import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import databaseConfig from '../config/database.config';
import { AppController } from './app.controller';
import { GameModule } from './modules/game/game.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    GameModule,
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(
      // {
      //     imports: [ConfigModule],
      //     useFactory: (configService: ConfigService) => configService.get("databaseConfig"),
      //     inject: [ConfigService],
      //   },
      {
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const dbConfig = {
            type: 'mysql',
            host: configService.get<string>('DATABASE_HOST'),
            port: configService.get<number>('DATABASE_PORT'),
            username: configService.get<string>('DATABASE_USERNAME'),
            password: configService.get<string>('DATABASE_PASSWORD'),
            database: configService.get<string>('DATABASE_NAME'),
            // synchronize: true,
            autoLoadEntities: true,
          };
          if (!dbConfig.host && dbConfig.password && dbConfig.port) {
            Logger.log('Missing core db credentials.');
          }
          return { ...dbConfig } as TypeOrmModuleOptions;
        },
        inject: [ConfigService],
      },
    ),
  ],
  controllers: [AppController],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
