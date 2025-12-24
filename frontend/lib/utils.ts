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