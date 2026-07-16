import { useSettingsStore } from "@/lib/store/settingsStore";

/**
 * Format a number into dynamic currency representation.
 * Example: 250000 -> 250 000 FCFA or $ 250 000
 */
export function formatFCFA(amount: number | bigint | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '0 FCFA';
  }
  
  const numericAmount = typeof amount === 'bigint' ? Number(amount) : amount;
  
  // Retrieve settings currency safely
  let currency = 'XOF';
  try {
    currency = useSettingsStore.getState().settings.currency || 'XOF';
  } catch (e) {
    // SSR Safe fallback
  }

  // Format with space as thousands separator
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  let label = currency;
  if (currency === 'XOF' || currency === 'XAF') {
    label = 'FCFA';
  } else if (currency === 'USD') {
    label = '$';
  } else if (currency === 'EUR') {
    label = '€';
  } else if (currency === 'GBP') {
    label = '£';
  }

  // Position symbol relative to amount
  if (label === '$' || label === '€' || label === '£') {
    return `${label} ${formatter.format(numericAmount)}`;
  }
  
  return `${formatter.format(numericAmount)} ${label}`;
}

/**
 * Format a date string or Date object into DD/MM/YYYY.
 * Example: "2026-07-14" -> "14/07/2026"
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}
