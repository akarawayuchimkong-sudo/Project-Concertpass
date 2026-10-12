import { Concert } from '../types/concert';

/**
 * Format timestamp to Thai readable date & time
 * e.g. "24 ต.ค. 2026 เวลา 17:00 น."
 */
export function formatThaiDateTime(timestampOrIso?: number | string): string {
  if (!timestampOrIso) return '-';
  const date = new Date(timestampOrIso);
  if (isNaN(date.getTime())) return '-';

  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + (date.getFullYear() < 2400 ? 543 : 0); // Convert to Buddhist Era if AD
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
}

/**
 * Convert Date or timestamp to datetime-local input string YYYY-MM-DDTHH:mm
 */
export function toDateTimeLocalString(timestampOrIso?: number | string): string {
  const d = timestampOrIso ? new Date(timestampOrIso) : new Date();
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Check if concert ticket sale is currently closed
 */
export function isConcertSaleClosed(concert: Concert, currentTime: number = Date.now()): boolean {
  if (concert.isSaleClosedManually) return true;
  if (concert.status === 'sale_closed') return true;
  if (concert.saleEndTimestamp && currentTime >= concert.saleEndTimestamp) {
    return true;
  }
  return false;
}

/**
 * Check if concert ticket sale is upcoming (not yet open for booking)
 */
export function isConcertSaleUpcoming(concert: Concert, currentTime: number = Date.now()): boolean {
  // If manually closed, consider closed rather than upcoming
  if (concert.isSaleClosedManually || concert.status === 'sale_closed') return false;

  // If saleStartTimestamp is specified:
  if (concert.saleStartTimestamp) {
    return currentTime < concert.saleStartTimestamp;
  }

  // Fallback to static status if no timestamp
  return concert.status === 'upcoming';
}

export interface SaleStatusInfo {
  isUpcoming: boolean;
  isClosed: boolean;
  isSoldOut: boolean;
  canBook: boolean;
  badgeLabel: string;
  badgeStyle: 'open' | 'closed' | 'sold_out' | 'upcoming';
  countdownText?: string;
  openDateFormatted: string;
  closeDateFormatted: string;
  buttonLabel: string;
  reason?: string;
}

/**
 * Get comprehensive sale status for a concert
 */
export function getConcertSaleStatus(concert: Concert, currentTime: number = Date.now()): SaleStatusInfo {
  const availableSeats = concert.seats.filter((s) => s.status === 'available').length;
  const isSoldOut = availableSeats === 0;
  const isClosed = isConcertSaleClosed(concert, currentTime);
  const isUpcoming = !isClosed && isConcertSaleUpcoming(concert, currentTime);

  const openDateFormatted = concert.saleStartTimestamp
    ? formatThaiDateTime(concert.saleStartTimestamp)
    : concert.saleStartDatetime
    ? formatThaiDateTime(concert.saleStartDatetime)
    : concert.saleStartTime || '-';

  const closeDateFormatted = concert.saleEndTimestamp
    ? formatThaiDateTime(concert.saleEndTimestamp)
    : concert.saleEndDatetime
    ? formatThaiDateTime(concert.saleEndDatetime)
    : '-';

  // 1. Sale is Closed
  if (isClosed) {
    let reason = 'ปิดจำหน่ายตั๋วตามเวลาที่กำหนด';
    if (concert.isSaleClosedManually) {
      reason = 'ผู้จัดงานปิดการจำหน่ายตั๋วชั่วคราว';
    }
    return {
      isUpcoming: false,
      isClosed: true,
      isSoldOut,
      canBook: false,
      badgeLabel: 'ปิดจำหน่ายแล้ว',
      badgeStyle: 'closed',
      openDateFormatted,
      closeDateFormatted,
      buttonLabel: 'ปิดจำหน่ายแล้ว',
      reason,
      countdownText: 'สิ้นสุดเวลาจำหน่ายแล้ว',
    };
  }

  // 2. Upcoming (Not yet open)
  if (isUpcoming) {
    let countdownText = concert.saleStartTime || 'ยังไม่เปิดจำหน่าย';
    if (concert.saleStartTimestamp) {
      const diffMs = concert.saleStartTimestamp - currentTime;
      if (diffMs > 0) {
        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
        const minutes = totalMinutes % 60;

        if (days > 0) {
          countdownText = `เปิดจองในอีก ${days} วัน ${hours} ชม.`;
        } else if (hours > 0) {
          countdownText = `เปิดจองในอีก ${hours} ชม. ${minutes} นาที`;
        } else if (minutes > 0) {
          countdownText = `เปิดจองในอีก ${minutes} นาที`;
        } else {
          const seconds = Math.floor((diffMs % 60000) / 1000);
          countdownText = `เปิดจองในอีก ${seconds} วินาที`;
        }
      }
    }

    return {
      isUpcoming: true,
      isClosed: false,
      isSoldOut: false,
      canBook: false,
      badgeLabel: 'เร็วๆ นี้',
      badgeStyle: 'upcoming',
      openDateFormatted,
      closeDateFormatted,
      buttonLabel: 'ยังไม่เปิดให้จอง',
      reason: `ยังไม่ถึงกำหนดเวลาเปิดจองตั๋ว (${openDateFormatted})`,
      countdownText,
    };
  }

  // 3. Sold Out
  if (isSoldOut) {
    return {
      isUpcoming: false,
      isClosed: false,
      isSoldOut: true,
      canBook: false,
      badgeLabel: 'บัตรหมดแล้ว',
      badgeStyle: 'sold_out',
      openDateFormatted,
      closeDateFormatted,
      buttonLabel: 'บัตรหมดแล้ว',
      countdownText: 'บัตรทุกที่นั่งถูกจำหน่ายหมด',
    };
  }

  // 4. Active / Open sale: calculate countdown to closing
  let countdownText = 'เปิดจำหน่ายตามปกติ';
  if (concert.saleEndTimestamp) {
    const diffMs = concert.saleEndTimestamp - currentTime;
    if (diffMs > 0) {
      const totalMinutes = Math.floor(diffMs / 60000);
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      if (days > 0) {
        countdownText = `ปิดจำหน่ายในอีก ${days} วัน ${hours} ชม.`;
      } else if (hours > 0) {
        countdownText = `ปิดจำหน่ายในอีก ${hours} ชม. ${minutes} นาที`;
      } else if (minutes > 0) {
        countdownText = `ปิดจำหน่ายในอีก ${minutes} นาที`;
      } else {
        const seconds = Math.floor((diffMs % 60000) / 1000);
        countdownText = `ปิดจำหน่ายในอีก ${seconds} วินาที`;
      }
    }
  }

  return {
    isUpcoming: false,
    isClosed: false,
    isSoldOut: false,
    canBook: true,
    badgeLabel: 'เปิดจำหน่าย',
    badgeStyle: 'open',
    openDateFormatted,
    closeDateFormatted,
    buttonLabel: 'เลือกที่นั่ง',
    countdownText,
  };
}
