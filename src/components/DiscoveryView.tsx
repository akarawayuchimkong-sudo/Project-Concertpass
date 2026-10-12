import React, { useState } from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { ConcertCard } from './ConcertCard';
import { isConcertSaleClosed, isConcertSaleUpcoming } from '../utils/concertSale';
import { Search, Sparkles, Shield, Zap, Ticket } from 'lucide-react';

interface DiscoveryViewProps {
  onSelectConcert: (concertId: string) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onSelectConcert, onOpenAuthModal }) => {
  const { concerts, isLoggedIn, currentTime } = useConcertPass();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'upcoming' | 'closed'>('all');

  const categories = ['all', 'Acoustic', 'Indie', 'Electronic', 'Rock'];

  const filteredConcerts = concerts.filter((c) => {
    const matchesCategory =
      selectedCategory === 'all' || c.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.artist.toLowerCase().includes(query) ||
      c.venue.toLowerCase().includes(query);

    const isClosed = isConcertSaleClosed(c, currentTime);
    const isUpcoming = !isClosed && isConcertSaleUpcoming(c, currentTime);
    const isOpen = !isClosed && !isUpcoming;

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'open' && isOpen) ||
      (selectedStatus === 'upcoming' && isUpcoming) ||
      (selectedStatus === 'closed' && isClosed);

    return matchesCategory && matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full">
      {/* 2026 Minimalist Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-neutral-900">
        {/* Subtle background ambient mesh */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-500/20 via-violet-500/20 to-transparent blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ระบบจองคิวคอนเสิร์ตรูปแบบใหม่ประจำปี 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-display max-w-4xl mx-auto leading-[1.15] text-balance">
            สัมผัสประสบการณ์ดนตรีสด<br className="hidden sm:inline" />
            หมดปัญหาแย่งที่นั่งและบัตรผี
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            ConcertPass ระบบผังที่นั่งโต้ตอบแบบเรียลไทม์พร้อมเทคโนโลยี Concurrency Lock 15 นาที
            ชำระเงินอัตโนมัติ และ E-Ticket สแกนหน้างานไร้รอยต่อ
          </p>

          {!isLoggedIn && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onOpenAuthModal('register')}
                className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-white/10"
              >
                สมัครสมาชิกเพื่อเริ่มจองตั๋ว
              </button>
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white font-medium text-xs rounded-xl transition-all"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="mt-8 sm:mt-10 max-w-xl mx-auto space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาคอนเสิร์ต ศิลปิน หรือสถานที่จัดแสดง..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all shadow-xl"
              />
            </div>

            {/* Segmented category filter controls */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all ${
                    selectedCategory === cat
                      ? 'bg-white text-neutral-950 font-semibold shadow-sm'
                      : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800/80'
                  }`}
                >
                  {cat === 'all' ? 'ทุกแนวเพลง' : cat}
                </button>
              ))}
            </div>

            {/* Status filter tabs */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
              {[
                { id: 'all', label: 'สถานะทั้งหมด' },
                { id: 'open', label: '🟢 เปิดจำหน่าย' },
                { id: 'upcoming', label: '🔵 เร็วๆ นี้ (ยังไม่เปิดขาย)' },
                { id: 'closed', label: '🔴 ปิดจำหน่ายแล้ว' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id as any)}
                  className={`px-3 py-1 text-[11px] font-mono rounded-lg transition-all ${
                    selectedStatus === st.id
                      ? 'bg-neutral-200 text-neutral-950 font-bold shadow-sm'
                      : 'bg-neutral-900/50 text-neutral-400 hover:text-white border border-neutral-800/60'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-12 border-b border-neutral-900 bg-neutral-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">
                01. Concurrency Seat Locking
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                ล็อกที่นั่งที่คุณเลือกไว้ 15 นาทีทันทีขณะทำรายการ ป้องกันการจองซ้ำซ้อน 100%
                และคืนสิทธิ์อัตโนมัติหากไม่ชำระเงินตามเวลา (BR-02)
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">
                02. Automated Thai QR Payment
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                ระบบชำระเงินผ่าน PromptPay ยืนยันยอดอัตโนมัติภายใน 5 วินาที
                ไม่ต้องแคปสลิปส่งแชต ไม่ต้องรอแอดมินตรวจสอบข้ามคืน (F-03)
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">
                03. Secure Paperless E-Ticket
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                บัตรอิเล็กทรอนิกส์พร้อมคิวอาร์โค้ดเข้ารหัสเฉพาะบุคคล สแกนเช็คอินหน้างานได้ภายใน 0.3 วินาที
                ป้องกันการส่งภาพเวียนซ้ำและปราบตั๋วผี (BR-04)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Concerts Grid */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
              LIVE SCHEDULE · 2026
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
              รอบการแสดงที่เปิดให้จอง
            </h2>
          </div>
          <div className="text-xs font-mono text-neutral-500">
            พบ {filteredConcerts.length} รายการที่พร้อมจำหน่าย
          </div>
        </div>

        {filteredConcerts.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 font-mono text-sm border border-neutral-800 rounded-3xl">
            ไม่พบคอนเสิร์ตที่ตรงกับคำค้นหาของคุณ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredConcerts.map((concert) => (
              <ConcertCard
                key={concert.id}
                concert={concert}
                onSelectConcert={onSelectConcert}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
