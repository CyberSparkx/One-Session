import prisma from "./prisma.ts";

export interface GoogleCalendarEventInput {
  accessToken: string;
  sessionTitle: string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  creatorName: string;
  creatorEmail: string;
}

export interface GoogleCalendarDeleteInput {
  userId?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  clientName?: string;
  clientEmail?: string;
  sessionTitle?: string;
}

/**
 * Gets a fresh valid Google access token using the stored refresh token.
 * If refreshed, persists the new token in the database for future calls.
 */
export async function getFreshGoogleAccessToken(user: {
  id?: string;
  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
}): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!user.googleRefreshToken || !clientId || !clientSecret) {
    return user.googleAccessToken || null;
  }

  // If there is an existing access token, test it quickly with a lightweight check or refresh directly
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: user.googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        if (user.id) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { googleAccessToken: data.access_token },
            });
          } catch (dbErr) {
            console.warn("Could not save refreshed googleAccessToken to DB:", dbErr);
          }
        }
        return data.access_token;
      }
    } else {
      console.warn("Google token refresh failed with status:", res.status);
    }
  } catch (err) {
    console.error("Error refreshing Google access token:", err);
  }

  return user.googleAccessToken || null;
}

export async function createGoogleCalendarEvent(input: GoogleCalendarEventInput) {
  try {
    const startIso = new Date(input.scheduledStart).toISOString();
    const endIso = new Date(input.scheduledEnd).toISOString();

    const event = {
      summary: `1:1 Session: ${input.sessionTitle} with ${input.clientName}`,
      description: `SessionBook 1:1 Consultation\nClient: ${input.clientName} (${input.clientEmail}, ${input.clientPhone})`,
      start: { dateTime: startIso },
      end: { dateTime: endIso },
      attendees: [
        { email: input.clientEmail, displayName: input.clientName },
        { email: input.creatorEmail, displayName: input.creatorName },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!res.ok) {
      const errData = await res.json();
      console.warn("Google Calendar API warning:", errData);
      return null;
    }

    const createdEvent = await res.json();
    return createdEvent;
  } catch (err) {
    console.error("Failed to create Google Calendar event:", err);
    return null;
  }
}

/**
 * Removes a cancelled session event from Google Calendar (web and mobile).
 * Finds the event matching the time window and client/session details and calls DELETE with sendUpdates=all.
 */
export async function deleteGoogleCalendarEvent(input: GoogleCalendarDeleteInput): Promise<boolean> {
  try {
    // 1. Resolve a fresh access token
    const token = await getFreshGoogleAccessToken({
      id: input.userId,
      googleAccessToken: input.accessToken,
      googleRefreshToken: input.refreshToken,
    });

    if (!token) {
      console.log("[Google Calendar] No access/refresh token available to delete event.");
      return false;
    }

    const startDate = new Date(input.scheduledStart);
    const endDate = new Date(input.scheduledEnd);

    // Expand search window slightly (+/- 15 minutes) to account for slight timezone offsets
    const searchStart = new Date(startDate.getTime() - 15 * 60 * 1000).toISOString();
    const searchEnd = new Date(endDate.getTime() + 15 * 60 * 1000).toISOString();

    const listUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      searchStart
    )}&timeMax=${encodeURIComponent(searchEnd)}&singleEvents=true`;

    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!listRes.ok) {
      console.warn("[Google Calendar] Failed to list events for deletion:", await listRes.text());
      return false;
    }

    const listData = await listRes.json();
    const events: any[] = listData.items || [];

    if (events.length === 0) {
      console.log("[Google Calendar] No calendar event found matching the time window for deletion.");
      return false;
    }

    // Match candidate event by client name, client email, or session title
    const clientNameLower = input.clientName?.toLowerCase().trim();
    const clientEmailLower = input.clientEmail?.toLowerCase().trim();
    const sessionTitleLower = input.sessionTitle?.toLowerCase().trim();

    let matchingEvents = events.filter((ev) => {
      const summary = (ev.summary || "").toLowerCase();
      const description = (ev.description || "").toLowerCase();
      const attendees = (ev.attendees || []).map((a: any) => (a.email || "").toLowerCase());

      const matchName = clientNameLower && (summary.includes(clientNameLower) || description.includes(clientNameLower));
      const matchEmail = clientEmailLower && (attendees.includes(clientEmailLower) || description.includes(clientEmailLower));
      const matchTitle = sessionTitleLower && summary.includes(sessionTitleLower);

      return matchName || matchEmail || matchTitle;
    });

    // If no specific keyword match was found but there's exactly 1 event at that start time
    if (matchingEvents.length === 0 && events.length === 1) {
      matchingEvents = events;
    }

    if (matchingEvents.length === 0) {
      console.log("[Google Calendar] No matching event found among candidates for deletion.");
      return false;
    }

    // Delete each matching event (sendUpdates=all notifies attendees and purges on all devices/syncs)
    let anyDeleted = false;
    for (const ev of matchingEvents) {
      const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
        ev.id
      )}?sendUpdates=all`;

      const delRes = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (delRes.ok || delRes.status === 404 || delRes.status === 410) {
        console.log(`[Google Calendar] Successfully deleted event ${ev.id} (${ev.summary})`);
        anyDeleted = true;
      } else {
        console.warn(`[Google Calendar] Failed to delete event ${ev.id}:`, await delRes.text());
      }
    }

    return anyDeleted;
  } catch (err) {
    console.error("[Google Calendar] Error deleting event:", err);
    return false;
  }
}

