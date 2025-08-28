import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './config/supabase.config';
import { QueueService } from './common/queue.service';
import { AIAgentService } from './common/ai-agent.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    SupabaseService, 
    QueueService, 
    AIAgentService
  ],
})
export class AppModule {}
