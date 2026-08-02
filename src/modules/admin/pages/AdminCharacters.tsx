import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Upload } from 'lucide-react';
import { friendlyError, storagePublicUrl } from '@/shared/lib/supabase';
import {
  listAllCharacters,
  updateCharacter,
  uploadCharacterIcon,
} from '@/shared/lib/catalog.service';
import { monogramDataUri, prepareAvatarFile } from '@/shared/utils/avatar';
import { Alert, ArcadePanel, Spinner } from '@/shared/components/ui';
import type { Character } from '@/shared/types/database';
import { AdminHeader, ConfirmDialog } from '../shared/AdminKit';

/**
 * Iconos de personaje.
 *
 * Cada personaje puede tener una imagen propia. Si no la tiene, su avatar sigue
 * siendo el monograma generado por código: los dos sistemas conviven, así que
 * se pueden ir subiendo de uno en uno sin que nada quede a medias, y quitar una
 * imagen no rompe nada.
 *
 * Las imágenes se reducen a 256x256 y se convierten a WebP en el navegador
 * antes de subirlas. Una imagen de 1024x1024 pesa cerca de un megabyte; a este
 * tamaño baja a unos veinte kilobytes, y se ve idéntica en un avatar.
 */
function CharacterTile({
  character,
  onUploaded,
  onRemove,
}: {
  character: Character;
  onUploaded: (id: number, path: string) => void;
  onRemove: (character: Character) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const iconUrl = storagePublicUrl('media', character.icon_path);
  const preview = iconUrl ?? monogramDataUri(character.initials, character.color_hex);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError('');
    setUploading(true);

    try {
      const blob = await prepareAvatarFile(file, 256);
      const path = await uploadCharacterIcon(character.slug, blob);
      onUploaded(character.id, path);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <ArcadePanel beveled={false} className="p-4">
      <div className="flex items-center gap-4">
        <img
          src={preview}
          alt=""
          width={64}
          height={64}
          className="arcade-clip h-16 w-16 shrink-0 bg-surface-raised object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{character.name}</p>
          <p className="text-xs text-ink-dim">
            {character.icon_path ? 'Icono propio' : 'Monograma generado'}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-edge bg-surface-raised px-2.5 py-1.5 text-xs transition-colors hover:border-steel hover:text-steel">
              <Upload size={12} />
              {uploading ? 'Subiendo…' : character.icon_path ? 'Cambiar' : 'Subir'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {character.icon_path && (
              <button
                onClick={() => onRemove(character)}
                className="inline-flex items-center gap-1 text-xs text-danger hover:underline"
              >
                <Trash2 size={12} /> Quitar
              </button>
            )}
          </div>

          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>
      </div>
    </ArcadePanel>
  );
}

export function AdminCharactersPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [removing, setRemoving] = useState<Character | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'characters'],
    queryFn: listAllCharacters,
  });

  const save = useMutation({
    mutationFn: ({ id, iconPath }: { id: number; iconPath: string | null }) =>
      updateCharacter(id, { icon_path: iconPath }),
    onSuccess: () => {
      // Se invalida el catálogo público además del de administración: si no,
      // los avatares seguirían mostrando el monograma hasta recargar.
      queryClient.invalidateQueries({ queryKey: ['admin', 'characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      setMessage('Guardado.');
      setError('');
    },
    onError: (err) => setError(friendlyError(err)),
  });

  if (isLoading) return <Spinner />;

  const withIcon = (data ?? []).filter((c) => c.icon_path).length;

  return (
    <>
      <AdminHeader
        title="PERSONAJES"
        description="Icono de cada personaje. Quien no tenga imagen propia usa el monograma generado por código."
      />

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      <ArcadePanel beveled={false} className="mb-5 p-4">
        <p className="text-sm text-ink-soft">
          <strong className="text-primary">
            {withIcon} de {data?.length ?? 0}
          </strong>{' '}
          personajes tienen icono propio.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-dim">
          Las imágenes se recortan en cuadrado, se reducen a 256 píxeles y se convierten a
          WebP antes de subirse, así que da igual el tamaño del archivo original. Quitar un
          icono devuelve a ese personaje a su monograma sin romper ningún avatar.
        </p>
      </ArcadePanel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((character) => (
          <CharacterTile
            key={character.id}
            character={character}
            onUploaded={(id, path) => save.mutate({ id, iconPath: path })}
            onRemove={setRemoving}
          />
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Quitar icono"
        message={`${removing?.name} volverá a mostrarse con su monograma de iniciales. El archivo permanece en el almacenamiento y puedes volver a asignarlo subiéndolo de nuevo.`}
        confirmLabel="Quitar"
        loading={save.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) save.mutate({ id: removing.id, iconPath: null });
          setRemoving(null);
        }}
      />
    </>
  );
}
