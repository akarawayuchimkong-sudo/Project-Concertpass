import React, { useState } from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { Ticket as TicketType } from '../types/concert';
import {
  Download,
  CheckCircle,
  Trash2,
  Calendar,
  QrCode,
  Clock,
  RotateCcw,
  AlertTriangle,
  User,
  Database,
  ArrowRight,
} from 'lucide-react';

interface MyTicketsViewProps {
  onBrowseConcerts?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  onBrowseConcerts,
  onOpenSupabaseModal,
}) => {
  const {
    tickets,
    currentUser,
    deleteTicket,
    refundTicket,
    quickSwitchAccount,
    isSupabaseActive,
  } = useConcertPass();

  // Filter tickets strictly for the current logged-in user account
  const userTickets = currentUser
    ? tickets.filter(
        (t) =>
          t.userId === currentUser.id ||
          (!t.userId && currentUser.id === 'usr-customer-a')
      )
    : [];

  const [activeTicketId, setActiveTicketId] = useState<string | null>(
    userTickets.length > 0 ? userTickets[0].id : null
  );
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [ticketToRefund, setTicketToRefund] = useState<TicketType | null>(null);

  const upcomingTickets = userTickets.filter((t) => t.status === 'valid');
  const pastTickets = userTickets.filter((t) => t.status === 'used');

  const selectedTicket =
    userTickets.find((t) => t.id === activeTicketId) ||
    (userTickets.length > 0 ? userTickets[0] : null);

  const handleDownloadTicket = (ticket: TicketType) => {
    setFeedbackNotice(`บันทึก E-Ticket [${ticket.seatLabel} - ${ticket.id}] สำเร็จ`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleDeleteUsedTicket = (ticket: TicketType, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (ticket.status !== 'used') {
      return; // Safety guard: can only delete scanned/used tickets
    }

    const success = deleteTicket(ticket.id);
    if (success) {
      setFeedbackNotice(`ลบประวัติบัตรที่เข้างานแล้ว [${ticket.seatLabel} - ${ticket.id}] สำเร็จ`);
      setTimeout(() => setFeedbackNotice(null), 3500);

      if (activeTicketId === ticket.id) {
        const remaining = userTickets.filter((t) => t.id !== ticket.id);
        setActiveTicketId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const handleConfirmRefund = () => {
    if (!ticketToRefund) return;
    const res = refundTicket(ticketToRefund.id);
    if (res.success) {
      setFeedbackNotice(res.message);
      setTimeout(() => setFeedbackNotice(null), 4000);

      if (activeTicketId === ticketToRefund.id) {
        const remaining = userTickets.filter((t) => t.id !== ticketToRefund.id);
        setActiveTicketId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
    setTicketToRefund(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Account Separation Banner (Requested Feature) */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-white shrink-0 mt-0.5">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  ACCOUNT ISOLATION (แยกตั๋วตาม ACCOUNT)
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  ID: {currentUser?.id || 'guest'}
                </span>
                {isSupabaseActive && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase SQL Connected
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
                กำลังดูบัตรของ: {currentUser?.name || 'ยังไม่ได้เข้าสู่ระบบ'}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                อีเมล: <span className="font-mono text-neutral-300">{currentUser?.email}</span> — บัตรในกระเป๋าของคุณจะถูกแยกเฉพาะบัญชีนี้ตาม SQL Database
              </p>
            </div>
          </div>

          {/* Quick Account Switcher Buttons for Live Testing */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="text-[11px] font-mono text-neutral-400 w-full sm:w-auto">
              ทดสอบสลับบัญชี:
            </div>
            <button
              onClick={() => quickSwitchAccount('customerA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                currentUser?.id === 'usr-customer-a'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              👤 Account A (แพรว)
            </button>
            <button
              onClick={() => quickSwitchAccount('customerB')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                currentUser?.id === 'usr-customer-b'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              👤 Account B (ธนกฤต)
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
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
          <span>DIGITAL WALLET (E-TICKET F-04)</span>
          <span aria-hidden="true">·</span>
          <span>ตั๋วอิเล็กทรอนิกส์พร้อมระบบคืนบัตร & ปลดล็อกที่นั่งอัตโนมัติ</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          บัตรคอนเสิร์ตของฉัน ({userTickets.length} ใบ)
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          แสดง QR Code หน้าประตู หรือจัดการขอคืนบัตรเพื่อให้ที่นั่งกลับคืนสู่ผังจองคิว
        </p>
      </div>

      {feedbackNotice && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Empty State when this account has no tickets */}
      {userTickets.length === 0 ? (
        <div className="p-12 rounded-3xl bg-neutral-950 border border-neutral-800/80 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4 text-neutral-500">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white font-display">
            ยังไม่มีบัตรคอนเสิร์ตในบัญชี {currentUser?.name || ''}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
            ระบบได้แยกข้อมูลของแต่ละ Account ออกจากกันอย่างเด็ดขาด บัญชีนี้ยังไม่มีประวัติการจองตั๋ว
            คุณสามารถเลือกดูคอนเสิร์ตและจองตั๋วเพื่อทดสอบรับ E-Ticket ได้ทันที
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onBrowseConcerts && (
              <button
                onClick={onBrowseConcerts}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
              >
                <span>เลือกคอนเสิร์ตเพื่อจองบัตร</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => quickSwitchAccount(currentUser?.id === 'usr-customer-a' ? 'customerB' : 'customerA')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-medium hover:border-neutral-500 transition-colors"
            >
              สลับไปดูบัญชีที่มีตั๋ว ({currentUser?.id === 'usr-customer-a' ? 'Account B' : 'Account A'})
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Tabs: ทั้งหมด / กำลังจะมาถึง / ผ่านมาแล้ว */}
          <div className="flex items-center gap-2 mb-6 p-1 bg-neutral-900/80 border border-neutral-800/80 rounded-xl w-fit">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedFilter === 'all'
                  ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              ทั้งหมด ({userTickets.length})
            </button>
            <button
              onClick={() => setSelectedFilter('upcoming')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedFilter === 'upcoming'
                  ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              บัตรที่กำลังจะมาถึง ({upcomingTickets.length})
            </button>
            <button
              onClick={() => setSelectedFilter('past')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedFilter === 'past'
                  ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              บัตรที่ผ่านมา ({pastTickets.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Ticket Selector List Divided by Headings */}
            <div className="lg:col-span-5 space-y-6">
              {/* Section 1: บัตรที่กำลังจะมาถึง (Upcoming Passes) */}
              {(selectedFilter === 'all' || selectedFilter === 'upcoming') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>บัตรที่กำลังจะมาถึง (พร้อมใช้งาน)</span>
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">{upcomingTickets.length} ใบ</span>
                  </div>

                  {upcomingTickets.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/60 text-xs text-neutral-500 font-mono text-center">
                      ไม่มีบัตรที่กำลังจะมาถึง
                    </div>
                  ) : (
                    upcomingTickets.map((t) => {
                      const isSelected = selectedTicket?.id === t.id;

                      return (
                        <div
                          key={t.id}
                          onClick={() => setActiveTicketId(t.id)}
                          className={`w-full text-left p-4 rounded-2xl transition-all border cursor-pointer relative ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-700 shadow-lg ring-1 ring-white/10'
                              : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-white font-display line-clamp-1">
                                {t.concertTitle}
                              </h3>
                              <p className="text-xs text-neutral-400 mt-0.5">{t.artist}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-950/60 text-emerald-400 border-emerald-800/80 shrink-0">
                                พร้อมใช้งาน
                              </span>
                              {/* Quick refund trigger on card */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTicketToRefund(t);
                                }}
                                className="p-1 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                                title="ขอคืนบัตรนี้เพื่อปล่อยที่นั่งว่าง"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs font-mono text-neutral-400">
                            <span className="text-white font-bold">
                              {t.seatLabel} ({t.zoneName.includes('VIP') ? 'VIP' : 'STD'})
                            </span>
                            <span>{t.date}</span>
                            <span className="text-neutral-400">฿{t.price.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Section 2: บัตรที่ผ่านมา (Past / Used Passes) */}
              {(selectedFilter === 'all' || selectedFilter === 'past') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>บัตรที่ผ่านมา (เข้างานแล้ว)</span>
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">{pastTickets.length} ใบ</span>
                  </div>

                  {pastTickets.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/60 text-xs text-neutral-500 font-mono text-center">
                      ไม่มีประวัติบัตรที่ผ่านมา
                    </div>
                  ) : (
                    pastTickets.map((t) => {
                      const isSelected = selectedTicket?.id === t.id;

                      return (
                        <div
                          key={t.id}
                          onClick={() => setActiveTicketId(t.id)}
                          className={`w-full text-left p-4 rounded-2xl transition-all border cursor-pointer opacity-80 hover:opacity-100 ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-700 shadow-md ring-1 ring-white/10'
                              : 'bg-neutral-950/40 border-neutral-900 hover:border-neutral-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-neutral-300 font-display line-clamp-1 line-through">
                                {t.concertTitle}
                              </h3>
                              <p className="text-xs text-neutral-500 mt-0.5">{t.artist}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-500 border border-neutral-800 shrink-0">
                                เข้างานแล้ว
                              </span>
                              <button
                                onClick={(e) => handleDeleteUsedTicket(t, e)}
                                className="p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                                title="ลบประวัติบัตรนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-neutral-900 flex items-center justify-between text-xs font-mono text-neutral-500">
                            <span>
                              {t.seatLabel} ({t.zoneName})
                            </span>
                            <span>{t.date}</span>
                            <span>เข้างานเมื่อ {t.checkedInAt ? new Date(t.checkedInAt).toLocaleTimeString('th-TH') : '-'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Right Side: High-fidelity E-Ticket Preview with QR Code */}
            <div className="lg:col-span-7">
              {selectedTicket ? (
                <div className="sticky top-24 bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8">
                  {/* Ticket Top Notch */}
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-6 mb-6">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                        OFFICIAL CONCERT PASS · {selectedTicket.id}
                      </div>
                      <h2 className="text-2xl font-bold text-white font-display mt-1">
                        {selectedTicket.concertTitle}
                      </h2>
                      <div className="text-sm text-neutral-400 mt-0.5">{selectedTicket.artist}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
                          selectedTicket.status === 'valid'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {selectedTicket.status === 'valid' ? '● พร้อมเข้างาน' : '✓ สแกนแล้ว'}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Meta Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                      <div className="text-neutral-500 text-[10px] uppercase">วันแสดง</div>
                      <div className="text-white font-bold mt-0.5 truncate">{selectedTicket.date}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                      <div className="text-neutral-500 text-[10px] uppercase">เวลา</div>
                      <div className="text-white font-bold mt-0.5 truncate">{selectedTicket.time}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                      <div className="text-emerald-400 font-bold mt-0.5 truncate">{selectedTicket.zoneName}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                      <div className="text-neutral-500 text-[10px] uppercase">ที่นั่ง</div>
                      <div className="text-white font-bold text-sm mt-0.5">{selectedTicket.seatLabel}</div>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner">
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                      {/* SVG Mock QR Code */}
                      <svg
                        className="w-48 h-48 sm:w-56 sm:h-56"
                        viewBox="0 0 100 100"
                        fill="currentColor"
                      >
                        {/* Finder patterns */}
                        <path d="M5,5 h25 v25 h-25 z M10,10 v15 h15 v-15 z M14,14 h7 v7 h-7 z" fill="#000" />
                        <path d="M70,5 h25 v25 h-25 z M75,10 v15 h15 v-15 z M79,14 h7 v7 h-7 z" fill="#000" />
                        <path d="M5,70 h25 v25 h-25 z M10,75 v15 h15 v-15 z M14,79 h7 v7 h-7 z" fill="#000" />
                        {/* Data noise simulating unique QR code */}
                        <rect x="35" y="10" width="8" height="8" fill="#000" />
                        <rect x="47" y="12" width="6" height="6" fill="#000" />
                        <rect x="57" y="8" width="7" height="7" fill="#000" />
                        <rect x="36" y="24" width="6" height="6" fill="#000" />
                        <rect x="46" y="22" width="8" height="8" fill="#000" />
                        <rect x="58" y="25" width="6" height="6" fill="#000" />
                        <rect x="10" y="36" width="6" height="6" fill="#000" />
                        <rect x="22" y="38" width="7" height="7" fill="#000" />
                        <rect x="34" y="35" width="8" height="8" fill="#000" />
                        <rect x="45" y="42" width="10" height="10" fill="#000" />
                        <rect x="62" y="36" width="7" height="7" fill="#000" />
                        <rect x="74" y="38" width="6" height="6" fill="#000" />
                        <rect x="85" y="35" width="8" height="8" fill="#000" />
                        <rect x="12" y="48" width="8" height="8" fill="#000" />
                        <rect x="25" y="52" width="6" height="6" fill="#000" />
                        <rect x="38" y="49" width="7" height="7" fill="#000" />
                        <rect x="65" y="48" width="8" height="8" fill="#000" />
                        <rect x="77" y="52" width="6" height="6" fill="#000" />
                        <rect x="88" y="49" width="7" height="7" fill="#000" />
                        <rect x="35" y="65" width="7" height="7" fill="#000" />
                        <rect x="47" y="62" width="9" height="9" fill="#000" />
                        <rect x="60" y="66" width="6" height="6" fill="#000" />
                        <rect x="75" y="70" width="8" height="8" fill="#000" />
                        <rect x="86" y="74" width="7" height="7" fill="#000" />
                        <rect x="38" y="78" width="6" height="6" fill="#000" />
                        <rect x="49" y="80" width="8" height="8" fill="#000" />
                        <rect x="62" y="77" width="7" height="7" fill="#000" />
                        <rect x="77" y="85" width="6" height="6" fill="#000" />
                        <rect x="87" y="86" width="8" height="8" fill="#000" />
                      </svg>
                    </div>

                    <div className="mt-4 text-xs font-mono text-neutral-800 font-bold tracking-wider">
                      {selectedTicket.id}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-sans mt-0.5">
                      ผู้ถือบัตร: {selectedTicket.attendeeName}
                    </div>
                  </div>

                  {/* Ticket Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-neutral-800">
                    <button
                      onClick={() => handleDownloadTicket(selectedTicket)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700/80 hover:border-neutral-500 text-neutral-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>บันทึกภาพตั๋ว (Save)</span>
                    </button>

                    {selectedTicket.status === 'valid' && (
                      <button
                        onClick={() => setTicketToRefund(selectedTicket)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-950 text-amber-400 border border-amber-900/60 hover:bg-amber-950/40 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ขอคืนบัตร / ปลดล็อกที่นั่ง</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal for Refund */}
      {ticketToRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white font-display">
                ยืนยันการขอคืนบัตรคอนเสิร์ต?
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                บัตรที่นั่ง <span className="text-white font-bold">{ticketToRefund.seatLabel}</span> ({ticketToRefund.zoneName}) งาน{' '}
                <span className="text-white font-semibold">"{ticketToRefund.concertTitle}"</span> จะถูกยกเลิก และที่นั่งจะถูกปลดล็อกกลับคืนสู่ผังจองคิวให้ผู้ใช้อื่นจองได้ทันที
              </p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs font-mono text-neutral-400 flex items-center justify-between">
              <span>ยอดเงินคืน:</span>
              <span className="text-emerald-400 font-bold text-sm">
                ฿{ticketToRefund.price.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setTicketToRefund(null)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmRefund}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
              >
                ยืนยันคืนบัตร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
