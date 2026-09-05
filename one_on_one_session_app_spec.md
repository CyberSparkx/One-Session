# 1:1 Session Marketplace — Product & Technical Specification

**Target stack:** Next.js + TypeScript  
**Product type:** Marketplace for paid 1:1 sessions  
**Primary integrations:** Google OAuth, Google Calendar, Google Meet, Stripe  
**Document purpose:** Product structure, user flows, feature scope, architecture, data model, and implementation roadmap

---

## 1. Product Summary

The product is a marketplace where creators/mentors/experts can publish paid 1:1 sessions and users can:

1. Discover a creator.
2. View a session/service.
3. Choose an available date and time.
4. Pay for the session.
5. Automatically receive a calendar event and Google Meet link.
6. Manage, reschedule, or cancel the booking.
7. Join the session from the booking/dashboard.
8. Receive reminders and transactional emails.

The creator gets:

- A public profile.
- A public session/offer page.
- Availability controls.
- Google Calendar synchronization.
- Automatic Google Meet generation.
- Booking management.
- Payment/earning visibility.
- Customer/session history.

The product should feel like a combination of a **creator marketplace + Calendly/TidyCal-style scheduling + paid consultation checkout**.

---

# 2. Research Findings

## 2.1 Products worth learning from

### Calendly

Key patterns:

- Booking links.
- Calendar availability.
- Google Calendar integration.
- Google Meet integration.
- Automatic conferencing details.
- Scheduling rules.
- Public booking pages.

Calendly currently documents Google Calendar + Google Meet integration where connected Google Calendar can automatically add Google Meet conferencing details to meetings.

**What to copy conceptually:** extremely simple booking flow.

---

### TidyCal

TidyCal combines:

- Public booking pages.
- Multiple booking types.
- Custom availability schedules.
- Calendar synchronization.
- Paid bookings.
- Stripe/PayPal.
- Recurring bookings.
- Packages.
- Google Meet.
- Booking management.

Its current documentation says Google Meet links can be automatically generated when Google Calendar is connected and Google Meet is selected as the booking location.

**What to copy conceptually:** simple service creation + booking + payment flow.

---

### SavvyCal

Important ideas:

- Calendar-aware availability.
- Booking links.
- Payments before reserving a slot.
- Availability limits.
- Buffer time.
- Time blocks.
- Frequency limits.
- Team scheduling.

**What to copy conceptually:** strong scheduling engine rather than a simple list of available hours.

---

### MentorCruise

This is especially relevant because the product model is close to the planned app.

MentorCruise supports one-time sessions with:

- Fixed price.
- Defined scope.
- Booking from a mentor profile.
- Scheduling integrations.
- Calendar connections.
- Conferencing tools.
- Working hours.
- Scheduling rules.
- Buffer before/after meetings.

**What to copy conceptually:** creator/mentor profile → session product → purchase → scheduled meeting.

---

# 3. Product Vision

## Core concept

> **Experts sell their time. Users buy a specific outcome and a scheduled 1:1 conversation.**

The product should not initially behave like a generic calendar application.

The primary object should be a **Session**.

Example:

```text
Creator
  └── Session
       ├── "1:1 React Mentorship"
       ├── 60 minutes
       ├── ₹999
       ├── Description
       ├── Questions
       ├── Availability
       └── Google Meet
```

---

# 4. User Types

## 4.1 Guest

Can:

- Browse creators.
- Search sessions.
- View public profiles.
- View session details.
- Start booking.
- Sign up/login during checkout.

Cannot:

- Create sessions.
- Manage calendar.
- See private bookings.

---

## 4.2 Customer

Can:

- Book sessions.
- Pay.
- View upcoming sessions.
- View past sessions.
- Reschedule.
- Cancel where allowed.
- Join Google Meet.
- Manage profile.
- Connect Google Calendar if needed.

---

## 4.3 Creator

Can:

- Create/edit profile.
- Create sessions.
- Set prices.
- Set duration.
- Configure availability.
- Connect Google Calendar.
- Generate Google Meet links.
- Manage bookings.
- View earnings.
- View customers.
- Configure cancellation/rescheduling rules.

---

## 4.4 Admin

