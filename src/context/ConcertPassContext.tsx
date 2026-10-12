import React, { createContext, useContext, useState, useEffect } from 'react';
import { Concert, Seat, Order, Ticket, CheckInResult, AuditLog, UserRole, UserAccount } from '../types/concert';
import { INITIAL_CONCERTS } from '../data/initialConcerts';
import { isConcertSaleClosed, isConcertSaleUpcoming, getConcertSaleStatus } from '../utils/concertSale';
import {
  fetchUserTicketsFromSupabase,
  persistOrderAndTicketsToSupabase,
  updateTicketStatusInSupabase,
  deleteTicketFromSupabase,
  persistConcertToSupabase,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

export const DEMO_ACCOUNTS = {
  customerA: {
    id: 'usr-customer-a',
    name: 'แพรว รักษ์ดนตรี (Customer A)',
    email: 'praew.customerA@example.com',
    phone: '081-111-2222',
    role: 'customer' as UserRole,
    createdAt: Date.now() - 86400000 * 30,
  },
  customerB: {
    id: 'usr-customer-b',
    name: 'ธนกฤต แฟนเพลง (Customer B)',
    email: 'thanakrit.customerB@example.com',
    phone: '082-333-4444',
    role: 'customer' as UserRole,
    createdAt: Date.now() - 86400000 * 15,
  },
  organizerA: {
    id: 'usr-somchai-org',
    name: 'สมชาย ผู้จัดการค่าย (Organizer A)',
    email: 'somchai.organizer@example.com',
    phone: '089-876-5432',
    role: 'organizer' as UserRole,
    createdAt: Date.now() - 86400000 * 60,
  },
  organizerB: {
    id: 'usr-wichan-org',
    name: 'วิชาญ โปรโมเตอร์อินดี้ (Organizer B)',
    email: 'wichan.organizer@example.com',
    phone: '086-555-7777',
    role: 'organizer' as UserRole,
    createdAt: Date.now() - 86400000 * 45,
  },
  gate_staff: {
    id: 'usr-karn-gate',
    name: 'กานต์ เจ้าหน้าที่ Gate A',
    email: 'karn.gate@example.com',
    phone: '095-432-1098',
    role: 'gate_staff' as UserRole,
    createdAt: Date.now() - 86400000 * 10,
  },
};

interface ConcertPassContextType {
  // Auth & Roles
  isLoggedIn: boolean;
  currentUser: UserAccount | null;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  login: (email: string, password?: string) => boolean;
  register: (data: { name: string; email: string; phone: string; password: string; role: UserRole }) => boolean;
  logout: () => void;
  quickLoginDemo: (role: UserRole) => void;
  quickSwitchAccount: (accountKey: 'customerA' | 'customerB' | 'organizerA' | 'organizerB' | 'gate_staff') => void;

  // Supabase Status
  isSupabaseActive: boolean;

  // Concerts
  concerts: Concert[];
  activeConcertId: string | null;
  setActiveConcertId: (id: string | null) => void;
  addNewConcert: (concert: Concert) => void;
  updateConcert: (concert: Concert) => void;
  toggleSaleStatus: (concertId: string) => void;
  openSaleImmediately: (concertId: string) => void;
  currentTime: number;

  // Seat Selection & Temporary Hold
  selectedSeatIds: string[];
  holdTimeRemaining: number; // in seconds
  holdExpiresAt: number | null;
  toggleSeatSelection: (concertId: string, seatId: string) => { success: boolean; reason?: string };
  clearSelectedSeats: () => void;

  // Checkout & Payment
  activeOrder: Order | null;
  startCheckout: (concertId: string) => Order | null;
  processPayment: (orderId: string) => Promise<boolean>;
  cancelCurrentOrder: () => void;

  // Tickets
  tickets: Ticket[];
  getTicketsByOrderId: (orderId: string) => Ticket[];
  deleteTicket: (ticketId: string) => boolean;
  refundTicket: (ticketId: string) => { success: boolean; message: string; seatLabel?: string; concertTitle?: string };

  // Gate Scanner
  validateAndCheckInTicket: (ticketQrOrId: string, gateStaffName?: string) => CheckInResult;

  // Audit Logs & Stats
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string, type: AuditLog['type']) => void;

  // Toast / System notice
  systemNotice: string | null;
  setSystemNotice: (notice: string | null) => void;
}

