import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsString, Length } from 'class-validator';

class AuthDto {
  @IsString()
  @Length(3, 20)
  username: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: AuthDto) {
    return await this.authService.register(dto.username);
  }

  @Post('login')
  async login(@Body() dto: AuthDto) {
    return this.authService.login(dto.username);
  }
}