Can:

- Manage users.
- Manage creators.
- Manage sessions.
- View bookings.
- View payments.
- Handle disputes/refunds.
- Suspend accounts.
- Moderate public content.
- View platform analytics.

---

# 5. Recommended MVP Scope

Do NOT build everything at once.

## MVP

### Authentication

- Google login.
- Email/password or magic link.
- Session management.
- Role selection: customer/creator.

### Creator

- Profile.
- Bio.
- Profile photo.
- Social links.
- Session creation.
- Price.
- Duration.
- Description.
- Availability.
- Buffer time.

### Booking

- Public session page.
- Calendar.
- Available time slots.
- Timezone handling.
- Checkout.
- Booking confirmation.

### Google

- Google OAuth.
- Google Calendar connection.
- Calendar free/busy lookup.
- Google Calendar event creation.
- Google Meet generation.

### Payments

- Stripe Checkout.
- Payment success/failure.
- Webhooks.
- Booking confirmation only after verified payment.

### Notifications

- Booking confirmation.
- Creator notification.
- Cancellation.
- Rescheduling.
- Reminder.

---

# 6. Future Features

After MVP:

- Packages.
- Recurring sessions.
- Coupons.
- Reviews.
- Ratings.
- Creator discovery.
- Search.
- Categories.
- Featured creators.
- Payouts.
- Platform commission.
- Refund automation.
- Email templates.
- SMS/WhatsApp reminders.
- Zoom.
- Microsoft Teams.
- Apple Calendar.
- Outlook Calendar.
- Team accounts.
- Group sessions.
- Subscriptions.
- Analytics.
- Affiliate/referral system.
- Creator verification.
- Custom domains.
- Embed booking widget.
- API.
- Webhooks.
- Mobile application.

---

# 7. Complete User Journey

## Customer Journey

```text
Landing Page
     ↓
Browse/Search
     ↓
Creator Profile
     ↓
Session Details
     ↓
Select Date
     ↓
Select Time
     ↓
Login / Signup
     ↓
Checkout
     ↓
Stripe Payment
     ↓
Payment Webhook
     ↓
Booking Created
     ↓
Google Calendar Event Created
     ↓
Google Meet Link Generated
     ↓
Confirmation Page
     ↓
Email Confirmation
     ↓
Reminder
     ↓
Join Meeting
     ↓
Session Completed
```

---

# 8. Creator Journey

```text
Signup
  ↓
Choose "Become a Creator"
  ↓
Complete Profile
  ↓
Connect Google Account
  ↓
Connect Google Calendar
  ↓
Configure Availability
  ↓
Create Session
  ↓
Set Price
  ↓
Publish
  ↓
Share Public Link
  ↓
Customer Books
  ↓
Payment Confirmed
  ↓
Calendar Event Created
  ↓
Google Meet Created
  ↓
Creator Receives Notification
  ↓
Session
  ↓
Completed
```

---

# 9. Public Website Structure

## `/`

Landing page.

Sections:

- Hero.
- How it works.
- Popular categories.
- Featured creators.
- Popular sessions.
- CTA for creators.
- CTA for customers.
- Footer.

---

## `/explore`

Marketplace.

Filters:

- Category.
- Price.
- Duration.
- Rating.
- Language.
- Availability.
- Creator.

Search:

```text
"React mentor"
"Video editing"
"DSA"
"Career guidance"
"UI/UX"
```

---

## `/creator/[username]`

Creator profile.

Contains:

- Avatar.
- Name.
- Bio.
- Expertise.
- Social links.
- Reviews.
- Sessions.

Example:

```text
Naren Roy
Software Developer

Helping beginners become better developers.

[1:1 React Session]
60 min
₹999

[Book Session]
```

---

## `/session/[slug]`

Session landing page.

Contains:

- Session title.
- Creator.
- Price.
- Duration.
- Description.
- What you'll get.
- Who it's for.
- Requirements.
- Cancellation policy.
- FAQ.
- Available times.
- Book button.

---

# 10. Booking UI

The booking experience should be extremely simple.

## Step 1 — Date

```text
September 2026

Mon Tue Wed Thu Fri Sat Sun
 1   2   3   4   5   6   7
```

