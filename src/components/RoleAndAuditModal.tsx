import React from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { UserRole } from '../types/concert';
import { User, QrCode, LayoutDashboard, History } from 'lucide-react';

interface RoleAndAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoleTab?: (tab: 'discovery' | 'seat_map' | 'my_tickets' | 'scanner' | 'organizer') => void;
}

export const RoleAndAuditModal: React.FC<RoleAndAuditModalProps> = ({
  isOpen,
  onClose,
  onSelectRoleTab,
}) => {
  const { userRole, quickLoginDemo, auditLogs } = useConcertPass();

  if (!isOpen) return null;

  const roles: { id: UserRole; name: string; person: string; desc: string; icon: any; targetTab: 'discovery' | 'scanner' | 'organizer' }[] = [
    {
      id: 'customer',
      name: 'Customer (ผู้ซื้อบัตร)',
      person: 'แพรว รักษ์ดนตรี',
      desc: 'ค้นหาคอนเสิร์ต, ดูผังที่นั่ง, ล็อกที่นั่ง 15 นาที, สแกน PromptPay, รับ E-Ticket',
      icon: User,
      targetTab: 'discovery',
    },
    {
      id: 'organizer',
      name: 'Organizer (ผู้จัดงาน)',
      person: 'สมชาย ผู้จัดการค่าย',
      desc: 'สร้างรอบการแสดง, กำหนดราคา VIP/STD, ตั้งค่าลิมิตการซื้อ, ดูยอดขายเรียลไทม์',
      icon: LayoutDashboard,
      targetTab: 'organizer',
    },
    {
      id: 'gate_staff',
      name: 'Gate Staff (เจ้าหน้าที่หน้าประตู)',
      person: 'กานต์ เจ้าหน้าที่ประจำ Gate A',
      desc: 'สแกน QR Code หน้างาน ตรวจสอบความถูกต้องและตัดสถานะเป็นเข้างานแล้ว (< 3 วินาที)',
      icon: QrCode,
      targetTab: 'scanner',
    },
  ];

  const handleSwitchRole = (role: UserRole, targetTab: 'discovery' | 'scanner' | 'organizer') => {
    quickLoginDemo(role);
    if (onSelectRoleTab) {
      onSelectRoleTab(targetTab);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
              <span>PROJECT DATABASE: ขวาน · CONCERTPASS</span>
            </div>
            <h2 className="text-xl font-bold text-white font-display">
              สลับบทบาทผู้ใช้งาน & บันทึกการทำงานระบบ (Audit Logs)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg font-mono"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Role Switcher Cards */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-3">
              เลือกบทบาทเพื่อทดสอบฟังก์ชัน (Target User Roles)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roles.map((r) => {
                const isCurrent = userRole === r.id;
                const IconComponent = r.icon;

                return (
                  <button
                    key={r.id}
                    onClick={() => handleSwitchRole(r.id, r.targetTab)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isCurrent
                        ? 'bg-neutral-800/90 border-white/40 ring-1 ring-white/20'
                        : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-white text-neutral-950' : 'bg-neutral-800 text-neutral-300'}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-white font-display">{r.name}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          กำลังใช้งาน
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-neutral-300 mb-1">{r.person}</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{r.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Logs Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-neutral-400" />
                <span>บันทึกการทำงานของระบบ (Audit & Concurrency Logs)</span>
              </label>
              <span className="text-[11px] font-mono text-neutral-500">
                {auditLogs.length} รายการ
              </span>
            </div>

            <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 max-h-56 overflow-y-auto space-y-2.5 font-mono text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-200">{log.action}</span>
                      <span className="text-[10px] text-neutral-500 font-sans">({log.actor})</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{log.details}</div>
                  </div>
                  <span className="text-[10px] text-neutral-500 whitespace-nowrap self-end sm:self-auto">
                    {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Academic Attribution */}
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/60 text-xs font-mono text-neutral-400">
            <div className="text-white font-semibold mb-1">ข้อมูลโครงการ (Project Specification):</div>
            <div>ชื่อกลุ่ม: ขวาน · โครงการ: ระบบจองคิวคอนเสิร์ต (ConcertPass)</div>
            <div className="text-neutral-500 text-[11px] mt-1">
              ผู้พัฒนา: 67030286 นาย จิรภัทร กองฟู · 68023627 นาย อัครวายุ ฉิมคง
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
