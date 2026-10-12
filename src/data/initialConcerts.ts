import { Concert, Seat, Zone } from '../types/concert';

function generateSeats(vipPrice: number, standardPrice: number): { zones: Zone[]; seats: Seat[] } {
  const seats: Seat[] = [];

  // Zone VIP: Row A (1-8), Row B (1-8)
  const vipRows = ['A', 'B'];
  vipRows.forEach((row) => {
    for (let i = 1; i <= 8; i++) {
      // Simulate a few already sold seats to look real
      const isSold = (row === 'A' && (i === 3 || i === 4)) || (row === 'B' && i === 7);
      seats.push({
        id: `vip-${row}${i}`,
        zoneId: 'z-vip',
        zoneName: 'VIP Zone (หน้าเวที)',
        row,
        number: i,
        label: `${row}${i}`,
        price: vipPrice,
        status: isSold ? 'sold' : 'available',
      });
    }
  });

  // Zone Standard: Row C, D, E (1-10)
  const stdRows = ['C', 'D', 'E'];
  stdRows.forEach((row) => {
    for (let i = 1; i <= 10; i++) {
      const isSold = (row === 'C' && (i === 1 || i === 2)) || (row === 'D' && i === 5);
      seats.push({
        id: `std-${row}${i}`,
        zoneId: 'z-std',
        zoneName: 'Standard Zone (ชั้นกลาง)',
        row,
        number: i,
        label: `${row}${i}`,
        price: standardPrice,
        status: isSold ? 'sold' : 'available',
      });
    }
  });

  const vipSeats = seats.filter((s) => s.zoneId === 'z-vip');
  const stdSeats = seats.filter((s) => s.zoneId === 'z-std');

  const zones: Zone[] = [
    {
      id: 'z-vip',
      name: 'VIP Zone (หน้าเวที ใกล้ชิดศิลปิน)',
      price: vipPrice,
      type: 'seated',
      color: '#f59e0b', // amber
      totalCapacity: vipSeats.length,
      availableCount: vipSeats.filter((s) => s.status === 'available').length,
    },
    {
      id: 'z-std',
      name: 'Standard Zone (มุมมองกว้าง เสียงชัด)',
      price: standardPrice,
      type: 'seated',
      color: '#06b6d4', // cyan
      totalCapacity: stdSeats.length,
      availableCount: stdSeats.filter((s) => s.status === 'available').length,
    },
  ];

  return { zones, seats };
}

const acousticData = generateSeats(1200, 800);
const neonData = generateSeats(3500, 1800);
const rooftopData = generateSeats(1500, 950);
const echoData = generateSeats(2800, 1400);

