import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../config/supabase.config';
import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@ApiBearerAuth()
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly marketplaceService: MarketplaceService,
  ) {}

  @Get('test')
  @ApiOkResponse({ description: 'Returns patient marketplace parameters from insurance_info and env presence' })
  async test(@Headers('authorization') authHeader?: string) {
    const apiKey = this.configService.get<string>('marketplace.apiKey')
    const supabaseUrl = this.configService.get<string>('supabase.url')
    const supabaseAnonKey = this.configService.get<string>('supabase.anonKey')

    if (!authHeader) {
      return { ok: false, error: 'Missing Authorization header' }
    }
    const token = authHeader.replace('Bearer ', '')
    if (!supabaseUrl) {
      return { ok: false, error: 'Supabase URL not configured' }
    }

    // Resolve current user id from Supabase auth
    const { data: user } = await axios.get(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey || '',
      },
    })
    const userId = user?.id

    // Read insurance_info using admin when available
    let supabase
    try { supabase = this.supabaseService.getAdminClient() } catch { supabase = this.supabaseService.getClient() }
    const { data: insurance } = await supabase
      .from('insurance_info')
      .select('*')
      .eq('patient_id', userId)
      .maybeSingle()

    return {
      ok: true,
      marketplaceKeyPresent: Boolean(apiKey),
      params: {
        zip_code: insurance?.zip_code || null,
        county_name: insurance?.county_name || null,
        county_fips: insurance?.county_fips || null,
        state: insurance?.state || null,
        plan_year: insurance?.plan_year || null,
        household_size: insurance?.household_size || null,
        household_income: insurance?.household_income || null,
        member_ages: insurance?.member_ages || null,
        tobacco_use_adults: insurance?.tobacco_use_adults ?? null,
        preferred_providers: insurance?.preferred_providers || null,
        medications: insurance?.medications || null,
        pharmacy_zip: insurance?.pharmacy_zip || null,
        marketplace_consent: insurance?.marketplace_consent ?? null,
      },
    }
  }

  @Get('plans')
  @ApiOkResponse({ description: 'Returns local plan options based on stored insurance fields (and optional overrides)' })
  async plans(
    @Headers('authorization') authHeader?: string,
    @Query('zip') zip?: string,
    @Query('county_fips') countyFips?: string,
    @Query('year') year?: string,
  ) {
    const supabaseUrl = this.configService.get<string>('supabase.url')
    const supabaseAnonKey = this.configService.get<string>('supabase.anonKey')
    if (!authHeader || !supabaseUrl) {
      return { ok: false, error: 'Auth or Supabase not configured' }
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: user } = await axios.get(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey || '' },
    })
    const userId = user?.id
    let supabase
    try { supabase = this.supabaseService.getAdminClient() } catch { supabase = this.supabaseService.getClient() }
    const { data: insurance } = await supabase
      .from('insurance_info')
      .select('*')
      .eq('patient_id', userId)
      .maybeSingle()

    const params = {
      zip_code: zip || insurance?.zip_code,
      county_name: insurance?.county_name,
      county_fips: countyFips || insurance?.county_fips,
      state: insurance?.state,
      plan_year: year ? parseInt(year, 10) : insurance?.plan_year,
      household_size: insurance?.household_size,
      household_income: insurance?.household_income,
      member_ages: insurance?.member_ages,
      tobacco_use_adults: insurance?.tobacco_use_adults,
      preferred_providers: insurance?.preferred_providers,
      medications: insurance?.medications,
      pharmacy_zip: insurance?.pharmacy_zip,
    }

    const results = await this.marketplaceService.getPlans(params)
    return { ok: true, ...results }
  }
}


