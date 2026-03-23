import { clsx } from 'clsx';

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function differenceInDays(start: Date, end: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / millisecondsPerDay));
}

export function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function extractDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCurrencyInput(value: string, currency = 'BRL', locale = 'pt-BR') {
  const digits = extractDigits(value);
  const amount = Number(digits || '0') / 100;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseCurrencyInput(value: string) {
  return Number(extractDigits(value) || '0') / 100;
}