## Step 2 — Time

```text
09:00 AM
10:00 AM
11:30 AM
02:00 PM
04:30 PM
```

## Step 3 — Details

```text
Name
Email
Question / Goal
```

## Step 4 — Payment

```text
1:1 React Session
60 minutes

₹999

[Pay & Book]
```

---

# 11. Timezone Handling

This is critical.

Store timestamps in UTC.

Display them in the user's timezone.

Example:

```text
Creator timezone:
Asia/Kolkata

Customer timezone:
America/New_York
```

The customer should see:

```text
Your time:
9:30 AM

Creator's time:
7:00 PM
```

Never store a booking as a naive local date/time.

Recommended database fields:

```text
startAt: UTC timestamp
endAt: UTC timestamp
timezone: IANA timezone
```

Examples:

```text
Asia/Kolkata
America/New_York
Europe/London
```

---

# 12. Availability Engine

Creator config:

```text
Monday
09:00 - 12:00
14:00 - 18:00

Tuesday
09:00 - 12:00

Wednesday
OFF
```

Session:

```text
Duration: 60 minutes
Buffer before: 15 minutes
Buffer after: 15 minutes
```

The scheduler calculates:

```text
Working hours
-
Existing Google Calendar events
-
Existing platform bookings
-
Buffers
=
Available slots
```

---

# 13. Google Calendar Integration

Google Calendar should be treated as the source of truth for creator conflicts.

Google Calendar provides a `freeBusy` endpoint that can return busy periods for calendars.

Use it to determine whether the creator is already occupied.

Flow:

```text
Creator connects Google
       ↓
OAuth authorization
       ↓
Store encrypted refresh token
       ↓
Fetch calendar list
       ↓
Creator selects calendar
       ↓
Fetch busy periods
       ↓
Generate available slots
```

Google's OAuth web-server flow uses authorization codes and can return access + refresh tokens. The refresh token allows the server to obtain fresh access tokens later.

---

# 14. Google Meet Integration

Recommended implementation:

Create a Google Calendar event and request Google Meet conference data as part of the event.

Conceptually:

```text
Google Calendar Event
        +
conferenceData.createRequest
        ↓
Google Meet conference
        ↓
Meeting URL
```

Google's Calendar API supports `conferenceData` and recommends generating a unique conference for each event.

Do not reuse the same Meet conference across unrelated bookings.

Store:

```text
googleMeetUrl
googleConferenceId
```

---

# 15. Google OAuth Architecture

Never put Google client secrets in the browser.

Recommended:

```text
Browser
   ↓
Next.js server route
   ↓
Google OAuth
   ↓
Callback
   ↓
Store encrypted refresh token
```

Environment variables:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

Required APIs:

- Google Calendar API.
- Google People API if profile information is required.

Recommended OAuth scopes should be kept as narrow as practical.

For calendar management, use the least-privileged scopes that satisfy the required functionality.

---

# 16. Stripe Payment Architecture

Do NOT trust the frontend for payment success.

Correct flow:

```text
Customer
   ↓
Booking hold
   ↓
Stripe Checkout Session
   ↓
Customer pays
   ↓
Stripe webhook
   ↓
Verify webhook signature
   ↓
Payment confirmed
   ↓
Create final booking
   ↓
Create Calendar event
   ↓
Generate Google Meet
   ↓
Send confirmation
```

Important:

The booking should not become permanently confirmed merely because the browser returned to a success URL.

The Stripe webhook is the source of truth.

---

# 17. Preventing Double Booking

This is one of the most important backend problems.

Potential race condition:

```text
Customer A sees 5:00 PM available
Customer B sees 5:00 PM available

A pays
B pays

Both try to book 5:00 PM
```

Solution:

Use a temporary booking hold.

Example:

```text
AVAILABLE
   ↓
HELD
   ↓
PAYMENT_PENDING
   ↓
CONFIRMED
```

Hold expiration:

```text
10 minutes
```

Database transaction / unique constraint should protect the final booking.

Recommended constraint concept:

```text
creatorId + startAt + endAt
```

must not allow overlapping confirmed bookings.

For robust implementation, use PostgreSQL and transaction/locking logic rather than relying only on frontend checks.

