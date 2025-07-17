import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from 'src/entity/game-session.entity';

@Module({
  controllers: [GameController],
  providers: [GameService],
  imports: [TypeOrmModule.forFeature([GameSession])],
})
export class GameModule {}
