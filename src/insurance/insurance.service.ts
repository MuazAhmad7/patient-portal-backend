import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../config/supabase.config';
import { UpsertInsuranceDto } from './insurance.dto';

@Injectable()
export class InsuranceService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getInsuranceInfo(patientId: string) {
    // Prefer admin client to ensure we can read the patient's row securely on the server
    let supabase;
    try {
      supabase = this.supabaseService.getAdminClient();
    } catch {
      supabase = this.supabaseService.getClient();
    }
    const { data, error } = await supabase
      .from('insurance_info')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();
    if (error) {
      throw error;
    }
    // If no insurance information on file, return an empty object
    // so the chatbot can function without requiring the questionnaire.
    if (!data) {
      return {};
    }
    return data;
  }

  async upsertInsuranceInfo(patientId: string, dto: UpsertInsuranceDto) {
    // Use admin client to bypass RLS for server-side upserts tied to authenticated patient
    let supabase;
    try {
      supabase = this.supabaseService.getAdminClient();
    } catch {
      supabase = this.supabaseService.getClient();
    }
    const payload = { ...dto, patient_id: patientId } as const;
    const { data, error } = await supabase
      .from('insurance_info')
      .upsert(payload, { onConflict: 'patient_id' })
      .select('*')
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }
}


