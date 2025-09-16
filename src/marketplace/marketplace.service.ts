import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../config/supabase.config';
import axios from 'axios';

export interface MarketplaceParams {
  zip_code?: string;
  county_name?: string;
  county_fips?: string;
  state?: string;
  plan_year?: number;
  household_size?: number;
  household_income?: number;
  member_ages?: number[];
  tobacco_use_adults?: boolean;
  preferred_providers?: any;
  medications?: string[];
  pharmacy_zip?: string;
}

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  getApiKey(): string | undefined {
    return this.configService.get<string>('marketplace.apiKey');
  }

  async getPlans(params: MarketplaceParams): Promise<any> {
    const apiKey = this.getApiKey();
    const baseUrl = this.configService.get<string>('marketplace.baseUrl');
    // If no key, gracefully return empty to keep chatbot usable
    if (!apiKey || !baseUrl) {
      return { apiKeyPresent: false, query: params, plans: [] };
    }

    // Minimal viable request: zip and year (fallbacks from params)
    const zip = params.zip_code;
    const year = params.plan_year || new Date().getFullYear();
    if (!zip) {
      return { apiKeyPresent: true, query: params, plans: [] };
    }

    try {
      // Resolve county FIPS if missing
      let countyFips = params.county_fips;
      if (!countyFips) {
        try {
          const geoUrl = `${baseUrl}/counties/by/zip/${encodeURIComponent(zip)}`;
          const geo = await axios.get(geoUrl, {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
          });
          // pick the first matching county if multiple returned
          countyFips = geo?.data?.[0]?.fips || geo?.data?.counties?.[0]?.fips || countyFips;
        } catch {}
      }

      // POST /plans/search with flexible payload
      const url = `${baseUrl}/plans/search`;
      const body: any = {
        zip,
        county_fips: countyFips,
        year,
      };
      // Attach optional household context if available
      if (params.household_size || params.member_ages) {
        body.household = {
          size: params.household_size,
          income: params.household_income,
          members: (params.member_ages || []).map((age) => ({ age, tobacco: !!params.tobacco_use_adults })),
        };
      }

      const { data } = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      });

      // Normalize a subset of plan fields expected by the chatbot
      const rawPlans = (data?.plans || data?.results || data || []);
      const plans = (Array.isArray(rawPlans) ? rawPlans : []).slice(0, 10).map((p: any) => ({
        id: p.id || p.planId || p.hiosId || p.plan_id || p.marketing_name,
        name: p.marketing_name || p.name || p.plan_marketing_name || 'Unknown Plan',
        carrier: p.carrier || p.issuer_name || p.issuer || p.issuer || 'Unknown Carrier',
        metal: p.metal_level || p.metal || p.metal_level_code || 'Unknown',
        monthly_premium: p.monthly_premium || p.premium || p.individual_rate || 0,
        deductible: p.deductible_individual || p.deductible || p.individual_deductible || 0,
        oop_max: p.oop_max_individual || p.oop_max || p.individual_oop_max || 0,
        type: p.plan_type || p.type || p.network || undefined,
      }));

      return { apiKeyPresent: true, query: params, plans };
    } catch (error) {
      // Fail soft to keep chat going
      return { apiKeyPresent: true, query: params, plans: [], error: 'plan_fetch_failed' };
    }
  }
}


