import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { ChatMessageDto, UpsertInsuranceDto } from './insurance.dto';
import { ConfigService } from '@nestjs/config';
import { MarketplaceService } from '../marketplace/marketplace.service';
import axios from 'axios';

@ApiTags('insurance')
@ApiBearerAuth()
@Controller('insurance')
export class InsuranceController {
  constructor(
    private readonly insuranceService: InsuranceService,
    private readonly configService: ConfigService,
    private readonly marketplaceService: MarketplaceService,
  ) {}

  @Get('me')
  @ApiOkResponse({ description: 'Returns the current user insurance info' })
  async getMyInsurance(@Headers('authorization') authHeader?: string) {
    try {
      const patientId = await this.getPatientIdFromSupabase(authHeader);
      return this.insuranceService.getInsuranceInfo(patientId);
    } catch (e) {
      // In local/dev environments where SUPABASE_URL or auth may be missing,
      // return an empty object so the UI and chatbot can proceed without blocking.
      return {};
    }
  }

  @Post('me')
  @ApiOkResponse({ description: 'Upserts current user insurance info' })
  async upsertMyInsurance(
    @Body() dto: UpsertInsuranceDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const patientId = await this.getPatientIdFromSupabase(authHeader);
    return this.insuranceService.upsertInsuranceInfo(patientId, dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Chat with AI about insurance using user insurance data' })
  async chat(
    @Body() body: ChatMessageDto,
    @Headers('authorization') authHeader?: string,
  ) {
    let insurance: any = {};
    try {
      const patientId = await this.getPatientIdFromSupabase(authHeader);
      insurance = await this.insuranceService.getInsuranceInfo(patientId);
    } catch {
      // Graceful fallback when auth/env missing or no data exists
      insurance = {};
    }

    const attachmentNote = body.attachments?.length
      ? `\n\nThe user provided ${body.attachments.length} attachment(s). If relevant (e.g., images or PDFs), consider them when answering.`
      : '';

    const lower = (body.message || '').toLowerCase();
    const wantsPlans = /(better|best|compare|cheaper|options|plans?|providers?|insurance|insurer|carrier|carriers|policy)\b|in[- ]network|marketplace|healthcare\.gov/.test(lower);

    // Always attempt a lightweight local plan preview when intent suggests shopping/comparison,
    // using whatever parameters we have; missing fields are okay.
    let plansSummary = '';
    if (wantsPlans) {
      try {
        const results = await this.marketplaceService.getPlans({
          zip_code: (insurance as any)?.zip_code,
          county_fips: (insurance as any)?.county_fips,
          state: (insurance as any)?.state,
          plan_year: (insurance as any)?.plan_year,
          household_size: (insurance as any)?.household_size,
          household_income: (insurance as any)?.household_income,
          member_ages: (insurance as any)?.member_ages,
          tobacco_use_adults: (insurance as any)?.tobacco_use_adults,
          preferred_providers: (insurance as any)?.preferred_providers,
          medications: (insurance as any)?.medications,
          pharmacy_zip: (insurance as any)?.pharmacy_zip,
        });
        const top = (results?.plans || []).slice(0, 3);
        if (top.length) {
          plansSummary = `\nTop local plan options:${results.error ? ' (unable to fetch live plans; showing none)' : ''}\n` + top.map((p: any, i: number) => `  ${i+1}. ${p.carrier || 'Carrier'} — ${p.name} (${p.metal}${p.type ? ', ' + p.type : ''}) — $${p.monthly_premium}/mo, ded $${p.deductible}, OOP max $${p.oop_max}`).join('\n');
        } else {
          plansSummary = '';
        }
      } catch {
        plansSummary = '';
      }
    }

    const systemPrompt = `You are an expert health insurance assistant.
Respond in 3-6 concise bullet points or short sentences.
Bold key terms using **text** and keep tone clear and friendly.
Prioritize:
- A short comparison: **Your current plan** vs top local options (carrier + plan name, metal level, $premium/mo, deductible, OOP max)
- Practical guidance tailored to the user
Do not ask the user to fill the questionnaire unless a critical field is missing. If a critical field (like ZIP/county) is missing, ask ONE short follow-up question instead of deferring.
Avoid legal/financial guarantees.

User's known insurance info (may be empty):\n${JSON.stringify(insurance, null, 2)}${plansSummary}${attachmentNote}`;
    const text = await this.generateWithGemini(systemPrompt, body.message);
    return { message: text };
  }

  private async getPatientIdFromSupabase(authHeader?: string): Promise<string> {
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    // Verify token with Supabase Auth endpoint
    // Uses configured environment keys (NEXT_PUBLIC_SUPABASE_URL) via ConfigService
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseAnonKey = this.configService.get<string>('supabase.anonKey');
    if (!supabaseUrl) throw new Error('Supabase URL not configured');
    const { data } = await axios.get(`${supabaseUrl}/auth/v1/user`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey || '',
      },
    });
    return data?.id;
  }

  private async generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('external.apiKey');
    if (!apiKey) {
      return 'AI responses are disabled because GEMINI_API_KEY is not configured on the server.';
    }
    // Using Gemini 1.5/2.0 REST API format
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    const { data } = await axios.post(
      `${url}?key=${apiKey}`,
      {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUser Question: ${userPrompt}` },
            ],
          },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    return text;
  }
}


