import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-neutral-950 border-t border-neutral-800/80 mt-20 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Project Brand & Overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-white text-neutral-950 flex items-center justify-center font-bold text-xs">
                CP
              </span>
              <span className="text-base font-bold text-white font-display">ConcertPass 2026</span>
            </div>
            <p className="text-neutral-400 max-w-md leading-relaxed text-xs">
              เว็บแอปพลิเคชันสำหรับการบริหารจัดการและจองบัตรคอนเสิร์ตแบบรวมศูนย์ ลดขั้นตอนงานซ้ำซ้อน
              ขจัดปัญหาการแย่งซื้อด้วยกลไก Concurrency Seat Locking และระบบ E-Ticket เข้ารหัสป้องกันบัตรผี
            </p>
            <div className="text-[11px] font-mono text-neutral-500 pt-1">
              ระบบฐานข้อมูล (Project Database) · กลุ่ม ขวาน
            </div>
          </div>

          {/* Col 2: Core Architecture Features */}
          <div className="space-y-2 font-mono text-xs">
            <span className="text-white font-semibold uppercase tracking-wider block mb-1">
              ฟีเจอร์หลัก (Core Systems)
            </span>
            <div className="text-neutral-400 space-y-1">
              <div>· Interactive Seat Map & Real-time Hold</div>
              <div>· Concurrency Lock 15 Minutes (BR-02)</div>
              <div>· PromptPay QR Automated Webhook</div>
              <div>· Gate Staff QR Verification &lt; 3s (BR-04)</div>
            </div>
          </div>

          {/* Col 3: Project Credits */}
          <div className="space-y-2 font-mono text-xs">
            <span className="text-white font-semibold uppercase tracking-wider block mb-1">
              สมาชิกโครงการ (Project Team)
            </span>
            <div className="text-neutral-300 space-y-1">
              <div>67030286 นาย จิรภัทร กองฟู</div>
              <div>68023627 นาย อัครวายุ ฉิมคง</div>
              <div className="text-neutral-500 text-[11px] pt-1">ภาควิชาวิทยาการคอมพิวเตอร์ / เทคโนโลยีสารสนเทศ</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-neutral-500">
          <div>
            © 2026 ConcertPass. Designed with Minimalist UI & Responsive Architecture.
          </div>
          <div className="flex items-center gap-4">
            <span>Thai QR PromptPay Enabled</span>
            <span>·</span>
            <span>Paperless E-Ticket Standard</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