---

# 18. Booking State Machine

```text
PENDING
   ↓
PAYMENT_PENDING
   ↓
CONFIRMED
   ↓
COMPLETED
```

Alternative paths:

```text
PENDING → EXPIRED
PENDING → CANCELLED

CONFIRMED → CANCELLED
CONFIRMED → RESCHEDULED
CONFIRMED → NO_SHOW
```

---

# 19. Rescheduling

Customer opens:

```text
Dashboard
 → Upcoming session
 → Reschedule
```

System:

1. Check cancellation/reschedule policy.
2. Fetch latest availability.
3. Select new slot.
4. Update booking.
5. Update Google Calendar event.
6. Keep or regenerate conference information according to the implementation policy.
7. Send notification.

Do not allow rescheduling into an occupied slot.

---

# 20. Cancellation

Session should define:

```text
Cancellation allowed:
24 hours before session

Refund:
100%
```

Possible policies:

```text
Flexible
24 hours
48 hours
No refund
```

Cancellation flow:

```text
Cancel
 ↓
Check policy
 ↓
Cancel booking
 ↓
Refund if applicable
 ↓
Update Calendar
 ↓
Notify both parties
```

---

# 21. Database Design

Recommended database:

**PostgreSQL**

ORM:

**Prisma**

---

## User

```text
User
- id
- name
- email
- image
- role
- timezone
- createdAt
- updatedAt
```

Roles:

```text
CUSTOMER
CREATOR
ADMIN
```

---

## CreatorProfile

```text
CreatorProfile
- id
- userId
- username
- headline
- bio
- avatarUrl
- category
- socialLinks
- isPublished
- createdAt
- updatedAt
```

---

## Session

```text
Session
- id
- creatorId
- title
- slug
- description
- durationMinutes
- price
- currency
- status
- cancellationPolicy
- bufferBeforeMinutes
- bufferAfterMinutes
- createdAt
- updatedAt
```

---

## AvailabilityRule

```text
AvailabilityRule
- id
- creatorId
- dayOfWeek
- startTime
- endTime
- timezone
- enabled
```

---

## Booking

```text
Booking
- id
- sessionId
- creatorId
- customerId
- startAt
- endAt
- timezone
- status
- price
- currency
- notes
- cancellationReason
- createdAt
- updatedAt
```

---

## Payment

```text
Payment
- id
- bookingId
- provider
- providerPaymentId
- amount
- currency
- status
- createdAt
```

---

## CalendarConnection

```text
CalendarConnection
- id
- userId
- provider
- providerAccountId
- calendarId
- accessTokenEncrypted
- refreshTokenEncrypted
- expiresAt
- scopes
- createdAt
- updatedAt
```

---

## CalendarEvent

```text
CalendarEvent
- id
- bookingId
- provider
- externalEventId
- conferenceUrl
- conferenceId
- createdAt
- updatedAt
```

---

## Notification

```text
Notification
- id
- userId
- type
- title
- message
- readAt
- createdAt
```

---

# 22. Recommended Next.js Architecture

Use the App Router.

```text
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── explore/
│   │   └── creator/
│   │
│   ├── session/
│   │   └── [slug]/
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── bookings/
│   │   ├── sessions/
│   │   ├── availability/
│   │   ├── integrations/
│   │   ├── earnings/
│   │   └── settings/
│   │
│   ├── checkout/
│   │   └── [bookingId]/
│   │
│   └── api/
│       ├── auth/
│       ├── bookings/
│       ├── sessions/
│       ├── availability/
│       ├── google/
│       ├── stripe/
│       └── webhooks/
│
├── components/
│   ├── ui/
│   ├── booking/
│   ├── calendar/
│   ├── session/
│   ├── creator/
│   └── dashboard/
│
├── lib/
│   ├── auth/
│   ├── google/
│   ├── stripe/
│   ├── calendar/
│   ├── booking/
│   ├── availability/
│   └── email/
│
├── server/
│   ├── services/
│   └── repositories/
│
├── prisma/
│   └── schema.prisma
│
└── types/
```

---

# 23. Backend Service Architecture

Keep business logic out of React components.

Recommended:

