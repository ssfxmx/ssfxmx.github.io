import { useQuery } from '@tanstack/react-query';
import { listCities } from '@/shared/lib/catalog.service';
import { Field, Input, Select } from '@/shared/components/ui';

/**
 * Selector de ciudad.
 *
 * Un solo componente para el registro, la edición de perfil y el filtro del
 * directorio: si mañana cambia la forma de elegir ciudad, se toca aquí y no en
 * tres pantallas que se irían desincronizando.
 *
 * Las ciudades se agrupan por estado. Con setenta y cinco entradas, una lista
 * plana obligaría a recorrerla entera; agrupada se encuentra de un vistazo.
 *
 * La opción "Otro" revela un campo de texto. Lo que se escriba ahí queda
 * pendiente en el panel para que un administrador lo agregue al catálogo, y a
 * partir de entonces deja de ser texto suelto.
 */

export interface CityValue {
  cityId: number | null;
  cityCustom: string;
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });
}

const OTHER = 'otro';

export function CitySelect({
  value,
  onChange,
  label = 'Ciudad',
  required = false,
  error,
}: {
  value: CityValue;
  onChange: (value: CityValue) => void;
  label?: string;
  required?: boolean;
  error?: string;
}) {
  const { data: cities, isLoading } = useCities();

  const grouped = (cities ?? []).reduce<Record<string, typeof cities>>((acc, city) => {
    (acc[city.state] ??= []).push(city);
    return acc;
  }, {});

  const showCustom = value.cityId === null && value.cityCustom !== '';
  const selectValue = value.cityId ? String(value.cityId) : showCustom ? OTHER : '';

  function handleSelect(raw: string) {
    if (raw === OTHER) {
      // Un espacio marca "eligió Otro pero aún no escribe nada": permite
      // distinguirlo de "no ha elegido nada" y mostrar el campo de texto.
      onChange({ cityId: null, cityCustom: ' ' });
      return;
    }
    onChange({ cityId: raw ? Number(raw) : null, cityCustom: '' });
  }

  return (
    <div className="space-y-3">
      <Field label={label} required={required} error={error}>
        <Select
          value={selectValue}
          onChange={(e) => handleSelect(e.target.value)}
          disabled={isLoading}
        >
          <option value="">{isLoading ? 'Cargando…' : 'Elige tu ciudad…'}</option>
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b, 'es'))
            .map(([state, list]) => (
              <optgroup key={state} label={state}>
                {list?.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </optgroup>
            ))}
          <option value={OTHER}>Otra ciudad…</option>
        </Select>
      </Field>

      {showCustom && (
        <Field
          label="¿Cuál?"
          hint="La agregaremos a la lista si varias personas la escriben."
        >
          <Input
            value={value.cityCustom.trimStart()}
            onChange={(e) => onChange({ cityId: null, cityCustom: e.target.value })}
            maxLength={80}
            placeholder="Escribe el nombre de tu ciudad"
            autoFocus
          />
        </Field>
      )}
    </div>
  );
}

/** Versión compacta para filtrar listados. Sin opción "Otro". */
export function CityFilter({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (cityId: number | null) => void;
}) {
  const { data: cities } = useCities();

  const grouped = (cities ?? []).reduce<Record<string, typeof cities>>((acc, city) => {
    (acc[city.state] ??= []).push(city);
    return acc;
  }, {});

  return (
    <Select value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">Todas las ciudades</option>
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b, 'es'))
        .map(([state, list]) => (
          <optgroup key={state} label={state}>
            {list?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </optgroup>
        ))}
    </Select>
  );
}
