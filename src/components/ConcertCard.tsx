import React from 'react';
import { Concert } from '../types/concert';
import { ConcertArtFallback } from './ConcertArtFallback';
import { useConcertPass } from '../context/ConcertPassContext';
import { getConcertSaleStatus } from '../utils/concertSale';
import { Calendar, MapPin, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

interface ConcertCardProps {
  concert: Concert;
  onSelectConcert: (concertId: string) => void;
}

export const ConcertCard: React.FC<ConcertCardProps> = ({ concert, onSelectConcert }) => {
  const { currentTime } = useConcertPass();
  const minPrice = Math.min(...concert.zones.map((z) => z.price));
  const availableSeatsCount = concert.seats.filter((s) => s.status === 'available').length;
  const isSoldOut = availableSeatsCount === 0;

  const saleStatus = getConcertSaleStatus(concert, currentTime);
  const isClosed = saleStatus.isClosed;
  const isUpcoming = saleStatus.isUpcoming;

  return (
    <div className={`group rounded-3xl bg-neutral-950 border transition-all overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl ${
      isClosed
        ? 'border-neutral-800/60 opacity-95'
        : isUpcoming
        ? 'border-blue-900/40 hover:border-blue-700/60'
        : 'border-neutral-800/80 hover:border-neutral-700'
    }`}>
      {/* Visual Artwork Frame */}
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
        {concert.posterUrl ? (
          <img
            src={concert.posterUrl}
            alt={concert.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isClosed ? 'grayscale-[35%]' : isUpcoming ? 'brightness-90' : 'group-hover:scale-105'
            }`}
          />
        ) : (
          <ConcertArtFallback
            title={concert.title}
            artist={concert.artist}
            category={concert.category}
            accentColor={concert.accentColor}
            aspectRatio="4:3"
          />
        )}

        {/* Quiet status tag in top right */}
        <div className="absolute top-4 right-4 z-20">
          {isClosed ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-red-950/90 text-red-200 border border-red-800/80 font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg shadow-red-950/40">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              ปิดจำหน่ายแล้ว
            </span>
          ) : isSoldOut ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-neutral-950/90 text-neutral-400 border border-neutral-700/60 font-medium backdrop-blur-md">
              บัตรหมดแล้ว
            </span>
          ) : isUpcoming ? (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-950/90 text-blue-300 border border-blue-700/60 font-medium backdrop-blur-md flex items-center gap-1.5 shadow-lg shadow-blue-950/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              เร็วๆ นี้
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-neutral-950/90 text-emerald-400 border border-emerald-800/70 font-medium backdrop-blur-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              เปิดจำหน่าย
            </span>
          )}
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed Metadata with · separator */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mb-2">
            <span>{concert.category}</span>
            <span aria-hidden="true">·</span>
            <span>{concert.date}</span>
            <span aria-hidden="true">·</span>
            <span>{concert.time}</span>
          </div>

          <h3 className="text-xl font-bold text-white font-display tracking-tight group-hover:text-neutral-200 transition-colors line-clamp-1">
            {concert.title}
          </h3>

          <p className="text-sm text-neutral-400 mt-1 font-medium line-clamp-1">
            {concert.artist}
          </p>

          {/* Organizer Attribution */}
          <div className="mt-2 text-xs flex items-center gap-1.5">
            <span className="text-neutral-500 font-mono text-[11px]">ผู้จัดงาน by</span>
            <span className="text-neutral-200 font-medium truncate">
              {concert.organizerName || 'สมชาย ผู้จัดการค่าย'}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
            <span className="truncate">{concert.venue}</span>
          </div>

          {/* Ticket Sale Schedule info */}
          <div className={`mt-3 py-1.5 px-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono ${
            isClosed
              ? 'bg-red-950/20 border-red-900/40 text-red-300'
              : isUpcoming
              ? 'bg-blue-950/20 border-blue-900/40 text-blue-300'
              : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
          }`}>
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3 h-3 shrink-0 ${
                isClosed ? 'text-red-400' : isUpcoming ? 'text-blue-400' : 'text-neutral-400'
              }`} />
              <span className="text-neutral-400">
                {isClosed ? 'ปิดขายเมื่อ:' : isUpcoming ? 'เปิดจำหน่ายตั๋ว:' : 'ปิดจำหน่ายตั๋ว:'}
              </span>
              <span className="font-semibold text-neutral-200 truncate">
                {isUpcoming ? saleStatus.openDateFormatted : saleStatus.closeDateFormatted}
              </span>
            </div>
            {saleStatus.countdownText && (
              <span className={`text-[10px] font-medium shrink-0 ${
                isClosed ? 'text-red-400' : isUpcoming ? 'text-cyan-400' : 'text-amber-400'
              }`}>
                {saleStatus.countdownText}
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-500 font-mono block">เริ่มต้นที่</span>
            <span className="text-base font-bold text-white font-mono tabular-nums">
              ฿{minPrice.toLocaleString()}{' '}
              <span className="text-xs font-normal text-neutral-400">THB</span>
            </span>
          </div>

          <button
            onClick={() => onSelectConcert(concert.id)}
            disabled={isSoldOut || isClosed || isUpcoming}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isClosed
                ? 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-not-allowed'
                : isUpcoming
                ? 'bg-neutral-900 text-neutral-400 border border-neutral-800 cursor-not-allowed'
                : isSoldOut
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-white text-neutral-950 hover:bg-neutral-200 shadow-md shadow-white/5 cursor-pointer'
            }`}
          >
            {isUpcoming && <Clock className="w-3.5 h-3.5 text-neutral-500" />}
            <span>
              {isClosed
                ? 'ปิดจำหน่ายแล้ว'
                : isUpcoming
                ? 'ยังไม่เปิดให้จอง'
                : isSoldOut
                ? 'บัตรหมดแล้ว'
                : 'เลือกที่นั่ง'}
            </span>
            {!isClosed && !isSoldOut && !isUpcoming && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
