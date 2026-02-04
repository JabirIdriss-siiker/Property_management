import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Custom iCal parser adapted for Deno.
 */
function parseICal(content: string): any[] {
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
function transformToReservations(events: any[], apartmentId: string) {
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
            apartment_id: apartmentId,
            ical_uid: event['UID'] || crypto.randomUUID(),
            summary: event['SUMMARY'] || 'Réservation iCal',
            check_in: checkIn,
            check_out: checkOut,
            source: 'iCal',
            raw_data: event,
            updated_at: new Date().toISOString()
        };
    });
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch active apartments with an ical_link and their bag
        const { data: apartments, error: apartmentsError } = await supabaseClient
            .from('apartments')
            .select(`
        id, 
        name, 
        ical_link,
        bags (id)
      `)
            .eq('is_active', true)
            .eq('ical_sync_enabled', true)
            .not('ical_link', 'is', null)

        if (apartmentsError) throw apartmentsError

        const syncResults = []

        for (const apartment of apartments) {
            try {
                console.log(`Syncing apartment: ${apartment.name}`)
                const bagId = apartment.bags?.[0]?.id

                if (!bagId) {
                    console.warn(`No bag found for ${apartment.name}. Skipping mission creation.`)
                }

                // 2. Fetch iCal feed
                const response = await fetch(apartment.ical_link!)
                if (!response.ok) throw new Error(`Fetch iCal failed: ${response.statusText}`)
                const icalContent = await response.text()

                // 3. Parse iCal and Upsert Reservations
                const events = parseICal(icalContent)
                const reservationsToUpsert = transformToReservations(events, apartment.id)

                let reservations = []
                if (reservationsToUpsert.length > 0) {
                    const { data: upsertData, error: upsertError } = await supabaseClient
                        .from('reservations')
                        .upsert(reservationsToUpsert, {
                            onConflict: 'apartment_id,ical_uid'
                        })
                        .select()

                    if (upsertError) throw upsertError
                    reservations = upsertData || []
                }

                // 4. Automatic Mission Creation
                let missionsCreated = 0
                const today = new Date().toISOString().split('T')[0]

                if (bagId && reservations.length > 0) {
                    for (const res of reservations) {
                        // Only create missions for future or today's checkouts
                        if (res.check_out < today) continue

                        // Check if mission already exists for this apartment and date
                        const { data: existingMissions } = await supabaseClient
                            .from('missions')
                            .select('id')
                            .eq('apartment_id', apartment.id)
                            .eq('scheduled_date', res.check_out)
                            .limit(1)

                        if (!existingMissions || existingMissions.length === 0) {
                            const { error: missionError } = await supabaseClient
                                .from('missions')
                                .insert({
                                    apartment_id: apartment.id,
                                    bag_id: bagId,
                                    reservation_id: res.id,
                                    scheduled_date: res.check_out,
                                    scheduled_time: '11:00',
                                    status: 'à_faire',
                                    is_manual: false,
                                    notes: `Auto-généré depuis iCal: ${res.summary}`
                                })

                            if (!missionError) missionsCreated++
                        }
                    }
                }

                // 5. Update last sync time
                await supabaseClient
                    .from('apartments')
                    .update({ ical_last_sync: new Date().toISOString() })
                    .eq('id', apartment.id)

                syncResults.push({
                    apartment: apartment.name,
                    reservations_count: reservations.length,
                    missions_created: missionsCreated,
                    bag_status: bagId ? 'ok' : 'missing'
                })

            } catch (err) {
                console.error(`Error for ${apartment.name}:`, err)
                syncResults.push({
                    apartment: apartment.name,
                    status: 'error',
                    error: String(err)
                })
            }
        }

        return new Response(JSON.stringify({ results: syncResults }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
