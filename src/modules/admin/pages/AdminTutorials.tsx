import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { friendlyError } from '@/shared/lib/supabase';
import { DIFFICULTY_LABELS } from '@/shared/utils/format';
import {
  Alert,
  ArcadePanel,
  Badge,
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
  useAdminTutorial,
  useAdminTutorials,
  useCreateTutorial,
  useDeleteTutorial,
  useTutorialCategories,
  useUpdateTutorial,
} from '@/modules/tutorials/hooks';
import type { ContentStatus, Tutorial } from '@/shared/types/database';
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

export function AdminTutorialsList() {
  const { data, isLoading } = useAdminTutorials();
  const { data: categories } = useTutorialCategories();
  const remove = useDeleteTutorial();
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<Tutorial | null>(null);

  if (isLoading) return <Spinner />;

  const rows = (data ?? []).filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Tutorial>[] = [
    {
      key: 'title',
      header: 'Título',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.title}</p>
          <p className="text-xs text-ink-dim">
            {categories?.find((c) => c.id === row.category_id)?.name ?? 'Sin categoría'}
          </p>
        </div>
      ),
    },
    {
      key: 'difficulty',
      header: 'Nivel',
      render: (row) => <Badge>{DIFFICULTY_LABELS[row.difficulty] ?? '—'}</Badge>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <ContentStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <TableActions>
          <EditLink to={routes.adminTutorialsEdit(row.id)} />
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
        title="TUTORIALES"
        description="Guías de la comunidad. El orden dentro de cada categoría es pedagógico, no cronológico."
        action={<LinkButton to={routes.adminTutorialsNew} size="sm">Nuevo tutorial</LinkButton>}
      />

      <DataTable
        rows={rows}
        columns={columns}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar tutorial…"
        emptyMessage="Todavía no hay guías. La primera debería ser cómo instalar Fightcade."
      />

      <ConfirmDialog
        open={Boolean(target)}
        title="Eliminar tutorial"
        message={`"${target?.title}" se borrará permanentemente.`}
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

export function AdminTutorialForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nuevo';
  const navigate = useNavigate();
  const { session } = useSession();

  const { data: existing, isLoading } = useAdminTutorial(isNew ? undefined : id);
  const { data: categories } = useTutorialCategories();
  const create = useCreateTutorial();
  const update = useUpdateTutorial();

  const [form, setForm] = useState({
    title: '',
    summary: '',
    body_md: '',
    category_id: '' as string | number,
    difficulty: 1,
    estimated_min: '',
    cover_path: null as string | null,
    status: 'draft' as ContentStatus,
    display_order: 0,
  });
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title,
      summary: existing.summary ?? '',
      body_md: existing.body_md,
      category_id: existing.category_id ?? '',
      difficulty: existing.difficulty,
      estimated_min: existing.estimated_min?.toString() ?? '',
      cover_path: existing.cover_path,
      status: existing.status,
      display_order: existing.display_order,
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
    if (!form.body_md.trim()) {
      setError('El contenido no puede estar vacío.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      body_md: form.body_md,
      category_id: form.category_id ? Number(form.category_id) : null,
      difficulty: form.difficulty,
      estimated_min: form.estimated_min ? Number(form.estimated_min) : null,
      cover_path: form.cover_path,
      status: form.status,
      display_order: Number(form.display_order) || 0,
    };

    try {
      if (isNew) {
        await create.mutateAsync({ ...payload, author_id: session?.user.id ?? null });
      } else {
        await update.mutateAsync({ id: id!, input: payload });
      }
      navigate(routes.adminTutorials);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <>
      <AdminHeader title={isNew ? 'NUEVO TUTORIAL' : 'EDITAR TUTORIAL'} />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        <ArcadePanel beveled={false} className="space-y-5 p-6">
          <Field label="Título" required>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              maxLength={160}
            />
          </Field>

          <Field label="Resumen">
            <Textarea
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              maxLength={320}
              className="min-h-[70px]"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Categoría">
              <Select
                value={form.category_id}
                onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              >
                <option value="">Sin categoría</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Dificultad">
              <Select
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: Number(e.target.value) }))}
              >
                <option value={1}>Principiante</option>
                <option value={2}>Intermedio</option>
                <option value={3}>Avanzado</option>
              </Select>
            </Field>

            <Field label="Duración (min)">
              <Input
                type="number"
                min={1}
                value={form.estimated_min}
                onChange={(e) => setForm((p) => ({ ...p, estimated_min: e.target.value }))}
              />
            </Field>
          </div>

          <CoverUpload
            value={form.cover_path}
            onChange={(path) => setForm((p) => ({ ...p, cover_path: path }))}
            folder="tutorials"
          />
        </ArcadePanel>

        <ArcadePanel beveled={false} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink-soft">
              Contenido <span className="text-primary">*</span>
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPreview((v) => !v)}>
              {preview ? 'Editar' : 'Vista previa'}
            </Button>
          </div>

          {preview ? (
            <div className="min-h-[300px] rounded border border-edge bg-base p-4">
              <Markdown>{form.body_md || '*Nada que mostrar todavía.*'}</Markdown>
            </div>
          ) : (
            <Textarea
              value={form.body_md}
              onChange={(e) => setForm((p) => ({ ...p, body_md: e.target.value }))}
              className="min-h-[320px] font-mono text-sm"
              placeholder={'## Paso 1\n\nDescribe el paso.\n\n1. Primero esto\n2. Luego lo otro'}
            />
          )}
        </ArcadePanel>

        <ArcadePanel beveled={false} className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Estado">
            <Select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContentStatus }))}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </Select>
          </Field>

          <Field label="Orden" hint="Menor número aparece primero dentro de su categoría.">
            <Input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
            />
          </Field>
        </ArcadePanel>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isNew ? 'Crear tutorial' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(routes.adminTutorials)}>
            Cancelar
          </Button>
        </div>
      </form>
    </>
  );
}
