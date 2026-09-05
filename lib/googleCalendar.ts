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