```text
API Route
   ↓
Service
   ↓
Repository
   ↓
Database
```

Example:

```text
POST /api/bookings

BookingController
       ↓
BookingService
       ↓
AvailabilityService
       ↓
PaymentService
       ↓
CalendarService
       ↓
Database
```

---

# 24. Important Services

## AvailabilityService

Responsibilities:

- Working hours.
- Calendar busy periods.
- Existing platform bookings.
- Buffer times.
- Slot generation.
- Timezone conversion.

---

## BookingService

Responsibilities:

- Booking creation.
- Booking holds.
- State transitions.
- Double-booking prevention.
- Rescheduling.
- Cancellation.

---

## GoogleCalendarService

Responsibilities:

- OAuth.
- Token refresh.
- Calendar listing.
- Free/busy.
- Event creation.
- Event update.
- Event deletion.
- Meet generation.

---

## PaymentService

Responsibilities:

- Stripe Checkout.
- Payment verification.
- Refunds.
- Webhook processing.

---

## NotificationService

Responsibilities:

- Booking email.
- Reminder email.
- Cancellation email.
- Reschedule email.
- Creator notifications.

---

# 25. API Design

## Sessions

```http
POST   /api/sessions
GET    /api/sessions
GET    /api/sessions/:slug
PATCH  /api/sessions/:id
DELETE /api/sessions/:id
```

---

## Availability

```http
GET  /api/availability/:sessionId
POST /api/availability
PATCH /api/availability/:id
DELETE /api/availability/:id
```

---

## Booking

```http
POST /api/bookings/hold
POST /api/bookings
GET  /api/bookings/:id
POST /api/bookings/:id/cancel
POST /api/bookings/:id/reschedule
```

---

## Google

```http
GET /api/integrations/google/connect
GET /api/integrations/google/callback
GET /api/integrations/google/calendars
POST /api/integrations/google/disconnect
```

---

## Stripe

```http
POST /api/payments/create-checkout
POST /api/webhooks/stripe
```

---

# 26. Dashboard Structure

## Customer Dashboard

```text
Dashboard
├── Upcoming
├── Past
├── Bookings
├── Profile
└── Settings
```

Upcoming card:

```text
React Mentorship
with Naren Roy

Today
7:00 PM

[Join Meeting]
[Reschedule]
[Cancel]
```

---

## Creator Dashboard

```text
Dashboard
├── Overview
├── Sessions
├── Calendar
├── Bookings
├── Customers
├── Earnings
├── Availability
├── Integrations
└── Settings
```

Overview:

```text
Today's sessions
Upcoming bookings
Total bookings
Revenue
Conversion rate
```

---

# 27. Creator Session Builder

The session creation form should be divided into sections.

## Basic information

```text
Title
Short description
Full description
Category
```

## Pricing

```text
Price
Currency
```

## Duration

```text
30 min
45 min
60 min
90 min
Custom
```

## Availability

```text
Use default availability
Custom availability
```

## Location

MVP:

```text
Google Meet
```

Future:

```text
Zoom
Microsoft Teams
Phone
Custom location
```

## Policies

```text
Cancellation
Rescheduling
Minimum notice
Maximum advance booking
```

---

# 28. Scheduling Rules

Each creator should control:

### Minimum notice

Example:

```text
Book at least 2 hours before start.
```

### Maximum advance

Example:

```text
Allow booking up to 30 days ahead.
```

### Buffer

```text
15 min before
15 min after
```

### Daily limit

```text
Maximum 5 sessions/day
```

### Weekly limit

```text
Maximum 20 sessions/week
```

### Booking frequency

Useful for creators who don't want back-to-back meetings.

---

# 29. Email System

Recommended provider:

- Resend
- Postmark
- Amazon SES

Email events:

```text
Booking confirmed
Payment received
Session reminder
Session tomorrow
Session in 1 hour
Booking cancelled
Booking rescheduled
Payment failed
Refund issued
Creator received booking
```

---

# 30. Reminder System

Recommended schedule:

```text
24 hours before
1 hour before
10 minutes before
```

For MVP:

```text
24h
1h
```

Use a background job system instead of relying on a normal HTTP request.

