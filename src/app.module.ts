import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './config/supabase.config';
// import { QueueService } from './common/queue.service';  // Commented out - Redis not needed
import { AIAgentService } from './common/ai-agent.service';
import configuration from './config/configuration';
import { InsuranceModule } from './insurance/insurance.module';
import { MarketplaceModule } from './marketplace/marketplace.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
    }),
    InsuranceModule,
    MarketplaceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    SupabaseService, 
    // QueueService,  // Commented out - Redis not needed for insurance chatbot
    AIAgentService
  ],
})
export class AppModule {}
