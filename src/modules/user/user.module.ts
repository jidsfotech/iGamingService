import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from 'src/entity/users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [TypeOrmModule.forFeature([User])],
})
export class UserModule {}
