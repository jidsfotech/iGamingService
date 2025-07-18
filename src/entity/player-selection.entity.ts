import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { GameSession } from './game-session.entity';
import { User } from './users.entity';

@Entity()
export class PlayerSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.selections)
  user: User;

  @ManyToOne(() => GameSession, (gameSession) => gameSession.selections)
  gameSession: GameSession;

  @Column({ nullable: true })
  selectedNumber: number;
}
