/** Utilidades de presentación de texto y números. */

/** Ordinal de posición en torneo: 1.º, 2.º, 3.º */
export function ordinal(position: number): string {
  return `${position}.º`;
}

/** Medalla para el podio. Las posiciones fuera del podio no llevan icono. */
export function medalFor(position: number): string | null {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return medals[position] ?? null;
}

/** Etiqueta legible del puesto */
export function positionLabel(position: number): string {
  const labels: Record<number, string> = {
    1: 'Campeón',
    2: 'Segundo lugar',
    3: 'Tercer lugar',
    4: 'Cuarto lugar',
  };
  return labels[position] ?? `${ordinal(position)} lugar`;
}

/** Corta un texto respetando palabras completas. */
export function truncate(text: string | null | undefined, max = 160): string {
  const clean = (text ?? '').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

/** Quita el marcado de Markdown para generar resúmenes automáticos. */
export function stripMarkdown(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_`>|-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "3 torneos" / "1 torneo" */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Bandera por código ISO. Decorativa: siempre acompaña al nombre del país. */
export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'MX', name: 'México' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'BR', name: 'Brasil' },
  { code: 'ES', name: 'España' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'JP', name: 'Japón' },
];

export function countryName(code: string | null | undefined): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code ?? '';
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Principiante',
  2: 'Intermedio',
  3: 'Avanzado',
};
