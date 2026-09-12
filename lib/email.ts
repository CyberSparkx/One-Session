import { Resend } from "resend";
import { format } from "date-fns";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey && !resendApiKey.startsWith("re_yourResend") ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || "SessionBook <onboarding@resend.dev>";

export interface BookingEmailData {
  bookingId: string;
  sessionTitle: string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  clientName: string;
  clientEmail: string;
  creatorName: string;
  creatorEmail: string;
  creatorTimezone: string;
  priceInPaise: number;
}

export function generateIcsAttachment({
  bookingId,
  sessionTitle,
  scheduledStart,
  scheduledEnd,
  clientName,
  clientEmail,
  creatorName,
  creatorEmail,
}: {
  bookingId: string;
  sessionTitle: string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  clientName: string;
  clientEmail: string;
  creatorName: string;
  creatorEmail: string;
}): string {
  const startUtc = new Date(scheduledStart)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const endUtc = new Date(scheduledEnd)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const nowUtc = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SessionBook//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:booking-${bookingId}@sessionbook.com`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:1:1 Session: ${sessionTitle} with ${creatorName}`,
    `DESCRIPTION:1:1 Consultation Session via SessionBook\\nAttendee: ${clientName}`,
    `ORGANIZER;CN=${creatorName}:mailto:${creatorEmail}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${clientName}:mailto:${clientEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const start = new Date(data.scheduledStart);
  const formattedDate = format(start, "EEEE, MMMM d, yyyy");
  const formattedTime = format(start, "h:mm a");
  const priceRupees = (data.priceInPaise / 100).toLocaleString("en-IN");
  const creatorPayoutRupees = (Math.round(data.priceInPaise * 0.96) / 100).toLocaleString("en-IN");

  const ics = generateIcsAttachment({
    bookingId: data.bookingId,
    sessionTitle: data.sessionTitle,
    scheduledStart: data.scheduledStart,
    scheduledEnd: data.scheduledEnd,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    creatorName: data.creatorName,
    creatorEmail: data.creatorEmail,
  });

  const icsBase64 = Buffer.from(ics).toString("base64");

  if (!resend) {
    console.log("-----------------------------------------");
    console.log(`[EMAIL DISPATCH SIMULATION (Resend not configured)]`);
    console.log(`To Client: ${data.clientEmail}`);
    console.log(`Subject: Confirmed: 1:1 Session with ${data.creatorName}`);
    console.log(`Date & Time: ${formattedDate} at ${formattedTime}`);
    console.log(`To Creator: ${data.creatorEmail}`);
    console.log(`Subject: New Booking: ${data.clientName} booked ${data.sessionTitle}`);
    console.log(`Creator Payout: ₹${creatorPayoutRupees} (after 4% commission)`);
    console.log("-----------------------------------------");
    return;
  }

  // 1. Email to Client (with fallback to creator email if using Resend unverified test domain)
  try {
    const clientRes = await resend.emails.send({
      from: fromEmail,
      to: data.clientEmail,
      subject: `Confirmed: 1:1 Session with ${data.creatorName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #4f46e5;">Your 1:1 session is confirmed!</h2>
          <p>Hi ${data.clientName},</p>
          <p>Your session with <strong>${data.creatorName}</strong> has been successfully booked.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Session:</strong> ${data.sessionTitle}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${formattedTime}</p>
            <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${priceRupees}</p>
          </div>

          <p>A calendar invitation (.ics) is attached to this email so you can add it directly to Google Calendar or Apple Calendar.</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 30px;">Best regards,<br/>SessionBook Team</p>
        </div>
      `,
      attachments: [
        {
          filename: "session-invite.ics",
          content: icsBase64,
        },
      ],
    });

    // If Resend blocked because recipient is not the account owner (free test domain limitation)
    if (clientRes.error && clientRes.error.message.includes("only send testing emails")) {
      console.warn(`Resend Test limitation: Delivering client copy to creator (${data.creatorEmail})`);
      await resend.emails.send({
        from: fromEmail,
        to: data.creatorEmail,
        subject: `[Client Copy Preview] Confirmed: 1:1 Session with ${data.creatorName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 12px; color: #92400e;">
              <strong>Resend Test Mode Note:</strong> This is a copy of the email intended for <strong>${data.clientEmail}</strong> (Resend test mode delivers to your registered account).
            </div>
            <h2 style="color: #4f46e5;">Your 1:1 session is confirmed!</h2>
            <p>Hi ${data.clientName},</p>
            <p>Your session with <strong>${data.creatorName}</strong> has been successfully booked.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Session:</strong> ${data.sessionTitle}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${formattedTime}</p>
              <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${priceRupees}</p>
            </div>
          </div>
        `,
        attachments: [{ filename: "session-invite.ics", content: icsBase64 }],
      });
    }
  } catch (err) {
    console.error("Failed to send client email via Resend:", err);
  }

  // 2. Email to Creator
  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.creatorEmail,
      subject: `New Booking: ${data.clientName} booked ${data.sessionTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #4f46e5;">You have a new booking!</h2>
          <p>Hi ${data.creatorName},</p>
          <p><strong>${data.clientName}</strong> has booked a 1:1 session with you.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Session:</strong> ${data.sessionTitle}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${formattedTime} (${data.creatorTimezone})</p>
            <p style="margin: 4px 0;"><strong>Client Email:</strong> ${data.clientEmail}</p>
            <p style="margin: 4px 0;"><strong>Your Payout (96%):</strong> ₹${creatorPayoutRupees}</p>
            <p style="margin: 4px 0; color: #64748b; font-size: 12px;">(Platform retained 4% fee)</p>
          </div>

          <p>The calendar invitation (.ics) is attached. Manage your bookings anytime from your creator dashboard.</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 30px;">Best regards,<br/>SessionBook Team</p>
        </div>
      `,
      attachments: [
        {
          filename: "session-invite.ics",
          content: icsBase64,
        },
      ],
    });
  } catch (err) {
    console.error("Failed to send creator email via Resend:", err);
  }
}

export interface BookingCancellationEmailData {
  bookingId: string;
  sessionTitle: string;
  scheduledStart: Date | string;
  clientName: string;
  clientEmail: string;
  creatorName: string;
  creatorEmail: string;
  reason?: string;
  refundType: "FULL" | "PARTIAL" | "NONE";
  refundAmountPaise: number;
  cancelledBy?: "CLIENT" | "CREATOR";
}

export async function sendBookingCancellationEmail(data: BookingCancellationEmailData) {
  const start = new Date(data.scheduledStart);
  const formattedDate = format(start, "EEEE, MMMM d, yyyy");
  const formattedTime = format(start, "h:mm a");
  const refundRupees = (data.refundAmountPaise / 100).toLocaleString("en-IN");
  const isRefunded = data.refundAmountPaise > 0;
  const refundTitle = data.refundType === "FULL" ? "Full Refund (100%)" : "Partial Refund (96%)";
  const isClientCancelled = data.cancelledBy === "CLIENT";

  if (!resend) {
    console.log("-----------------------------------------");
    console.log(`[CANCELLATION EMAIL SIMULATION (Resend not configured)]`);
    console.log(`Cancelled By: ${data.cancelledBy || "CREATOR"}`);
    console.log(`To Client: ${data.clientEmail}`);
    console.log(`Subject: ${isClientCancelled ? "Booking Cancelled" : "Session Cancelled by Creator"}: 1:1 with ${data.creatorName}`);
    console.log(`Reason: ${data.reason || (isClientCancelled ? "Client requested cancellation" : "Cancelled by creator")}`);
    console.log(`Refund: ${isRefunded ? `₹${refundRupees} (${refundTitle})` : "None"}`);
    console.log(`To Creator: ${data.creatorEmail}`);
    console.log("-----------------------------------------");
    return;
  }

  // 1. Email to Client
  try {
    const clientSubject = isClientCancelled
      ? `Booking Cancellation Confirmed: 1:1 with ${data.creatorName}`
      : `Session Cancelled: 1:1 with ${data.creatorName}`;

    const clientRes = await resend.emails.send({
      from: fromEmail,
      to: data.clientEmail,
      subject: clientSubject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #dc2626;">
            ${isClientCancelled ? "Your session booking has been cancelled" : "Your 1:1 session has been cancelled"}
          </h2>
          <p>Hi ${data.clientName},</p>
          <p>
            ${
              isClientCancelled
                ? `You have successfully cancelled your upcoming 1:1 session with <strong>${data.creatorName}</strong>.`
                : `Your upcoming session with <strong>${data.creatorName}</strong> has been cancelled by the creator.`
            }
          </p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Session:</strong> ${data.sessionTitle}</p>
            <p style="margin: 4px 0;"><strong>Scheduled Date:</strong> ${formattedDate} at ${formattedTime}</p>
            <p style="margin: 4px 0;"><strong>Reason:</strong> ${data.reason || (isClientCancelled ? "Client requested cancellation" : "Cancelled by creator")}</p>
          </div>

          ${
            isRefunded
              ? `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #166534; font-size: 15px;">💰 Refund Initiated</h3>
              <p style="margin: 4px 0;"><strong>Refund Type:</strong> ${refundTitle}</p>
              <p style="margin: 4px 0;"><strong>Amount to be Refunded:</strong> ₹${refundRupees}</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #15803d;">
                Your refund has been initiated via Razorpay and will be credited to your original payment method in <strong>5–7 business days</strong>.
              </p>
            </div>
          `
              : `
            <p style="color: #64748b; font-size: 13px;">No payment was captured for this session.</p>
          `
          }

          <p style="color: #64748b; font-size: 13px; margin-top: 30px;">
            If you have any questions, you can contact the creator directly at <a href="mailto:${data.creatorEmail}" style="color: #ea580c;">${data.creatorEmail}</a>.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">Best regards,<br/>SessionBook Team</p>
        </div>
      `,
    });

    if (clientRes.error) {
      console.warn("Resend client cancellation email note:", clientRes.error.message);
    }
  } catch (err) {
    console.error("Failed to send client cancellation email via Resend:", err);
  }

  // 2. Email Confirmation to Creator
  try {
    const creatorSubject = isClientCancelled
      ? `Session Cancelled by Client: ${data.clientName}`
      : `Cancelled: 1:1 Session with ${data.clientName}`;

    await resend.emails.send({
      from: fromEmail,
      to: data.creatorEmail,
      subject: creatorSubject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #ea580c;">
            ${isClientCancelled ? "Session Cancelled by Client" : "Session Cancellation Confirmed"}
          </h2>
          <p>Hi ${data.creatorName},</p>
          <p>
            ${
              isClientCancelled
                ? `<strong>${data.clientName}</strong> has cancelled their upcoming 1:1 session with you.`
                : `You have successfully cancelled your session with <strong>${data.clientName}</strong>.`
            }
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Session:</strong> ${data.sessionTitle}</p>
            <p style="margin: 4px 0;"><strong>Scheduled Date:</strong> ${formattedDate} at ${formattedTime}</p>
            <p style="margin: 4px 0;"><strong>Client:</strong> ${data.clientName} (<a href="mailto:${data.clientEmail}" style="color: #ea580c;">${data.clientEmail}</a>)</p>
            <p style="margin: 4px 0;"><strong>Reason:</strong> ${data.reason || (isClientCancelled ? "Client requested cancellation" : "Cancelled by creator")}</p>
            ${
              isRefunded
                ? `
              <p style="margin: 4px 0;"><strong>Refund Processed:</strong> ₹${refundRupees} (${refundTitle})</p>
            `
                : ""
            }
          </div>

          ${
            isClientCancelled
              ? `
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 13px; color: #1e40af;">
              ℹ️ <strong>Slot Released:</strong> The reserved time slot has been freed up and is automatically available for other clients to book on your calendar.
            </div>
          `
              : ""
          }

          <p style="color: #64748b; font-size: 13px; margin-top: 30px;">Best regards,<br/>SessionBook Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send creator cancellation confirmation via Resend:", err);
  }
}
