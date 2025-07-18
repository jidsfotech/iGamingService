import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  healthCheck() {
    return 'iGaming service is live';
  }
} 