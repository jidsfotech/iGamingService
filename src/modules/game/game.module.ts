import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from 'src/entity/game-session.entity';
import { User } from 'src/entity/users.entity';
import { PlayerSelection } from 'src/entity/player-selection.entity';

@Module({
  controllers: [GameController],
  providers: [GameService],
  imports: [TypeOrmModule.forFeature([User, GameSession, PlayerSelection])],
})
export class GameModule {}
