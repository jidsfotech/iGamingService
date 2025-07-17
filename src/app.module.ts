import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
// import { UserModule } from './modules/users/users.module';
import databaseConfig from '../config/database.config';

@Module({
  imports: [
    // UserModule,
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
            type: "mysql",
            host: configService.get<string>("DATABASE_HOST"),
            port: configService.get<number>("DATABASE_PORT"),
            username: configService.get<string>("DATABASE_USERNAME"),
            password: configService.get<string>("DATABASE_PASSWORD"),
            database: configService.get<string>("DATABASE_NAME"),
            // entities: [User],
            synchronize: true,
          }
          if (!dbConfig.host && dbConfig.password && dbConfig.port) {
            console.log("Missing core db credentials.")
          }
          return { ...dbConfig } as TypeOrmModuleOptions;
        },
        inject: [ConfigService],
      }
    ),
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}