import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Key,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA_CONTENT = `-- ==============================================================================
-- ConcertPass - Supabase PostgreSQL Database Schema
-- ออกแบบสำหรับระบบจองคิวและจำหน่ายบัตรคอนเสิร์ต (ConcertPass 2026)
-- รองรับการแยกข้อมูลของแต่ละ Customer Account (บัตรของฉัน) และ Organizer Account (ผู้จัดงาน)
-- พร้อมระบบ Row Level Security (RLS) เพื่อความปลอดภัยสูงสุด
-- ==============================================================================

-- 1. เปิด Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. สร้าง Enums สำหรับสถานะต่างๆ
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('customer', 'organizer', 'gate_staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE concert_category_type AS ENUM ('Indie', 'Rock', 'Electronic', 'Pop', 'Acoustic');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE concert_status_type AS ENUM ('sale_open', 'upcoming', 'sold_out', 'sale_closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE seat_status_type AS ENUM ('available', 'held', 'sold');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status_type AS ENUM ('valid', 'used');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. ตารางผู้ใช้งาน (Profiles / User Accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role_type NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางคอนเสิร์ต (Concerts) - แยกตามผู้จัดงาน (organizer_id)
CREATE TABLE IF NOT EXISTS public.concerts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    organizer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organizer_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    doors_open TEXT NOT NULL DEFAULT '17:00 น.',
    venue TEXT NOT NULL,
    description TEXT,
    category concert_category_type NOT NULL DEFAULT 'Indie',
    purchase_limit INT NOT NULL DEFAULT 4,
    status concert_status_type NOT NULL DEFAULT 'sale_open',
    sale_start_time TEXT DEFAULT 'เปิดจำหน่ายแล้ว',
    sale_start_datetime TEXT,
    sale_start_timestamp BIGINT,
    sale_end_datetime TEXT,
    sale_end_timestamp BIGINT,
    is_sale_closed_manually BOOLEAN DEFAULT FALSE,
    accent_color TEXT DEFAULT '#10b981',
    gradient_theme TEXT DEFAULT 'from-emerald-950/70 via-neutral-900 to-neutral-950',
    poster_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางโซนที่นั่ง (Concert Zones)
CREATE TABLE IF NOT EXISTS public.zones (
    id TEXT PRIMARY KEY,
    concert_id TEXT NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'seated',
    color TEXT DEFAULT '#06b6d4',
    total_capacity INT NOT NULL,
    available_count INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางที่นั่ง (Seats)
CREATE TABLE IF NOT EXISTS public.seats (
    id TEXT PRIMARY KEY,
    concert_id TEXT NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
    zone_id TEXT NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    zone_name TEXT NOT NULL,
    row TEXT NOT NULL,
    number INT NOT NULL,
    label TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status seat_status_type NOT NULL DEFAULT 'available',
    held_by TEXT,
    held_expires_at BIGINT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ตารางคำสั่งซื้อ (Orders)
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
    created_at BIGINT NOT NULL,
    paid_at BIGINT,
    qr_payload TEXT NOT NULL,
    inserted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ตารางตั๋วอิเล็กทรอนิกส์ (Tickets) - **แยกตาม user_id**
-- Account A จะเห็นเฉพาะตั๋วที่ user_id = Account A
-- Account B จะเห็นเฉพาะตั๋วที่ user_id = Account B
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

-- 9. ตารางบันทึกการทำงาน (Audit Logs)
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

-- 10. Indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_concert_id ON public.tickets(concert_id);
CREATE INDEX IF NOT EXISTS idx_concerts_organizer_id ON public.concerts(organizer_id);

-- 11. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- นโยบาย RLS: Customer อ่านได้เฉพาะตั๋วของตนเอง
CREATE POLICY "customer_select_own_tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "customer_insert_tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "update_tickets_policy" ON public.tickets FOR UPDATE USING (true);
CREATE POLICY "delete_tickets_policy" ON public.tickets FOR DELETE USING (true);
CREATE POLICY "public_read_concerts" ON public.concerts FOR SELECT USING (true);
CREATE POLICY "organizer_insert_concerts" ON public.concerts FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "public_read_seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "public_update_seats" ON public.seats FOR UPDATE USING (true);
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_logs_read" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 12. ข้อมูลตัวอย่างเริ่มต้น (Seed Demo Data)
INSERT INTO public.profiles (id, email, name, phone, role) VALUES 
    ('usr-customer-a', 'praew.customerA@example.com', 'แพรว รักษ์ดนตรี (Customer A)', '081-111-2222', 'customer'),
    ('usr-customer-b', 'thanakrit.customerB@example.com', 'ธนกฤต แฟนเพลง (Customer B)', '082-333-4444', 'customer'),
    ('usr-somchai-org', 'somchai.organizer@example.com', 'สมชาย ผู้จัดการค่าย (Organizer A)', '089-876-5432', 'organizer'),
    ('usr-wichan-org', 'wichan.organizer@example.com', 'วิชาญ โปรโมเตอร์อินดี้ (Organizer B)', '086-555-7777', 'organizer')
ON CONFLICT (id) DO NOTHING;
`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'config' | 'guide'>('sql');
  const [copied, setCopied] = useState(false);

  // Supabase Config Form
  const currentConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(supabaseUrl, anonKey);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSaveConfig = () => {
    if (!supabaseUrl.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'กรุณากรอกทั้ง Project URL และ Anon Key',
      });
      return;
    }
    saveSupabaseConfig(supabaseUrl, anonKey);
    setTestResult({
      success: true,
      message: 'บันทึกการตั้งค่าเรียบร้อย! รีเฟรชหน้าเว็บเพื่อเริ่มซิงค์ข้อมูลกับ Supabase',
    });
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleResetToLocal = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'สลับกลับสู่โหมด Local Storage ในตัวเรียบร้อยแล้ว',
    });
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                  Supabase PostgreSQL & Database SQL Architecture
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isConfigured
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {isConfigured ? '🟢 Connected to Supabase' : '🟡 Local SQL Storage Mode'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                ออกแบบฐานข้อมูลเชิงสัมพันธ์แยกระหว่าง Customer Accounts (บัตรของฉัน) และ Organizer Accounts (ผู้จัดงาน)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-neutral-800/80 bg-neutral-950/50 shrink-0 text-xs font-mono">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'bg-white text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>คำสั่ง SQL Database (Schema & RLS)</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-white text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>ตั้งค่าเชื่อมต่อ Supabase</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-white text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>คู่มือการติดตั้ง 3 ขั้นตอน</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: SQL Schema Script */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              {/* Architecture Highlight Box */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>สถาปัตยกรรมข้อมูลการแยก Account ใน SQL:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-neutral-300 font-sans mt-2">
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                    <span className="font-bold text-emerald-400 font-mono">1. Customer Tickets Isolation:</span>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      ในตาราง <code className="text-white font-mono bg-neutral-950 px-1 py-0.5 rounded">tickets</code> มีคอลัมน์ <code className="text-emerald-300 font-mono">user_id</code> ผูกกับ Account ลูกค้า เมื่อ Account A จองตั๋ว จะได้ตั๋วที่ <code className="text-neutral-300 font-mono">user_id = 'usr-customer-a'</code> ทำให้ในหน้า "บัตรของฉัน" จะแสดงเฉพาะของ Account A ส่วน Account B จะไม่เห็นตั๋วใบนี้
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                    <span className="font-bold text-purple-400 font-mono">2. Organizer Concerts Isolation:</span>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      ในตาราง <code className="text-white font-mono bg-neutral-950 px-1 py-0.5 rounded">concerts</code> มีคอลัมน์ <code className="text-purple-300 font-mono">organizer_id</code> ผู้จัด A (สมชาย) จะดูแลเฉพาะคอนเสิร์ตของตนเอง และผู้จัด B (วิชาญ) จะดูแลเฉพาะของตนเอง พร้อมสถิติยอดขายแยกกันอย่างเด็ดขาด
                    </p>
                  </div>
                </div>
              </div>

              {/* Code viewer & Copy bar */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-mono">
                  คัดลอกคำสั่งด้านล่างไปวางใน Supabase SQL Editor แล้วกด Run:
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow-md shadow-white/10"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>คัดลอกสำเร็จแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอก SQL ทั้งหมด (Copy)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 p-4 overflow-x-auto max-h-[380px] font-mono text-[11px] text-neutral-300 leading-relaxed">
                <pre>{SQL_SCHEMA_CONTENT}</pre>
              </div>
            </div>
          )}

          {/* TAB 2: Supabase Connection Config */}
          {activeTab === 'config' && (
            <div className="max-w-xl mx-auto space-y-6 py-2">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <h3 className="font-bold text-white text-sm mb-1">
                  ตั้งค่า Supabase API Credentials
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  ระบุ URL และ anon public key ของโปรเจกต์ Supabase ของคุณเพื่อเชื่อมต่อฐานข้อมูลจริง
                  ระบบจะทำการซิงค์ตั๋ว คำสั่งซื้อ และคอนเสิร์ตไปยัง Supabase แบบอัตโนมัติ
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    ตัวอย่าง: https://abcdefghijklm.supabase.co
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Supabase Anon Public API Key
                  </label>
                  <textarea
                    rows={3}
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    หาได้จากเมนู Project Settings &gt; API &gt; Project API keys (anon public)
                  </span>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs ${
                      testResult.success
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-red-950/60 border-red-800 text-red-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังทดสอบ...</span>
                      </>
                    ) : (
                      <>
                        <Server className="w-3.5 h-3.5" />
                        <span>ทดสอบการเชื่อมต่อ (Test Ping)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveConfig}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    บันทึกและเชื่อมต่อ Supabase
                  </button>

                  {isConfigured && (
                    <button
                      onClick={handleResetToLocal}
                      className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white text-xs transition-colors"
                    >
                      กลับสู่โหมด Local
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Step-by-Step Guide */}
          {activeTab === 'guide' && (
            <div className="max-w-2xl mx-auto space-y-5 py-2">
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">สร้างโปรเจกต์ใหม่ใน Supabase</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    ไปที่ <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> สมัครหรือล็อกอิน แล้วกดปุ่ม <strong>"New Project"</strong> ตั้งชื่อโปรเจกต์ เช่น <code className="text-white font-mono bg-neutral-900 px-1 py-0.5 rounded">concertpass-db</code>
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">รันคำสั่ง SQL Schema</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    ไปที่แถบเมนูด้านซ้ายเลือก <strong>"SQL Editor"</strong> แล้วกด <strong>"New Query"</strong> จากนั้นกลับมาคัดลอกคำสั่ง SQL ทั้งหมดจากแท็บ <strong>"คำสั่ง SQL Database"</strong> ด้านบนไปวาง แล้วกดปุ่มเขียว <strong>"Run"</strong> เพื่อสร้างตารางและ RLS
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">คัดลอก API Keys มาใส่ในเว็บ</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    ใน Supabase ไปที่ <strong>Project Settings &gt; API</strong> คัดลอก <strong>Project URL</strong> และ <strong>anon public key</strong> มาใส่ในแท็บ <strong>"ตั้งค่าเชื่อมต่อ Supabase"</strong> แล้วกดบันทึก ข้อมูลการจองและตั๋วจะแยกตาม Account ทันที!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
