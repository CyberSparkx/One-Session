import { z } from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  timezone: z.string().default("Asia/Kolkata"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
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
  clientEmail: z.string().email("Valid email is required"),
  clientPhone: z.string().min(5, "Valid phone number is required"),
  notes: z.string().max(1000).optional(),
});

export const CancelBookingSchema = z.object({
  cancelToken: z.string().min(1, "Cancel token is required"),
  reason: z.string().max(500).optional(),
});
