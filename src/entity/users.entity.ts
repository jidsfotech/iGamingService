import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PlayerSelection } from './player-selection.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  looses: number;

  @OneToMany(() => PlayerSelection, (selection) => selection.user)
  selections: PlayerSelection[];
}
