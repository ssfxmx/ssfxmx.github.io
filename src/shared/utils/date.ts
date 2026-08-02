import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

/**
 * Fechas y horas.
 *
 * La base guarda todo en timestamptz (UTC). La conversión a hora local ocurre
 * solo aquí, en la capa de presentación. Un torneo anunciado con una hora
 * equivocada arruina el torneo, y guardar horas sin zona es la causa número uno
 * de ese error.
 *
 * Se muestra siempre con etiqueta explícita ("20:00 CDMX") porque la comunidad
 * está repartida por todo el país.
 */

export const TIMEZONE = 'America/Mexico_City';
export const TIMEZONE_LABEL = 'CDMX';

function zoned(value: string | Date): Date {
  return toZonedTime(typeof value === 'string' ? new Date(value) : value, TIMEZONE);
}

/** "14 de abril de 2026" */
export function formatDate(value: string | Date): string {
  return format(zoned(value), "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** "14 abr 2026" */
export function formatDateShort(value: string | Date): string {
  return format(zoned(value), 'd MMM yyyy', { locale: es });
}

/** "14 de abril de 2026, 20:00 CDMX" */
export function formatDateTime(value: string | Date): string {
  return `${format(zoned(value), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })} ${TIMEZONE_LABEL}`;
}

/** "20:00 CDMX" */
export function formatTime(value: string | Date): string {
  return `${format(zoned(value), 'HH:mm', { locale: es })} ${TIMEZONE_LABEL}`;
}

/** "hace 3 días" */
export function formatRelative(value: string | Date): string {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: es });
}

/** Etiqueta amistosa para el próximo evento: "Hoy", "Mañana" o la fecha. */
export function formatEventDay(value: string | Date): string {
  const date = zoned(value);
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  return formatDate(value);
}

export function isPastDate(value: string | Date): boolean {
  return isPast(new Date(value));
}

/** Valor para <input type="datetime-local"> a partir de un ISO en UTC. */
export function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return '';
  return format(zoned(value), "yyyy-MM-dd'T'HH:mm");
}

/**
 * Convierte lo que escribió el admin en un <input type="datetime-local"> a ISO.
 * El navegador entrega hora local del equipo; se asume que el admin captura en
 * su propio horario, que es el comportamiento esperado.
 */
export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

/** Agrupa por mes: { "2026-04": [...] } */
export function monthKey(value: string | Date): string {
  return format(zoned(value), 'yyyy-MM');
}

export function monthLabel(value: string | Date): string {
  const label = format(zoned(value), 'MMMM yyyy', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
