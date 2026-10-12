import React, { useState } from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { CheckInResult } from '../types/concert';
import { QrCode, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Camera, Clock, Shield } from 'lucide-react';

export const GateScannerView: React.FC = () => {
  const { validateAndCheckInTicket, tickets } = useConcertPass();

  const [inputCode, setInputCode] = useState('');
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [history, setHistory] = useState<{ id: string; time: string; result: CheckInResult }[]>([]);

  const handleScan = (codeToTest?: string) => {
    const code = (codeToTest || inputCode).trim();
    if (!code) return;

    setIsScanning(true);
    // Simulate instantaneous hardware camera / barcode scan validation (< 300ms)
    setTimeout(() => {
      const result = validateAndCheckInTicket(code, 'กานต์ (Gate Staff A-01)');
      setScanResult(result);
      setIsScanning(false);
      setInputCode('');

      setHistory((prev) => [
        {
          id: `scan-${Date.now()}`,
          time: new Date().toLocaleTimeString('th-TH'),
          result,
        },
        ...prev.slice(0, 9),
      ]);
    }, 280);
  };

  // Find demo tickets for convenient testing buttons
  const validTicket = tickets.find((t) => t.status === 'valid');
  const usedTicket = tickets.find((t) => t.status === 'used');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>GATE STAFF SYSTEM (FEATURE F-07)</span>
            <span aria-hidden="true">·</span>
            <span>ตรวจสอบสิทธิ์ & ป้องกันบัตรเวียนซ้ำ (BR-04)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            ระบบสแกนตรวจบัตรหน้าประตู
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            เจ้าหน้าที่: <span className="text-neutral-200 font-medium">กานต์ (Gate Staff)</span> · ประตู Main Gate A
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>เวลาประมวลผล: &lt; 0.3 วินาที/คน</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Camera Viewport & Result Display */}
        <div className="md:col-span-7 space-y-6">
          {/* Camera Frame Mock */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden text-center shadow-xl">
            {/* Viewport Frame with Scanner Overlay */}
            <div className="w-full aspect-square max-w-[320px] mx-auto rounded-2xl bg-neutral-900 border-2 border-dashed border-neutral-700 relative overflow-hidden flex flex-col items-center justify-center p-4">
              {/* Corner targeting brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

              {/* Scanning Laser Beam Line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />

              <Camera className="w-10 h-10 text-neutral-600 mb-2" />
              <span className="text-xs text-neutral-400 font-mono">
                จัดตำแหน่ง QR Code ให้อยู่ในกรอบ
              </span>
              <span className="text-[10px] text-neutral-600 font-mono mt-1">
                กล้องความเร็วสูง 60fps พร้อมระบบถอดรหัส
              </span>
            </div>

            {/* Quick Testing Triggers */}
            <div className="mt-6 pt-4 border-t border-neutral-800/80">
              <span className="text-[11px] font-mono text-neutral-500 uppercase block mb-2.5">
                คลิกทดสอบสถานการณ์ตามเอกสาร (Scenario 3 & BR-04)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {validTicket && (
                  <button
                    onClick={() => handleScan(validTicket.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-mono hover:bg-emerald-900/60 transition-colors"
                  >
                    1. บัตรถูกต้อง ({validTicket.seatLabel})
                  </button>
                )}

                {usedTicket && (
                  <button
                    onClick={() => handleScan(usedTicket.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-700/60 text-red-300 text-xs font-mono hover:bg-red-900/60 transition-colors"
                  >
                    2. บัตรถูกใช้แล้ว ({usedTicket.seatLabel})
                  </button>
                )}

                <button
                  onClick={() => handleScan('FAKE-QR-INV-999')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-mono hover:bg-neutral-800 transition-colors"
                >
                  3. บัตรปลอม / ไม่ถูกต้อง
                </button>
              </div>
            </div>

            {/* Manual QR / Ticket ID Input */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="พิมพ์รหัสตั๋ว เช่น TCK-DEMO-8821"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-neutral-600 font-mono"
              />
              <button
                disabled={isScanning || !inputCode.trim()}
                onClick={() => handleScan()}
                className="px-4 py-2 bg-white text-neutral-950 rounded-xl text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-40"
              >
                ตรวจบัตร
              </button>
            </div>
          </div>

          {/* Validation Status Result Card (Acceptance Criteria 1, 2, 3) */}
          {scanResult && (
            <div
              className={`p-6 rounded-3xl border transition-all ${
                scanResult.status === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                  : scanResult.status === 'already_used'
                  ? 'bg-red-950/70 border-red-500/80 text-red-200'
                  : 'bg-amber-950/60 border-amber-500/80 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {scanResult.status === 'success' ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                ) : scanResult.status === 'already_used' ? (
                  <XCircle className="w-10 h-10 text-red-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-amber-400 shrink-0" />
                )}

                <div className="space-y-1">
                  <div className="text-xs font-mono uppercase tracking-wider font-bold">
                    {scanResult.status === 'success'
                      ? '✓ ผ่าน (VERIFIED & ADMITTED)'
                      : scanResult.status === 'already_used'
                      ? '✕ ปฏิเสธ: บัตรถูกใช้งานแล้ว (ALREADY USED)'
                      : '✕ ปฏิเสธ: บัตรไม่ถูกต้อง (INVALID TICKET)'}
                  </div>

                  <h3 className="text-lg font-bold text-white font-display">
                    {scanResult.message}
                  </h3>

                  {scanResult.ticket && (
                    <div className="text-xs space-y-0.5 pt-2 text-neutral-300 font-mono">
                      <div>ผู้ถือบัตร: <span className="text-white font-semibold">{scanResult.ticket.attendeeName}</span></div>
                      <div>คอนเสิร์ต: {scanResult.ticket.concertTitle}</div>
                      <div>รหัสบัตร: {scanResult.ticket.id}</div>
                    </div>
                  )}

                  {scanResult.status === 'already_used' && scanResult.previousCheckInTime && (
                    <div className="mt-2 p-2 rounded-lg bg-red-900/40 text-red-300 text-xs font-mono">
                      ถูกสแกนเข้างานครั้งแรกเมื่อ:{' '}
                      <span className="font-bold text-white">
                        {new Date(scanResult.previousCheckInTime).toLocaleTimeString('th-TH')}
                      </span>{' '}
                      (สแกนซ้ำไม่ได้ตามกฎ BR-04)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Check-in Audit Feed */}
        <div className="md:col-span-5 bg-neutral-950 border border-neutral-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>ประวัติการสแกนล่าสุด (Scan Log)</span>
            </h3>
            <span className="text-xs text-neutral-500 font-mono">{history.length} รายการ</span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500 font-mono">
              ยังไม่มีประวัติการสแกนในรอบนี้<br />
              ทดสอบกดปุ่มสแกนด้านซ้ายเพื่อดูผลลัพธ์
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    {item.result.status === 'success' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                    )}
                    <div>
                      <div className="font-medium text-neutral-200 line-clamp-1">
                        {item.result.ticket ? `${item.result.ticket.seatLabel} (${item.result.ticket.zoneName})` : 'บัตรไม่ถูกต้อง'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {item.result.ticket?.attendeeName || item.result.message}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
