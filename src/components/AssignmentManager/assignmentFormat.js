// Conversions between what an administrator types and what the API stores.
// Estimated time is stored as whole minutes and typed as hours; cost is a plain number (one currency).

// Mirrors the backend limit (one year).
export const MAX_ESTIMATED_MINUTES = 525600;

const COST_PATTERN = /^\d+(\.\d{1,2})?$/;

// 90 -> "1.5". Two decimals are enough to get back to the same whole minute.
export function minutesToHoursText(minutes) {
  if (minutes == null) return '';
  return String(Math.round((minutes / 60) * 100) / 100);
}

// "1,5" or "1.5" -> { minutes: 90 }; "" -> { minutes: null }; anything unusable -> { error }.
export function parseHoursText(text) {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return { minutes: null };
  const hours = Number(trimmed);
  if (!Number.isFinite(hours) || hours <= 0) {
    return { error: 'Estimated time must be a number of hours greater than 0' };
  }
  const minutes = Math.round(hours * 60);
  if (minutes < 1 || minutes > MAX_ESTIMATED_MINUTES) {
    return { error: 'Estimated time must be between 1 minute and 365 days' };
  }
  return { minutes };
}

// "1250,5" or "1250.50" -> { cost: 1250.5 }; "" -> { cost: null }; anything unusable -> { error }.
export function parseCostText(text) {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return { cost: null };
  if (!COST_PATTERN.test(trimmed)) {
    return { error: 'Cost must be a number of 0 or more with at most 2 decimals' };
  }
  return { cost: Number(trimmed) };
}

// 90 -> "1 h 30 min", 45 -> "45 min", 120 -> "2 h"
export function formatMinutes(minutes) {
  if (minutes == null) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatCost(cost) {
  if (cost == null) return null;
  return Number(cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// How an employee is shown in lists and dropdowns.
export function employeeLabel(employee) {
  if (!employee) return null;
  return employee.name ? `${employee.name} (${employee.email})` : employee.email;
}
