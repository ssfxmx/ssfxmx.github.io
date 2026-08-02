import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { friendlyError } from '@/shared/lib/supabase';
import {
  formatDateTime,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '@/shared/utils/date';
import {
  Alert,
  ArcadePanel,
  Button,
  Field,
  Input,
  LinkButton,
  Select,
  Spinner,
  Textarea,
} from '@/shared/components/ui';
import { useSession } from '@/modules/auth/hooks/useSession';
import {
  useAdminEvent,
  useAdminEvents,
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from '@/modules/events/hooks';
import { EventStatusBadge, KIND_LABELS, MODE_LABELS } from '@/modules/events/components/EventBits';
import type { EventKind, EventMode, EventRecord, EventStatus } from '@/shared/types/database';
import {
  AdminHeader,
  ConfirmDialog,
  CoverUpload,
  DataTable,
  EditLink,
  TableActions,
  type Column,
} from '../shared/AdminKit';

/* ========================================================================== */
/* Listado                                                                     */
/* ========================================================================== */

export function AdminEventsList() {
  const { data, isLoading } = useAdminEvents();
  const remove = useDeleteEvent();
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<EventRecord | null>(null);

  if (isLoading) return <Spinner />;

  const rows = (data ?? []).filter((event) =>
    event.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<EventRecord>[] = [
    {
      key: 'name',
      header: 'Evento',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.name}</p>
          <p className="text-xs text-ink-dim">
            {KIND_LABELS[row.kind]} · {MODE_LABELS[row.mode]}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-ink-dim">
          {formatDateTime(row.starts_at)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <EventStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <TableActions>
          <EditLink to={routes.adminEventsEdit(row.id)} />
          {row.status === 'finished' && (
            <a href={routes.adminResultsEdit(row.id)} className="text-xs text-primary hover:underline">
              Resultados
            </a>
          )}
          <button onClick={() => setTarget(row)} className="text-xs text-danger hover:underline">
            Eliminar
          </button>
        </TableActions>
      ),
    },
  ];

  return (
    <>
      <AdminHeader
        title="EVENTOS"
        description="Torneos, casuales y talleres de la comunidad."
        action={<LinkButton to={routes.adminEventsNew} size="sm">Nuevo evento</LinkButton>}
      />

      <DataTable
        rows={rows}
        columns={columns}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar evento…"
        emptyMessage="Todavía no has creado ningún evento."
      />

      <ConfirmDialog
        open={Boolean(target)}
        title="Eliminar evento"
        message={`"${target?.name}" y TODOS sus resultados se borrarán permanentemente. Si el torneo ya ocurrió, considera marcarlo como cancelado en lugar de borrarlo: así se conserva el historial.`}
        loading={remove.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={async () => {
          if (target) await remove.mutateAsync(target.id);
          setTarget(null);
        }}
      />
    </>
  );
}

/* ========================================================================== */
/* Formulario                                                                  */
/* ========================================================================== */

const EMPTY = {
  name: '',
  description_md: '',
  kind: 'tournament' as EventKind,
  mode: 'online' as EventMode,
  status: 'draft' as EventStatus,
  starts_at: '',
  ends_at: '',
  venue_name: '',
  venue_address: '',
  stream_url: '',
  registration_url: '',
  cover_path: null as string | null,
  max_participants: '',
  rules: '',
  prizes: '',
};

export function AdminEventForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nuevo';
  const navigate = useNavigate();
  const { session } = useSession();

  const { data: existing, isLoading } = useAdminEvent(isNew ? undefined : id);
  const create = useCreateEvent();
  const update = useUpdateEvent();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!existing) return;
    const extra = (existing.extra ?? {}) as Record<string, string>;
    setForm({
      name: existing.name,
      description_md: existing.description_md ?? '',
      kind: existing.kind,
      mode: existing.mode,
      status: existing.status,
      starts_at: toDateTimeLocalValue(existing.starts_at),
      ends_at: toDateTimeLocalValue(existing.ends_at),
      venue_name: existing.venue_name ?? '',
      venue_address: existing.venue_address ?? '',
      stream_url: existing.stream_url ?? '',
      registration_url: existing.registration_url ?? '',
      cover_path: existing.cover_path,
      max_participants: existing.max_participants?.toString() ?? '',
      rules: extra.reglas ?? '',
      prizes: extra.premios ?? '',
    });
  }, [existing]);

  if (!isNew && isLoading) return <Spinner />;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (form.name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    if (!form.starts_at) {
      setError('Selecciona la fecha y hora de inicio.');
      return;
    }
    if (form.mode === 'presencial' && !form.venue_name.trim()) {
      setError('Un evento presencial necesita nombre de sede.');
      return;
    }

    // Los datos que solo se muestran van en `extra`. Si algún día hay que
    // filtrar u ordenar por ellos, se promueven a columna en una migración.
    const extra: Record<string, string> = {};
    if (form.rules.trim()) extra.reglas = form.rules.trim();
    if (form.prizes.trim()) extra.premios = form.prizes.trim();

    const payload = {
      name: form.name.trim(),
      description_md: form.description_md.trim() || null,
      kind: form.kind,
      mode: form.mode,
      status: form.status,
      starts_at: fromDateTimeLocalValue(form.starts_at),
      ends_at: form.ends_at ? fromDateTimeLocalValue(form.ends_at) : null,
      venue_name: form.venue_name.trim() || null,
      venue_address: form.venue_address.trim() || null,
      stream_url: form.stream_url.trim() || null,
      registration_url: form.registration_url.trim() || null,
      cover_path: form.cover_path,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      extra,
    };

    try {
      if (isNew) {
        await create.mutateAsync({ ...payload, created_by: session?.user.id ?? null });
      } else {
        await update.mutateAsync({ id: id!, input: payload });
      }
      navigate(routes.adminEvents);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <>
      <AdminHeader title={isNew ? 'NUEVO EVENTO' : 'EDITAR EVENTO'} />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        <ArcadePanel beveled={false} className="space-y-5 p-6">
          <Field label="Nombre" required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={160} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tipo">
              <Select value={form.kind} onChange={(e) => set('kind', e.target.value as EventKind)}>
                <option value="tournament">Torneo</option>
                <option value="casual">Casuales</option>
                <option value="exhibition">Exhibición</option>
                <option value="workshop">Taller</option>
              </Select>
            </Field>

            <Field label="Modalidad">
              <Select value={form.mode} onChange={(e) => set('mode', e.target.value as EventMode)}>
                <option value="online">En línea</option>
                <option value="presencial">Presencial</option>
                <option value="hibrido">Híbrido</option>
              </Select>
            </Field>

            <Field label="Estado">
              <Select
                value={form.status}
                onChange={(e) => set('status', e.target.value as EventStatus)}
              >
                <option value="draft">Borrador</option>
                <option value="scheduled">Programado</option>
                <option value="open">Inscripciones abiertas</option>
                <option value="live">En vivo</option>
                <option value="finished">Finalizado</option>
                <option value="cancelled">Cancelado</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Inicio" required hint="Hora de la Ciudad de México.">
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
              />
            </Field>

            <Field label="Fin" hint="Opcional.">
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
              />
            </Field>
          </div>
        </ArcadePanel>

        <ArcadePanel beveled={false} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Sede"
              required={form.mode === 'presencial'}
              hint={form.mode === 'online' ? 'Ej.: Fightcade' : undefined}
            >
              <Input value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} />
            </Field>

            <Field label="Dirección">
              <Input
                value={form.venue_address}
                onChange={(e) => set('venue_address', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Enlace de inscripción">
              <Input
                type="url"
                value={form.registration_url}
                onChange={(e) => set('registration_url', e.target.value)}
                placeholder="https://…"
              />
            </Field>

            <Field label="Enlace de transmisión">
              <Input
                type="url"
                value={form.stream_url}
                onChange={(e) => set('stream_url', e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>

          <Field label="Cupo máximo">
            <Input
              type="number"
              min={1}
              value={form.max_participants}
              onChange={(e) => set('max_participants', e.target.value)}
            />
          </Field>

          <CoverUpload
            value={form.cover_path}
            onChange={(path) => set('cover_path', path)}
            folder="events"
          />
        </ArcadePanel>

        <ArcadePanel beveled={false} className="space-y-5 p-6">
          <Field label="Descripción" hint="Se admite Markdown.">
            <Textarea
              value={form.description_md}
              onChange={(e) => set('description_md', e.target.value)}
              className="min-h-[160px] font-mono text-sm"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reglas" hint="Información adicional.">
              <Input value={form.rules} onChange={(e) => set('rules', e.target.value)} />
            </Field>

            <Field label="Premios">
              <Input value={form.prizes} onChange={(e) => set('prizes', e.target.value)} />
            </Field>
          </div>
        </ArcadePanel>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isNew ? 'Crear evento' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(routes.adminEvents)}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
