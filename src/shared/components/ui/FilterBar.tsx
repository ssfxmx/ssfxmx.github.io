import { Search, X } from 'lucide-react';
import { Input, Select } from './index';

/**
 * Barra de búsqueda y filtros para los listados públicos.
 *
 * Existe como componente compartido porque noticias y eventos necesitan lo
 * mismo y, si cada uno lo resolviera por su cuenta, acabarían viéndose y
 * comportándose distinto sin que nadie lo decidiera. El día que se filtren
 * también los tutoriales, se reutiliza.
 *
 * NO decide nada sobre los datos: recibe valores y devuelve cambios. Quién
 * filtra —el servidor o el cliente— es decisión de cada página, y esa decisión
 * se explica donde se toma.
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface SelectFilter {
  /** Valor actual. Cadena vacía significa "sin filtrar". */
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Texto de la opción que desactiva este filtro, p. ej. "Todos los años". */
  allLabel: string;
  /** Para lectores de pantalla: el desplegable no lleva etiqueta visible. */
  ariaLabel: string;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar…',
  filters = [],
  resultLabel,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: SelectFilter[];
  /** Texto del recuento, p. ej. "12 resultados". Se oculta si no se pasa. */
  resultLabel?: string;
}) {
  const hasFilters = search.trim() !== '' || filters.some((filter) => filter.value !== '');

  function clearAll() {
    onSearchChange('');
    for (const filter of filters) filter.onChange('');
  }

  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>

        {filters.map((filter) => (
          <Select
            key={filter.ariaLabel}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            aria-label={filter.ariaLabel}
            className="sm:w-44"
          >
            <option value="">{filter.allLabel}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ))}
      </div>

      {/* La fila de estado solo aparece cuando hay algo que decir. Mostrarla
          siempre añadiría una línea de ruido permanente a la página. */}
      {(hasFilters || resultLabel) && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-dim">
          {resultLabel && <span>{resultLabel}</span>}
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-steel transition-colors hover:text-primary"
            >
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Lista de años para el desplegable, del más reciente al más antiguo.
 *
 * Se construye a partir del año más antiguo que hay en la tabla, que se
 * consulta con una sola fila. La alternativa —traer todas las fechas y sacar
 * los años distintos— crece con el archivo y aquí no aporta nada: un año sin
 * contenido saldría en la lista y devolvería cero resultados, que es
 * exactamente lo que pasaría si no estuviera.
 */
export function yearOptions(oldestYear: number | null): FilterOption[] {
  if (!oldestYear) return [];

  const currentYear = new Date().getFullYear();
  const years: FilterOption[] = [];

  for (let year = currentYear; year >= oldestYear; year -= 1) {
    years.push({ value: String(year), label: String(year) });
  }

  return years;
}
