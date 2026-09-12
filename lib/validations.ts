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
 * Validates an Indian mobile phone number:
 * - Exactly 10 digits
 * - Starts with 6, 7, 8, or 9 (standard Indian mobile operator ranges: Jio, Airtel, Vi, BSNL)
 * - May optionally be prefixed with +91, 91, or 0, but clean digits must be 10 digits starting with 6-9
 */
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export function sanitizeIndianPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") return "";
  // Strip all whitespace, dashes, parens, and plus signs
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  // If starts with 91 and has 12 digits, strip 91
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return cleaned.slice(2);
  }
  // If starts with 0 and has 11 digits, strip 0
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return cleaned.slice(1);
  }
  return cleaned;
}

export function isValidIndianPhoneNumber(phone: string): boolean {
  const sanitized = sanitizeIndianPhoneNumber(phone);
  return INDIAN_PHONE_REGEX.test(sanitized);
}

export const INDIAN_PHONE_ERROR =
  "Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9)";

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
  clientPhone: z
    .string()
    .transform((val) => sanitizeIndianPhoneNumber(val))
    .refine((val) => INDIAN_PHONE_REGEX.test(val), {
      message: INDIAN_PHONE_ERROR,
    }),
  notes: z.string().max(1000).optional(),
});

export const CancelBookingSchema = z.object({
  cancelToken: z.string().min(1, "Cancel token is required"),
  reason: z.string().max(500).optional(),
});
