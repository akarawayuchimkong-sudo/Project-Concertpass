import { getSupabaseClient } from '../lib/supabase';
import { Ticket, Order, Concert } from '../types/concert';

/**
 * Service to interact with Supabase PostgreSQL tables
 * When Supabase is connected, these methods persist to and read from the real SQL database.
 * If not connected, callers fall back to local in-memory/localStorage state.
 */

export async function fetchUserTicketsFromSupabase(userId: string): Promise<Ticket[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching tickets from Supabase:', error);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      userEmail: row.user_email,
      concertId: row.concert_id,
      concertTitle: row.concert_title,
      artist: row.artist,
      venue: row.venue,
      date: row.date,
      time: row.time,
      zoneName: row.zone_name,
      seatLabel: row.seat_label,
      price: Number(row.price),
      attendeeName: row.attendee_name,
      qrCodeString: row.qr_code_string,
      status: row.status,
      checkedInAt: row.checked_in_at ? Number(row.checked_in_at) : undefined,
      gateStaffName: row.gate_staff_name,
    }));
  } catch (err) {
    console.error('Failed to query Supabase tickets:', err);
    return null;
  }
}

export async function persistOrderAndTicketsToSupabase(order: Order, tickets: Ticket[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Insert Order
    const { error: orderError } = await client.from('orders').upsert({
      id: order.id,
      concert_id: order.concertId,
      concert_title: order.concertTitle,
      artist: order.artist,
      venue: order.venue,
      date: order.date,
      user_id: order.userId,
      user_name: order.userName,
      user_email: order.userEmail,
      seat_labels: order.seatLabels,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      status: order.status,
      created_at: order.createdAt,
      paid_at: order.paidAt || Date.now(),
      qr_payload: order.qrPayload,
    });

    if (orderError) {
      console.warn('Failed to insert order to Supabase:', orderError);
    }

    // 2. Insert Tickets
    const ticketRows = tickets.map((t) => ({
      id: t.id,
      order_id: t.orderId,
      user_id: t.userId,
      user_email: t.userEmail,
      concert_id: t.concertId,
      concert_title: t.concertTitle,
      artist: t.artist,
      venue: t.venue,
      date: t.date,
      time: t.time,
      zone_name: t.zoneName,
      seat_label: t.seatLabel,
      price: t.price,
      attendee_name: t.attendeeName,
      qr_code_string: t.qrCodeString,
      status: t.status,
      created_at: Date.now(),
    }));

    const { error: ticketsError } = await client.from('tickets').upsert(ticketRows);

    if (ticketsError) {
      console.warn('Failed to insert tickets to Supabase:', ticketsError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception syncing order to Supabase:', err);
    return false;
  }
}

export async function updateTicketStatusInSupabase(
  ticketId: string,
  status: 'valid' | 'used',
  gateStaffName?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload: any = { status };
    if (status === 'used') {
      payload.checked_in_at = Date.now();
      if (gateStaffName) payload.gate_staff_name = gateStaffName;
    } else {
      payload.checked_in_at = null;
      payload.gate_staff_name = null;
    }

    const { error } = await client.from('tickets').update(payload).eq('id', ticketId);
    return !error;
  } catch (err) {
    console.error('Exception updating ticket in Supabase:', err);
    return false;
  }
}

export async function deleteTicketFromSupabase(ticketId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('tickets').delete().eq('id', ticketId);
    return !error;
  } catch (err) {
    console.error('Exception deleting ticket in Supabase:', err);
    return false;
  }
}

export async function persistConcertToSupabase(concert: Concert): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('concerts').upsert({
      id: concert.id,
      title: concert.title,
      artist: concert.artist,
      organizer_id: concert.organizerId || 'usr-somchai-org',
      organizer_name: concert.organizerName || 'สมชาย ผู้จัดการค่าย',
      date: concert.date,
      time: concert.time,
      doors_open: concert.doorsOpen,
      venue: concert.venue,
      description: concert.description,
      category: concert.category,
      purchase_limit: concert.purchaseLimit,
      status: concert.status,
      sale_start_time: concert.saleStartTime,
      sale_start_datetime: concert.saleStartDatetime,
      sale_start_timestamp: concert.saleStartTimestamp,
      sale_end_datetime: concert.saleEndDatetime,
      sale_end_timestamp: concert.saleEndTimestamp,
      is_sale_closed_manually: concert.isSaleClosedManually,
      accent_color: concert.accentColor,
      gradient_theme: concert.gradientTheme,
      poster_url: concert.posterUrl,
    });

    return !error;
  } catch (err) {
    console.error('Exception saving concert to Supabase:', err);
    return false;
  }
}
