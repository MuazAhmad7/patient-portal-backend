import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseAnonKey = this.configService.get<string>('supabase.anonKey');
    const supabaseServiceKey = this.configService.get<string>('supabase.serviceRoleKey');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    // Public client for user operations
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client for service operations
    if (supabaseServiceKey) {
      this.adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminSupabase) {
      throw new Error('Admin Supabase client not configured');
    }
    return this.adminSupabase;
  }
}