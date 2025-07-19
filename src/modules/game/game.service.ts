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

  // 15 seconds between sessions
  readonly breakTime: number = 15 * 1000;

  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    @InjectRepository(PlayerSelection)
    private readonly selectionRepo: Repository<PlayerSelection>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    // Run the game loop
    setInterval(() => {
      (async () => {
        if (this.currentSession) {
          await this.endSession();
        }
        await this.initSession();
      })();
    }, 35000);
  }

  // Initialize a new game session
  async initSession() {
    const now = new Date();
    const end = new Date(now.getTime() + 20000); // 20 seconds session time

    const session = this.sessionRepo.create({ startTime: now, endTime: end });
    this.currentSession = await this.sessionRepo.save(session);

    this.logger.log(`Started new session: ${session.id}`);
  }

  // End the current session and process results
  async endSession() {
    if (!this.currentSession) return;

    const sessionId = this.currentSession.id;
    const winningNumber = Math.floor(Math.random() * 10) + 1;

    await this.sessionRepo.update(sessionId, { winningNumber });
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

    for (const { user } of winners) {
      user.wins += 1;
    }

    for (const { user } of losers) {
      user.looses += 1;
    }

    await this.userRepo.save([
      ...winners.map((w) => w.user),
      ...losers.map((l) => l.user),
    ]);

    this.logger.log(
      `Session ${sessionId} ended. Winning number: ${winningNumber}. ` +
        `Winners: ${winners.length}, Losers: ${losers.length}`,
    );

    this.currentSession = null;
  }

  // User oin the current session
  async joinSession(userId: UUID) {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
    }

    const existingSelection = await this.selectionRepo.findOne({
      where: {
        user: { id: userId },
        gameSession: { id: this.currentSession.id },
      },
    });

    if (existingSelection) {
      throw new ConflictException('User already joined this session');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.error(`User not found: ${userId}`);
      throw new NotFoundException('User not found');
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

  // User pick a number after joining
  async playerSelect(userId: UUID, selectedNumber: number) {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
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

  // Get current session status
  async getCurrentSessionInfo() {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
    }

    const selections = await this.selectionRepo.find({
      where: { gameSession: { id: this.currentSession.id } },
      relations: ['user'],
    });

    return {
      sessionActive: true,
      id: this.currentSession.id,
      startTime: this.currentSession.startTime,
      endTime: this.currentSession.endTime,
      totalPlayers: selections.length,
      players: selections.map((sel) => ({
        id: sel.user.id,
        username: sel.user.username,
        selectedNumber: sel.selectedNumber,
        wins: sel.user.wins,
        looses: sel.user.looses,
      })),
    };
  }

  // Get ended session result
  async getEndedSessionInfo(sessionId?: UUID) {
    const id = sessionId ?? this.currentSession?.id;

    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['selections', 'selections.user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const totalPlayers = session.selections.length;
    const totalWins = session.selections.filter(
      (sel) => sel.selectedNumber === session.winningNumber,
    ).length;

    const nextSessionStartTime = new Date(
      session.endTime.getTime() + this.breakTime,
    );

    return {
      id: session.id,
      totalPlayers,
      totalWins,
      nextSessionStartTime,
      winningNumber: session.winningNumber,
    };
  }

  // Get top 10 players from the session
  async getTopPlayers(sessionId: UUID): Promise<User[]> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['selections', 'selections.user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const userIds = [...new Set(session.selections.map((sel) => sel.user.id))];

    if (userIds.length === 0) {
      return [];
    }

    return this.userRepo.find({
      where: { id: In(userIds) },
      order: { wins: 'DESC' },
      take: 10,
      select: ['id', 'username', 'wins'],
    });
  }

  // Expose current session
  getCurrentSession() {
    return this.currentSession;
  }
}
