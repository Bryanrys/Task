/**
 * Helper to calculate and format countdown to a task deadline
 */
export function getDeadlineStatus(deadlineISO?: string): {
  text: string;
  isUrgent: boolean;
  isPast: boolean;
} | null {
  if (!deadlineISO) return null;

  const target = new Date(deadlineISO).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    const hoursAgo = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    return {
      text: hoursAgo === 0 ? '¡Venció hace unos minutos!' : `Venció hace ${hoursAgo}h`,
      isUrgent: true,
      isPast: true,
    };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days === 0) {
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      text: hours === 0 ? `⚠️ Vence en ${minutes} min` : `⚠️ Vence en ${hours}h ${minutes}m`,
      isUrgent: true,
      isPast: false,
    };
  }

  return {
    text: days === 1 ? `⏳ Vence mañana (${remainingHours}h)` : `⏳ Faltan ${days} días`,
    isUrgent: days <= 2,
    isPast: false,
  };
}
