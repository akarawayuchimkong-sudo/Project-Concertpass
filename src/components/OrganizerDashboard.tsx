import React, { useState } from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { Concert, Zone } from '../types/concert';
import {
  formatThaiDateTime,
  toDateTimeLocalString,
  isConcertSaleClosed,
  isConcertSaleUpcoming,
  getConcertSaleStatus,
} from '../utils/concertSale';
import {
  LayoutDashboard,
  Plus,
  DollarSign,
  Users,
  Ticket,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Download,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Clock,
  Calendar,
  Pencil,
  Lock,
  Unlock,
  AlertTriangle,
  Building2,
  Database,
  Timer,
} from 'lucide-react';

const POSTER_PRESETS = [
  {
    name: 'นีออนเลเซอร์ (Neon Stage)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="50%" stop-color="%23581c87"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><radialGradient id="r" cx="50%" cy="30%" r="60%"><stop offset="0%" stop-color="%238b5cf6" stop-opacity="0.6"/><stop offset="100%" stop-color="%23000" stop-opacity="0"/></radialGradient></defs><rect width="600" height="400" fill="url(%23g)"/><rect width="600" height="400" fill="url(%23r)"/><polygon points="300,0 120,400 480,400" fill="%23c084fc" opacity="0.15"/><polygon points="200,0 50,400 350,400" fill="%2338bdf8" opacity="0.1"/><polygon points="400,0 250,400 550,400" fill="%23f43f5e" opacity="0.1"/><circle cx="300" cy="180" r="70" fill="none" stroke="%2338bdf8" stroke-width="2" opacity="0.5"/><text x="50%" y="85%" font-family="sans-serif" font-weight="bold" font-size="28" fill="%23fff" text-anchor="middle" letter-spacing="4">NEON LIVE 2026</text></svg>',
  },
  {
    name: 'อินดี้อะคูสติก (Sunset Indie)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23431407"/><stop offset="50%" stop-color="%237c2d12"/><stop offset="100%" stop-color="%23172554"/></linearGradient><radialGradient id="sun" cx="50%" cy="40%" r="40%"><stop offset="0%" stop-color="%23f59e0b" stop-opacity="0.8"/><stop offset="100%" stop-color="%23000" stop-opacity="0"/></radialGradient></defs><rect width="600" height="400" fill="url(%23g2)"/><circle cx="300" cy="160" r="90" fill="url(%23sun)"/><path d="M0,320 Q150,260 300,320 T600,320 L600,400 L0,400 Z" fill="%23052e16" opacity="0.8"/><text x="50%" y="85%" font-family="sans-serif" font-weight="bold" font-size="26" fill="%23fef08a" text-anchor="middle" letter-spacing="3">ACOUSTIC PARK SESSION</text></svg>',
  },
  {
    name: 'สเตเดียมร็อก (Stadium Strobe)',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23020617"/><stop offset="50%" stop-color="%230f172a"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="600" height="400" fill="url(%23g3)"/><polygon points="300,0 180,400 420,400" fill="%2338bdf8" opacity="0.25"/><polygon points="150,0 20,400 280,400" fill="%23e2e8f0" opacity="0.1"/><polygon points="450,0 320,400 580,400" fill="%23e2e8f0" opacity="0.1"/><text x="50%" y="85%" font-family="sans-serif" font-weight="bold" font-size="28" fill="%23fff" text-anchor="middle" letter-spacing="4">HORIZON ARENA TOUR</text></svg>',
  },
];

