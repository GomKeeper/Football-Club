// frontend/lib/utils.ts

export const DAYS_KR = ["월", "화", "수", "목", "금", "토", "일"];

export function formatSchedule(dayOfWeek: number, utcTimeStr: string) {
  // 1. Create a dummy date with the UTC time
  const [hours, minutes] = utcTimeStr.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);

  // 2. Format to Local Time (KST if browser is in Korea)
  const timeStr = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);

  // 3. Combine with Day Name
  return `매주 ${DAYS_KR[dayOfWeek]}요일 ${timeStr}`;
}

export function formatKST(isoString: string) {
  if (!isoString) return "";

  // 1. Ensure the string ends with 'Z' if it's missing, to force UTC parsing
  const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
  
  const date = new Date(utcString);

  // 2. Use Intl.DateTimeFormat with explicit Asia/Seoul timezone
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul'
  }).format(date);
}

export function parseKSTForInput(isoString: string) {
  const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
  const date = new Date(utcString);
  
  // Add 9 hours manually to get KST value
  const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
  
  return {
    date: kstDate.toISOString().split('T')[0], // YYYY-MM-DD
    time: kstDate.toISOString().split('T')[1].slice(0, 5) // HH:MM
  };
}

export function calculateTimeRemaining(targetDateStr?: string | null) {
  if (!targetDateStr) return null;

  const now = new Date();
  // Ensure UTC parsing
  const target = new Date(targetDateStr.endsWith('Z') ? targetDateStr : `${targetDateStr}Z`);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { isExpired: true, days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { isExpired: false, days, hours, minutes };
}