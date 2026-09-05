# SessionBook — Product & Technical Specification
### A one-on-one session booking marketplace (build brief for Antigravity)

---

## 0. How to use this document

1. Open Antigravity → create a new workspace pointed at an empty local folder.
2. Copy `AGENTS.md` into the root of that folder. Antigravity loads it automatically as a
   standing rule set (this is what enforces the git-commit-after-every-change behavior).
3. Copy this file (`PROJECT_SPEC.md`) into the same root folder.
4. In the Agent Manager, start a new conversation and say roughly:
   > "Read PROJECT_SPEC.md and AGENTS.md in this workspace. Start with Phase 0, then Phase 1.
   > Stop and summarize after each phase before continuing."
5. Work phase by phase (Section 12 below). Don't ask it to "build the whole app" in one message —
   review each phase, run the app locally, then tell it to continue to the next phase.

---

## 1. Product overview

**SessionBook** lets a creator (coach, mentor, consultant, tutor — anyone who sells their time)
sign up, define one or more bookable "session types" with a price and duration, set their
weekly availability, and publish a public booking page. A client visits that page, picks a slot,
enters their details, pays online, and instantly receives a confirmation email with the schedule.
The platform takes a **4% commission** on every booking; the rest is owed to the creator.

No subscription fees for creators — the platform only earns when a creator earns.

## 2. User roles

| Role | Description |
|---|---|
| **Admin** (you) | Owns the platform. Sees all bookings, GMV, commission earned, manages creators. |
| **Creator** | Signs up, builds session types + availability, publishes a public page, gets paid. |
| **Client** | No account required. Visits a creator's public link, books, and pays as a guest. |

## 3. Core user flows

### 3.1 Creator onboarding
1. Sign up (email + password, or Google OAuth) → verify email.
2. Complete profile: display name, bio, photo, timezone, unique public slug (`/u/jane-doe`).
3. Add payout details (bank account / UPI — see Section 9 on payouts).
4. Create one or more **Session Types**: title, description, duration, price (INR), buffer time.
5. Set **Availability**: recurring weekly hours (e.g. Mon–Fri 10:00–18:00) + date-specific
   overrides (block a day off, or open an extra day).
6. Toggle **Publish** — public page goes live at `sessionbook.app/u/jane-doe`.

