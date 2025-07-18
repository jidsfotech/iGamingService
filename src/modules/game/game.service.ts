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
    setInterval(() => {
      (async () => {
        if (this.currentSession) {
          await this.endSession();
        }
        await this.initSession();
      })();
    }, 70000); // 30 seconds
  }

  // Start a new session
  async initSession() {
    const now = new Date();
    const end = new Date(now.getTime() + 60000); // 20 seconds
    const session = this.sessionRepo.create({ startTime: now, endTime: end });
    this.currentSession = await this.sessionRepo.save(session);
    this.logger.log(`Started new session: ${session.id}`);
  }

  // End the current session
  async endSession() {
    if (!this.currentSession) return;
    // Pick winning number
    const winningNumber = Math.floor(Math.random() * 10) + 1;
    this.currentSession.winningNumber = winningNumber;
    await this.sessionRepo.save(this.currentSession);
    // Find winners
    const participants = await this.selectionRepo.find({
      where: {
        gameSession: { id: this.currentSession.id },
      },
      relations: ['user'],
    });
    const winners = participants.filter(
      (p) => p.selectedNumber === winningNumber,
    );
    const losers = participants.filter(
      (p) => p.selectedNumber !== winningNumber,
    );
    for (const winner of winners) {
      winner.user.wins += 1;
      await this.userRepo.save(winner.user);
    }
    for (const loser of losers) {
      loser.user.looses += 1;
      await this.userRepo.save(loser.user);
    }
    this.logger.log(
      `Session ${this.currentSession.id} ended. Winning number: ${winningNumber}`,
    );
    this.currentSession = null;
  }

  // User joins the current session and picks a number
  async joinSession(userId: UUID) {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
    }

    // Check if the user has already joined the session
    const existingSelection = await this.selectionRepo.findOne({
      where: {
        user: { id: userId },
        gameSession: { id: this.currentSession.id },
      },
    });

    if (existingSelection) {
      throw new ConflictException('User already joined this session');
    }

    try {
      // Create and save the user's selection for the current session
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
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to join session');
    }
  }

  async playerSelect(userId: UUID, selectedNumber: number) {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
    }

    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      // Find the player's selection for the current session
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

      // Update the selected number
      selection.selectedNumber = selectedNumber;
      await this.selectionRepo.save(selection);

      return {
        message: 'User selection updated',
        sessionId: this.currentSession.id,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  // Get info about the current session
  async getCurrentSessionInfo() {
    if (!this.currentSession) {
      throw new NotFoundException('No active session');
    }

    const selections = await this.selectionRepo.find({
      where: { gameSession: { id: this.currentSession.id } },
      relations: ['user'],
    });

    const { winningNumber, startTime, endTime, id } = this.currentSession;
    // Calculate next session start time
    const nextSessionStartTime = new Date(endTime.getTime() + this.breakTime);
    // Count players who have joined
    const totalPlayers = selections.length;

    return {
      sessionActive: true,
      id,
      startTime,
      endTime,
      nextSessionStartTime,
      winningNumber,
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

  // Get info about a ended session
  async getEndedSessionInfo(sessionId?: UUID) {
    const id = sessionId ?? this.currentSession?.id;
    // Fetch session with player selections and users
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['selections', 'selections.user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Calculate total players
    const totalPlayers = session.selections.length;

    // Calculate total wins
    const totalWins = session.selections.filter(
      (sel) => sel.selectedNumber === session.winningNumber,
    ).length;

    // Calculate next session start time (20 seconds after endTime)
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

  // Get top 10 players by wins

  async getTopPlayers(sessionId: UUID): Promise<User[]> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['selections', 'selections.user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Use a Set to deduplicate user IDs
    const userIds = [...new Set(session.selections.map((sel) => sel.user.id))];

    if (userIds.length === 0) {
      return [];
    }

    const topPlayers = await this.userRepo.find({
      where: { id: In(userIds) },
      order: { wins: 'DESC' },
      take: 10,
      select: ['id', 'username', 'wins'],
    });

    return topPlayers;
  }

  getCurrentSession() {
    return this.currentSession;
  }
}