Possible choices:

- Inngest.
- Trigger.dev.
- BullMQ + Redis.
- Vercel Cron for simpler scheduled tasks.

---

# 31. Security Requirements

Important:

- Encrypt Google refresh tokens.
- Never expose OAuth client secrets.
- Validate webhook signatures.
- Validate all API input.
- Rate-limit public booking APIs.
- Protect dashboard routes.
- Use server-side authorization.
- Never trust role values from the client.
- Prevent IDOR by checking resource ownership.
- Sanitize user-generated content where required.
- Use secure cookies/session handling.
- Keep payment and booking state server-controlled.

---

# 32. Google Token Strategy

Store:

```text
refreshToken
accessToken
expiresAt
```

Access tokens are temporary.

When expired:

```text
refreshToken
    ↓
Google OAuth token endpoint
    ↓
new accessToken
```

Refresh tokens should be encrypted at rest.

---

# 33. Calendar Synchronization Strategy

MVP:

```text
Read busy times
Create events
Update events
Delete events
```

Future:

```text
Google Calendar watch/webhooks
```

A synchronization layer should eventually detect external calendar changes.

Example:

```text
Creator blocks 5 PM directly in Google Calendar
             ↓
Calendar change detected
             ↓
Availability recalculated
             ↓
5 PM disappears from booking page
```

---

# 34. Booking Hold System

When user chooses a slot:

```text
AVAILABLE
   ↓
10-minute HOLD
   ↓
Stripe Checkout
```

If payment succeeds:

```text
HOLD → CONFIRMED
```

If payment fails/expires:

```text
HOLD → EXPIRED
```

A cleanup worker should periodically remove expired holds.

---

# 35. Payments & Marketplace Consideration

There are two possible business models.

## Model A — Platform collects money

```text
Customer
   ↓
Platform Stripe account
   ↓
Platform
   ↓
Creator payout
```

Good for:

- Platform commission.
- Centralized refunds.
- Marketplace economics.

This requires marketplace/payout architecture.

---

## Model B — Creator connects Stripe

```text
Customer
   ↓
Creator's connected Stripe account
```

Better for:

- Simpler creator ownership.
- Less money held by platform.

For a real marketplace, Stripe Connect should be evaluated early.

---

# 36. Recommended MVP Business Model

Start with:

```text
Session price: ₹999

Platform commission: 10%
Creator receives: ₹899
```

Actual payment processing fees need to be accounted for separately.

Do not hard-code this assumption into the database; store platform fee configuration.

---

# 37. UX Principles

The most important UX rule:

> **The user should not feel like they are configuring a calendar. They should feel like they are booking a person.**

Bad:

```text
Connect calendar
Configure timezone
Choose event type
Configure conferencing
Configure availability
```

Better:

```text
Choose a session
      ↓
Choose a time
      ↓
Pay
      ↓
You're booked
```

All integration complexity should happen behind the scenes.

---

# 38. Recommended UI

Style direction:

- Clean.
- Minimal.
- Creator-first.
- Large typography.
- Strong session cards.
- Calendar UI that feels lightweight.
- Mobile-first booking experience.

Core UI components:

```text
Navbar
CreatorCard
SessionCard
BookingCalendar
TimeSlotPicker
CheckoutCard
BookingConfirmation
AvailabilityEditor
CalendarConnectionCard
IntegrationCard
DashboardSidebar
StatsCard
BookingCard
SessionBuilder
```

---

# 39. Error Handling

Examples:

### Calendar disconnected

```text
Your Google Calendar connection expired.

[Reconnect Google Calendar]
```

### Slot became unavailable

```text
That time was just booked.

Please choose another time.
```

### Payment failed

```text
Payment couldn't be completed.

Your time slot has been released.
```

### Google Meet generation failed

Do not silently mark booking as broken.

Create the booking, retry Meet generation, and notify the creator if the retry fails.

---

# 40. Observability

Track:

```text
booking_created
booking_hold_created
checkout_started
payment_succeeded
payment_failed
booking_confirmed
booking_cancelled
booking_rescheduled
calendar_event_created
calendar_event_failed
meet_created
meet_creation_failed
```

Use:

