import React, { useState } from 'react';
import { useConcertPass } from '../context/ConcertPassContext';
import { UserRole } from '../types/concert';
import { User, Lock, Mail, Phone, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: (role?: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { login, register, quickLoginDemo, currentUser, userRole } = useConcertPass();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('customer');

  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setFeedback({ type: 'error', message: 'กรุณากรอกอีเมล' });
      return;
    }

    const success = login(loginEmail, loginPassword);
    if (success) {
      const lower = loginEmail.toLowerCase();
      const detectedRole: UserRole = lower.includes('org') || lower.includes('somchai')
        ? 'organizer'
        : lower.includes('gate') || lower.includes('karn')
        ? 'gate_staff'
        : 'customer';

      setFeedback({ type: 'success', message: 'เข้าสู่ระบบสำเร็จ' });
      setTimeout(() => {
        setFeedback(null);
        if (onSuccess) onSuccess(detectedRole);
        onClose();
      }, 700);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setFeedback({ type: 'error', message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
      return;
    }

    const success = register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: regRole,
    });

    if (success) {
      setFeedback({ type: 'success', message: 'สมัครสมาชิกและเข้าสู่ระบบสำเร็จ' });
      setTimeout(() => {
        setFeedback(null);
        if (onSuccess) onSuccess(regRole);
        onClose();
      }, 700);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    quickLoginDemo(role);
    setFeedback({ type: 'success', message: 'เข้าสู่ระบบด้วยบัญชีทดสอบสำเร็จ' });
    setTimeout(() => {
      setFeedback(null);
      if (onSuccess) onSuccess(role);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-6 pb-4 border-b border-neutral-800/80 bg-neutral-950 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
              CONCERTPASS ACCOUNT
            </div>
            <h2 className="text-xl font-bold text-white font-display">
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg font-mono p-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2 bg-neutral-950 border-b border-neutral-800/60 flex">
          <button
            onClick={() => {
              setMode('login');
              setFeedback(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            เข้าสู่ระบบ (Sign In)
          </button>
          <button
            onClick={() => {
              setMode('register');
              setFeedback(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            สมัครสมาชิก (Sign Up)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-red-950/60 border border-red-800 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1">อีเมลผู้ใช้งาน (Email)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="example@concertpass.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-white/10 flex items-center justify-center gap-1.5"
              >
                <span>เข้าสู่ระบบ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Form (Data Requirements: Section 9) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1">ชื่อ-นามสกุล (Full Name) *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมพร รักเสียงเพลง"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">อีเมล (Email) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="somporn@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">เบอร์โทรศัพท์ (Phone)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">รหัสผ่าน (Password) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none focus:border-neutral-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">เลือกประเภทบัญชี (Account Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('customer')}
                    className={`py-2 px-3 rounded-xl border text-left transition-all ${
                      regRole === 'customer'
                        ? 'bg-neutral-800 border-white text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="font-bold">ผู้ซื้อบัตร</div>
                    <div className="text-[10px] text-neutral-500">จองตั๋ว & รับ E-Ticket</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('organizer')}
                    className={`py-2 px-3 rounded-xl border text-left transition-all ${
                      regRole === 'organizer'
                        ? 'bg-neutral-800 border-white text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="font-bold">ผู้จัดงาน</div>
                    <div className="text-[10px] text-neutral-500">สร้างรอบ & ดูยอดขาย</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-white/10 flex items-center justify-center gap-1.5 mt-2"
              >
                <span>สมัครสมาชิกและเริ่มใช้งาน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-neutral-800/80">
            <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-2">
              หรือเข้าสู่ระบบด่วนด้วยบัญชีทดสอบ (1-Click Demo):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 text-left text-neutral-300 transition-colors"
              >
                <div className="font-semibold text-white">แพรว (Customer)</div>
                <div className="text-[10px] text-neutral-500">ผู้ซื้อบัตร</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('organizer')}
                className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 text-left text-neutral-300 transition-colors"
              >
                <div className="font-semibold text-white">สมชาย (Organizer)</div>
                <div className="text-[10px] text-neutral-500">ผู้จัดงานคอนเสิร์ต</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('gate_staff')}
                className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 text-left text-neutral-300 transition-colors"
              >
                <div className="font-semibold text-white">กานต์ (Gate Staff)</div>
                <div className="text-[10px] text-neutral-500">เจ้าหน้าที่ตรวจบัตร</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
