import React, { useState } from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { Clock, CheckCircle2, ShieldCheck, QrCode, AlertTriangle, ArrowLeft } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    activeOrder,
    holdTimeRemaining,
    processPayment,
    cancelCurrentOrder,
    currentUser,
  } = useConcertPass();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen || !activeOrder) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    const success = await processPayment(activeOrder.id);
    setIsProcessing(false);
    if (success) {
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        onSuccess();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Top Header with Timer */}
        <div className="p-6 border-b border-neutral-800/80 bg-neutral-950 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
              AUTOMATED PAYMENT (F-03)
            </span>
            <h2 className="text-xl font-bold text-white font-display">
              ชำระเงินผ่าน Thai QR PromptPay
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400">เหลือเวลา</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {formatTimer(holdTimeRemaining)}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {paymentSuccess ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-xl font-bold text-white font-display">ชำระเงินเรียบร้อยแล้ว!</h3>
              <p className="text-sm text-neutral-400">
                ระบบออกบัตรอิเล็กทรอนิกส์ (E-Ticket) พร้อม QR Code ให้คุณทันที
              </p>
              <div className="text-xs font-mono text-emerald-400">กำลังนำคุณไปยังหน้าบัตรของฉัน...</div>
            </div>
          ) : (
            <>
              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/70 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>งานคอนเสิร์ต</span>
                  <span className="text-neutral-200 font-medium text-right">{activeOrder.concertTitle}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>ผู้สั่งซื้อ</span>
                  <span className="text-neutral-200">{currentUser?.name || activeOrder.userName}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>ที่นั่งที่จอง</span>
                  <span className="text-emerald-400 font-mono font-medium">
                    {activeOrder.seatLabels.join(', ')} ({activeOrder.seatLabels.length} ใบ)
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
                  <span className="font-medium text-neutral-300">ยอดชำระสุทธิ</span>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums">
                    ฿{activeOrder.totalAmount.toLocaleString()} <span className="text-xs font-normal text-neutral-400">THB</span>
                  </span>
                </div>
              </div>

              {/* Minimalist PromptPay QR Code Display */}
              <div className="bg-white rounded-2xl p-6 text-neutral-900 text-center flex flex-col items-center shadow-lg">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-[#003d6d] uppercase mb-3">
                  <span className="px-2 py-0.5 bg-[#003d6d] text-white rounded text-[10px]">THAI QR</span>
                  <span>PROMPTPAY / พร้อมเพย์</span>
                </div>

                {/* Vector QR Code SVG */}
                <div className="w-48 h-48 bg-white p-2 border border-neutral-200 rounded-xl relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    {/* Corner Position Detection Patterns */}
                    <rect x="10" y="10" width="30" height="30" rx="3" fill="#000" />
                    <rect x="15" y="15" width="20" height="20" rx="2" fill="#fff" />
                    <rect x="20" y="20" width="10" height="10" rx="1" fill="#000" />

                    <rect x="80" y="10" width="30" height="30" rx="3" fill="#000" />
                    <rect x="85" y="15" width="20" height="20" rx="2" fill="#fff" />
                    <rect x="90" y="20" width="10" height="10" rx="1" fill="#000" />

                    <rect x="10" y="80" width="30" height="30" rx="3" fill="#000" />
                    <rect x="15" y="85" width="20" height="20" rx="2" fill="#fff" />
                    <rect x="20" y="90" width="10" height="10" rx="1" fill="#000" />

                    {/* QR Code Matrix Cells */}
                    <rect x="46" y="12" width="6" height="6" fill="#000" />
                    <rect x="58" y="12" width="6" height="6" fill="#000" />
                    <rect x="68" y="16" width="6" height="6" fill="#000" />
                    <rect x="46" y="24" width="6" height="6" fill="#000" />
                    <rect x="60" y="28" width="6" height="6" fill="#000" />

                    <rect x="14" y="48" width="6" height="6" fill="#000" />
                    <rect x="26" y="52" width="6" height="6" fill="#000" />
                    <rect x="44" y="44" width="6" height="6" fill="#000" />
                    <rect x="54" y="50" width="12" height="12" rx="2" fill="#003d6d" />
                    <rect x="72" y="44" width="6" height="6" fill="#000" />
                    <rect x="88" y="52" width="6" height="6" fill="#000" />
                    <rect x="100" y="48" width="6" height="6" fill="#000" />

                    <rect x="48" y="70" width="6" height="6" fill="#000" />
                    <rect x="62" y="72" width="6" height="6" fill="#000" />
                    <rect x="74" y="66" width="6" height="6" fill="#000" />
                    <rect x="46" y="86" width="6" height="6" fill="#000" />
                    <rect x="58" y="94" width="6" height="6" fill="#000" />
                    <rect x="70" y="86" width="6" height="6" fill="#000" />
                    <rect x="86" y="80" width="6" height="6" fill="#000" />
                    <rect x="98" y="92" width="6" height="6" fill="#000" />
                    <rect x="88" y="102" width="6" height="6" fill="#000" />
                  </svg>
                </div>

                <div className="mt-3 text-[11px] font-mono text-neutral-500">
                  สแกนผ่านแอปธนาคารทุกแห่ง · ตรวจสอบยอดเงินอัตโนมัติ
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  disabled={isProcessing}
                  onClick={handleSimulatePayment}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังยืนยันยอดเงินผ่านระบบ Payment Gateway...</span>
                    </div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>จำลองการสแกนจ่ายเงิน (Simulate Instant Payment)</span>
                    </>
                  )}
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    cancelCurrentOrder();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 text-xs text-neutral-400 hover:text-neutral-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ยกเลิกรายการและคืนสิทธิ์ที่นั่ง</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
