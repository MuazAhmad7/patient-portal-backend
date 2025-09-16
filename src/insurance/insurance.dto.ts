import { ApiProperty } from '@nestjs/swagger';

export class UpsertInsuranceDto {
  @ApiProperty()
  insurance_provider: string;

  @ApiProperty()
  policy_number: string;

  @ApiProperty({ required: false })
  group_number?: string;

  @ApiProperty()
  member_id: string;

  @ApiProperty({ required: false })
  coverage_type?: string;

  @ApiProperty({ required: false })
  copay_amount?: number;

  @ApiProperty({ required: false })
  deductible_amount?: number;

  @ApiProperty({ required: false })
  deductible_met?: number;

  @ApiProperty({ required: false })
  out_of_pocket_max?: number;

  @ApiProperty({ required: false })
  out_of_pocket_met?: number;

  @ApiProperty({ required: false })
  expires_at?: string;

  // Marketplace-related optional fields
  @ApiProperty({ required: false })
  zip_code?: string;

  @ApiProperty({ required: false })
  county_name?: string;

  @ApiProperty({ required: false })
  county_fips?: string;

  @ApiProperty({ required: false })
  state?: string;

  @ApiProperty({ required: false })
  plan_year?: number;

  @ApiProperty({ required: false })
  household_size?: number;

  @ApiProperty({ required: false })
  household_income?: number;

  @ApiProperty({ required: false, type: [Number] })
  member_ages?: number[];

  @ApiProperty({ required: false })
  tobacco_use_adults?: boolean;

  @ApiProperty({ required: false, type: Object, additionalProperties: true })
  preferred_providers?: any;

  @ApiProperty({ required: false, type: [String] })
  medications?: string[];

  @ApiProperty({ required: false })
  pharmacy_zip?: string;

  @ApiProperty({ required: false })
  marketplace_consent?: boolean;
}

export class ChatMessageDto {
  @ApiProperty({ description: 'The user message' })
  message: string;

  @ApiProperty({ description: 'Optional attachments as base64', required: false, isArray: true })
  attachments?: ChatAttachment[];
}

export class ChatAttachment {
  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'MIME type, e.g., image/png, application/pdf' })
  mimeType: string;

  @ApiProperty({ description: 'Base64-encoded file content (no data: prefix)' })
  base64: string;
}


