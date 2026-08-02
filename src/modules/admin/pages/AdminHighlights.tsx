import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Link2 } from 'lucide-react';
import { friendlyError } from '@/shared/lib/supabase';
import { formatDate } from '@/shared/utils/date';
import { truncate } from '@/shared/utils/format';
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
import { useAdminEvents } from '@/modules/events/hooks';
import {
  useAdminHighlight,
  useAdminHighlights,
  useCreateHighlight,
  useDeleteHighlight,
  useUpdateHighlight,
} from '@/modules/highlights/hooks';
import {
  HighlightPlayer,
  PlatformBadge,
} from '@/modules/highlights/components/HighlightPlayer';
import { detectLink, PLATFORM_LABELS } from '@/shared/utils/socialLinks';
import type { Highlight } from '@/modules/highlights/services/highlights.service';
import type { ContentStatus } from '@/shared/types/database';
import {
  AdminHeader,
  ConfirmDialog,
  ContentStatusBadge,
  DataTable,
  EditLink,
  TableActions,
  type Column,
} from '../shared/AdminKit';

/* ========================================================================== */
/* Listado                                                                     */
/* ========================================================================== */

export function AdminHighlightsList() {
  const { data, isLoading } = useAdminHighlights();
  const remove = useDeleteHighlight();
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<Highlight | null>(null);

  if (isLoading) return <Spinner />;

  const rows = (data ?? []).filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Highlight>[] = [
    {
      key: 'title',
      header: 'Clip',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.title}</p>
          <p className="truncate text-xs text-ink-dim">
            {truncate(row.description ?? row.url, 60)}
          </p>
        </div>
      ),
    },
    {
      key: 'platform',
      header: 'Plataforma',
      render: (row) => <PlatformBadge platform={row.platform} />,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <ContentStatusBadge status={row.status} />,
    },
    {
      key: 'date',
      header: 'Publicado',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-ink-dim">
          {row.published_at ? formatDate(row.published_at) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <TableActions>
          <EditLink to={`/admin/highlights/${row.id}`} />
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
        title="HIGHLIGHTS"
        description="Clips de combates memorables. Se guarda el enlace, no el video."
        action={
          <LinkButton to="/admin/highlights/nuevo" size="sm">
            Nuevo highlight
          </LinkButton>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar clip…"
        emptyMessage="Todavía no has publicado ningún clip."
      />

      <ConfirmDialog
        open={Boolean(target)}
        title="Eliminar highlight"
        message={`"${target?.title}" dejará de aparecer en el sitio. El video original en su plataforma no se toca.`}
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

/**
 * Publicar un highlight.
 *
 * El flujo se diseñó alrededor de una sola acción: pegar el enlace. En cuanto
 * se pega, se detecta la plataforma, se extrae el identificador del video y se
 * muestra la vista previa real — la misma que verá el visitante. Así se
 * descubre AQUÍ si el enlace está mal, y no cuando alguien se queja de que un
 * clip no carga.
 */
export function AdminHighlightForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nuevo';
  const navigate = useNavigate();
  const { session } = useSession();

  const { data: existing, isLoading } = useAdminHighlight(isNew ? undefined : id);
  const { data: events } = useAdminEvents();
  const create = useCreateHighlight();
  const update = useUpdateHighlight();

  const [form, setForm] = useState({
    title: '',
    description: '',
    url: '',
    event_id: '',
    status: 'draft' as ContentStatus,
    is_featured: false,
    display_order: 0,
    thumbnail_url: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title,
      description: existing.description ?? '',
      url: existing.url,
      event_id: existing.event_id ?? '',
      status: existing.status,
      is_featured: existing.is_featured,
      display_order: existing.display_order,
      thumbnail_url: existing.thumbnail_url ?? '',
    });
  }, [existing]);

  // Se recalcula con cada tecla: es una operación de texto, no cuesta nada.
  const detected = useMemo(() => detectLink(form.url), [form.url]);

  if (!isNew && isLoading) return <Spinner />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (form.title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres.');
      return;
    }
    if (!/^https?:\/\//i.test(form.url.trim())) {
      setError('El enlace debe empezar por http:// o https://');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      url: form.url.trim(),
      platform: detected.platform,
      embed_id: detected.embedId,
      thumbnail_url: form.thumbnail_url.trim() || detected.thumbnailUrl,
      event_id: form.event_id || null,
      status: form.status,
      is_featured: form.is_featured,
      display_order: Number(form.display_order) || 0,
    };

    try {
      if (isNew) {
        await create.mutateAsync({ ...payload, created_by: session?.user.id ?? null });
      } else {
        await update.mutateAsync({ id: id!, input: payload });
      }
      navigate('/admin/highlights');
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <>
      <AdminHeader title={isNew ? 'NUEVO HIGHLIGHT' : 'EDITAR HIGHLIGHT'} />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        <ArcadePanel beveled={false} className="space-y-5 p-6">
          <Field
            label="Enlace del video"
            required
            hint="Pega la dirección de YouTube, Twitch, X, TikTok, Instagram, Facebook o Kick."
          >
            <div className="relative">
              <Link2
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
              />
              <Input
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://…"
                className="pl-9"
              />
            </div>
          </Field>

          {form.url.trim().length > 8 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <PlatformBadge platform={detected.platform} />
                {detected.embeddable ? (
                  <span className="flex items-center gap-1.5 text-success">
                    <Check size={14} /> Se reproduce dentro del sitio
                  </span>
                ) : detected.platform === 'other' ? (
                  <span className="text-ink-dim">
                    No se reconoció la plataforma. Se mostrará como enlace.
                  </span>
                ) : (
                  <span className="text-ink-dim">
                    {PLATFORM_LABELS[detected.platform]} no permite incrustar sin cargar
                    sus rastreadores: se mostrará como tarjeta con enlace.
                  </span>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-dim">
                  Así lo verá el visitante
                </p>
                <HighlightPlayer
                  platform={detected.platform}
                  embedId={detected.embedId}
                  url={form.url}
                  title={form.title || 'Vista previa'}
                  thumbnailUrl={form.thumbnail_url || detected.thumbnailUrl}
                />
              </div>
            </div>
          )}
        </ArcadePanel>

        <ArcadePanel beveled={false} className="space-y-5 p-6">
          <Field label="Título" required>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              maxLength={160}
              placeholder="Ej.: Remontada en la final con un pixel de vida"
            />
          </Field>

          <Field label="Descripción" hint="Contexto del combate. Opcional.">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              maxLength={500}
              className="min-h-[90px]"
            />
          </Field>

          <Field label="Torneo" hint="Vincula el clip a un evento. Opcional.">
            <Select
              value={form.event_id}
              onChange={(e) => setForm((p) => ({ ...p, event_id: e.target.value }))}
            >
              <option value="">Sin torneo asociado</option>
              {events?.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </Select>
          </Field>

          {!detected.thumbnailUrl && (
            <Field
              label="Miniatura"
              hint="Solo YouTube la genera sola. Para el resto puedes pegar la URL de una imagen."
            >
              <Input
                value={form.thumbnail_url}
                onChange={(e) => setForm((p) => ({ ...p, thumbnail_url: e.target.value }))}
                placeholder="https://…"
              />
            </Field>
          )}
        </ArcadePanel>

        <ArcadePanel beveled={false} className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estado">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as ContentStatus }))
                }
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </Select>
            </Field>

            <Field label="Orden" hint="Menor número aparece antes.">
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm((p) => ({ ...p, display_order: Number(e.target.value) }))
                }
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
              className="h-4 w-4 accent-[rgb(var(--color-primary))]"
            />
            Destacar: aparece grande al inicio de la galería
          </label>
        </ArcadePanel>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isNew ? 'Publicar highlight' : 'Guardar cambios'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/highlights')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
