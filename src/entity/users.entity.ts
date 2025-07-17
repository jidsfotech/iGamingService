import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from "typeorm";
import { PlayerSelection } from "./player-selection.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ default: 0 })
  wins: number;

  @OneToMany(() => PlayerSelection, (selection) => selection.user)
  selections: PlayerSelection[];
}