- Sentry.
- Structured server logs.
- Database audit events.

---

# 41. Suggested Tech Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
```

## Backend

```text
Next.js Route Handlers / Server Actions
Prisma
PostgreSQL
```

## Authentication

```text
Auth.js / Better Auth
Google OAuth
```

Choose one authentication library rather than implementing OAuth/session management from scratch.

## Payments

```text
Stripe
Stripe Checkout
Stripe Webhooks
Stripe Connect
```

## Calendar

```text
Google Calendar API
Google OAuth
```

## Video

```text
Google Meet through Google Calendar conferenceData
```

## Email

```text
Resend
```

## Background jobs

```text
Inngest / Trigger.dev
```

## Monitoring

```text
Sentry
```

## Hosting

```text
Vercel
```

## Database

```text
PostgreSQL
```

---

# 42. Environment Variables

Example:

```env
DATABASE_URL=

AUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=

APP_URL=
```

Never commit these values.

---

# 43. Development Phases

## Phase 1 — Foundation

- Next.js setup.
- TypeScript.
- Tailwind.
- Database.
- Prisma.
- Authentication.
- User roles.

---

## Phase 2 — Creator System

- Creator profile.
- Username.
- Session CRUD.
- Public creator page.
- Public session page.

---

## Phase 3 — Scheduling Engine

- Availability rules.
- Timezone handling.
- Slot generation.
- Buffer.
- Minimum notice.
- Existing booking conflict detection.

---

## Phase 4 — Google Integration

- Google OAuth.
- Calendar connection.
- Calendar selection.
- Free/busy.
- Calendar event creation.
- Google Meet generation.

---

## Phase 5 — Payments

- Stripe Checkout.
- Booking hold.
- Payment webhook.
- Confirmed booking.
- Refund logic.

---

## Phase 6 — Dashboard

- Customer dashboard.
- Creator dashboard.
- Upcoming bookings.
- Past bookings.
- Session management.
- Availability management.
- Integration management.

---

## Phase 7 — Notifications

- Confirmation emails.
- Cancellation.
- Rescheduling.
- Reminders.

---

## Phase 8 — Production Hardening

- Rate limiting.
- Security.
- Error handling.
- Sentry.
- Logging.
- Database indexes.
- Race-condition testing.
- Webhook idempotency.
- Calendar failure recovery.

---

# 44. MVP Acceptance Criteria

The MVP is ready when this complete scenario works:

```text
1. Creator signs up.
2. Creator connects Google.
3. Creator selects Google Calendar.
4. Creator configures availability.
5. Creator creates a ₹999 / 60-minute session.
6. Creator publishes the session.
7. Customer opens the public session page.
8. Customer selects a date.
9. System checks creator availability.
10. System checks Google Calendar busy periods.
11. Customer selects a slot.
12. Slot becomes temporarily held.
13. Customer completes Stripe Checkout.
14. Stripe webhook confirms payment.
15. Booking becomes CONFIRMED.
16. Google Calendar event is created.
17. Unique Google Meet conference is generated.
18. Meet link is stored.
19. Creator receives confirmation.
20. Customer receives confirmation.
21. Both see the booking in their dashboards.
22. Reminder is sent.
23. Customer joins using the Meet link.
24. Customer can later reschedule/cancel according to policy.
```

---

# 45. Critical Engineering Rules

### Rule 1

Never trust the frontend for payment status.

### Rule 2

Never trust the frontend for availability.

### Rule 3

Never store local date/time as the authoritative booking timestamp.

### Rule 4

Never expose Google refresh tokens.

### Rule 5

Never create a booking without server-side conflict checking.

### Rule 6

Make Stripe webhooks idempotent.

### Rule 7

Make Google Calendar operations retryable.

### Rule 8

Every booking should have a clear state.

### Rule 9

Every external integration failure should be recoverable.

### Rule 10

Keep calendar/provider logic behind service interfaces so future Zoom/Outlook integrations do not require rewriting the booking system.

---

# 46. Provider Abstraction

Build this from day one:

```ts
interface CalendarProvider {
  getCalendars(): Promise<Calendar[]>

  getBusyPeriods(
    calendarId: string,
    start: Date,
    end: Date
  ): Promise<BusyPeriod[]>

