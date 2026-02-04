import { Reservation } from '../types';

/**
 * Custom iCal parser to extract events from a raw iCal feed.
 * It handles the standard VEVENT format and extracts SUMMARY, DTSTART, DTEND, and UID.
 */
export function parseICal(content: string): any[] {
    const events: any[] = [];
    const lines = content.split(/\r?\n/);

    let currentEvent: any = null;
    let inVEvent = false;

    for (let line of lines) {
        line = line.trim();

        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
            inVEvent = true;
            continue;
        }

        if (line === 'END:VEVENT') {
            if (currentEvent) {
                events.push(currentEvent);
            }
            inVEvent = false;
            currentEvent = null;
            continue;
        }

        if (inVEvent && currentEvent) {
            const firstColonIndex = line.indexOf(':');
            if (firstColonIndex === -1) continue;

            const keyPart = line.substring(0, firstColonIndex);
            const value = line.substring(firstColonIndex + 1);

            // Handle the key which might contain parameters like DTSTART;VALUE=DATE
            const key = keyPart.split(';')[0];

            currentEvent[key] = value;
        }
    }

    return events;
}

/**
 * Transforms parsed iCal events into Reservation objects.
 */
export function transformToReservations(events: any[], apartmentId: string): Reservation[] {
    return events.map(event => {
        const rawCheckIn = event['DTSTART'];
        const rawCheckOut = event['DTEND'];

        // Parse date strings (format is usually YYYYMMDD or YYYYMMDDTHHMMSSZ)
        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            return `${year}-${month}-${day}`;
        };

        const checkIn = formatDate(rawCheckIn);
        const checkOut = formatDate(rawCheckOut);

        return {
            id: crypto.randomUUID(),
            apartmentId,
            icalUid: event['UID'] || crypto.randomUUID(),
            summary: event['SUMMARY'] || 'Réservation iCal',
            checkIn,
            checkOut,
            source: 'iCal',
            rawData: event,
            createdAt: new Date().toISOString()
        };
    });
}
