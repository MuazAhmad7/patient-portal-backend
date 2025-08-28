import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    return 'Patient Portal Backend API is running!';
  }

  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'patient-portal-backend',
      version: '1.0.0',
      environment: this.configService.get('nodeEnv'),
    };
  }
}
