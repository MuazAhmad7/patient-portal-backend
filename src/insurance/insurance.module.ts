import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { SupabaseService } from '../config/supabase.config';
import { MarketplaceService } from '../marketplace/marketplace.service';

@Module({
  controllers: [InsuranceController],
  providers: [InsuranceService, SupabaseService, MarketplaceService],
})
export class InsuranceModule {}