const ConcertPassContext = createContext<ConcertPassContextType | undefined>(undefined);

const HOLD_DURATION_SECONDS = 15 * 60; // 15 minutes as per BR-02

export const ConcertPassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(DEMO_ACCOUNTS.customerA);
  const [userRole, setUserRoleState] = useState<UserRole>('customer');
  const [registeredAccounts, setRegisteredAccounts] = useState<UserAccount[]>([
    DEMO_ACCOUNTS.customerA,
    DEMO_ACCOUNTS.customerB,
    DEMO_ACCOUNTS.organizerA,
    DEMO_ACCOUNTS.organizerB,
    DEMO_ACCOUNTS.gate_staff,
  ]);
  const [concerts, setConcerts] = useState<Concert[]>(INITIAL_CONCERTS);
  const [activeConcertId, setActiveConcertId] = useState<string | null>(INITIAL_CONCERTS[0].id);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(isSupabaseConfigured());

  // Real-time tick every second to accurately trigger ticket sale closing
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update Supabase active flag periodically or on demand
  useEffect(() => {
    setIsSupabaseActive(isSupabaseConfigured());
  }, []);

  // If Supabase is connected, attempt to fetch user tickets on login
  useEffect(() => {
    if (isSupabaseActive && currentUser?.id) {
      fetchUserTicketsFromSupabase(currentUser.id).then((cloudTickets) => {
        if (cloudTickets && cloudTickets.length > 0) {
          setTickets((prev) => {
            const map = new Map<string, Ticket>();
            prev.forEach((t) => map.set(t.id, t));
            cloudTickets.forEach((t) => map.set(t.id, t));
            return Array.from(map.values());
          });
        }
      });
    }
  }, [currentUser?.id, isSupabaseActive]);

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    if (isLoggedIn && currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };

  const login = (email: string): boolean => {
    // Check if matches any registered or demo account
    const existing = registeredAccounts.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      setCurrentUser(existing);
      setUserRoleState(existing.role);
      setIsLoggedIn(true);
      addAuditLog('เข้าสู่ระบบสำเร็จ', `ผู้ใช้ ${existing.name} (${existing.email}) เข้าสู่ระบบ บทบาท: ${existing.role}`, 'security' as any);
      return true;
    }

    // Check if email suggests organizer or gate staff
    const lowerEmail = email.toLowerCase();
    const inferredRole: UserRole = lowerEmail.includes('org')
      ? 'organizer'
      : lowerEmail.includes('gate') || lowerEmail.includes('scan')
      ? 'gate_staff'
      : 'customer';

    const newUser: UserAccount = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: email.split('@')[0],
      email,
      role: inferredRole,
      createdAt: Date.now(),
    };
    setRegisteredAccounts((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setUserRoleState(inferredRole);
    setIsLoggedIn(true);
    addAuditLog('เข้าสู่ระบบสำเร็จ', `ผู้ใช้ ${newUser.email} เข้าสู่ระบบสำเร็จ บทบาท: ${inferredRole}`, 'security' as any);
    return true;
  };

  const register = (data: { name: string; email: string; phone: string; password: string; role: UserRole }): boolean => {
    const newUser: UserAccount = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      createdAt: Date.now(),
    };
    setRegisteredAccounts((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setUserRoleState(data.role);
    setIsLoggedIn(true);
    addAuditLog('สมัครสมาชิกใหม่สำเร็จ', `สร้างบัญชีใหม่ ${data.name} (${data.email}) บทบาท: ${data.role}`, 'security' as any);
    return true;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('ออกจากระบบ', `ผู้ใช้ ${currentUser.name} ออกจากระบบ`, 'security' as any);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRoleState('customer');
    clearSelectedSeats();
  };

  const quickLoginDemo = (role: UserRole) => {
    const demo = role === 'customer'
      ? DEMO_ACCOUNTS.customerA
      : role === 'organizer'
      ? DEMO_ACCOUNTS.organizerA
      : DEMO_ACCOUNTS.gate_staff;

    setCurrentUser(demo);
    setUserRoleState(demo.role);
    setIsLoggedIn(true);
    addAuditLog('เข้าสู่ระบบด่วน (Demo)', `สลับเข้าใช้งานในฐานะ ${demo.name} (${demo.role})`, 'security' as any);
  };

  const quickSwitchAccount = (accountKey: 'customerA' | 'customerB' | 'organizerA' | 'organizerB' | 'gate_staff') => {
    const target = DEMO_ACCOUNTS[accountKey];
    if (!target) return;
    setCurrentUser(target);
    setUserRoleState(target.role);
    setIsLoggedIn(true);
    clearSelectedSeats();
    setSystemNotice(`สลับไปยังบัญชี: ${target.name} เรียบร้อยแล้ว`);
    addAuditLog('สลับบัญชีผู้ใช้', `สลับไปยังบัญชี ${target.name} (${target.id})`, 'security' as any);
  };

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdTimeRemaining, setHoldTimeRemaining] = useState<number>(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Initial tickets explicitly assigned per account:
  // Account A (แพรว) has 1 ticket for Acoustic in the Park 2026
  // Account B (ธนกฤต) has 1 ticket for Neon Waves Electronic Live 2026
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TCK-CUST-A-01',
      orderId: 'ORD-CUST-A-001',
      userId: 'usr-customer-a',
      userEmail: 'praew.customerA@example.com',
      concertId: 'c-acoustic-park',
      concertTitle: 'Acoustic in the Park 2026',
      artist: 'Dept x Anatomy Rabbit x Greasy Cafe',
      venue: 'สวนรถไฟ Amphitheater, กรุงเทพฯ',
      date: '24 ต.ค. 2026',
      time: '18:00 - 22:30 น.',
      zoneName: 'VIP Zone (หน้าเวที)',
      seatLabel: 'A3',
      price: 1200,
      attendeeName: 'แพรว รักษ์ดนตรี (Customer A)',
      qrCodeString: 'CONCERTPASS:TCK-CUST-A-01:c-acoustic-park:A3:VIP:ACTIVE',
      status: 'valid',
    },
    {
      id: 'TCK-CUST-B-01',
      orderId: 'ORD-CUST-B-001',
      userId: 'usr-customer-b',
      userEmail: 'thanakrit.customerB@example.com',
      concertId: 'c-neon-waves',
      concertTitle: 'Neon Waves Electronic Live 2026',
      artist: 'HYBS Live Reunion & K-Indie Guest',
      venue: 'Thunder Dome, เมืองทองธานี',
      date: '15 พ.ย. 2026',
      time: '20:00 - 01:00 น.',
      zoneName: 'VIP Zone (หน้าเวที)',
      seatLabel: 'B7',
      price: 3500,
      attendeeName: 'ธนกฤต แฟนเพลง (Customer B)',
      qrCodeString: 'CONCERTPASS:TCK-CUST-B-01:c-neon-waves:B7:VIP:ACTIVE',
      status: 'valid',
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      timestamp: Date.now() - 1000 * 60 * 120,
      actor: 'สมชาย (Organizer)',
      role: 'organizer',
      action: 'สร้างรอบการแสดง',
      details: 'เปิดรอบการแสดง "Acoustic in the Park 2026" โควตา 400 ที่นั่ง',
      type: 'concert_create',
    },
    {
      id: 'log-2',
      timestamp: Date.now() - 1000 * 60 * 45,
      actor: 'กานต์ (Gate Staff)',
      role: 'gate_staff',
      action: 'สแกนเข้างานสำเร็จ',
      details: 'ตรวจสอบตั๋ว TCK-USED-1092 ที่นั่ง A4 โซน VIP ผ่าน',
      type: 'checkin',
    },
  ]);

  const [systemNotice, setSystemNotice] = useState<string | null>(null);

  const addAuditLog = (action: string, details: string, type: AuditLog['type']) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      actor: currentUser?.name || 'ระบบอัตโนมัติ',
      role: userRole,
      action,
      details,
      type,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Timer Countdown for 15-minute Seat Hold (BR-02 & Scenario 4)
  useEffect(() => {
    if (!holdExpiresAt) {
      setHoldTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
      setHoldTimeRemaining(remaining);

      // Scenario 4: Auto release when 15 minutes expire
      if (remaining <= 0) {
        clearInterval(interval);
        handleHoldExpiration();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, activeConcertId, selectedSeatIds]);

  const handleHoldExpiration = () => {
    if (selectedSeatIds.length > 0 && activeConcertId) {
      // Revert seats from 'held' back to 'available'
      setConcerts((prev) =>
        prev.map((c) => {
          if (c.id !== activeConcertId) return c;
          return {
            ...c,
            seats: c.seats.map((s) =>
              selectedSeatIds.includes(s.id) ? { ...s, status: 'available', heldBy: undefined } : s
            ),
          };
        })
      );

      addAuditLog(
        'หมดเวลาการจอง (Auto-Release)',
        `คืนสิทธิ์ที่นั่ง [${selectedSeatIds.join(', ')}] กลับสู่ระบบเนื่องจากเกิน 15 นาที`,
        'release'
      );
      setSystemNotice('หมดเวลาล็อกที่นั่ง 15 นาที ระบบทำการคืนสิทธิ์ที่นั่งกลับสู่สาธารณะอัตโนมัติ');
    }

    setSelectedSeatIds([]);
    setHoldExpiresAt(null);
    setActiveOrder(null);
  };

  // Toggle Seat Selection with Concurrency Lock (BR-01, BR-02)
  const toggleSeatSelection = (concertId: string, seatId: string): { success: boolean; reason?: string } => {
    const targetConcert = concerts.find((c) => c.id === concertId);
    if (!targetConcert) return { success: false, reason: 'ไม่พบคอนเสิร์ต' };

    // Check if ticket sales for this concert are closed
    if (isConcertSaleClosed(targetConcert, currentTime)) {
      return { success: false, reason: 'คอนเสิร์ตนี้ปิดการจำหน่ายตั๋วแล้วตามกำหนดเวลา ไม่สามารถเลือกที่นั่งได้' };
    }

    // Check if ticket sales for this concert are not yet open (Upcoming)
    if (isConcertSaleUpcoming(targetConcert, currentTime)) {
      const saleInfo = getConcertSaleStatus(targetConcert, currentTime);
      return {
        success: false,
        reason: `คอนเสิร์ตนี้ยังไม่เปิดให้จองตั๋ว (กำหนดเปิดจอง: ${saleInfo.openDateFormatted})`,
      };
    }

    const seat = targetConcert.seats.find((s) => s.id === seatId);
    if (!seat) return { success: false, reason: 'ไม่พบที่นั่ง' };

    // If already sold
    if (seat.status === 'sold') {
      return { success: false, reason: 'ที่นั่งนี้ถูกจำหน่ายไปแล้ว' };
    }

    // If held by someone else
    const currentUserId = currentUser?.id || 'usr-praew-2026';
    if (seat.status === 'held' && seat.heldBy && seat.heldBy !== currentUserId) {
      return { success: false, reason: 'ที่นั่งนี้กำลังอยู่ในระหว่างการทำรายการโดยผู้อื่น (Concurrency Lock)' };
    }

    const isAlreadySelected = selectedSeatIds.includes(seatId);

    if (isAlreadySelected) {
      // Deselect
      const newSelected = selectedSeatIds.filter((id) => id !== seatId);
      setSelectedSeatIds(newSelected);

      // Revert seat status to available
      setConcerts((prev) =>
        prev.map((c) => {
          if (c.id !== concertId) return c;
          return {
            ...c,
            seats: c.seats.map((s) => (s.id === seatId ? { ...s, status: 'available', heldBy: undefined } : s)),
          };
        })
      );

      if (newSelected.length === 0) {
        setHoldExpiresAt(null);
      }
      return { success: true };
    } else {
      // Check purchase limit (BR-01: max 4 per account)
      if (selectedSeatIds.length >= targetConcert.purchaseLimit) {
        return {
          success: false,
          reason: `จำกัดการซื้อสูงสุดไม่เกิน ${targetConcert.purchaseLimit} ที่นั่งต่อ 1 บัญชี (ตามกฎ BR-01)`,
        };
      }

      // Lock seat for this user
      const newSelected = [...selectedSeatIds, seatId];
      setSelectedSeatIds(newSelected);

      // Set/refresh 15-minute hold timer
      const expires = Date.now() + HOLD_DURATION_SECONDS * 1000;
      setHoldExpiresAt(expires);

      setConcerts((prev) =>
        prev.map((c) => {
          if (c.id !== concertId) return c;
          return {
            ...c,
            seats: c.seats.map((s) =>
              s.id === seatId
                ? { ...s, status: 'held', heldBy: currentUserId, heldExpiresAt: expires }
                : s
            ),
          };
        })
      );

      addAuditLog(
        'ล็อกที่นั่งชั่วคราว (Seat Hold)',
        `ผู้ใช้ ${currentUser?.name || 'แพรว'} ล็อกที่นั่ง ${seat.label} โซน ${seat.zoneName} (สิทธิ์ 15 นาที)`,
        'hold'
      );

      return { success: true };
    }
  };

  const clearSelectedSeats = () => {
    if (activeConcertId && selectedSeatIds.length > 0) {
      setConcerts((prev) =>
        prev.map((c) => {
          if (c.id !== activeConcertId) return c;
          return {
            ...c,
            seats: c.seats.map((s) =>
              selectedSeatIds.includes(s.id) ? { ...s, status: 'available', heldBy: undefined } : s
            ),
          };
        })
      );
    }
    setSelectedSeatIds([]);
    setHoldExpiresAt(null);
    setActiveOrder(null);
  };

  // Start Checkout
  const startCheckout = (concertId: string): Order | null => {
    const targetConcert = concerts.find((c) => c.id === concertId);
    if (!targetConcert || selectedSeatIds.length === 0) return null;

    if (isConcertSaleClosed(targetConcert, currentTime)) {
      setSystemNotice('คอนเสิร์ตนี้ปิดการจำหน่ายตั๋วแล้วตามกำหนดเวลา ไม่สามารถสั่งซื้อได้');
      return null;
    }

    if (isConcertSaleUpcoming(targetConcert, currentTime)) {
      setSystemNotice('คอนเสิร์ตนี้ยังไม่ถึงกำหนดเวลาเปิดจองตั๋ว ไม่สามารถดำเนินการสั่งซื้อได้');
      return null;
    }

    const selectedSeats = targetConcert.seats.filter((s) => selectedSeatIds.includes(s.id));
    const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const seatLabels = selectedSeats.map((s) => s.label);

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: orderId,
      concertId: targetConcert.id,
      concertTitle: targetConcert.title,
      artist: targetConcert.artist,
      venue: targetConcert.venue,
      date: targetConcert.date,
      userId: currentUser?.id || 'usr-customer-a',
      userName: currentUser?.name || 'ลูกค้าทั่วไป',
      userEmail: currentUser?.email || 'customer@example.com',
      seatLabels,
      totalAmount,
      paymentMethod: 'promptpay',
      status: 'pending',
      createdAt: Date.now(),
      qrPayload: `00020101021129370016A000000677010111011300668912345675802TH5407${totalAmount}.0053037646304${orderId}`,
    };

    setActiveOrder(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  // Automated Payment Confirmation (F-03: within < 5s automatic confirmation & E-Ticket generation)
  const processPayment = async (orderId: string): Promise<boolean> => {
    const targetOrder = orders.find((o) => o.id === orderId) || activeOrder;
    if (!targetOrder) return false;

    // Simulate instant payment gateway webhook confirmation
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const concert = concerts.find((c) => c.id === targetOrder.concertId);
    if (!concert) return false;

    // Mark seats as permanently 'sold'
    setConcerts((prev) =>
      prev.map((c) => {
        if (c.id !== targetOrder.concertId) return c;
        return {
          ...c,
          seats: c.seats.map((s) => {
            if (targetOrder.seatLabels.includes(s.label)) {
              return { ...s, status: 'sold', heldBy: undefined, heldExpiresAt: undefined };
            }
            return s;
          }),
        };
      })
    );

    // Update order status
    const confirmedOrder: Order = {
      ...targetOrder,
      status: 'confirmed',
      paidAt: Date.now(),
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? confirmedOrder : o)));
    setActiveOrder(confirmedOrder);

    // Generate individual secure E-Tickets (F-04)
    const generatedTickets: Ticket[] = targetOrder.seatLabels.map((label, idx) => {
      const seatObj = concert.seats.find((s) => s.label === label);
      const ticketId = `TCK-${Date.now().toString().slice(-4)}-${idx + 1}`;
      const qrPayload = `CONCERTPASS:${ticketId}:${concert.id}:${label}:${seatObj?.zoneName || 'STANDARD'}:${targetOrder.userName}`;

      return {
        id: ticketId,
        orderId: targetOrder.id,
        userId: targetOrder.userId,
        userEmail: targetOrder.userEmail,
        concertId: concert.id,
        concertTitle: concert.title,
        artist: concert.artist,
        venue: concert.venue,
        date: concert.date,
        time: concert.time,
        zoneName: seatObj?.zoneName || 'Standard Zone',
        seatLabel: label,
        price: seatObj?.price || 0,
        attendeeName: targetOrder.userName,
        qrCodeString: qrPayload,
        status: 'valid',
      };
    });

    setTickets((prev) => [...generatedTickets, ...prev]);
    setSelectedSeatIds([]);
    setHoldExpiresAt(null);

    // Persist to Supabase if configured
    persistOrderAndTicketsToSupabase(confirmedOrder, generatedTickets).catch((err) => {
      console.warn('Supabase sync notice:', err);
    });

    addAuditLog(
      'ชำระเงินสำเร็จ (Payment Success)',
      `คำสั่งซื้อ ${orderId} ยอดเงิน ฿${targetOrder.totalAmount.toLocaleString()} ออกตั๋ว E-Ticket จำนวน ${generatedTickets.length} ใบ`,
      'purchase'
    );

    return true;
  };

  const cancelCurrentOrder = () => {
    handleHoldExpiration();
  };

  const getTicketsByOrderId = (orderId: string) => {
    return tickets.filter((t) => t.orderId === orderId);
  };

  // Gate Ticket Scanner Validation (BR-04, Feature F-07)
  const validateAndCheckInTicket = (ticketQrOrId: string, gateStaffName = 'เจ้าหน้าที่หน้าประตู'): CheckInResult => {
    const trimmed = ticketQrOrId.trim();

    // Find ticket by ID or matching QR string
    const ticket = tickets.find(
      (t) =>
        t.id.toLowerCase() === trimmed.toLowerCase() ||
        t.qrCodeString === trimmed ||
        t.qrCodeString.includes(trimmed)
    );

    if (!ticket) {
      addAuditLog('สแกนไม่ผ่าน (Invalid Ticket)', `พบรหัสตั๋วไม่ถูกต้องหรือไม่มีในระบบ: "${trimmed}"`, 'checkin');
      return {
        status: 'invalid',
        message: 'บัตรไม่ถูกต้อง หรือไม่พบข้อมูลในรอบการแสดงนี้',
      };
    }

    // Check if already used (BR-04)
    if (ticket.status === 'used') {
      addAuditLog(
        'เตือนการใช้บัตรซ้ำ (Ticket Re-used Alert)',
        `พบการสแกนซ้ำ บัตร ${ticket.id} (${ticket.seatLabel}) สแกนแล้วเมื่อ ${new Date(
          ticket.checkedInAt || 0
        ).toLocaleTimeString('th-TH')}`,
        'checkin'
      );
      return {
        status: 'already_used',
        message: 'บัตรนี้ถูกใช้งานแล้ว (Ticket Already Used)',
        ticket,
        previousCheckInTime: ticket.checkedInAt,
      };
    }

    // Valid ticket -> Mark as used immediately (< 3s requirement)
    const checkInTime = Date.now();
    const updatedTicket: Ticket = {
      ...ticket,
      status: 'used',
      checkedInAt: checkInTime,
      gateStaffName,
    };

    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updatedTicket : t)));
    updateTicketStatusInSupabase(ticket.id, 'used', gateStaffName).catch(console.warn);

    addAuditLog(
      'เช็คอินเข้างานสำเร็จ (Check-in Verified)',
      `บัตร ${ticket.id} [${ticket.zoneName} ที่นั่ง ${ticket.seatLabel}] ผู้ชม: ${ticket.attendeeName} ผ่านประตูเรียบร้อย`,
      'checkin'
    );

    return {
      status: 'success',
      message: `บัตรถูกต้อง: ${ticket.zoneName} ที่นั่ง ${ticket.seatLabel}`,
      ticket: updatedTicket,
    };
  };

  // Delete ticket (only allowed if already scanned/used)
  const deleteTicket = (ticketId: string): boolean => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return false;
    if (target.status !== 'used') {
      return false; // Can only delete tickets that have already been used!
    }
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    deleteTicketFromSupabase(ticketId).catch(console.warn);
    addAuditLog('ลบบัตรที่เข้างานแล้ว', `ลบประวัติบัตร ${target.id} (${target.seatLabel}) ออกจากกระเป๋า`, 'security' as any);
    return true;
  };

  // Refund ticket: returns ticket, frees up seat back to available in seat map
  const refundTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) {
      return { success: false, message: 'ไม่พบข้อมูลบัตรที่ต้องการคืน' };
    }
    if (target.status === 'used') {
      return { success: false, message: 'บัตรนี้ถูกสแกนเข้างานไปแล้ว ไม่สามารถทำการคืนได้' };
    }

    // 1. Revert seat back to 'available' in the concert
    setConcerts((prev) =>
      prev.map((c) => {
        if (c.id !== target.concertId) return c;
        return {
          ...c,
          seats: c.seats.map((s) => {
            if (s.label === target.seatLabel) {
              return {
                ...s,
                status: 'available',
                heldBy: undefined,
                heldExpiresAt: undefined,
              };
            }
            return s;
          }),
        };
      })
    );

    // 2. Remove the ticket from tickets list
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    deleteTicketFromSupabase(ticketId).catch(console.warn);

    // 3. Add system audit log
    addAuditLog(
      'คืนบัตรและปลดล็อกที่นั่งว่าง (Ticket Refund)',
      `คืนบัตร ${target.id} [${target.zoneName} ที่นั่ง ${target.seatLabel}] งาน "${target.concertTitle}" คืนเงินและปลดล็อกที่นั่งกลับสู่ผังสำเร็จ`,
      'release'
    );

    return {
      success: true,
      message: `คืนบัตรที่นั่ง ${target.seatLabel} สำเร็จ! ที่นั่งถูกคืนสู่ระบบผังจองคิวเรียบร้อยแล้ว`,
      seatLabel: target.seatLabel,
      concertTitle: target.concertTitle,
    };
  };

  // Organizer: Add New Concert (F-05)
  const addNewConcert = (newConcert: Concert) => {
    const finalConcert: Concert = {
      ...newConcert,
      organizerId: newConcert.organizerId || currentUser?.id || 'usr-somchai-org',
      organizerName: newConcert.organizerName || currentUser?.name || 'สมชาย ผู้จัดการค่าย',
    };
    setConcerts((prev) => [finalConcert, ...prev]);
    setActiveConcertId(finalConcert.id);
    persistConcertToSupabase(finalConcert).catch(console.warn);
    addAuditLog(
      'เพิ่มคอนเสิร์ตใหม่',
      `สร้างงาน "${finalConcert.title}" ศิลปิน ${finalConcert.artist} โดย ${finalConcert.organizerName} สถานที่ ${finalConcert.venue}`,
      'concert_create'
    );
  };

  // Organizer: Update Concert (Edit Concert Details / Time / Sale Closing)
  const updateConcert = (updatedConcert: Concert) => {
    setConcerts((prev) =>
      prev.map((c) => (c.id === updatedConcert.id ? updatedConcert : c))
    );
    addAuditLog(
      'แก้ไขข้อมูลคอนเสิร์ต',
      `แก้ไขงาน "${updatedConcert.title}" วันที่ ${updatedConcert.date} เวลาจัดคอนเสิร์ต ${updatedConcert.time} สถานที่ ${updatedConcert.venue}`,
      'concert_update'
    );
  };

  // Organizer: Toggle Sale Status (Manual Open/Close)
  const toggleSaleStatus = (concertId: string) => {
    setConcerts((prev) =>
      prev.map((c) => {
        if (c.id !== concertId) return c;
        const currentlyClosed = isConcertSaleClosed(c, currentTime);
        const willBeClosed = !currentlyClosed;

        const updated: Concert = {
          ...c,
          status: willBeClosed ? 'sale_closed' : 'sale_open',
          isSaleClosedManually: willBeClosed,
          saleEndTimestamp: willBeClosed
            ? Date.now()
            : (c.saleEndTimestamp && c.saleEndTimestamp < Date.now() ? Date.now() + 86400000 * 7 : c.saleEndTimestamp),
        };

        addAuditLog(
          willBeClosed ? 'ปิดการจำหน่ายตั๋ว' : 'เปิดการจำหน่ายตั๋ว',
          `${willBeClosed ? 'ปิด' : 'เปิด'}จำหน่ายตั๋วคอนเสิร์ต "${c.title}" โดย ${currentUser?.name || 'ผู้จัดงาน'}`,
          willBeClosed ? 'sale_close' : 'sale_open'
        );

        setSystemNotice(
          willBeClosed
            ? `ปิดการจำหน่ายตั๋ว "${c.title}" เรียบร้อยแล้ว`
            : `เปิดการจำหน่ายตั๋ว "${c.title}" เรียบร้อยแล้ว`
        );

        return updated;
      })
    );
  };

  // Organizer: Open Ticket Sale Immediately (for upcoming concerts or manual opening)
  const openSaleImmediately = (concertId: string) => {
    setConcerts((prev) =>
      prev.map((c) => {
        if (c.id !== concertId) return c;
        const updated: Concert = {
          ...c,
          status: 'sale_open',
          isSaleClosedManually: false,
          saleStartTimestamp: Date.now() - 1000,
          saleStartTime: 'เปิดจำหน่ายแล้ว',
          saleEndTimestamp:
            c.saleEndTimestamp && c.saleEndTimestamp > Date.now()
              ? c.saleEndTimestamp
              : Date.now() + 86400000 * 14,
        };

        addAuditLog(
          'เปิดจำหน่ายตั๋วทันที',
          `เริ่มเปิดให้จองตั๋วคอนเสิร์ต "${c.title}" ทันที โดย ${currentUser?.name || 'ผู้จัดงาน'}`,
          'sale_open'
        );

        setSystemNotice(`คอนเสิร์ต "${c.title}" เริ่มเปิดให้จองตั๋วแล้วตอนนี้!`);
        return updated;
      })
    );
  };

  return (
    <ConcertPassContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        userRole,
        setUserRole,
        login,
        register,
        logout,
        quickLoginDemo,
        quickSwitchAccount,
        isSupabaseActive,
        concerts,
        activeConcertId,
        setActiveConcertId,
        addNewConcert,
        updateConcert,
        toggleSaleStatus,
        openSaleImmediately,
        currentTime,
        selectedSeatIds,
        holdTimeRemaining,
        holdExpiresAt,
        toggleSeatSelection,
        clearSelectedSeats,
        activeOrder,
        startCheckout,
        processPayment,
        cancelCurrentOrder,
        tickets,
        getTicketsByOrderId,
        deleteTicket,
        refundTicket,
        validateAndCheckInTicket,
        auditLogs,
        addAuditLog,
        systemNotice,
        setSystemNotice,
      }}
    >
      {children}
    </ConcertPassContext.Provider>
  );
};

export const useConcertPass = () => {
  const context = useContext(ConcertPassContext);
  if (!context) {
    throw new Error('useConcertPass must be used within a ConcertPassProvider');
  }
  return context;
};
