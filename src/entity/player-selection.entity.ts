import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./users.entity";
import { GameSession } from "../entity/game-session.entity";

@Entity()
export class PlayerSelection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.selections)
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => GameSession, (gameSession) => gameSession.selections)
  gameSession: GameSession;

  @Column()
  gameSessionId: number;

  @Column()
  selectedNumber: number;
} 