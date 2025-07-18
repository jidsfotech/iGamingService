import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entity/users.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    username: string,
  ): Promise<{ username: string; access_token: string }> {
    const existing = await this.userRepository.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('Username already taken');
    }
    const user = this.userRepository.create({ username });
    this.userRepository.save(user);
    const payload = { sub: user.id, username: user.username };
    return {
      username: user.username,
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(
    username: string,
  ): Promise<{ username: string; access_token: string }> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const payload = { sub: user.id, username: user.username };

    return {
      username: user.username,
      access_token: this.jwtService.sign(payload),
    };
  }
}
