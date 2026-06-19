import { z } from 'zod';

export const studentProfileSchema = z.object({
  student_name: z.string().min(2, 'Student name is required'),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  guardian_name: z.string().optional(),
  date_of_birth: z.string().refine((val) => {
    if (!val) return true;
    return new Date(val) <= new Date();
  }, { message: 'Date of birth cannot be in the future' }).optional(),
  gender_id: z.string().uuid('Invalid gender').optional(),
  mobile_no: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[0-9]{10}$/.test(val);
  }, { message: 'Mobile number must be 10 digits' }),
  address_text: z.string().optional(),
  village: z.string().optional(),
  panchayat: z.string().optional(),
  is_cwsn: z.boolean().default(false),
});

export const studentEnrollmentSchema = z.object({
  academic_session_id: z.string().uuid('Session is required'),
  class_id: z.string().uuid('Class is required'),
  section_name: z.string().optional(),
  roll_no: z.string().optional(),
  enrollment_date: z.string().min(1, 'Enrollment date is required'),
});

export const studentFullFormSchema = z.object({
  profile: studentProfileSchema,
  enrollment: studentEnrollmentSchema,
});

export type StudentFullFormData = z.infer<typeof studentFullFormSchema>;

export const csvRowSchema = z.object({
  admission_no: z.string().optional(),
  student_name: z.string().min(1, 'Name is required'),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  guardian_name: z.string().optional(),
  date_of_birth: z.string().refine((val) => {
    if (!val) return true;
    const d = new Date(val);
    return !isNaN(d.getTime()) && d <= new Date();
  }, { message: 'Invalid DOB or future date' }).optional(),
  gender: z.string().optional(),
  class: z.string().min(1, 'Class is required'),
  section: z.string().optional(),
  roll_no: z.string().optional(),
  mobile_no: z.string().optional().refine((val) => !val || /^[0-9]{10}$/.test(val), 'Invalid mobile'),
  village: z.string().optional(),
  panchayat: z.string().optional(),
  // Class 11/12 specific fields
  stream: z.string().optional(),
  subject: z.string().optional(),
}).refine(data => {
  // If class is 11 or 12, stream and subject are required
  const isSenior = data.class.includes('11') || data.class.includes('12');
  if (isSenior) {
    return !!data.stream && !!data.subject;
  }
  return true;
}, {
  message: "Stream and subject are required for Class 11 and 12",
  path: ["stream"]
});

export type CsvRowData = z.infer<typeof csvRowSchema>;
