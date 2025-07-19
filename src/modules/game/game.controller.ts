import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Put,
} from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from '@nestjs/passport';
import { IsInt, Min, Max } from 'class-validator';
import { User } from 'src/entity/users.entity';
import { UUID } from 'crypto';

class JoinGameDto {
  @IsInt()
  @Min(1)
  @Max(10)
  number: number;
}

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // POST /game/join
  @UseGuards(AuthGuard('jwt'))
  @Post('join')
  async join(@Request() req) {
    return this.gameService.joinSession(req.user.userId);
  }

  // POST /game/player select
  @UseGuards(AuthGuard('jwt'))
  @Put('player-select')
  async playerSelect(@Request() req, @Body() dto: JoinGameDto) {
    return this.gameService.playerSelect(req.user.userId, dto.number);
  }

  // GET /game/session
  @UseGuards(AuthGuard('jwt'))
  @Get('session')
  async getSession() {
    return this.gameService.getCurrentSessionInfo();
  }

  // Get info about a ended session
  @UseGuards(AuthGuard('jwt'))
  @Get('ended-session/:id')
  async getEndedSessionInfo(@Request() req, @Param('id') endedSessionId: UUID) {
    return this.gameService.getEndedSessionInfo(
      req.user.userId,
      endedSessionId,
    );
  }

  // GET /game/top-players
  @UseGuards(AuthGuard('jwt'))
  @Get('top-players/:id')
  async getTopPlayers(@Param('id') endedSessionId: UUID): Promise<User[]> {
    return this.gameService.getTopPlayers(endedSessionId);
  }
}
