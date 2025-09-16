import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketplaceController } from './marketplace.controller';
import { SupabaseService } from '../config/supabase.config';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [ConfigModule],
  controllers: [MarketplaceController],
  providers: [SupabaseService, MarketplaceService],
})
export class MarketplaceModule {}


