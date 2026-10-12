import React, { useState } from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { getConcertSaleStatus, isConcertSaleClosed, isConcertSaleUpcoming } from '../utils/concertSale';
import { Clock, ShieldAlert, Check, AlertCircle, ShoppingBag, ArrowRight, Lock } from 'lucide-react';

interface SeatMapProps {
  onProceedToCheckout: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ onProceedToCheckout }) => {
  const {
    concerts,
    activeConcertId,
    setActiveConcertId,
    selectedSeatIds,
    holdTimeRemaining,
    toggleSeatSelection,
    clearSelectedSeats,
    currentTime,
  } = useConcertPass();

  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const currentConcert = concerts.find((c) => c.id === activeConcertId) || concerts[0];
  const saleStatus = getConcertSaleStatus(currentConcert, currentTime);
  const isClosed = saleStatus.isClosed;
  const isUpcoming = saleStatus.isUpcoming;

  // Helper format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeatClick = (seatId: string) => {
    setFeedbackError(null);
    if (isClosed) {
      setFeedbackError('คอนเสิร์ตนี้ปิดการจำหน่ายตั๋วแล้วตามกำหนดเวลา ไม่สามารถเลือกที่นั่งได้');
      setTimeout(() => setFeedbackError(null), 4000);
      return;
    }
    if (isUpcoming) {
      setFeedbackError(`คอนเสิร์ตนี้ยังไม่เปิดให้จองตั๋ว (กำหนดเปิดจอง: ${saleStatus.openDateFormatted})`);
      setTimeout(() => setFeedbackError(null), 4000);
      return;
    }
    const result = toggleSeatSelection(currentConcert.id, seatId);
    if (!result.success && result.reason) {
      setFeedbackError(result.reason);
      // Auto dismiss error
      setTimeout(() => setFeedbackError(null), 4000);
    }
  };

  // Group seats by row
  const rows = Array.from(new Set(currentConcert.seats.map((s) => s.row))).sort();

  const selectedSeats = currentConcert.seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Concert Selector & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mb-1">
            <span>ผังที่นั่งแบบโต้ตอบ (INTERACTIVE SEAT MAP)</span>
            <span aria-hidden="true">·</span>
            <span>กฎ BR-01: สูงสุด {currentConcert.purchaseLimit} ที่นั่ง/บัญชี</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            {currentConcert.title}
          </h1>
          <p className="text-sm text-neutral-400 mt-1 flex flex-wrap items-center gap-x-2">
            <span>{currentConcert.venue} · {currentConcert.date} ({currentConcert.time})</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-neutral-300 font-mono text-xs">ผู้จัดงาน by {currentConcert.organizerName || 'สมชาย ผู้จัดการค่าย'}</span>
          </p>
        </div>

        {/* Concert switcher if multiple */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-400 whitespace-nowrap">เลือกรอบแสดง:</label>
          <select
            value={currentConcert.id}
            onChange={(e) => {
              clearSelectedSeats();
              setActiveConcertId(e.target.value);
            }}
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-neutral-600"
          >
            {concerts.map((c) => {
              const closed = isConcertSaleClosed(c, currentTime);
              const upcoming = !closed && isConcertSaleUpcoming(c, currentTime);
              return (
                <option key={c.id} value={c.id}>
                  {c.title} {closed ? ' (ปิดจำหน่ายแล้ว)' : upcoming ? ' (เร็วๆ นี้)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Sale Closed Banner */}
      {isClosed && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-700/80 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-900/60 text-red-300 shrink-0 border border-red-700/60">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-display">
                  รอบการแสดงนี้ปิดการจำหน่ายตั๋วแล้ว (TICKET SALES CLOSED)
                </span>
              </div>
              <p className="text-xs text-red-300/90 mt-0.5">
                เวลาปิดจำหน่ายที่กำหนด: <strong className="text-white">{saleStatus.closeDateFormatted}</strong> ({saleStatus.reason}) — ไม่สามารถคลิกเลือกที่นั่งหรือชำระเงินได้
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-900/80 text-red-200 text-xs font-mono font-bold shrink-0 self-start sm:self-auto border border-red-600/70 flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            ปิดจำหน่าย
          </span>
        </div>
      )}

      {/* Upcoming (Not Yet Open) Banner */}
      {isUpcoming && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-950/60 border border-blue-700/80 text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-900/60 text-blue-300 shrink-0 border border-blue-700/60">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-display">
                  รอบการแสดงนี้ยังไม่เปิดให้จองตั๋ว (UPCOMING · COMING SOON)
                </span>
              </div>
              <p className="text-xs text-blue-300/90 mt-0.5">
                กำหนดเปิดจอง: <strong className="text-white">{saleStatus.openDateFormatted}</strong> ({saleStatus.countdownText}) — สามารถดูราคาและผังที่นั่งล่วงหน้าได้ แต่ยังไม่สามารถเลือกหรือจองที่นั่งได้จนกว่าจะถึงเวลา
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-900/80 text-blue-200 text-xs font-mono font-bold shrink-0 self-start sm:self-auto border border-blue-600/70 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            เร็วๆ นี้
          </span>
        </div>
      )}

      {/* Warning Notice if constraint triggered */}
      {feedbackError && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-950/50 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{feedbackError}</span>
        </div>
      )}

      {/* 15-Minute Concurrency Seat Lock Banner (Feature F-02 & Rule BR-02) */}
      {selectedSeatIds.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-neutral-900/90 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/40">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  TEMPORARY SEAT LOCK ACTIVE
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  (ระบบล็อกที่นั่งป้องกันการแย่งซื้อ)
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                ที่นั่งของคุณถูกจองสิทธิ์ไว้ชั่วคราว หากไม่ชำระเงินในเวลา ระบบจะคืนสิทธิ์ให้ผู้อื่นอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block font-mono">เวลาที่เหลือ</span>
              <span className="text-xl font-bold font-mono tracking-wider text-emerald-400 tabular-nums">
                {formatTimer(holdTimeRemaining)}
              </span>
            </div>
            <button
              onClick={clearSelectedSeats}
              className="text-xs text-neutral-400 hover:text-neutral-200 underline whitespace-nowrap"
            >
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-3 px-4 mb-8 bg-neutral-900/60 rounded-xl border border-neutral-800 text-xs text-neutral-300">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-800 border border-neutral-700" />
          <span>ว่าง (Available)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-500 text-neutral-950 font-bold flex items-center justify-center text-[10px]">
            ✓
          </div>
          <span>กำลังเลือก / ล็อก 15 นาที</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-800 opacity-40 relative flex items-center justify-center">
            <span className="text-[10px] text-neutral-500 font-mono">✕</span>
          </div>
          <span className="text-neutral-500">ขายแล้ว (Sold)</span>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-neutral-800 text-neutral-400 font-mono">
          <span>โซน VIP: ฿{currentConcert.zones[0]?.price.toLocaleString()}</span>
          <span>·</span>
          <span>โซน Standard: ฿{currentConcert.zones[1]?.price.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Interactive Stage & Seating Arena */}
      <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6 sm:p-10 relative overflow-hidden">
        {/* Stage Graphic */}
        <div className="max-w-md mx-auto mb-12 text-center">
          <div className="h-10 sm:h-12 w-full rounded-t-xl border-t-2 border-x-2 border-neutral-600 bg-gradient-to-b from-neutral-800/80 via-neutral-900 to-neutral-950 flex items-center justify-center shadow-[0_-15px_30px_rgba(255,255,255,0.03)]">
            <span className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-neutral-300 font-mono">
              STAGE / เวทีการแสดง
            </span>
          </div>
          <div className="flex justify-between px-6 text-[10px] font-mono text-neutral-400 mt-1">
            <span>◀ ซ้าย (Left)</span>
            <span>กึ่งกลางเวที (Center)</span>
            <span>ขวา (Right) ▶</span>
          </div>
        </div>

        {/* Seating Grid with Horizontal Scroll on Small Screens */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[580px] flex flex-col items-center gap-4">
            {rows.map((rowName) => {
              const rowSeats = currentConcert.seats.filter((s) => s.row === rowName);
              const isVIP = rowName === 'A' || rowName === 'B';

              return (
                <div key={rowName} className="flex items-center gap-3 sm:gap-4 w-full justify-center">
                  {/* Row Indicator */}
                  <div
                    className={`w-6 text-center font-mono text-xs font-bold ${
                      isVIP ? 'text-amber-400' : 'text-neutral-400'
                    }`}
                  >
                    {rowName}
                  </div>

                  {/* Seat Buttons */}
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isSold = seat.status === 'sold';
                      const isHeldByOther =
                        seat.status === 'held' && Boolean(seat.heldBy) && seat.heldBy !== 'usr-praew-2026';

                      let btnStyle =
                        'bg-neutral-900/90 text-neutral-300 border border-neutral-700/80 hover:border-neutral-400 hover:text-white cursor-pointer';

                      if (isClosed || isUpcoming) {
                        btnStyle =
                          'bg-neutral-900/30 text-neutral-600 border border-neutral-800/40 cursor-not-allowed opacity-40';
                      } else if (isSelected) {
                        btnStyle =
                          'bg-emerald-400 text-neutral-950 font-bold border-emerald-300 ring-2 ring-emerald-400/40 cursor-pointer shadow-md shadow-emerald-950';
                      } else if (isSold) {
                        btnStyle =
                          'bg-neutral-900/40 text-neutral-600 border border-neutral-800/60 cursor-not-allowed opacity-40';
                      } else if (isHeldByOther) {
                        btnStyle =
                          'bg-amber-950/40 text-amber-500 border border-amber-800/60 cursor-not-allowed';
                      } else if (isVIP) {
                        btnStyle =
                          'bg-neutral-900/90 text-amber-200 border border-amber-700/40 hover:border-amber-400 cursor-pointer';
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isClosed || isUpcoming || isSold || isHeldByOther}
                          onClick={() => handleSeatClick(seat.id)}
                          title={
                            isClosed
                              ? 'ปิดการจำหน่ายตั๋วแล้ว'
                              : isUpcoming
                              ? `ยังไม่เปิดให้จองตั๋ว (กำหนดเปิด: ${saleStatus.openDateFormatted})`
                              : `ที่นั่ง ${seat.label} - ${seat.zoneName} (฿${seat.price.toLocaleString()})`
                          }
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all ${btnStyle}`}
                        >
                          {isSelected ? '✓' : seat.number}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Row Indicator */}
                  <div
                    className={`w-6 text-center font-mono text-xs font-bold ${
                      isVIP ? 'text-amber-400' : 'text-neutral-400'
                    }`}
                  >
                    {rowName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone Demarcation Note */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2 font-mono">
          <span>แถว A - B: VIP Zone (฿{currentConcert.zones[0]?.price.toLocaleString()})</span>
          <span>แถว C - E: Standard Zone (฿{currentConcert.zones[1]?.price.toLocaleString()})</span>
        </div>
      </div>

      {/* Floating Bottom Action Dock (Sticky purchase summary $\le 15\%$ height) */}
      <div className="sticky bottom-4 mt-8 z-30">
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">ที่นั่งที่เลือก:</span>
              {selectedSeats.length === 0 ? (
                <span className="text-xs text-neutral-400">ยังไม่ได้เลือกที่นั่ง (คลิกที่ผังด้านบน)</span>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/40"
                    >
                      {s.label} ({s.zoneName.includes('VIP') ? 'VIP' : 'STD'})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {selectedSeats.length > 0 && (
              <div className="text-xs text-neutral-400 mt-1 font-mono">
                ยอดรวม: <span className="text-base font-bold text-white tabular-nums">฿{totalPrice.toLocaleString()}</span> THB
                <span className="ml-2 text-neutral-400">({selectedSeats.length} ที่นั่ง)</span>
              </div>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              disabled={isClosed || isUpcoming || selectedSeats.length === 0}
              onClick={onProceedToCheckout}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                isClosed || isUpcoming
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : selectedSeats.length > 0
                  ? 'bg-white text-neutral-950 hover:bg-neutral-200 cursor-pointer shadow-lg shadow-white/10'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span>
                {isClosed
                  ? 'ปิดการจำหน่ายตั๋วแล้ว'
                  : isUpcoming
                  ? 'ยังไม่เปิดให้จองตั๋ว'
                  : 'ไปที่หน้าชำระเงิน'}
              </span>
              {!isClosed && !isUpcoming && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