  createEvent(
    event: CalendarEventInput
  ): Promise<CalendarEventResult>

  updateEvent(
    eventId: string,
    event: CalendarEventInput
  ): Promise<CalendarEventResult>

  deleteEvent(
    eventId: string
  ): Promise<void>
}
```

Then:

```text
GoogleCalendarProvider
OutlookCalendarProvider
AppleCalendarProvider
```

can implement the same interface later.

---

# 47. Video Provider Abstraction

Similarly:

```ts
interface VideoProvider {
  createMeeting(input: CreateMeetingInput): Promise<Meeting>
  deleteMeeting(id: string): Promise<void>
}
```

For MVP:

```text
GoogleMeetProvider
```

Later:

```text
ZoomProvider
TeamsProvider
```

However, because Google Meet is generated through Google Calendar for this implementation, the actual MVP implementation can keep Meet creation inside the Google Calendar integration service.

---

# 48. What NOT to Build Initially

Avoid:

- Mobile app.
- Chat system.
- Community.
- AI matching.
- Complex analytics.
- Team scheduling.
- Group sessions.
- Multiple payment providers.
- Multiple calendar providers.
- Multiple video providers.
- Custom domains.
- Affiliate system.

First make this perfect:

```text
Creator
→ Session
→ Availability
→ Payment
→ Calendar
→ Meet
→ Booking
```

---

# 49. Final Product Architecture

```text
                         ┌────────────────────┐
                         │      Next.js       │
                         │   Web Application  │
                         └─────────┬──────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
        Authentication       Booking Engine         Dashboard
             │                     │
             │                     ├── Availability
             │                     ├── Timezones
             │                     ├── Holds
             │                     ├── Booking states
             │                     └── Policies
             │
             ▼
        PostgreSQL
             │
             ├── Users
             ├── Creators
             ├── Sessions
             ├── Availability
             ├── Bookings
             ├── Payments
             └── Integrations

                     External Services
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
   Google OAuth       Google Calendar          Stripe
                            │
                            ▼
                       Google Meet

                            │
                            ▼
                         Resend
                         Emails
```

---

# 50. The Most Important Product Loop

The entire product can be reduced to:

```text
DISCOVER
   ↓
UNDERSTAND
   ↓
CHOOSE TIME
   ↓
PAY
   ↓
CONFIRM
   ↓
MEET
   ↓
RETURN
```

If this loop is fast and reliable, the product works.

Everything else is secondary.

---

# 51. Research Sources

The architecture and feature recommendations in this document were informed by current documentation/product pages for:

- Calendly — Google Meet integration and scheduling workflows.
- TidyCal — booking types, calendar sync, payments, Google Meet, recurring bookings and packages.
- SavvyCal — scheduling, payments, availability controls and Google Calendar integration.
- MentorCruise — one-time paid sessions and mentor scheduling.
- Google Calendar API — events, free/busy, conferenceData and event creation.
- Google OAuth — web-server OAuth flow and refresh-token architecture.

Primary technical references:

- Google OAuth 2.0 for Web Server Applications
- Google Calendar API Reference
- Google Calendar API: Create Events
- Google Calendar Events Reference
- Calendly Google Meet documentation
- TidyCal Google Meet documentation
- TidyCal Integrations documentation
- SavvyCal Features/Integrations
- MentorCruise Scheduling documentation
- MentorCruise Sessions documentation

---

# 52. Recommended First Build Order

If building this as a real project, implement in this exact order:

```text
01. Project setup
02. Authentication
03. User roles
04. Creator profile
05. Session CRUD
06. Public session page
07. Availability rules
08. Timezone engine
09. Booking slot generation
10. Google OAuth
11. Google Calendar free/busy
12. Stripe checkout
13. Stripe webhook
14. Booking confirmation
15. Google Calendar event
16. Google Meet generation
17. Customer dashboard
18. Creator dashboard
19. Rescheduling
20. Cancellation/refunds
21. Email notifications
22. Reminder jobs
23. Security hardening
24. Monitoring
25. Production deployment
```

This order keeps the architecture modular while getting the core marketplace-to-meeting loop working as early as possible.