interface OrganizerDashboardProps {
  onOpenSupabaseModal?: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  onOpenSupabaseModal,
}) => {
  const {
    concerts,
    addNewConcert,
    updateConcert,
    toggleSaleStatus,
    openSaleImmediately,
    currentTime,
    tickets,
    currentUser,
    quickSwitchAccount,
    isSupabaseActive,
  } = useConcertPass();

  const [organizerFilter, setOrganizerFilter] = useState<'mine' | 'all'>('mine');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingConcertId, setEditingConcertId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Filter concerts by organizer
  const isMine = organizerFilter === 'mine';
  const displayedConcerts = isMine
    ? concerts.filter(
        (c) =>
          c.organizerId === currentUser?.id ||
          (!c.organizerId && currentUser?.id === 'usr-somchai-org')
      )
    : concerts;

  // Concert form state
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newDate, setNewDate] = useState('28 พ.ย. 2026');
  const [newTime, setNewTime] = useState('19:00 - 22:30 น.');
  const [newDoorsOpen, setNewDoorsOpen] = useState('17:30 น.');
  const [newVenue, setNewVenue] = useState('Voice Space, วิภาวดี');
  const [newCategory, setNewCategory] = useState<'Indie' | 'Rock' | 'Electronic' | 'Pop' | 'Acoustic'>('Indie');
  const [newVipPrice, setNewVipPrice] = useState(3500);
  const [newStandardPrice, setNewStandardPrice] = useState(1500);
  const [newLimit, setNewLimit] = useState(4);
  const [newDesc, setNewDesc] = useState('รอบการแสดงพิเศษ ออกแบบเพื่อระบบจัดการคิว ConcertPass ยุค 2026');
  const [newPosterUrl, setNewPosterUrl] = useState<string>('');

  // Ticket Sale Opening Schedule state (Requested Feature)
  const [newSaleStartDatetime, setNewSaleStartDatetime] = useState<string>('');
  const [newSaleStartTimestamp, setNewSaleStartTimestamp] = useState<number | undefined>(undefined);
  const [newSaleStartTimeText, setNewSaleStartTimeText] = useState<string>('เปิดจำหน่ายแล้ว');

  // Ticket Sale Closing Deadline state
  const [newSaleEndDatetime, setNewSaleEndDatetime] = useState<string>('2026-11-28T18:00');
  const [newSaleEndTimestamp, setNewSaleEndTimestamp] = useState<number | undefined>(new Date('2026-11-28T18:00:00').getTime());
  const [newIsSaleClosedManually, setNewIsSaleClosedManually] = useState<boolean>(false);

  const handleOpenCreateModal = () => {
    setEditingConcertId(null);
    setNewTitle('');
    setNewArtist('');
    setNewDate('28 พ.ย. 2026');
    setNewTime('19:00 - 22:30 น.');
    setNewDoorsOpen('17:30 น.');
    setNewVenue('Voice Space, วิภาวดี');
    setNewCategory('Indie');
    setNewVipPrice(3500);
    setNewStandardPrice(1500);
    setNewLimit(4);
    setNewDesc('รอบการแสดงพิเศษ ออกแบบเพื่อระบบจัดการคิว ConcertPass ยุค 2026');
    setNewPosterUrl('');

    // Default opening: immediately open
    setNewSaleStartDatetime('');
    setNewSaleStartTimestamp(undefined);
    setNewSaleStartTimeText('เปิดจำหน่ายแล้ว');

    // Default closing: 2026-11-28 18:00
    const defTimestamp = new Date('2026-11-28T18:00:00').getTime();
    setNewSaleEndDatetime(toDateTimeLocalString(defTimestamp));
    setNewSaleEndTimestamp(defTimestamp);
    setNewIsSaleClosedManually(false);

    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (concert: Concert) => {
    setEditingConcertId(concert.id);
    setNewTitle(concert.title);
    setNewArtist(concert.artist);
    setNewDate(concert.date);
    setNewTime(concert.time);
    setNewDoorsOpen(concert.doorsOpen || '17:30 น.');
    setNewVenue(concert.venue);
    setNewCategory(concert.category);
    setNewVipPrice(concert.zones[0]?.price || 3500);
    setNewStandardPrice(concert.zones[1]?.price || 1500);
    setNewLimit(concert.purchaseLimit || 4);
    setNewDesc(concert.description || '');
    setNewPosterUrl(concert.posterUrl || '');

    // Set opening schedule
    const startTs = concert.saleStartTimestamp || (concert.saleStartDatetime ? new Date(concert.saleStartDatetime).getTime() : undefined);
    const startDtString = startTs ? toDateTimeLocalString(startTs) : (concert.saleStartDatetime || '');
    setNewSaleStartDatetime(startDtString);
    setNewSaleStartTimestamp(startTs);
    setNewSaleStartTimeText(concert.saleStartTime || (startTs && startTs > Date.now() ? `เปิดขาย ${formatThaiDateTime(startTs)}` : 'เปิดจำหน่ายแล้ว'));

    // Set closing deadline
    const endTs = concert.saleEndTimestamp || (concert.saleEndDatetime ? new Date(concert.saleEndDatetime).getTime() : undefined);
    const dtString = endTs ? toDateTimeLocalString(endTs) : (concert.saleEndDatetime || '2026-11-28T18:00');
    setNewSaleEndDatetime(dtString);
    setNewSaleEndTimestamp(endTs);
    setNewIsSaleClosedManually(Boolean(concert.isSaleClosedManually || concert.status === 'sale_closed'));

    setIsCreateModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewPosterUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Compute statistics based on displayed concerts
  let totalRevenue = 0;
  let totalSoldSeats = 0;
  let totalCapacity = 0;

  displayedConcerts.forEach((c) => {
    c.seats.forEach((s) => {
      totalCapacity += 1;
      if (s.status === 'sold') {
        totalSoldSeats += 1;
        totalRevenue += s.price;
      }
    });
  });

  const concertIds = new Set(displayedConcerts.map((c) => c.id));
  const checkedInCount = tickets.filter((t) => t.status === 'used' && concertIds.has(t.concertId)).length;
  const occupancyRate = totalCapacity > 0 ? Math.round((totalSoldSeats / totalCapacity) * 100) : 0;

  const handleCreateConcert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) return;

    const finalStartTimestamp = newSaleStartDatetime
      ? new Date(newSaleStartDatetime).getTime()
      : newSaleStartTimestamp;

    const finalEndTimestamp = newSaleEndDatetime
      ? new Date(newSaleEndDatetime).getTime()
      : newSaleEndTimestamp;

    const now = Date.now();
    const isCurrentlyClosed = newIsSaleClosedManually || (finalEndTimestamp ? now >= finalEndTimestamp : false);
    const isCurrentlyUpcoming = !isCurrentlyClosed && (finalStartTimestamp ? now < finalStartTimestamp : false);
    const finalStatus: 'sale_open' | 'upcoming' | 'sold_out' | 'sale_closed' =
      isCurrentlyClosed
        ? 'sale_closed'
        : isCurrentlyUpcoming
        ? 'upcoming'
        : 'sale_open';

    const finalSaleStartTime = isCurrentlyUpcoming
      ? (newSaleStartTimeText && newSaleStartTimeText !== 'เปิดจำหน่ายแล้ว'
          ? newSaleStartTimeText
          : finalStartTimestamp
          ? `เปิดขาย ${formatThaiDateTime(finalStartTimestamp)}`
          : 'เร็วๆ นี้')
      : 'เปิดจำหน่ายแล้ว';

    if (editingConcertId) {
      const existing = concerts.find((c) => c.id === editingConcertId);
      if (existing) {
        const updated: Concert = {
          ...existing,
          title: newTitle,
          artist: newArtist,
          date: newDate,
          time: newTime,
          doorsOpen: newDoorsOpen,
          venue: newVenue,
          category: newCategory,
          purchaseLimit: newLimit,
          description: newDesc,
          posterUrl: newPosterUrl.trim() || undefined,
          saleStartDatetime: newSaleStartDatetime || undefined,
          saleStartTimestamp: finalStartTimestamp,
          saleStartTime: finalSaleStartTime,
          saleEndDatetime: newSaleEndDatetime,
          saleEndTimestamp: finalEndTimestamp,
          isSaleClosedManually: newIsSaleClosedManually,
          status: finalStatus,
          zones: existing.zones.map((z, idx) => {
            if (idx === 0) return { ...z, price: newVipPrice };
            if (idx === 1) return { ...z, price: newStandardPrice };
            return z;
          }),
        };
        updateConcert(updated);
        setExportNotice(`แก้ไขข้อมูลและกำหนดเวลาเปิด-ปิดจำหน่ายตั๋ว "${newTitle}" สำเร็จเรียบร้อย`);
        setTimeout(() => setExportNotice(null), 3500);
        setIsCreateModalOpen(false);
        setEditingConcertId(null);
        return;
      }
    }

    // Generate seats for the new concert
    const newSeats = [];
    // 10 VIP seats
    for (let i = 1; i <= 10; i++) {
      newSeats.push({
        id: `seat-vip-${i}`,
        zoneId: 'z-vip-custom',
        zoneName: 'VIP Zone (หน้าเวที)',
        row: 'A',
        number: i,
        label: `A${i}`,
        price: newVipPrice,
        status: 'available' as const,
      });
    }
    // 20 Standard seats
    for (let i = 1; i <= 20; i++) {
      const row = i <= 10 ? 'B' : 'C';
      const num = i <= 10 ? i : i - 10;
      newSeats.push({
        id: `seat-std-${i}`,
        zoneId: 'z-std-custom',
        zoneName: 'Standard Zone',
        row,
        number: num,
        label: `${row}${num}`,
        price: newStandardPrice,
        status: 'available' as const,
      });
    }

    const zones: Zone[] = [
      {
        id: 'z-vip-custom',
        name: 'VIP Zone (หน้าเวที)',
        price: newVipPrice,
        type: 'seated',
        color: '#f59e0b',
        totalCapacity: 10,
        availableCount: 10,
      },
      {
        id: 'z-std-custom',
        name: 'Standard Zone',
        price: newStandardPrice,
        type: 'seated',
        color: '#06b6d4',
        totalCapacity: 20,
        availableCount: 20,
      },
    ];

    const createdConcert: Concert = {
      id: `c-custom-${Date.now()}`,
      title: newTitle,
      artist: newArtist,
      organizerName: currentUser?.name || 'สมชาย ผู้จัดการค่าย',
      organizerId: currentUser?.id,
      date: newDate,
      time: newTime,
      doorsOpen: newDoorsOpen,
      venue: newVenue,
      description: newDesc,
      category: newCategory,
      purchaseLimit: newLimit,
      status: finalStatus,
      saleStartTime: finalSaleStartTime,
      saleStartDatetime: newSaleStartDatetime || undefined,
      saleStartTimestamp: finalStartTimestamp,
      saleEndDatetime: newSaleEndDatetime,
      saleEndTimestamp: finalEndTimestamp,
      isSaleClosedManually: newIsSaleClosedManually,
      accentColor: '#8b5cf6',
      gradientTheme: 'from-purple-950/70 via-neutral-900 to-neutral-950',
      posterUrl: newPosterUrl.trim() || undefined,
      zones,
      seats: newSeats,
    };

    addNewConcert(createdConcert);
    setExportNotice(`สร้างคอนเสิร์ต "${newTitle}" พร้อมเวลาจัดแสดง ${newTime} สำเร็จเรียบร้อย`);
    setTimeout(() => setExportNotice(null), 3500);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewArtist('');
    setNewPosterUrl('');
  };

  const handleExportReport = () => {
    setExportNotice('ส่งออกรายงานยอดขายและสถิติเช็คอิน (CSV) เรียบร้อย');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>ORGANIZER HUB (FEATURE F-05, F-08)</span>
            <span aria-hidden="true">·</span>
            <span>แดชบอร์ดผู้จัดงานเรียลไทม์ (สมชาย)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            ระบบบริหารจัดการและสรุปยอดขาย
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            ติดตามยอดจำหน่ายบัตร อัตราการเข้างานจริง และตั้งค่ารอบคอนเสิร์ต
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            className="px-3.5 py-2 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-600 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออกรายงาน</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-bold text-neutral-950 bg-white hover:bg-neutral-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-white/10"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างคอนเสิร์ตใหม่</span>
          </button>
        </div>
      </div>

      {/* Organizer Account Context & Switcher Strip */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
                  ORGANIZER ACCOUNT ISOLATION (แยกตามผู้จัดงาน)
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  ID: {currentUser?.id || 'usr-somchai-org'}
                </span>
                {isSupabaseActive && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase PostgreSQL
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
                ผู้จัดงานปัจจุบัน: {currentUser?.name || 'สมชาย ผู้จัดการค่าย'}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                อีเมล: <span className="font-mono text-neutral-300">{currentUser?.email}</span> — ยอดขายและคอนเสิร์ตแยกตาม organizer_id ในฐานข้อมูล SQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="text-[11px] font-mono text-neutral-400 w-full sm:w-auto">
              สลับผู้จัด:
            </div>
            <button
              onClick={() => quickSwitchAccount('organizerA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                currentUser?.id === 'usr-somchai-org'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              🏢 ผู้จัด A (สมชาย)
            </button>
            <button
              onClick={() => quickSwitchAccount('organizerB')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                currentUser?.id === 'usr-wichan-org'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              🏢 ผู้จัด B (วิชาญ)
            </button>
            {onOpenSupabaseModal && (
              <button
                onClick={onOpenSupabaseModal}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700 transition-colors flex items-center gap-1.5"
                title="ดูตาราง SQL และการเชื่อมต่อ Supabase"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>SQL Schema</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggle: คอนเสิร์ตของฉัน vs คอนเสิร์ตทั้งหมด */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrganizerFilter('mine')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                organizerFilter === 'mine'
                  ? 'bg-white text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800'
              }`}
            >
              🎯 เฉพาะคอนเสิร์ตของฉัน ({concerts.filter((c) => c.organizerId === currentUser?.id || (!c.organizerId && currentUser?.id === 'usr-somchai-org')).length} งาน)
            </button>
            <button
              onClick={() => setOrganizerFilter('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                organizerFilter === 'all'
                  ? 'bg-white text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800'
              }`}
            >
              🌐 คอนเสิร์ตทั้งหมดในระบบ ({concerts.length} งาน)
            </button>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            กำลังแสดง: {isMine ? `เฉพาะงานของ ${currentUser?.name}` : 'ทุกงานในแพลตฟอร์ม'}
          </span>
        </div>
      </div>

      {exportNotice && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
            <span>รายรับรวม (REVENUE)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            ฿{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">
            ยืนยันแล้วผ่าน PromptPay
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
            <span>บัตรที่จำหน่ายแล้ว</span>
            <Ticket className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {totalSoldSeats} <span className="text-xs text-neutral-500 font-normal">/ {totalCapacity} ที่นั่ง</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono">
            อัตราการขาย: {occupancyRate}%
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
            <span>เช็คอินเข้างานแล้ว (GATE)</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {checkedInCount} <span className="text-xs text-neutral-500 font-normal">คน</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono">
            สแกนเรียบร้อยผ่าน Gate Scanner
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
            <span>ป้องกันการจองซ้ำ (LOCKS)</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            100%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 font-mono">
            Zero Double-booking Rate
          </div>
        </div>
      </div>

      {/* Concerts Table / List */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
          <h2 className="text-lg font-bold text-white font-display">
            รายการคอนเสิร์ตในการดูแล ({displayedConcerts.length} งาน)
          </h2>
          <span className="text-xs text-neutral-500 font-mono">อัปเดตเรียลไทม์</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400">
                <th className="pb-3 font-medium">ชื่องานคอนเสิร์ต</th>
                <th className="pb-3 font-medium">วันและเวลาจัดงาน</th>
                <th className="pb-3 font-medium">ราคาโซน (VIP / STD)</th>
                <th className="pb-3 font-medium">จำกัด/บัญชี</th>
                <th className="pb-3 font-medium">ยอดขาย (ที่นั่ง)</th>
                <th className="pb-3 font-medium text-right">การจัดการ & สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {displayedConcerts.map((c) => {
                const soldInThis = c.seats.filter((s) => s.status === 'sold').length;
                const totalInThis = c.seats.length;
                const vipP = c.zones[0]?.price || 0;
                const stdP = c.zones[1]?.price || 0;
                const saleStatus = getConcertSaleStatus(c, currentTime);
                const isClosed = saleStatus.isClosed;
                const isUpcoming = saleStatus.isUpcoming;

                return (
                  <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-4 font-semibold text-white font-display text-sm">
                      {c.title}
                      <span className="block text-[11px] font-normal font-sans text-neutral-400">
                        {c.artist}
                      </span>
                      <span className="block text-[10px] font-normal font-mono text-neutral-500 mt-0.5">
                        ผู้จัดงาน by {c.organizerName || 'สมชาย ผู้จัดการค่าย'}
                      </span>
                    </td>
                    <td className="py-4 text-neutral-400">
                      <div className="text-white font-medium">{c.date}</div>
                      <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{c.time}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate max-w-[180px] mt-0.5">{c.venue}</div>
                    </td>
                    <td className="py-4">
                      ฿{vipP.toLocaleString()} / ฿{stdP.toLocaleString()}
                    </td>
                    <td className="py-4 text-neutral-400">
                      {c.purchaseLimit} ใบ
                    </td>
                    <td className="py-4">
                      <span className="text-white font-bold">{soldInThis}</span> / {totalInThis}
                      <div className="w-24 bg-neutral-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${totalInThis > 0 ? (soldInThis / totalInThis) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        {isClosed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/70 text-red-300 border border-red-800/80 font-semibold flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            ปิดจำหน่ายแล้ว
                          </span>
                        ) : isUpcoming ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950/80 text-blue-300 border border-blue-700/70 font-semibold flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            เร็วๆ นี้ (ยังไม่เปิดขาย)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            เปิดจำหน่าย
                          </span>
                        )}

                        <div className="text-[10px] font-mono text-neutral-400 text-right">
                          <div className="flex items-center justify-end gap-1 text-neutral-400">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>
                              {isUpcoming
                                ? `เปิดจอง: ${saleStatus.openDateFormatted}`
                                : `ปิด: ${saleStatus.closeDateFormatted}`}
                            </span>
                          </div>
                          {saleStatus.countdownText && (
                            <span className={`block font-medium ${
                              isClosed ? 'text-red-400' : isUpcoming ? 'text-cyan-400' : 'text-amber-400'
                            }`}>
                              ({saleStatus.countdownText})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap justify-end">
                          {isUpcoming && (
                            <button
                              type="button"
                              onClick={() => openSaleImmediately(c.id)}
                              className="px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer border bg-blue-950/60 border-blue-700/70 hover:bg-blue-900/70 text-blue-300"
                              title="เปิดให้จองตั๋วทันที (เริ่มขายเลย)"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                              <span>เปิดจองทันที</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleSaleStatus(c.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer border ${
                              isClosed
                                ? 'bg-emerald-950/50 border-emerald-700/60 hover:bg-emerald-900/60 text-emerald-300'
                                : 'bg-red-950/50 border-red-800/60 hover:bg-red-900/60 text-red-300'
                            }`}
                            title={isClosed ? 'เปิดจำหน่ายตั๋วอีกครั้ง' : 'ปิดการจำหน่ายตั๋วทันที'}
                          >
                            {isClosed ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                            <span>{isClosed ? 'เปิดขายใหม่' : 'ปิดจำหน่าย'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700/80 hover:border-emerald-500 hover:text-emerald-300 text-neutral-300 text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="แก้ไขเวลาและข้อมูลคอนเสิร์ต"
                          >
                            <Pencil className="w-3 h-3 text-emerald-400" />
                            <span>แก้ไขเวลา / งาน</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario 2: Create Concert Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col h-[88vh] max-h-[880px] min-h-0 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  {editingConcertId
                    ? 'SCENARIO 2 · F-05 CONCERT SCHEDULE & EDIT'
                    : 'SCENARIO 2 · F-05 CONCERT SETUP'}
                </span>
                <h3 className="text-xl font-bold text-white font-display">
                  {editingConcertId
                    ? 'แก้ไขข้อมูลและเวลาจัดคอนเสิร์ต'
                    : 'สร้างรอบการแสดงและกำหนดผังราคา'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white text-lg font-mono p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateConcert}
              className="p-5 sm:p-6 space-y-4 text-xs font-mono overflow-y-auto flex-1 min-h-0 overscroll-contain scroll-smooth"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Organizer Attribution Info */}
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-neutral-500 block text-[10px] font-mono">ผู้จัดงาน (ชื่อบัญชีจริง):</span>
                  <span className="text-white font-sans font-semibold text-xs truncate block">
                    ผู้จัดงาน by {currentUser?.name || 'สมชาย ผู้จัดการค่าย'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono shrink-0">
                  Account Name
                </span>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">ชื่องานคอนเสิร์ต</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Acoustic in the Park 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">ศิลปิน (Artist Lineup)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น Dept x Anatomy Rabbit"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">แนวเพลง (Category)</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                  >
                    <option value="Acoustic">Acoustic</option>
                    <option value="Indie">Indie</option>
                    <option value="Rock">Rock</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Pop">Pop</option>
                  </select>
                </div>
              </div>

              {/* Date, Time & Schedule Section (Requested: เพิ่มการแก้ไข เวลา จัดคอนเสิร์ต) */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    กำหนดวันและเวลาจัดคอนเสิร์ต (CONCERT SCHEDULE)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    ระบุเวลาแสดง & เปิดประตู
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 mb-1 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>วันที่จัดแสดงคอนเสิร์ต</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 28 พ.ย. 2026 หรือ 24 ต.ค. 2026"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-cyan-500 font-sans text-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 mb-1 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>เวลาจัดคอนเสิร์ต (Concert Time)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 19:00 - 22:30 น."
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 font-mono text-xs transition-colors"
                    />
                  </div>
                </div>

                {/* Quick Time Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                  <span className="text-[10px] text-neutral-500 whitespace-nowrap font-mono">เลือกเวลาเร็ว:</span>
                  {[
                    '18:00 - 22:00 น.',
                    '19:00 - 22:30 น.',
                    '19:30 - 23:00 น.',
                    '20:00 - 23:30 น.',
                    '16:00 - 20:30 น.',
                  ].map((presetTime) => (
                    <button
                      key={presetTime}
                      type="button"
                      onClick={() => setNewTime(presetTime)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono whitespace-nowrap transition-colors ${
                        newTime === presetTime
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 text-neutral-400'
                      }`}
                    >
                      {presetTime}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-neutral-400 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>เวลาเปิดประตูเข้างาน (Doors Open)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 17:30 น."
                      value={newDoorsOpen}
                      onChange={(e) => setNewDoorsOpen(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">สถานที่จัดงาน (Venue)</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น Voice Space, วิภาวดี"
                      value={newVenue}
                      onChange={(e) => setNewVenue(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white outline-none focus:border-neutral-600 font-sans text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Sale Opening Schedule Section (Requested Feature: เร็วๆ นี้ / ยังไม่เปิดขาย) */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    กำหนดวันและเวลาเริ่มเปิดจองตั๋ว (SALE OPENING SCHEDULE)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    สถานะ "เร็วๆ นี้" จนกว่าจะถึงเวลานี้
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-neutral-300 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>วันและเวลาที่จะเริ่มเปิดให้จองตั๋ว (Opening Date & Time)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={newSaleStartDatetime}
                    onChange={(e) => {
                      setNewSaleStartDatetime(e.target.value);
                      if (e.target.value) {
                        const ts = new Date(e.target.value).getTime();
                        setNewSaleStartTimestamp(ts);
                        setNewSaleStartTimeText(`เปิดขาย ${formatThaiDateTime(ts)}`);
                      } else {
                        setNewSaleStartTimestamp(undefined);
                        setNewSaleStartTimeText('เปิดจำหน่ายแล้ว');
                      }
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500 font-mono text-xs transition-colors"
                  />
                  <p className="text-[10px] text-neutral-500 font-mono">
                    * หากปล่อยว่างไว้ ระบบจะถือว่าเปิดจำหน่ายทันที (ไม่เป็นสถานะเร็วๆ นี้)
                  </p>
                </div>

                {/* Quick Presets for Opening Time */}
                <div>
                  <span className="text-[10px] text-neutral-500 font-mono block mb-1.5">
                    ปุ่มลัดเลือกเวลาเปิดจอง (Quick Presets):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNewSaleStartDatetime('');
                        setNewSaleStartTimestamp(undefined);
                        setNewSaleStartTimeText('เปิดจำหน่ายแล้ว');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-700/60 hover:bg-emerald-900/60 text-emerald-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>🚀 เปิดจำหน่ายทันที (ไม่มีเร็วๆ นี้)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = Date.now() + 60 * 1000; // 1 min from now
                        setNewSaleStartTimestamp(target);
                        setNewSaleStartDatetime(toDateTimeLocalString(target));
                        setNewSaleStartTimeText(`เปิดขาย ${formatThaiDateTime(target)}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-700/60 hover:bg-blue-900/60 text-blue-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Timer className="w-3 h-3 text-blue-400" />
                      <span>⚡ เปิดในอีก 1 นาที (ทดสอบนับถอยหลัง & เปิดอัตโนมัติ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = new Date('2026-10-25T10:00:00').getTime();
                        setNewSaleStartTimestamp(target);
                        setNewSaleStartDatetime('2026-10-25T10:00');
                        setNewSaleStartTimeText('เปิดขาย 25 ต.ค. เวลา 10:00 น.');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      <span>📅 25 ต.ค. เวลา 10:00 น.</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ticket Sale Closing Deadline Section (Requested Feature) */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    กำหนดวันและเวลาปิดจำหน่ายตั๋ว (TICKET SALE CLOSING)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    ปิดรับการสั่งซื้ออัตโนมัติเมื่อถึงเวลานี้
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-neutral-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    <span>วันและเวลาที่ระบบจะปิดการจำหน่ายตั๋ว (Closing Date & Time)</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newSaleEndDatetime}
                    onChange={(e) => {
                      setNewSaleEndDatetime(e.target.value);
                      if (e.target.value) {
                        setNewSaleEndTimestamp(new Date(e.target.value).getTime());
                      }
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-red-500 font-mono text-xs transition-colors"
                  />
                </div>

                {/* Quick Presets for closing time */}
                <div>
                  <span className="text-[10px] text-neutral-500 font-mono block mb-1.5">
                    ปุ่มลัดเลือกเวลาปิดขายเร็ว (Quick Presets):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const target = Date.now() + 2 * 60 * 1000;
                        setNewSaleEndTimestamp(target);
                        setNewSaleEndDatetime(toDateTimeLocalString(target));
                        setNewIsSaleClosedManually(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-950/50 border border-red-700/60 hover:bg-red-900/60 text-red-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Timer className="w-3 h-3 text-red-400" />
                      <span>⚡ ปิดในอีก 2 นาที (สำหรับทดสอบ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = Date.now() + 60 * 60 * 1000;
                        setNewSaleEndTimestamp(target);
                        setNewSaleEndDatetime(toDateTimeLocalString(target));
                        setNewIsSaleClosedManually(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>ปิดในอีก 1 ชม.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = Date.now() + 24 * 60 * 60 * 1000;
                        setNewSaleEndTimestamp(target);
                        setNewSaleEndDatetime(toDateTimeLocalString(target));
                        setNewIsSaleClosedManually(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      <span>ปิดในอีก 1 วัน</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewIsSaleClosedManually(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
                        newIsSaleClosedManually
                          ? 'bg-red-900 text-white border-red-500 font-bold'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-red-400'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>ปิดจำหน่ายทันที</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewIsSaleClosedManually(false);
                        const future = Date.now() + 7 * 86400 * 1000;
                        setNewSaleEndTimestamp(future);
                        setNewSaleEndDatetime(toDateTimeLocalString(future));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
                        !newIsSaleClosedManually
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 font-bold'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <Unlock className="w-3 h-3" />
                      <span>เปิดจำหน่ายตามเวลา</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Status Preview inside Form */}
                {(() => {
                  const now = currentTime;
                  const isClosedPreview = newIsSaleClosedManually || (newSaleEndTimestamp && now >= newSaleEndTimestamp);
                  const isUpcomingPreview = !isClosedPreview && (newSaleStartTimestamp ? now < newSaleStartTimestamp : false);

                  return (
                    <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono ${
                      isClosedPreview
                        ? 'bg-red-950/40 border-red-800/80 text-red-200'
                        : isUpcomingPreview
                        ? 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                        : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          isClosedPreview
                            ? 'bg-red-400'
                            : isUpcomingPreview
                            ? 'bg-blue-400 animate-pulse'
                            : 'bg-emerald-400 animate-pulse'
                        }`} />
                        <span>
                          {isClosedPreview
                            ? 'สถานะ: ปิดการจำหน่ายตั๋วแล้ว (ผู้ซื้อจะไม่สามารถจองบัตรได้)'
                            : isUpcomingPreview
                            ? 'สถานะ: เร็วๆ นี้ (ยังไม่เปิดขาย - จะเปิดอัตโนมัติเมื่อถึงเวลา)'
                            : 'สถานะ: กำลังเปิดจำหน่ายตั๋วตามปกติ (ผู้ซื้อสามารถเลือกที่นั่งได้)'}
                        </span>
                      </div>
                      <div className="text-right text-[10px] text-neutral-400 space-y-0.5">
                        {isUpcomingPreview && newSaleStartTimestamp && (
                          <div className="text-blue-300 font-semibold">
                            เริ่มเปิดจอง: {formatThaiDateTime(newSaleStartTimestamp)}
                          </div>
                        )}
                        <div>
                          กำหนดปิดขาย: <strong className="text-white">{newSaleEndDatetime ? formatThaiDateTime(newSaleEndDatetime) : '-'}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Concert Poster Image Upload (Requested feature) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-400 font-semibold">
                    รูปภาพโปสเตอร์คอนเสิร์ต (Poster Image)
                  </label>
                  {newPosterUrl && (
                    <button
                      type="button"
                      onClick={() => setNewPosterUrl('')}
                      className="text-red-400 hover:text-red-300 text-[11px] font-sans flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>ลบรูปภาพ</span>
                    </button>
                  )}
                </div>

                {newPosterUrl ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-950 flex items-center justify-center group shadow-md">
                    <img
                      src={newPosterUrl}
                      alt="Concert Poster Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 bg-white text-neutral-950 font-bold rounded-xl cursor-pointer text-xs shadow-md flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>เปลี่ยนรูป</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewPosterUrl('')}
                        className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs shadow-md"
                      >
                        ลบออก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <label className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 bg-neutral-950/70 hover:bg-neutral-900/60 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all">
                      <Upload className="w-6 h-6 text-neutral-400 mb-1.5" />
                      <span className="text-white font-medium text-xs font-sans">
                        คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากรูปมาวางที่นี่
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        รองรับ PNG, JPG, WebP
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                    </label>

                    {/* Presets and URL input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <span className="text-[10px] text-neutral-500 whitespace-nowrap">ตัวอย่างภาพ:</span>
                        {POSTER_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewPosterUrl(preset.url)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-600 text-[10px] text-neutral-300 whitespace-nowrap transition-colors"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="หรือวางลิงก์ URL รูปภาพ (https://...)"
                          value={newPosterUrl.startsWith('data:') ? '' : newPosterUrl}
                          onChange={(e) => setNewPosterUrl(e.target.value)}
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-neutral-600 font-sans"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Limits (F-05 & F-06) */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-3">
                <span className="text-[11px] text-neutral-400 uppercase tracking-wider block font-semibold">
                  การกำหนดโซนราคา & กฎจำกัดสิทธิ์ (BR-01)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-amber-400 mb-1">ราคา VIP (THB)</label>
                    <input
                      type="number"
                      value={newVipPrice}
                      onChange={(e) => setNewVipPrice(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-400 mb-1">ราคา Standard (THB)</label>
                    <input
                      type="number"
                      value={newStandardPrice}
                      onChange={(e) => setNewStandardPrice(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">จำกัดซื้อ/บัญชี</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newLimit}
                      onChange={(e) => setNewLimit(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-neutral-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 sticky bottom-0 bg-neutral-950/95 backdrop-blur-md -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-4 flex items-center justify-end gap-3 z-10 rounded-b-3xl mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-neutral-950 font-bold rounded-xl hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10 cursor-pointer"
                >
                  {editingConcertId
                    ? 'บันทึกการแก้ไขเวลาและข้อมูลคอนเสิร์ต'
                    : 'บันทึกและเผยแพร่คอนเสิร์ต'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
