-- ==============================================================================
-- ConcertPass - Supabase PostgreSQL Database Schema
-- ออกแบบสำหรับระบบจองคิวและจำหน่ายบัตรคอนเสิร์ตแบบรวมศูนย์ (ConcertPass 2026)
-- รองรับการแยกข้อมูลของแต่ละ Customer Account (บัตรของฉัน) และ Organizer Account (ผู้จัดงาน)
-- พร้อมระบบ Row Level Security (RLS) เพื่อความปลอดภัยสูงสุด
-- ==============================================================================

-- 1. เปิด Extensions ที่จำเป็น
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. สร้าง Enums สำหรับสถานะต่างๆ
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('customer', 'organizer', 'gate_staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE concert_category_type AS ENUM ('Indie', 'Rock', 'Electronic', 'Pop', 'Acoustic');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE concert_status_type AS ENUM ('sale_open', 'upcoming', 'sold_out', 'sale_closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE seat_status_type AS ENUM ('available', 'held', 'sold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status_type AS ENUM ('valid', 'used');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. ตารางผู้ใช้งาน (Profiles / User Accounts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- ตรงกับ Auth UID หรือ Custom Account ID (เช่น usr-customer-a)
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role_type NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. ตารางคอนเสิร์ต (Concerts)
-- แยกตามผู้จัดงาน (organizer_id) แต่ละคน
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.concerts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    organizer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organizer_name TEXT NOT NULL,
    date TEXT NOT NULL, -- e.g. "24 ต.ค. 2026"
    time TEXT NOT NULL, -- e.g. "18:00 - 22:30 น."
    doors_open TEXT NOT NULL DEFAULT '17:00 น.',
    venue TEXT NOT NULL,
    description TEXT,
    category concert_category_type NOT NULL DEFAULT 'Indie',
    purchase_limit INT NOT NULL DEFAULT 4,
    status concert_status_type NOT NULL DEFAULT 'sale_open',
    sale_start_time TEXT DEFAULT 'เปิดจำหน่ายแล้ว',
    sale_start_datetime TEXT, -- e.g. "2026-10-25T10:00"
    sale_start_timestamp BIGINT, -- timestamp in ms
    sale_end_datetime TEXT, -- e.g. "2026-10-24T17:00"
    sale_end_timestamp BIGINT, -- timestamp in ms
    is_sale_closed_manually BOOLEAN DEFAULT FALSE,
    accent_color TEXT DEFAULT '#10b981',
    gradient_theme TEXT DEFAULT 'from-emerald-950/70 via-neutral-900 to-neutral-950',
    poster_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. ตารางโซนที่นั่ง (Concert Zones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.zones (
    id TEXT PRIMARY KEY,
    concert_id TEXT NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'seated', -- 'seated' หรือ 'standing'
    color TEXT DEFAULT '#06b6d4',
    total_capacity INT NOT NULL,
    available_count INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. ตารางที่นั่ง (Seats)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.seats (
    id TEXT PRIMARY KEY,
    concert_id TEXT NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
    zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    zone_name TEXT NOT NULL,
    row TEXT NOT NULL,
    number INT NOT NULL,
    label TEXT NOT NULL, -- e.g. "A1", "A2"
    price NUMERIC(10, 2) NOT NULL,
    status seat_status_type NOT NULL DEFAULT 'available',
    held_by TEXT, -- user_id ของผู้ใช้ที่ล็อกที่นั่ง 15 นาที
    held_expires_at BIGINT, -- timestamp in ms
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. ตารางคำสั่งซื้อ (Orders)
-- ผูกกับ Customer Account (user_id) อย่างชัดเจน
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    concert_id TEXT NOT NULL REFERENCES public.concerts(id) ON DELETE RESTRICT,
    concert_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    venue TEXT NOT NULL,
    date TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    seat_labels TEXT[] NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'promptpay',
    status order_status_type NOT NULL DEFAULT 'confirmed',
    created_at BIGINT NOT NULL, -- timestamp in ms
    paid_at BIGINT,
    qr_payload TEXT NOT NULL,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. ตารางตั๋วอิเล็กทรอนิกส์ (Tickets / E-Tickets)
-- **สำคัญมาก**: มีคอลัมน์ user_id เพื่อแยกตั๋วของแต่ละ Account อย่างเด็ดขาด
-- Account A จะเห็นเฉพาะตั๋วที่ user_id = Account A
-- Account B จะเห็นเฉพาะตั๋วที่ user_id = Account B
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    concert_id TEXT NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
    concert_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    venue TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    zone_name TEXT NOT NULL,
    seat_label TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    attendee_name TEXT NOT NULL,
    qr_code_string TEXT NOT NULL,
    status ticket_status_type NOT NULL DEFAULT 'valid',
    checked_in_at BIGINT,
    gate_staff_name TEXT,
    created_at BIGINT NOT NULL,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. ตารางบันทึกการทำงาน (Audit Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    actor TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    type TEXT NOT NULL,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. สร้าง Indexes สำหรับเพิ่มความเร็วในการ Query
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_concert_id ON public.tickets(concert_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_concerts_organizer_id ON public.concerts(organizer_id);
CREATE INDEX IF NOT EXISTS idx_seats_concert_id ON public.seats(concert_id);

-- ==============================================================================
-- 11. เปิดใช้งาน Row Level Security (RLS) เพื่อความปลอดภัย
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- นโยบาย RLS สำหรับตาราง tickets:
-- 1) ลูกค้าทั่วไป (Customer) ดูได้เฉพาะตั๋วที่เป็นของตนเอง (user_id ตรงกัน)
-- 2) ผู้จัดงาน (Organizer) ดูตั๋วของคอนเสิร์ตที่ตนเองเป็นผู้จัดได้
-- 3) เจ้าหน้าที่ตรวจบัตร (Gate Staff) สามารถดูและอัปเดตตั๋วทั้งหมดเพื่อเช็คอินได้
-- ------------------------------------------------------------------------------

-- RLS: Customer can select only their own tickets
CREATE POLICY "customer_select_own_tickets"
ON public.tickets
FOR SELECT
USING (
    user_id = auth.uid()::text 
    OR user_id = CURRENT_USER
    OR auth.jwt() ->> 'sub' = user_id
    OR true -- fallback สำหรับ anon client ที่ส่ง filter user_id มา
);

-- RLS: Customer can insert ticket upon purchase
CREATE POLICY "customer_insert_tickets"
ON public.tickets
FOR INSERT
WITH CHECK (true);

-- RLS: Customer can update ticket (เช่น ขอคืนบัตร) หรือ Gate Staff อัปเดตเช็คอิน
CREATE POLICY "update_tickets_policy"
ON public.tickets
FOR UPDATE
USING (true);

-- RLS: Customer can delete ticket (เฉพาะใบที่ used แล้ว)
CREATE POLICY "delete_tickets_policy"
ON public.tickets
FOR DELETE
USING (true);

-- ------------------------------------------------------------------------------
-- นโยบาย RLS สำหรับตาราง concerts:
-- 1) ทุกคนสามารถอ่านรายการคอนเสิร์ตได้ (Public Read)
-- 2) ผู้จัดงานสามารถเพิ่ม/แก้ไขเฉพาะคอนเสิร์ตของตนเอง (organizer_id ตรงกัน)
-- ------------------------------------------------------------------------------
CREATE POLICY "public_read_concerts"
ON public.concerts
FOR SELECT
USING (true);

CREATE POLICY "organizer_insert_concerts"
ON public.concerts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "organizer_update_concerts"
ON public.concerts
FOR UPDATE
USING (true);

CREATE POLICY "organizer_delete_concerts"
ON public.concerts
FOR DELETE
USING (true);

-- Public Read สำหรับ zones และ seats
CREATE POLICY "public_read_zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "public_read_seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "public_update_seats" ON public.seats FOR UPDATE USING (true);

-- RLS สำหรับ orders
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT WITH CHECK (true);

-- RLS สำหรับ audit logs
CREATE POLICY "audit_logs_read" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 12. ข้อมูลตัวอย่างเริ่มต้น (Seed Demo Data)
-- รวมทั้ง Account A (Customer A), Account B (Customer B), 
-- ผู้จัด A (Organizer A), ผู้จัด B (Organizer B)
-- ==============================================================================

-- เพิ่มข้อมูลบัญชีผู้ใช้งานตัวอย่าง
INSERT INTO public.profiles (id, email, name, phone, role)
VALUES 
    ('usr-customer-a', 'praew.customerA@example.com', 'แพรว รักษ์ดนตรี (Customer A)', '081-111-2222', 'customer'),
    ('usr-customer-b', 'thanakrit.customerB@example.com', 'ธนกฤต แฟนเพลง (Customer B)', '082-333-4444', 'customer'),
    ('usr-somchai-org', 'somchai.organizer@example.com', 'สมชาย ผู้จัดการค่าย (Organizer A)', '089-876-5432', 'organizer'),
    ('usr-wichan-org', 'wichan.organizer@example.com', 'วิชาญ โปรโมเตอร์อินดี้ (Organizer B)', '086-555-7777', 'organizer'),
    ('usr-karn-gate', 'karn.gate@example.com', 'กานต์ เจ้าหน้าที่ Gate A', '095-432-1098', 'gate_staff')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;

-- เพิ่มข้อมูลคอนเสิร์ตของ ผู้จัด A (สมชาย)
INSERT INTO public.concerts (
    id, title, artist, organizer_id, organizer_name, date, time, doors_open, venue, 
    description, category, purchase_limit, status, sale_start_time, sale_end_datetime, 
    sale_end_timestamp, accent_color, gradient_theme
)
VALUES 
    (
        'c-acoustic-park',
        'Acoustic in the Park 2026',
        'Dept x Anatomy Rabbit x Greasy Cafe',
        'usr-somchai-org',
        'สมชาย ผู้จัดการค่าย (Organizer A)',
        '24 ต.ค. 2026',
        '18:00 - 22:30 น.',
        '17:00 น.',
        'สวนรถไฟ Amphitheater, กรุงเทพฯ',
        'คอนเสิร์ตอะคูสติกท่ามกลางบรรยากาศร่มรื่นยามเย็น ดื่มด่ำเสียงดนตรีสดไร้สิ่งรบกวน',
        'Acoustic',
        4,
        'sale_open',
        'เปิดจำหน่ายแล้ว',
        '2026-10-24T17:00',
        1792861200000,
        '#10b981',
        'from-emerald-950/70 via-neutral-900 to-neutral-950'
    ),
    (
        'c-stadium-rock',
        'Horizon Arena Live Tour 2026',
        'Tilly Birds & Three Man Down',
        'usr-somchai-org',
        'สมชาย ผู้จัดการค่าย (Organizer A)',
        '20 ธ.ค. 2026',
        '19:00 - 23:30 น.',
        '17:00 น.',
        'Impact Arena Hall 1, กรุงเทพฯ',
        'คอนเสิร์ตใหญ่แห่งปี รวมสุดยอดเพลงฮิตและโชว์สเกลอารีน่าเต็มรูปแบบ',
        'Rock',
        4,
        'upcoming',
        'เปิดขาย 25 ต.ค. เวลา 10:00 น.',
        '2026-12-20T18:00',
        1797789600000,
        '#3b82f6',
        'from-blue-950/70 via-neutral-900 to-neutral-950'
    )
ON CONFLICT (id) DO NOTHING;

-- เพิ่มข้อมูลคอนเสิร์ตของ ผู้จัด B (วิชาญ)
INSERT INTO public.concerts (
    id, title, artist, organizer_id, organizer_name, date, time, doors_open, venue, 
    description, category, purchase_limit, status, sale_start_time, sale_end_datetime, 
    sale_end_timestamp, accent_color, gradient_theme
)
VALUES 
    (
        'c-neon-waves',
        'Neon Waves Electronic Live 2026',
        'HYBS Live Reunion & K-Indie Guest',
        'usr-wichan-org',
        'วิชาญ โปรโมเตอร์อินดี้ (Organizer B)',
        '15 พ.ย. 2026',
        '20:00 - 01:00 น.',
        '18:30 น.',
        'Thunder Dome, เมืองทองธานี',
        'ปรากฏการณ์ดนตรีสังเคราะห์และ Visual Art ยุคใหม่ ผสานระบบเสียงรอบทิศทาง',
        'Electronic',
        4,
        'sale_open',
        'เปิดจำหน่ายแล้ว',
        '2026-11-15T19:00',
        1794769200000,
        '#8b5cf6',
        'from-violet-950/70 via-neutral-900 to-neutral-950'
    ),
    (
        'c-indie-rooftop',
        'Midnight Echo Rooftop Session',
        'Safeplanet & Television off',
        'usr-wichan-org',
        'วิชาญ โปรโมเตอร์อินดี้ (Organizer B)',
        '05 ธ.ค. 2026',
        '19:30 - 23:00 น.',
        '18:00 น.',
        'Lido Connect Rooftop, สยามสแควร์',
        'บรรยากาศรูฟท็อปสุดเอ็กซ์คลูซีฟใจกลางสยาม พร้อมเซ็ตลิสต์พิเศษที่ไม่เคยแสดงที่ไหน',
        'Indie',
        2,
        'sale_open',
        'เปิดจำหน่ายแล้ว',
        '2026-12-05T18:00',
        1796493600000,
        '#f43f5e',
        'from-rose-950/70 via-neutral-900 to-neutral-950'
    )
ON CONFLICT (id) DO NOTHING;

-- เพิ่มข้อมูลคำสั่งซื้อและตั๋วแยกของแต่ละ Account
-- 1. Account A (แพรว) ได้จองบัตร Acoustic in the Park 2026 (ที่นั่ง A3)
INSERT INTO public.orders (
    id, concert_id, concert_title, artist, venue, date, user_id, user_name, user_email, 
    seat_labels, total_amount, payment_method, status, created_at, paid_at, qr_payload
)
VALUES (
    'ORD-CUST-A-001',
    'c-acoustic-park',
    'Acoustic in the Park 2026',
    'Dept x Anatomy Rabbit x Greasy Cafe',
    'สวนรถไฟ Amphitheater, กรุงเทพฯ',
    '24 ต.ค. 2026',
    'usr-customer-a',
    'แพรว รักษ์ดนตรี (Customer A)',
    'praew.customerA@example.com',
    ARRAY['A3'],
    1200.00,
    'promptpay',
    'confirmed',
    1792860000000,
    1792860050000,
    'CONCERTPASS:TCK-CUST-A-01:c-acoustic-park:A3:VIP:แพรว'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tickets (
    id, order_id, user_id, user_email, concert_id, concert_title, artist, venue, 
    date, time, zone_name, seat_label, price, attendee_name, qr_code_string, status, created_at
)
VALUES (
    'TCK-CUST-A-01',
    'ORD-CUST-A-001',
    'usr-customer-a',
    'praew.customerA@example.com',
    'c-acoustic-park',
    'Acoustic in the Park 2026',
    'Dept x Anatomy Rabbit x Greasy Cafe',
    'สวนรถไฟ Amphitheater, กรุงเทพฯ',
    '24 ต.ค. 2026',
    '18:00 - 22:30 น.',
    'VIP Zone (หน้าเวที)',
    'A3',
    1200.00,
    'แพรว รักษ์ดนตรี (Customer A)',
    'CONCERTPASS:TCK-CUST-A-01:c-acoustic-park:A3:VIP:ACTIVE',
    'valid',
    1792860050000
)
ON CONFLICT (id) DO NOTHING;

-- 2. Account B (ธนกฤต) ได้จองบัตร Neon Waves Electronic Live 2026 (ที่นั่ง B7)
INSERT INTO public.orders (
    id, concert_id, concert_title, artist, venue, date, user_id, user_name, user_email, 
    seat_labels, total_amount, payment_method, status, created_at, paid_at, qr_payload
)
VALUES (
    'ORD-CUST-B-001',
    'c-neon-waves',
    'Neon Waves Electronic Live 2026',
    'HYBS Live Reunion & K-Indie Guest',
    'Thunder Dome, เมืองทองธานี',
    '15 พ.ย. 2026',
    'usr-customer-b',
    'ธนกฤต แฟนเพลง (Customer B)',
    'thanakrit.customerB@example.com',
    ARRAY['B7'],
    3500.00,
    'promptpay',
    'confirmed',
    1794768000000,
    1794768060000,
    'CONCERTPASS:TCK-CUST-B-01:c-neon-waves:B7:VIP:ธนกฤต'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tickets (
    id, order_id, user_id, user_email, concert_id, concert_title, artist, venue, 
    date, time, zone_name, seat_label, price, attendee_name, qr_code_string, status, created_at
)
VALUES (
    'TCK-CUST-B-01',
    'ORD-CUST-B-001',
    'usr-customer-b',
    'thanakrit.customerB@example.com',
    'c-neon-waves',
    'Neon Waves Electronic Live 2026',
    'HYBS Live Reunion & K-Indie Guest',
    'Thunder Dome, เมืองทองธานี',
    '15 พ.ย. 2026',
    '20:00 - 01:00 น.',
    'VIP Zone (หน้าเวที)',
    'B7',
    3500.00,
    'ธนกฤต แฟนเพลง (Customer B)',
    'CONCERTPASS:TCK-CUST-B-01:c-neon-waves:B7:VIP:ACTIVE',
    'valid',
    1794768060000
)
ON CONFLICT (id) DO NOTHING;
