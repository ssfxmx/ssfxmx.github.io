import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus } from 'lucide-react';
import { friendlyError } from '@/shared/lib/supabase';
import {
  createCity,
  listAllCities,
  listPendingCities,
  promoteCity,
  updateCity,
} from '@/shared/lib/catalog.service';
import {
  Alert,
  ArcadePanel,
  Badge,
  Button,
  Field,
  Input,
  Spinner,
} from '@/shared/components/ui';
import type { City, PendingCity } from '@/shared/types/database';
import { AdminHeader, DataTable, type Column } from '../shared/AdminKit';

/**
 * Catálogo de ciudades.
 *
 * Existe para que el registro use una lista y no texto libre. Sin esto, "CDMX",
 * "Ciudad de México" y "cdmx" serían tres lugares distintos, el filtro del
 * directorio mostraría las tres, y cualquier estadística por escena local sería
 * inservible.
 *
 * La pieza que mantiene la lista viva es el bloque de pendientes: cuando
 * alguien elige "Otro" y escribe su ciudad, aparece aquí para que se agregue de
 * una vez. Al promoverla, quienes la habían escrito quedan reasignados
 * automáticamente, así que el texto suelto desaparece del sistema.
 */
export function AdminCitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [newCity, setNewCity] = useState({ name: '', state: '' });
  const [promoting, setPromoting] = useState<{ city: PendingCity; state: string } | null>(
    null
  );

  const cities = useQuery({ queryKey: ['admin', 'cities'], queryFn: listAllCities });
  const pending = useQuery({ queryKey: ['admin', 'cities', 'pending'], queryFn: listPendingCities });

  function refresh(text: string) {
    setMessage(text);
    setError('');
    queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] });
    queryClient.invalidateQueries({ queryKey: ['cities'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
  }

  const add = useMutation({
    mutationFn: () => createCity(newCity.name, newCity.state),
    onSuccess: () => {
      setNewCity({ name: '', state: '' });
      refresh('Ciudad agregada.');
    },
    onError: (err) => setError(friendlyError(err)),
  });

  const promote = useMutation({
    mutationFn: ({ name, state }: { name: string; state: string }) => promoteCity(name, state),
    onSuccess: () => {
      setPromoting(null);
      refresh('Ciudad agregada al catálogo y jugadores reasignados.');
    },
    onError: (err) => setError(friendlyError(err)),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      updateCity(id, { is_active: isActive }),
    onSuccess: () => refresh('Actualizado.'),
    onError: (err) => setError(friendlyError(err)),
  });

  if (cities.isLoading) return <Spinner />;

  const rows = (cities.data ?? []).filter(
    (city) =>
      city.name.toLowerCase().includes(search.toLowerCase()) ||
      city.state.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<City>[] = [
    {
      key: 'name',
      header: 'Ciudad',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.name}</p>
          <p className="truncate text-xs text-ink-dim">{row.state}</p>
        </div>
      ),
    },
    {
      key: 'aliases',
      header: 'También se escribe',
      render: (row) =>
        row.aliases.length > 0 ? (
          <span className="text-xs text-ink-dim">{row.aliases.join(', ')}</span>
        ) : (
          <span className="text-xs text-ink-dim">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) =>
        row.is_active ? (
          <Badge tone="success">Visible</Badge>
        ) : (
          <Badge tone="neutral">Oculta</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          onClick={() => toggle.mutate({ id: row.id, isActive: !row.is_active })}
          className="text-xs text-steel hover:underline"
        >
          {row.is_active ? 'Ocultar' : 'Mostrar'}
        </button>
      ),
    },
  ];

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (newCity.name.trim().length < 2 || newCity.state.trim().length < 2) {
      setError('Escribe el nombre de la ciudad y su estado.');
      return;
    }
    add.mutate();
  }

  return (
    <>
      <AdminHeader
        title="CIUDADES"
        description="La lista que aparece en el registro. Ocultar una ciudad no afecta a quien ya la eligió."
      />

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      {/* Ciudades escritas a mano, pendientes de agregar */}
      {(pending.data?.length ?? 0) > 0 && (
        <ArcadePanel className="mb-6 p-5">
          <div className="mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <h2 className="font-display text-[10px] uppercase tracking-wide text-primary">
              Pendientes de agregar
            </h2>
          </div>

          <p className="mb-4 text-xs leading-relaxed text-ink-dim">
            Estas ciudades las escribió alguien a mano porque no estaban en la lista. Al
            agregarlas, quien las había escrito queda reasignado automáticamente y el
            texto suelto desaparece.
          </p>

          <ul className="space-y-3">
            {pending.data?.map((item) => (
              <li
                key={item.name}
                className="flex flex-wrap items-center gap-3 border-b border-edge pb-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink-dim">
                    {item.players === 1 ? '1 jugador' : `${item.players} jugadores`}
                  </p>
                </div>

                {promoting?.city.name === item.name ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={promoting.state}
                      onChange={(e) =>
                        setPromoting({ city: item, state: e.target.value })
                      }
                      placeholder="Estado"
                      className="w-40"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      loading={promote.isPending}
                      onClick={() =>
                        promote.mutate({ name: item.name, state: promoting.state })
                      }
                    >
                      Agregar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPromoting(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPromoting({ city: item, state: '' })}
                  >
                    Agregar al catálogo
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </ArcadePanel>
      )}

      {/* Alta manual */}
      <ArcadePanel beveled={false} className="mb-6 p-5">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <Field label="Nueva ciudad">
            <Input
              value={newCity.name}
              onChange={(e) => setNewCity((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej.: Tepatitlán"
            />
          </Field>
          <Field label="Estado">
            <Input
              value={newCity.state}
              onChange={(e) => setNewCity((p) => ({ ...p, state: e.target.value }))}
              placeholder="Ej.: Jalisco"
            />
          </Field>
          <Button type="submit" size="sm" loading={add.isPending}>
            <Plus size={15} /> Agregar
          </Button>
        </form>
      </ArcadePanel>

      <DataTable
        rows={rows}
        columns={columns}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar ciudad o estado…"
        emptyMessage="No hay ciudades en el catálogo."
      />
    </>
  );
}