### 3.2 Booking flow (client-facing, no login)
1. Client opens the creator's public page → sees bio + list of session types.
2. Picks a session type → sees a calendar/date picker with only genuinely open slots
   (creator's availability minus buffer time minus already-booked slots minus past times).
3. Picks a slot → fills a short form: name, email, phone, optional note.
4. Reviews price → clicks **Pay & Confirm** → Razorpay Checkout opens.
5. On successful payment, the booking flips from `pending_payment` to `confirmed`.
6. Client and creator each receive a confirmation email with date/time (in their own timezone)
   and a calendar invite (`.ics` attachment). Client is shown a confirmation page too.
7. If payment is abandoned or fails, the held slot is released after 10 minutes so others can book it.

### 3.3 Money flow (see Section 9 for full detail)
1. Client pays the **full session price** into the platform's Razorpay account.
2. Platform ledger records: `platform_fee = 4% of price`, `creator_payout = 96% of price`.
3. Creator is paid out (automatically via Razorpay Route once eligible, or manually/via
   RazorpayX Payouts in the meantime — Section 9 explains both and how to switch later
   without changing the data model).

## 4. Feature checklist by role

**Creator**
- [ ] Auth: signup, login, logout, password reset
- [ ] Profile edit (name, bio, photo, timezone, slug)
- [ ] Session type CRUD (title, description, duration, price, buffer, active/inactive)
- [ ] Availability: weekly recurring rules + date overrides
- [ ] Publish/unpublish public page
- [ ] Payout details form (bank/UPI)
- [ ] Dashboard: upcoming bookings, past bookings, total earned, pending payout
- [ ] Booking detail view, manual cancel (triggers refund)

**Client**
- [ ] View public creator page (no login)
- [ ] Pick session type → pick slot → fill details → pay
- [ ] Email confirmation + `.ics` calendar file
- [ ] Booking confirmation page with cancel/reschedule link (token-based, no login)

**Admin**
- [ ] Login (separate role check, same auth system)
- [ ] Dashboard: total GMV, total commission earned, active creators count
- [ ] Creators list (status, published/unpublished, total earned)
- [ ] Transactions list (booking, amount, fee, payout status)
- [ ] Manually mark a payout as sent (for the manual-payout phase)

## 5. Data model

Use PostgreSQL + Prisma. All money fields are integers in paise (₹1 = 100).

```prisma
model User {
  id            String   @id @default(cuid())
  role          Role     @default(CREATOR)
  name          String
  email         String   @unique
  phone         String?
  passwordHash  String?
  timezone      String   @default("Asia/Kolkata")
  createdAt     DateTime @default(now())
  creatorProfile CreatorProfile?
}

enum Role {
  ADMIN
  CREATOR
}

model CreatorProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])
  slug              String    @unique
  bio               String?
  avatarUrl         String?
  isPublished       Boolean   @default(false)
  payoutMethod      String?   // "bank" | "upi" | "razorpay_route"
  payoutDetails     Json?     // encrypted/opaque blob: account no, IFSC, UPI id, or Route linked_account_id
  sessionTypes      SessionType[]
  availabilityRules AvailabilityRule[]
  availabilityOverrides AvailabilityOverride[]
  bookings          Booking[]
}

model SessionType {
  id                String   @id @default(cuid())
  creatorId         String
  creator           CreatorProfile @relation(fields: [creatorId], references: [id])
  title             String
  description       String?
  durationMinutes   Int
  priceInPaise      Int
  bufferBeforeMin   Int      @default(0)
  bufferAfterMin    Int      @default(0)
  isActive          Boolean  @default(true)
  bookings          Booking[]
}

model AvailabilityRule {
  id         String   @id @default(cuid())
  creatorId  String
  creator    CreatorProfile @relation(fields: [creatorId], references: [id])
  dayOfWeek  Int      // 0 = Sunday .. 6 = Saturday
  startTime  String   // "10:00" in creator's local timezone
  endTime    String   // "18:00"
}

model AvailabilityOverride {
  id         String   @id @default(cuid())
  creatorId  String
  creator    CreatorProfile @relation(fields: [creatorId], references: [id])
  date       DateTime // specific calendar date
  isBlocked  Boolean  @default(true) // true = day off; false = extra opening w/ startTime/endTime
  startTime  String?
  endTime    String?
}

model Booking {
  id              String   @id @default(cuid())
  sessionTypeId   String
  sessionType     SessionType @relation(fields: [sessionTypeId], references: [id])
  creatorId       String
  creator         CreatorProfile @relation(fields: [creatorId], references: [id])
  clientName      String
  clientEmail     String
  clientPhone     String
  notes           String?
  scheduledStart  DateTime // stored UTC
  scheduledEnd    DateTime // stored UTC
  status          BookingStatus @default(PENDING_PAYMENT)
  cancelToken     String   @unique @default(cuid())
  createdAt       DateTime @default(now())
  payment         Payment?
}

enum BookingStatus {
  PENDING_PAYMENT
  CONFIRMED
  CANCELLED
  REFUNDED
  COMPLETED
}

model Payment {
  id                 String   @id @default(cuid())
  bookingId          String   @unique
  booking            Booking  @relation(fields: [bookingId], references: [id])
  razorpayOrderId    String
  razorpayPaymentId  String?
  amountTotalPaise   Int
  platformFeePaise   Int
  creatorPayoutPaise Int
  status             PaymentStatus @default(CREATED)
  payoutStatus       PayoutStatus @default(NOT_PAID_OUT)
  createdAt          DateTime @default(now())
}

enum PaymentStatus {
  CREATED
  CAPTURED
  FAILED
  REFUNDED
}

enum PayoutStatus {
  NOT_PAID_OUT
  ROUTE_TRANSFERRED   // automatic split via Razorpay Route
  MANUALLY_PAID       // admin marked as paid via bank/UPI transfer
}
```

## 6. API design (Next.js route handlers)

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | * | Auth (NextAuth) |
| `/api/creator/profile` | GET/PUT | Get/update own profile, toggle publish |
| `/api/creator/session-types` | GET/POST | List/create session types |
| `/api/creator/session-types/[id]` | PUT/DELETE | Update/delete a session type |
| `/api/creator/availability` | GET/PUT | Get/replace weekly rules + overrides |
| `/api/creator/bookings` | GET | Creator's bookings (upcoming/past) |
| `/api/public/[slug]` | GET | Public profile + active session types |
| `/api/public/[slug]/slots` | GET | Computed open slots for a session type + date range |
| `/api/bookings` | POST | Create a booking (status `PENDING_PAYMENT`) + Razorpay order |
| `/api/bookings/[id]/cancel` | POST | Cancel via `cancelToken`, triggers refund |
| `/api/payments/webhook` | POST | Razorpay webhook — verify signature, capture, confirm, payout, email |
| `/api/admin/stats` | GET | GMV, commission earned, active creator count |
| `/api/admin/creators` | GET | List all creators + status |
| `/api/admin/transactions` | GET | List all payments/payouts |
| `/api/admin/payouts/[id]/mark-paid` | POST | Admin marks a manual payout as sent |

### Slot computation logic (for `/api/public/[slug]/slots`)
1. Load the creator's `AvailabilityRule`s for the requested date's day-of-week.
2. Apply any `AvailabilityOverride` for that exact date (fully blocks the day, or replaces the window).
3. Slice the resulting window into slots of `durationMinutes + bufferBefore + bufferAfter`.
4. Remove slots that overlap an existing `Booking` with status `PENDING_PAYMENT` (< 10 min old)
   or `CONFIRMED` for that creator.
5. Remove any slot that starts in the past.
6. Return slots in UTC; the client formats them in the browser's local timezone.

## 7. Payment & payout architecture (Razorpay)

**Important, current constraint (verified Sept 2026):** Razorpay's automatic split-payment
product, **Route**, now requires your business to meet an RBI-mandated minimum turnover
(₹40 lakh domestic turnover, or ₹5 lakh export turnover, in the current or preceding financial
year) before it can be enabled, following RBI Payment Aggregator guidelines from September 2025.
A brand-new platform will not qualify on day one. Build for **manual payouts first**, structure
the code so **Route can be switched on later** without a rebuild.

### Phase A — MVP payout model (use this first)
1. Client pays the full amount via a standard Razorpay **Order** + **Checkout**.
2. Webhook `payment.captured` verifies the signature, marks `Payment.status = CAPTURED`
   and `Booking.status = CONFIRMED`, computes and stores `platformFeePaise` (4%) and
   `creatorPayoutPaise` (96%).
3. All money settles into your own Razorpay account.
4. On a schedule (e.g. weekly), you (or an admin dashboard action) send each creator their
   accumulated `creatorPayoutPaise` via a manual bank/UPI transfer, or via **RazorpayX Payouts**
   (a separate, simpler payout API that doesn't require Route eligibility) — then mark those
   payments `payoutStatus = MANUALLY_PAID` in the admin dashboard.

### Phase B — Automatic split (switch on once Route-eligible)
1. Apply for Route access once your turnover threshold is met (Razorpay reviews in 5–7 business days).
2. Onboard each creator as a Route **Linked Account** (requires their PAN + bank details —
   a lightweight KYC step you'd add to the creator settings page) and store the returned
   `linked_account_id` in `CreatorProfile.payoutDetails`.
3. In the webhook handler, after capturing payment, create a Razorpay **Transfer** splitting
   96% to the creator's linked account and keeping 4% on your platform account — same
   transaction, same webhook, no separate payout run needed.
4. Set `payoutStatus = ROUTE_TRANSFERRED`.

Because both phases write to the same `Payment` fields, you can build the whole app now and
flip the payout mechanism later by swapping only the code inside the webhook handler.

### Webhook security (non-negotiable)
- Verify `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` using HMAC-SHA256 before
  trusting any payload.
- Make the handler idempotent (check `razorpayPaymentId` isn't already processed) — Razorpay
  may retry webhook delivery.
- Never compute the charge amount from anything the browser sent; always recompute from the
  `SessionType.priceInPaise` stored server-side.

## 8. Email notifications

Use Resend (or Nodemailer + any SMTP provider) with React Email for templates.

| Trigger | Recipient | Content |
|---|---|---|
| Booking confirmed | Client | Date/time, creator name, `.ics` attachment, cancel link |
| Booking confirmed | Creator | Client name/contact, date/time, `.ics` attachment |
| Booking cancelled/refunded | Both | Cancellation notice, refund timeline if applicable |
| (optional, later) | Client | Reminder 1 hour before session |

## 9. Suggested distribution model (your question about splitting the money)

Three viable approaches, in order of how you'll actually use them over time:

1. **Manual transfer (start here).** All payments land in your Razorpay account. Your DB
   is the source of truth for who's owed what. Once a week, transfer each creator their
   balance via UPI/bank transfer (or RazorpayX Payouts, which needs only your own KYC, not
   Route). Simple, fully within your control, zero extra approval needed.
2. **RazorpayX Payouts API** — same idea as #1 but automated: your backend calls the Payouts
   API on a schedule instead of you doing it by hand. Good middle step once volume grows.
3. **Razorpay Route (automatic, real-time split).** The "set and forget" option, but gated
   behind the turnover/compliance requirements described in Section 7. Apply for it once
   you're eligible; the data model above already supports switching to it.

## 10. Tech stack

- **Framework:** Next.js 15 (App Router), TypeScript, strict mode
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** PostgreSQL (Supabase or Neon) via Prisma ORM
- **Auth:** NextAuth.js (email/password credentials + optional Google OAuth)
- **Payments:** Razorpay Orders + Checkout (Route added later per Section 7)
- **Email:** Resend + React Email
- **Validation:** Zod on every API input and webhook payload
- **Dates/timezones:** `date-fns` + `date-fns-tz`
- **Hosting:** Vercel (serverless functions handle the webhook fine)

## 11. Folder structure

```
/app
  /(marketing)/page.tsx              → landing page
  /(auth)/signup, /login
  /dashboard/page.tsx                → creator home
  /dashboard/session-types
  /dashboard/availability
  /dashboard/settings
  /u/[slug]/page.tsx                 → public creator page
  /u/[slug]/book/[sessionTypeId]/page.tsx
  /booking/[id]/confirmation/page.tsx
  /admin/page.tsx
  /api/...                            → route handlers per Section 6
/lib
  /db.ts (Prisma client)
  /auth.ts
  /razorpay.ts
  /email.ts
  /availability.ts (slot computation)
/prisma/schema.prisma
/emails/*.tsx (React Email templates)
```

## 12. Phased build plan (work through these in order; commit after each per AGENTS.md)

- [ ] **Phase 0 — Scaffolding:** `git init`, Next.js + TS + Tailwind project, Prisma set up
  against a Postgres URL, `.env.example`, `.gitignore`. Commit: `chore: project scaffolding`.
- [ ] **Phase 1 — Auth & DB:** Full Prisma schema from Section 5, run migration, NextAuth
  credentials login/signup for `CREATOR` role, protected `/dashboard` shell.
- [ ] **Phase 2 — Creator profile & session types:** profile edit + slug + publish toggle;
  session type CRUD UI + API.
- [ ] **Phase 3 — Availability engine:** weekly rules + date overrides UI/API, and the slot
  computation function from Section 6, unit-tested with a couple of edge cases (midnight
  crossover, fully blocked day).
- [ ] **Phase 4 — Public page:** `/u/[slug]` listing session types, slot picker calling
  `/api/public/[slug]/slots`.
- [ ] **Phase 5 — Booking + payment:** booking form → `/api/bookings` → Razorpay order →
  Checkout embed → confirmation page.
- [ ] **Phase 6 — Webhook & payout ledger:** signature verification, idempotent capture
  handling, fee/payout split calculation (Phase A manual model from Section 9).
- [ ] **Phase 7 — Emails:** confirmation emails with `.ics` attachments for client + creator.
- [ ] **Phase 8 — Creator dashboard:** bookings list, earnings summary, payout status.
- [ ] **Phase 9 — Admin dashboard:** GMV, commission earned, creators list, transactions list,
  "mark payout as paid" action.
- [ ] **Phase 10 — Polish:** loading/error/empty states, mobile responsiveness, form validation
  messages, timezone display correctness.
- [ ] **Phase 11 — Deploy:** Vercel env vars, Razorpay live keys, webhook URL registered in
  Razorpay dashboard, smoke test a real ₹1 booking end to end.

## 13. Edge cases to explicitly handle

- Client abandons checkout → slot must be released after ~10 minutes.
- Two clients try to book the same slot at nearly the same time → second request should fail
  cleanly with "slot no longer available."
- Creator changes price after a booking was already confirmed → historical booking keeps its
  original price (never recompute retroactively).
- Creator unpublishes while a booking is pending payment → let the in-flight booking complete.
- Refunds → Razorpay refund API call + `Booking.status = REFUNDED` + notify both parties.
- Client and creator in different timezones → always display each person's own local time,
  store everything in UTC.
