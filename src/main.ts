import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
    logger: new ConsoleLogger({
      prefix: "iGaming",
      logLevels: ["error", "warn", "log", "verbose", "debug"],
    }),
  });

  app.enableCors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
