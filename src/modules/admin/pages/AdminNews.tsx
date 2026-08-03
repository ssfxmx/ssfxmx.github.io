import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { friendlyError } from '@/shared/lib/supabase';
import {
  formatDate,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '@/shared/utils/date';
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
import { Markdown } from '@/shared/components/ui/Markdown';
import { useSession } from '@/modules/auth/hooks/useSession';
import {
  useAdminNews,
  useAdminNewsItem,
  useCreateNews,
  useDeleteNews,
  useUpdateNews,
} from '@/modules/news/hooks';
import type { ContentStatus } from '@/shared/types/database';
import {
  AdminHeader,
  ConfirmDialog,
  ContentStatusBadge,
  CoverUpload,
  DataTable,
  EditLink,
  TableActions,
  type Column,
} from '../shared/AdminKit';
import type { News } from '@/shared/types/database';

/* ========================================================================== */
/* Listado                                                                     */
/* ========================================================================== */

export function AdminNewsList() {
  const { data, isLoading } = useAdminNews();
  const remove = useDeleteNews();
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<News | null>(null);

  if (isLoading) return <Spinner />;

  const rows = (data ?? []).filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<News>[] = [
    {
      key: 'title',
      header: 'Título',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.title}</p>
          <p className="truncate text-xs text-ink-dim">{truncate(row.excerpt ?? '', 60)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <ContentStatusBadge status={row.status} />,
    },
    {
      key: 'date',
      header: 'Publicada',
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
          <EditLink to={routes.adminNewsEdit(row.id)} />
          <button
            onClick={() => setTarget(row)}
            className="text-xs text-danger hover:underline"
          >
            Eliminar
          </button>
        </TableActions>
      ),
    },
  ];

  return (
    <>
      <AdminHeader
        title="NOTICIAS"
        description="Publicaciones de la comunidad en orden cronológico."
        action={<LinkButton to={routes.adminNewsNew} size="sm">Nueva noticia</LinkButton>}
      />

      <DataTable
        rows={rows}
        columns={columns}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por título…"
        emptyMessage="Todavía no has publicado ninguna noticia."
      />

      <ConfirmDialog
        open={Boolean(target)}
        title="Eliminar noticia"
        message={`"${target?.title}" se borrará permanentemente. Esta acción no se puede deshacer.`}
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

export function AdminNewsForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nueva';
  const navigate = useNavigate();
  const { session } = useSession();

  const { data: existing, isLoading } = useAdminNewsItem(isNew ? undefined : id);
  const create = useCreateNews();
  const update = useUpdateNews();

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    body_md: '',
    cover_path: null as string | null,
    status: 'draft' as ContentStatus,
    is_featured: false,
    published_at: '',
  });
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title,
      excerpt: existing.excerpt ?? '',
      body_md: existing.body_md,
      cover_path: existing.cover_path,
      status: existing.status,
      is_featured: existing.is_featured,
      published_at: toDateTimeLocalValue(existing.published_at),
    });
  }, [existing]);

  if (!isNew && isLoading) return <Spinner />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (form.title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres.');
      return;
    }
    if (form.body_md.trim().length === 0) {
      setError('El cuerpo de la noticia no puede estar vacío.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      body_md: form.body_md,
      cover_path: form.cover_path,
      status: form.status,
      is_featured: form.is_featured,
      // Si se deja vacía al publicar, el trigger de la base pone la de hoy.
      // Rellenarla permite cargar noticias antiguas con su fecha real.
      published_at: form.published_at
        ? fromDateTimeLocalValue(form.published_at)
        : null,
    };

    try {
      if (isNew) {
        await create.mutateAsync({ ...payload, author_id: session?.user.id ?? null });
      } else {
        await update.mutateAsync({ id: id!, input: payload });
      }
      navigate(routes.adminNews);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <>
      <AdminHeader title={isNew ? 'NUEVA NOTICIA' : 'EDITAR NOTICIA'} />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        <ArcadePanel beveled={false} className="space-y-5 p-6">
          <Field label="Título" required hint="El enlace de la noticia se genera a partir de él.">
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              maxLength={160}
            />
          </Field>

          <Field
            label="Resumen"
            hint="Aparece en el listado y como vista previa al compartir en WhatsApp o Discord."
          >
            <Textarea
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              maxLength={320}
              className="min-h-[80px]"
            />
          </Field>

          <CoverUpload
            value={form.cover_path}
            onChange={(path) => setForm((prev) => ({ ...prev, cover_path: path }))}
            folder="news"
          />
        </ArcadePanel>

        <ArcadePanel beveled={false} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink-soft">
              Contenido <span className="text-primary">*</span>
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? 'Editar' : 'Vista previa'}
            </Button>
          </div>

          {showPreview ? (
            <div className="min-h-[300px] rounded border border-edge bg-base p-4">
              <Markdown>{form.body_md || '*Nada que mostrar todavía.*'}</Markdown>
            </div>
          ) : (
            <Textarea
              value={form.body_md}
              onChange={(e) => setForm((prev) => ({ ...prev, body_md: e.target.value }))}
              className="min-h-[300px] font-mono text-sm"
              placeholder={'## Subtítulo\n\nEscribe en Markdown.\n\n- Lista\n- De puntos\n\n[Un enlace](https://ejemplo.com)'}
            />
          )}

          <p className="text-xs text-ink-dim">
            Se admite Markdown: <code>##</code> para subtítulos, <code>**negrita**</code>,{' '}
            <code>[texto](url)</code> para enlaces, <code>-</code> para listas.
          </p>
        </ArcadePanel>

        <ArcadePanel beveled={false} className="space-y-4 p-6">
          <Field label="Estado">
            <Select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value as ContentStatus }))
              }
            >
              <option value="draft">Borrador — solo tú la ves</option>
              <option value="published">Publicada — visible para todos</option>
              <option value="archived">Archivada</option>
            </Select>
          </Field>

          <Field
            label="Fecha de publicación"
            hint="Déjala vacía y se usa la de hoy. Rellénala para cargar una noticia antigua con su fecha real: el listado se ordena por este campo."
          >
            <Input
              type="datetime-local"
              value={form.published_at}
              onChange={(e) => setForm((prev) => ({ ...prev, published_at: e.target.value }))}
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
              className="h-4 w-4 accent-[rgb(var(--color-primary))]"
            />
            Destacar en la portada
          </label>
        </ArcadePanel>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isNew ? 'Crear noticia' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(routes.adminNews)}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
