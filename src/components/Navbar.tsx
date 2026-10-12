import React from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { Ticket as TicketIcon, QrCode, Shield, Layers, LayoutDashboard, LogIn, UserPlus, LogOut, Database } from 'lucide-react';

interface NavbarProps {
  currentTab: 'discovery' | 'seat_map' | 'my_tickets' | 'scanner' | 'organizer';
  setCurrentTab: (tab: 'discovery' | 'seat_map' | 'my_tickets' | 'scanner' | 'organizer') => void;
  onOpenRoleModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenSupabaseModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenRoleModal,
  onOpenAuthModal,
  onOpenSupabaseModal,
}) => {
  const { isLoggedIn, currentUser, userRole, tickets, selectedSeatIds, logout, isSupabaseActive } = useConcertPass();

  const roleLabels: Record<string, string> = {
    customer: 'ผู้ซื้อบัตร',
    organizer: 'ผู้จัดงาน',
    gate_staff: 'ตรวจบัตร',
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => {
            if (isLoggedIn) {
              if (userRole === 'gate_staff') setCurrentTab('scanner');
              else if (userRole === 'organizer') setCurrentTab('organizer');
              else setCurrentTab('discovery');
            } else {
              setCurrentTab('discovery');
            }
          }}
          className="text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-950 flex items-center justify-center font-black text-sm tracking-tighter">
            CP
          </span>
          <span className="font-display">ConcertPass</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-normal">
            2026
          </span>
        </button>

        {/* Zone 2: Concise Single-Line Navigation Links based on User Role */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          {(!isLoggedIn || (userRole !== 'gate_staff' && userRole !== 'organizer')) && (
            <button
              onClick={() => setCurrentTab('discovery')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 ${
                currentTab === 'discovery'
                  ? 'text-white border-b-2 border-white font-semibold'
                  : 'hover:text-neutral-200'
              }`}
            >
              คอนเสิร์ตทั้งหมด
            </button>
          )}

          {(!isLoggedIn || (userRole !== 'gate_staff' && userRole !== 'organizer')) && (
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  onOpenAuthModal('login');
                } else {
                  setCurrentTab('seat_map');
                }
              }}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 flex items-center gap-1.5 ${
                currentTab === 'seat_map'
                  ? 'text-white border-b-2 border-white font-semibold'
                  : 'hover:text-neutral-200'
              }`}
            >
              <span>ผังที่นั่ง & จองคิว</span>
              {selectedSeatIds.length > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded">
                  {selectedSeatIds.length}
                </span>
              )}
            </button>
          )}

          {isLoggedIn && userRole === 'customer' && (
            <button
              onClick={() => setCurrentTab('my_tickets')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 flex items-center gap-1.5 ${
                currentTab === 'my_tickets'
                  ? 'text-white border-b-2 border-white font-semibold'
                  : 'hover:text-neutral-200'
              }`}
            >
              <span>บัตรของฉัน</span>
              {tickets.length > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded">
                  {tickets.length}
                </span>
              )}
            </button>
          )}

          {isLoggedIn && userRole === 'gate_staff' && (
            <button
              onClick={() => setCurrentTab('scanner')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 flex items-center gap-1.5 ${
                currentTab === 'scanner'
                  ? 'text-white border-b-2 border-white font-semibold'
                  : 'hover:text-neutral-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>สแกนหน้างาน</span>
            </button>
          )}

          {isLoggedIn && userRole === 'organizer' && (
            <button
              onClick={() => setCurrentTab('organizer')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-1 flex items-center gap-1.5 ${
                currentTab === 'organizer'
                  ? 'text-white border-b-2 border-white font-semibold'
                  : 'hover:text-neutral-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>จัดการงาน</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action (Authentication or User Profile Control) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Supabase & SQL Schema trigger button */}
          <button
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-700/80 rounded-lg hover:border-emerald-500 hover:text-white transition-all whitespace-nowrap shrink-0 shadow-sm"
            title="ดูคำสั่ง SQL Database Schema และตั้งค่าเชื่อมต่อ Supabase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-mono">SQL / Supabase</span>
            {isSupabaseActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-white hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-white/10"
              >
                สมัครสมาชิก
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenRoleModal}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 border border-neutral-700/80 rounded-lg hover:border-neutral-500 hover:text-white transition-all whitespace-nowrap shrink-0 flex items-center gap-2"
                title="คลิกเพื่อจัดการบทบาทหรือดูบันทึกระบบ"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline text-neutral-400 font-sans">
                  {currentUser?.name || 'ผู้ใช้'}:
                </span>
                <span className="font-semibold text-white">
                  {roleLabels[userRole] || userRole}
                </span>
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors rounded-lg hover:bg-neutral-900"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-neutral-800/60 bg-neutral-950/90 text-xs overflow-x-auto">
        {(!isLoggedIn || (userRole !== 'gate_staff' && userRole !== 'organizer')) && (
          <button
            onClick={() => setCurrentTab('discovery')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'discovery' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
            }`}
          >
            คอนเสิร์ต
          </button>
        )}
        {(!isLoggedIn || (userRole !== 'gate_staff' && userRole !== 'organizer')) && (
          <button
            onClick={() => {
              if (!isLoggedIn) onOpenAuthModal('login');
              else setCurrentTab('seat_map');
            }}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'seat_map' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
            }`}
          >
            เลือกที่นั่ง {selectedSeatIds.length > 0 && `(${selectedSeatIds.length})`}
          </button>
        )}
        {isLoggedIn && userRole === 'customer' && (
          <button
            onClick={() => setCurrentTab('my_tickets')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'my_tickets' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
            }`}
          >
            บัตร ({tickets.length})
          </button>
        )}
        {isLoggedIn && userRole === 'gate_staff' && (
          <button
            onClick={() => setCurrentTab('scanner')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'scanner' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
            }`}
          >
            สแกนประตู
          </button>
        )}
        {isLoggedIn && userRole === 'organizer' && (
          <button
            onClick={() => setCurrentTab('organizer')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'organizer' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400'
            }`}
          >
            ผู้จัด
          </button>
        )}
        {!isLoggedIn && (
          <button
            onClick={() => onOpenAuthModal('login')}
            className="px-2.5 py-1 rounded whitespace-nowrap text-emerald-400 font-medium"
          >
            เข้าสู่ระบบ
          </button>
        )}
      </div>
    </header>
  );
};

