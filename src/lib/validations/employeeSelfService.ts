import { z } from 'zod';

export const REQUEST_TYPES = [
  { value: 'MOBILE_UPDATE', label: 'Mobile Number Update' },
  { value: 'ADDRESS_UPDATE', label: 'Address Update' },
  { value: 'QUALIFICATION_UPDATE', label: 'Qualification Update' },
  { value: 'NAME_CORRECTION', label: 'Name Correction' },
  { value: 'DOB_CORRECTION', label: 'Date of Birth Correction' },
  { value: 'POSTING_CORRECTION', label: 'Posting Detail Correction' },
  { value: 'SERVICE_RECORD_CORRECTION', label: 'Service Record Correction' },
] as const;

export type RequestTypeCode = typeof REQUEST_TYPES[number]['value'];

// ─── Base schema shared across all types ────────────────────────────────────
const baseSchema = z.object({
  request_type: z.enum([
    'MOBILE_UPDATE',
    'ADDRESS_UPDATE',
    'QUALIFICATION_UPDATE',
    'NAME_CORRECTION',
    'DOB_CORRECTION',
    'POSTING_CORRECTION',
    'SERVICE_RECORD_CORRECTION',
  ]),
  reason: z.string().min(10, 'Please provide a reason (at least 10 characters).'),
  supporting_document_desc: z.string().optional(),
});

// ─── Per-type detail schemas ─────────────────────────────────────────────────
const mobileSchema = baseSchema.extend({
  request_type: z.literal('MOBILE_UPDATE'),
  new_mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
});

const addressSchema = baseSchema.extend({
  request_type: z.literal('ADDRESS_UPDATE'),
  new_address: z.string().min(10, 'Address must be at least 10 characters.'),
  new_village: z.string().optional(),
  new_district: z.string().optional(),
});

const qualificationSchema = baseSchema.extend({
  request_type: z.literal('QUALIFICATION_UPDATE'),
  qualification_name: z.string().min(2, 'Enter qualification name.'),
  institution: z.string().min(2, 'Enter institution name.'),
  passing_year: z.coerce.number().min(1950).max(new Date().getFullYear(), 'Invalid year.'),
});

const nameCorrectionSchema = baseSchema.extend({
  request_type: z.literal('NAME_CORRECTION'),
  corrected_first_name: z.string().min(2, 'Enter corrected first name.'),
  corrected_last_name: z.string().min(2, 'Enter corrected last name.'),
  correction_reason: z.string().min(5, 'State reason for correction.'),
});

const dobCorrectionSchema = baseSchema.extend({
  request_type: z.literal('DOB_CORRECTION'),
  corrected_dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter date as YYYY-MM-DD.'),
  correction_reason: z.string().min(5, 'State reason for correction.'),
});

const postingCorrectionSchema = baseSchema.extend({
  request_type: z.literal('POSTING_CORRECTION'),
  correction_detail: z.string().min(10, 'Describe the posting correction needed.'),
});

const serviceRecordSchema = baseSchema.extend({
  request_type: z.literal('SERVICE_RECORD_CORRECTION'),
  correction_detail: z.string().min(10, 'Describe the service record correction needed.'),
});

// ─── Discriminated union ─────────────────────────────────────────────────────
export const updateRequestSchema = z.discriminatedUnion('request_type', [
  mobileSchema,
  addressSchema,
  qualificationSchema,
  nameCorrectionSchema,
  dobCorrectionSchema,
  postingCorrectionSchema,
  serviceRecordSchema,
]);

export type UpdateRequestFormData = z.infer<typeof updateRequestSchema>;

// ─── Helper: build proposed_values from form data ───────────────────────────
export function buildProposedValues(data: UpdateRequestFormData): Record<string, any> {
  const { request_type, reason, supporting_document_desc, ...rest } = data as any;
  return rest;
}