export const INITIAL_CONCERTS: Concert[] = [
  {
    id: 'c-acoustic-park',
    title: 'Acoustic in the Park 2026',
    artist: 'Dept x Anatomy Rabbit x Greasy Cafe',
    organizerId: 'usr-somchai-org',
    organizerName: 'สมชาย ผู้จัดการค่าย (Organizer A)',
    date: '24 ต.ค. 2026',
    time: '18:00 - 22:30 น.',
    doorsOpen: '17:00 น.',
    venue: 'สวนรถไฟ Amphitheater, กรุงเทพฯ',
    description: 'คอนเสิร์ตอะคูสติกท่ามกลางบรรยากาศร่มรื่นยามเย็น ผ่อนคลายกับบทเพลงอินดี้ไทยร่วมสมัย ดื่มด่ำเสียงดนตรีสดไร้สิ่งรบกวน',
    category: 'Acoustic',
    purchaseLimit: 4,
    status: 'sale_open',
    saleStartTime: 'เปิดจำหน่ายแล้ว',
    saleEndDatetime: '2026-10-24T17:00',
    saleEndTimestamp: new Date('2026-10-24T17:00:00').getTime(),
    accentColor: '#10b981', // emerald
    gradientTheme: 'from-emerald-950/70 via-neutral-900 to-neutral-950',
    zones: acousticData.zones,
    seats: acousticData.seats,
  },
  {
    id: 'c-neon-waves',
    title: 'Neon Waves Electronic Live 2026',
    artist: 'HYBS Live Reunion & K-Indie Guest',
    organizerId: 'usr-wichan-org',
    organizerName: 'วิชาญ โปรโมเตอร์อินดี้ (Organizer B)',
    date: '15 พ.ย. 2026',
    time: '20:00 - 01:00 น.',
    doorsOpen: '18:30 น.',
    venue: 'Thunder Dome, เมืองทองธานี',
    description: 'ปรากฏการณ์ดนตรีสังเคราะห์และ Visual Art ยุคใหม่ ผสานระบบเสียงรอบทิศทาง 360 องศา และแสงเลเซอร์ล้ำสมัยที่สุดแห่งปี',
    category: 'Electronic',
    purchaseLimit: 4,
    status: 'sale_open',
    saleStartTime: 'เปิดจำหน่ายแล้ว',
    saleEndDatetime: '2026-11-15T19:00',
    saleEndTimestamp: new Date('2026-11-15T19:00:00').getTime(),
    accentColor: '#8b5cf6', // purple
    gradientTheme: 'from-violet-950/70 via-neutral-900 to-neutral-950',
    zones: neonData.zones,
    seats: neonData.seats,
  },
  {
    id: 'c-indie-rooftop',
    title: 'Midnight Echo Rooftop Session',
    artist: 'Safeplanet & Television off',
    organizerId: 'usr-wichan-org',
    organizerName: 'วิชาญ โปรโมเตอร์อินดี้ (Organizer B)',
    date: '05 ธ.ค. 2026',
    time: '19:30 - 23:00 น.',
    doorsOpen: '18:00 น.',
    venue: 'Lido Connect Rooftop, สยามสแควร์',
    description: 'บรรยากาศรูฟท็อปสุดเอ็กซ์คลูซีฟใจกลางสยาม พร้อมเซ็ตลิสต์พิเศษที่ไม่เคยแสดงที่ไหนมาก่อน จำกัดที่นั่งเพื่อความใกล้ชิดสูงสุด',
    category: 'Indie',
    purchaseLimit: 2,
    status: 'sale_open',
    saleStartTime: 'เปิดจำหน่ายแล้ว',
    saleEndDatetime: '2026-12-05T18:00',
    saleEndTimestamp: new Date('2026-12-05T18:00:00').getTime(),
    accentColor: '#f43f5e', // rose
    gradientTheme: 'from-rose-950/70 via-neutral-900 to-neutral-950',
    zones: rooftopData.zones,
    seats: rooftopData.seats,
  },
  {
    id: 'c-stadium-rock',
    title: 'Horizon Arena Live Tour 2026',
    artist: 'Tilly Birds & Three Man Down',
    organizerId: 'usr-somchai-org',
    organizerName: 'สมชาย ผู้จัดการค่าย (Organizer A)',
    date: '20 ธ.ค. 2026',
    time: '19:00 - 23:30 น.',
    doorsOpen: '17:00 น.',
    venue: 'Impact Arena Hall 1, กรุงเทพฯ',
    description: 'คอนเสิร์ตใหญ่แห่งปี รวมสุดยอดเพลงฮิตและโชว์สเกลอารีน่าเต็มรูปแบบ ดนตรีสด พลังงานเข้มข้นที่จะทำให้คุณกระโดดทั้งคืน',
    category: 'Rock',
    purchaseLimit: 4,
    status: 'upcoming',
    saleStartTime: 'เปิดขาย 25 ต.ค. เวลา 10:00 น.',
    saleStartDatetime: '2026-10-25T10:00',
    saleStartTimestamp: new Date('2026-10-25T10:00:00').getTime(),
    saleEndDatetime: '2026-12-20T18:00',
    saleEndTimestamp: new Date('2026-12-20T18:00:00').getTime(),
    accentColor: '#3b82f6', // blue
    gradientTheme: 'from-blue-950/70 via-neutral-900 to-neutral-950',
    zones: echoData.zones,
    seats: echoData.seats,
  },
];
