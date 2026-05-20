/**
 * Utility functions for Smart Drg
 */

/**
 * clsx-like class merger — filters falsy values and joins classes
 * @param {...any} args
 * @returns {string}
 */
export function cn(...args) {
  return args
    .flat(Infinity)
    .filter((x) => typeof x === 'string' && x.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format number as Indonesian Rupiah
 * e.g. 1234567 → "Rp 1.234.567"
 * @param {number} n
 * @returns {string}
 */
export function rupiah(n) {
  if (n == null || isNaN(n)) return 'Rp 0';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

/**
 * Short Rupiah format
 * e.g. 1_500_000_000 → "Rp 1,5 M"
 *      450_000_000   → "Rp 450 jt"
 *      12_000        → "Rp 12 rb"
 *      500           → "Rp 500"
 * @param {number} n
 * @returns {string}
 */
export function rupiahShort(n) {
  if (n == null || isNaN(n)) return 'Rp 0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000;
    const formatted = val % 1 === 0 ? val : val.toLocaleString('id-ID', { maximumFractionDigits: 1 });
    return `${sign}Rp ${formatted} M`;
  }
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    const formatted = val % 1 === 0 ? val : val.toLocaleString('id-ID', { maximumFractionDigits: 1 });
    return `${sign}Rp ${formatted} jt`;
  }
  if (abs >= 1_000) {
    const val = abs / 1_000;
    const formatted = val % 1 === 0 ? val : val.toLocaleString('id-ID', { maximumFractionDigits: 1 });
    return `${sign}Rp ${formatted} rb`;
  }
  return `${sign}Rp ${abs}`;
}

/**
 * Format a number with Indonesian thousands separator
 * e.g. 1234567 → "1.234.567"
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('id-ID');
}

/**
 * Format a date as "12 Apr 2026" in Indonesian locale
 * @param {Date|string|number} d
 * @returns {string}
 */
export function dateID(d) {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date as "08:42"
 * @param {Date|string|number} d
 * @returns {string}
 */
export function timeID(d) {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Derive initials from a full name
 * e.g. "dr. Andini Pratiwi" → "AP"
 *      "Budi Santoso"       → "BS"
 *      "admin"              → "AD"
 * @param {string} name
 * @returns {string}
 */
export function initials(name) {
  if (!name) return '?';
  // Remove common prefixes
  const cleaned = name
    .replace(/^(dr\.?|drg\.?|prof\.?|ir\.?|drs\.?|hj\.?|h\.?)\s*/i, '')
    .trim();

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
