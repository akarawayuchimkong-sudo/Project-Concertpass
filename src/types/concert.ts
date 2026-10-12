export type UserRole = 'customer' | 'organizer' | 'gate_staff';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: number;
}

export type SeatStatus = 'available' | 'held' | 'sold';

export interface Seat {
  id: string;
  zoneId: string;
  zoneName: string;
  row: string;
  number: number;
  label: string; // e.g. "A1", "A2"
  price: number;
  status: SeatStatus;
  heldBy?: string;
  heldExpiresAt?: number; // timestamp
}

export interface Zone {
  id: string;
  name: string; // e.g. "VIP Front Zone", "Standard Seated", "Standing Pit"
  price: number;
  type: 'seated' | 'standing';
  color: string;
  totalCapacity: number;
  availableCount: number;
}

export interface Concert {
  id: string;
  title: string;
  artist: string;
  organizerName?: string;
  organizerId?: string;
  date: string; // e.g. "24 ต.ค. 2026"
  time: string; // e.g. "19:00 น."
  doorsOpen: string; // e.g. "17:30 น."
  venue: string;
  description: string;
  category: 'Indie' | 'Rock' | 'Electronic' | 'Pop' | 'Acoustic';
  purchaseLimit: number; // default 4 per account
  status: 'sale_open' | 'upcoming' | 'sold_out' | 'sale_closed';
  saleStartTime: string;
  saleStartDatetime?: string; // ISO or YYYY-MM-DDTHH:mm string e.g. "2026-10-25T10:00"
  saleStartTimestamp?: number; // timestamp in milliseconds when ticket sale opens
  saleEndDatetime?: string; // ISO or YYYY-MM-DDTHH:mm string e.g. "2026-10-24T17:00"
  saleEndTimestamp?: number; // timestamp in milliseconds when ticket sale closes
  isSaleClosedManually?: boolean;
  accentColor: string;
  gradientTheme: string;
  posterUrl?: string;
  zones: Zone[];
  seats: Seat[];
}

export interface Order {
  id: string;
  concertId: string;
  concertTitle: string;
  artist: string;
  venue: string;
  date: string;
  userId: string;
  userName: string;
  userEmail: string;
  seatLabels: string[];
  totalAmount: number;
  paymentMethod: 'promptpay' | 'credit_card';
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: number;
  paidAt?: number;
  qrPayload: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  userId: string; // Account ID owner (Customer)
  userEmail?: string;
  concertId: string;
  concertTitle: string;
  artist: string;
  venue: string;
  date: string;
  time: string;
  zoneName: string;
  seatLabel: string;
  price: number;
  attendeeName: string;
  qrCodeString: string;
  status: 'valid' | 'used';
  checkedInAt?: number;
  gateStaffName?: string;
}

export interface CheckInResult {
  status: 'success' | 'already_used' | 'invalid';
  message: string;
  ticket?: Ticket;
  previousCheckInTime?: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  actor: string;
  role: string;
  action: string;
  details: string;
  type: 'hold' | 'release' | 'purchase' | 'checkin' | 'concert_create' | 'concert_update' | 'sale_close' | 'sale_open';
}
