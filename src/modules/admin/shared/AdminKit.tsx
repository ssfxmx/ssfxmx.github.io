import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Search } from 'lucide-react';
import { storagePublicUrl, supabase } from '@/shared/lib/supabase';
import {
  ArcadePanel,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
} from '@/shared/components/ui';
import type { ContentStatus } from '@/shared/types/database';

/**
 * Piezas comunes del panel de administración.
 *
 * Toda pantalla del panel es una combinación de estas cuatro. Es lo que hace
 * que añadir el CRUD de un módulo nuevo sean ~150 líneas y no ~800, y donde el
 * requisito de "componentes reutilizables" se cobra de verdad.
 */

/* ========================================================================== */
/* Cabecera de página                                                          */
/* ========================================================================== */

export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-sm text-primary">{title}</h1>
        {description && <p className="mt-2 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ========================================================================== */
/* Tabla de datos                                                              */
/* ========================================================================== */

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string | number }>({
  rows,
  columns,
  emptyMessage = 'No hay registros.',
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar…',
}: {
  rows: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  return (
    <div className="space-y-4">
      {onSearchChange && (
        <div className="relative max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim"
          />
          <Input
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      )}

      {rows.length === 0 ? (
        <ArcadePanel beveled={false}>
          <EmptyState title="Sin registros" message={emptyMessage} />
        </ArcadePanel>
      ) : (
        <ArcadePanel beveled={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs uppercase tracking-wide text-ink-dim ${column.className ?? ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-edge/50 last:border-0 hover:bg-surface-raised/50">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ArcadePanel>
      )}
    </div>
  );
}

/* ========================================================================== */
/* Confirmación de acciones destructivas                                       */
/* ========================================================================== */

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <ArcadePanel className="w-full max-w-md p-6">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <h3 className="font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </ArcadePanel>
    </div>
  );
}

/* ========================================================================== */
/* Indicadores de estado                                                       */
/* ========================================================================== */

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const map = {
    draft: { label: 'Borrador', tone: 'neutral' as const },
    published: { label: 'Publicado', tone: 'success' as const },
    archived: { label: 'Archivado', tone: 'danger' as const },
  };
  const config = map[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

export function TableActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function EditLink({ to }: { to: string }) {
  return (
    <Link to={to} className="text-xs text-cyan hover:text-primary">
      Editar
    </Link>
  );
}

/* ========================================================================== */
/* Subida de imágenes de portada                                               */
/* ========================================================================== */

/**
 * Sube una portada al bucket `media`.
 *
 * Solo los administradores pueden escribir ahí; la política de Storage lo
 * impone, así que este componente no necesita comprobar permisos: si alguien
 * sin rol lo intentara, la subida fallaría en el servidor.
 */
export function CoverUpload({
  value,
  onChange,
  folder,
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const preview = storagePublicUrl('media', value);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError('');
    setUploading(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${folder}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;
      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label="Imagen de portada" hint="Máximo 3 MB. Se usa como vista previa al compartir el enlace.">
      <div className="space-y-3">
        {preview && (
          <div className="relative inline-block">
            <img
              src={preview}
              alt=""
              className="h-32 rounded border border-edge object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -right-2 -top-2 rounded-full bg-danger px-2 py-0.5 text-xs text-white"
            >
              Quitar
            </button>
          </div>
        )}

        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded border border-edge bg-surface-raised px-4 py-2 text-sm hover:border-cyan hover:text-cyan">
          {uploading ? 'Subiendo…' : preview ? 'Cambiar imagen' : 'Subir imagen'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </Field>
  );
}
