// Helper date utilities in Spanish

export const SPANISH_DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const SPANISH_DAYS_FULL = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function formatDateSpanish(dateStr: string): string {
  // Parse YYYY-MM-DD safely
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  const dayName = SPANISH_DAYS_FULL[d.getDay()];
  const monthName = SPANISH_MONTHS[month - 1];
  return `${dayName}, ${day} de ${monthName} de ${year}`;
}

export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  const dayShort = SPANISH_DAYS_SHORT[d.getDay()];
  const monthName = SPANISH_MONTHS[month - 1].substring(0, 3);
  return `${dayShort} ${day} ${monthName}`;
}

export function getTodayDateString(): string {
  // Target simulated current date from metadata: 2026-11-11
  // If the user's real browser date is in 2026-11, use it, otherwise default to 2026-11-11
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const browserToday = `${y}-${m}-${d}`;

  // If currently in Nov 2026, use actual day; else default to 2026-11-11 for best demo experience
  if (browserToday.startsWith('2026-11')) {
    return browserToday;
  }
  return '2026-11-11';
}

export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7); // "2026-11"
}

export function getMonthDisplayName(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return `${SPANISH_MONTHS[month - 1]} ${year}`;
}
