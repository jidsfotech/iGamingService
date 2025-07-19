import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GameSession } from 'src/entity/game-session.entity';
import { PlayerSelection } from 'src/entity/player-selection.entity';
import { User } from 'src/entity/users.entity';
import { UUID } from 'crypto';

@Injectable()
export class GameService {
  private currentSession: GameSession | null = null;
  private readonly logger = new Logger(GameService.name);
  readonly breakTime: number = 10 * 1000; // 10 seconds between sessions

  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    @InjectRepository(PlayerSelection)
    private readonly selectionRepo: Repository<PlayerSelection>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.runGameLoop();
  }

  /** Sequential game loop without race conditions */
  async runGameLoop() {
    while (true) {
      await this.initSession();
      await this.waitForSessionToEnd();

      await this.endSession();
      await this.sleep(this.breakTime);
    }
  }

  /** Utility sleep function */
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Wait until current session end time */
  private async waitForSessionToEnd() {
    if (!this.currentSession) return;

    const now = Date.now();
    const sessionEnd = this.currentSession.endTime.getTime();
    const waitTime = Math.max(sessionEnd - now, 0);

    this.logger.log(`Waiting ${waitTime / 1000}s for session to end...`);

    await this.sleep(waitTime);
  }

  /** Start a new session */
  async initSession() {
    const now = new Date();
    const end = new Date(now.getTime() + 20000); // 20 seconds

    const session = this.sessionRepo.create({ startTime: now, endTime: end });
    this.currentSession = await this.sessionRepo.save(session);

    this.logger.log(`Started new session: ${session.id}`);
  }

  /** End the current session and update winners */
  async endSession(): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active session to end');
    }

    const sessionId = this.currentSession.id;
    const winningNumber = Math.floor(Math.random() * 10) + 1;

    // Save winningNumber directly to DB
    await this.sessionRepo.update(sessionId, { winningNumber });

    // Fetch participants with user relation
    const participants = await this.selectionRepo.find({
      where: { gameSession: { id: sessionId } },
      relations: ['user'],
    });

    const winners = participants.filter(
      (p) => p.selectedNumber === winningNumber,
    );
    const losers = participants.filter(
      (p) => p.selectedNumber !== winningNumber,
    );

    for (const { user } of winners) user.wins += 1;
    for (const { user } of losers) user.looses += 1;

    await this.userRepo.save([
      ...winners.map((w) => w.user),
      ...losers.map((l) => l.user),
    ]);

    this.logger.log(
      `Session ${sessionId} ended. Winning number: ${winningNumber}. Winners: ${winners.length}`,
    );

    this.currentSession = null;

    return sessionId;
  }

  /** User joins the current session */
  async joinSession(userId: string) {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
    }

    const sessionId = this.currentSession.id;

    // Check if the user already joined
    const existingSelection = await this.selectionRepo.findOne({
      where: { user: { id: userId }, gameSession: { id: sessionId } },
    });

    if (existingSelection) {
      throw new ConflictException('User already joined this session');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.error('User not found');
      throw new Error('User not found');
    }

    const userSelection = this.selectionRepo.create({
      user,
      gameSession: this.currentSession,
    });

    await this.selectionRepo.save(userSelection);

    return {
      message: 'Joined session',
      sessionId: this.currentSession.id,
    };
  }

  /** Player selects a number */
  async playerSelect(userId: UUID, selectedNumber: number) {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
    }

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const selection = await this.selectionRepo.findOne({
      where: {
        user: { id: userId },
        gameSession: { id: this.currentSession.id },
      },
      relations: ['user', 'gameSession'],
    });

    if (!selection) {
      throw new NotFoundException('Player has not joined the session yet');
    }

    if (selection.selectedNumber !== null) {
      throw new ConflictException('Player has already selected a number');
    }

    selection.selectedNumber = selectedNumber;
    await this.selectionRepo.save(selection);

    return {
      message: 'User selection updated',
      sessionId: this.currentSession.id,
    };
  }

  /** Get info about the current session */
  async getCurrentSessionInfo() {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
    }

    const selections = await this.selectionRepo.find({
      where: { gameSession: { id: this.currentSession.id } },
      relations: ['user'],
    });

    const { startTime, endTime, id } = this.currentSession;
    const totalPlayers = selections.length;

    return {
      sessionActive: true,
      id,
      startTime,
      endTime,
      totalPlayers,
      players: selections.map((sel) => ({
        id: sel.user.id,
        username: sel.user.username,
        selectedNumber: sel.selectedNumber,
        wins: sel.user.wins,
        looses: sel.user.looses,
      })),
    };
  }

  /** Get info about an ended session */
  async getEndedSessionInfo(userId: UUID, sessionId: UUID) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['selections', 'selections.user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }
    // Find the requesting user's selection
    const playerSelection = session.selections.find(
      (sel) => sel.user.id === userId,
    );

    return {
      id: session.id,
      totalPlayers: session.selections.length,
      totalWins: session.selections.filter(
        (sel) => sel.selectedNumber === session.winningNumber,
      ).length,
      nextSessionStartTime: new Date(
        session.endTime.getTime() + this.breakTime,
      ),
      winningNumber: session.winningNumber,
      selectedNumber: playerSelection?.selectedNumber ?? null,
    };
  }

  /** Get top 10 players by wins */
  async getTopPlayers(sessionId: UUID): Promise<User[]> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['selections', 'selections.user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const userIds = [...new Set(session.selections.map((sel) => sel.user.id))];

    if (userIds.length === 0) return [];

    return this.userRepo.find({
      where: { id: In(userIds) },
      order: { wins: 'DESC' },
      take: 10,
      select: ['id', 'username', 'wins'],
    });
  }

  /** Get current session instance (internal use) */
  getCurrentSession() {
    return this.currentSession;
  }
}
