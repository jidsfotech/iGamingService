import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PlayerSelection } from './player-selection.entity';

@Entity()
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({ nullable: true })
  winningNumber: number;

  @OneToMany(() => PlayerSelection, (selection) => selection.gameSession)
  selections: PlayerSelection[];
}
