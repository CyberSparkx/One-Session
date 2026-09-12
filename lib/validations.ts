import { z } from "zod";

/**
 * Validates whether an email belongs to Google (Gmail) or Yahoo.
 * Blocks all other custom domains and providers to prevent fraud.
 */
export function isAllowedEmailDomain(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.toLowerCase().trim();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1) return false;
  const domain = trimmed.slice(atIndex + 1);

  // Gmail / Googlemail / Ymail
  if (domain === "gmail.com" || domain === "googlemail.com" || domain === "ymail.com") {
    return true;
  }

  // Yahoo domains (e.g. yahoo.com, yahoo.in, yahoo.co.uk, yahoo.ca)
  if (/^yahoo\.[a-z]{2,}(\.[a-z]{2,})?$/.test(domain)) {
    return true;
  }

  return false;
}

export const ALLOWED_EMAIL_ERROR =
  "Only Google (Gmail) or Yahoo email addresses are allowed (e.g., @gmail.com, @yahoo.com)";

/**
 * Country codes, dialing prefixes, and digit rules.
 * India strictly requires 10 digits starting with 6, 7, 8, or 9.
 */
export interface CountryConfig {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  maxLength: number;
  minLength: number;
  placeholder: string;
  regex: RegExp;
  error: string;
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    flag: "🇮🇳",
    maxLength: 10,
    minLength: 10,
    placeholder: "9876543210",
    regex: /^[6-9]\d{9}$/,
    error: "Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9)",
  },
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    flag: "🇺🇸",
    maxLength: 10,
    minLength: 10,
    placeholder: "2025550143",
    regex: /^[2-9]\d{9}$/,
    error: "Please enter a valid 10-digit US/Canada phone number",
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    flag: "🇬🇧",
    maxLength: 10,
    minLength: 10,
    placeholder: "7911123456",
    regex: /^7\d{9}$/,
    error: "Please enter a valid 10-digit UK mobile number (starting with 7)",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    flag: "🇦🇪",
    maxLength: 9,
    minLength: 9,
    placeholder: "501234567",
    regex: /^5\d{8}$/,
    error: "Please enter a valid 9-digit UAE mobile number (starting with 5)",
  },
  {
    code: "SG",
    name: "Singapore",
    dialCode: "+65",
    flag: "🇸🇬",
    maxLength: 8,
    minLength: 8,
    placeholder: "81234567",
    regex: /^[89]\d{7}$/,
    error: "Please enter a valid 8-digit Singapore mobile number (starting with 8 or 9)",
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    flag: "🇦🇺",
    maxLength: 9,
    minLength: 9,
    placeholder: "412345678",
    regex: /^4\d{8}$/,
    error: "Please enter a valid 9-digit Australian mobile number (starting with 4)",
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    flag: "🇨🇦",
    maxLength: 10,
    minLength: 10,
    placeholder: "4165550143",
    regex: /^[2-9]\d{9}$/,
    error: "Please enter a valid 10-digit Canadian phone number",
  },
  {
    code: "DE",
    name: "Germany",
    dialCode: "+49",
    flag: "🇩🇪",
    maxLength: 11,
    minLength: 10,
    placeholder: "15123456789",
    regex: /^1[567]\d{8,9}$/,
    error: "Please enter a valid German mobile number",
  },
];

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/[\s\-\(\)]/g, "").trim();
}

export function isValidPhoneForCountry(phone: string, countryCode: string = "IN"): { valid: boolean; error?: string } {
  const digitsOnly = phone.replace(/\D/g, "");
  
  // Require exactly 10 digits for India or default
  if (countryCode === "IN" || !countryCode) {
    if (digitsOnly.length !== 10) {
      return { valid: false, error: "Please enter a 10-digit phone number" };
    }
    return { valid: true };
  }

  // For other countries: 7 to 15 digits
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { valid: false, error: "Please enter a valid phone number" };
  }

  return { valid: true };
}

export const INDIAN_PHONE_ERROR = "Please enter a 10-digit phone number";

export const AllowedEmailSchema = z
  .string()
  .email("Valid email address is required")
  .refine(isAllowedEmailDomain, {
    message: ALLOWED_EMAIL_ERROR,
  });

export const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: AllowedEmailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  timezone: z.string().default("Asia/Kolkata"),
  role: z.enum(["CREATOR", "USER", "ADMIN"]).default("CREATOR"),
});

export const LoginSchema = z.object({
  email: AllowedEmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const CreatorProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(40, "Slug cannot exceed 40 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  timezone: z.string().min(1, "Timezone is required"),
  isPublished: z.boolean().default(false),
  payoutMethod: z.enum(["bank", "upi", "razorpay_route"]).optional().nullable(),
  payoutDetails: z.record(z.string(), z.any()).optional().nullable(),
});

export const SessionTypeSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().max(2000).optional().nullable(),
  durationMinutes: z.number().int().positive("Duration must be at least 1 minute"),
  priceInPaise: z.number().int().nonnegative("Price must be 0 or positive in paise"),
  bufferBeforeMin: z.number().int().nonnegative().default(0),
  bufferAfterMin: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const AvailabilityRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time format must be HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time format must be HH:mm"),
});

export const AvailabilityRulesBatchSchema = z.object({
  rules: z.array(AvailabilityRuleSchema),
});

export const AvailabilityOverrideSchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  isBlocked: z.boolean().default(true),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
});

export const CreateBookingSchema = z.object({
  sessionTypeId: z.string().min(1, "Session type is required"),
  scheduledStart: z.string().datetime({ message: "scheduledStart must be an ISO 8601 string" }),
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: AllowedEmailSchema,
  countryCode: z.string().default("IN").optional(),
  clientPhone: z.string().min(7, "Phone number is required"),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    const check = isValidPhoneForCountry(data.clientPhone, data.countryCode || "IN");
    return check.valid;
  },
  {
    message: "Invalid phone number for selected country",
    path: ["clientPhone"],
  }
);

export const CancelBookingSchema = z.object({
  cancelToken: z.string().min(1, "Cancel token is required"),
  reason: z.string().max(500).optional(),
});
