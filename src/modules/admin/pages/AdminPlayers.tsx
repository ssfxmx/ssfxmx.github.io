import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { friendlyError } from '@/shared/lib/supabase';
import { formatDate } from '@/shared/utils/date';
import { COUNTRIES, countryName } from '@/shared/utils/format';
import { useCharacters } from '@/shared/hooks';
import {
  CitySelect,
  useCities,
  type CityValue,
} from '@/shared/components/ui/CitySelect';
import {
  Alert,
  ArcadePanel,
  Badge,
  Button,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from '@/shared/components/ui';
import { useSession } from '@/modules/auth/hooks/useSession';
import {
  useAdminPlayers,
  useSetPlayerRole,
  useSetPlayerStatus,
  useUpdatePlayer,
} from '@/modules/players/hooks';
import type { Profile } from '@/shared/types/database';
import {
  AdminHeader,
  ConfirmDialog,
  DataTable,
  TableActions,
  type Column,
} from '../shared/AdminKit';

/* ========================================================================== */
/* Edición de un jugador                                                       */
/* ========================================================================== */

/**
 * Formulario de edición en ventana modal.
 *
 * Un administrador necesita poder corregir un nickname ofensivo o resolver una
 * suplantación sin depender de que el jugador entre a hacerlo. No se edita el
 * avatar: las políticas de Storage solo permiten escribir en la carpeta del
 * propio usuario, así que un admin puede borrar una imagen inapropiada pero no
 * subir una en nombre de otro. Moderar sí, suplantar no.
 */
function EditPlayerDialog({
  player,
  onClose,
}: {
  player: Profile | null;
  onClose: () => void;
}) {
  const { data: characters } = useCharacters();
  const update = useUpdatePlayer();

  const [form, setForm] = useState<{
    nickname: string;
    city: CityValue;
    country_code: string;
    bio: string;
    main_character_id: number;
  }>({
    nickname: '',
    city: { cityId: null, cityCustom: '' },
    country_code: 'MX',
    bio: '',
    main_character_id: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!player) return;
    setError('');
    setForm({
      nickname: player.nickname,
      city: { cityId: player.city_id, cityCustom: player.city_custom ?? '' },
      country_code: player.country_code,
      bio: player.bio ?? '',
      main_character_id: player.main_character_id ?? 0,
    });
  }, [player]);

  if (!player) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const nickname = form.nickname.trim();

    // Las mismas reglas que impone la base de datos. Validar aquí solo sirve
    // para dar un mensaje claro antes de ir al servidor; el que manda es el
    // CHECK de la tabla.
    if (!/^[A-Za-z0-9_.\-]{3,20}$/.test(nickname)) {
      setError('El nickname debe tener entre 3 y 20 caracteres: letras, números, guion, punto o guion bajo.');
      return;
    }

    try {
      await update.mutateAsync({
        id: player!.id,
        input: {
          nickname,
          city_id: form.city.cityId,
          city_custom: form.city.cityId ? null : form.city.cityCustom.trim() || null,
          country_code: form.country_code,
          bio: form.bio.trim() || null,
          main_character_id: form.main_character_id || null,
        },
      });
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10"
      role="dialog"
      aria-modal="true"
    >
      <ArcadePanel className="w-full max-w-lg p-6">
        <h3 className="mb-1 font-display text-xs text-primary">EDITAR JUGADOR</h3>
        <p className="mb-5 text-xs text-ink-dim">
          Cambiar el nickname modifica la dirección de su perfil público.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label="Nickname" required>
            <Input
              value={form.nickname}
              onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
              maxLength={20}
            />
          </Field>

          <Field label="País">
            <Select
              value={form.country_code}
              onChange={(e) => setForm((p) => ({ ...p, country_code: e.target.value }))}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
          </Field>

          <CitySelect
            value={form.city}
            onChange={(city) => setForm((p) => ({ ...p, city }))}
          />

          <Field label="Personaje principal">
            <Select
              value={form.main_character_id || ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, main_character_id: Number(e.target.value) }))
              }
            >
              <option value="">Sin definir</option>
              {characters?.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Bio" hint={`${form.bio.length}/280 caracteres. Es público.`}>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              maxLength={280}
              className="min-h-[80px]"
            />
          </Field>

          <p className="text-xs text-ink-dim">
            El correo y la contraseña solo los puede cambiar el propio jugador. El avatar
            se puede quitar desde Supabase si fuera inapropiado, pero no se sustituye
            desde aquí.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={update.isPending}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </ArcadePanel>
    </div>
  );
}

/* ========================================================================== */
/* Listado                                                                     */
/* ========================================================================== */

/**
 * Administración de jugadores.
 *
 * Nunca se borra a un jugador: se suspende. Borrarlo destruiría su historial de
 * torneos, y ese historial es el activo irremplazable del proyecto.
 */
export function AdminPlayersList() {
  const { profile } = useSession();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminPlayers(search);
  const { data: cities } = useCities();

  /** El perfil guarda la ciudad como referencia o como texto libre. */
  const cityLabel = (row: Profile) =>
    cities?.find((c) => c.id === row.city_id)?.name ?? row.city_custom ?? '';

  const setStatus = useSetPlayerStatus();
  const setRole = useSetPlayerRole();

  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [promoting, setPromoting] = useState<Profile | null>(null);

  if (isLoading) return <Spinner />;

  async function handleStatus(player: Profile, status: 'active' | 'suspended') {
    setError('');
    try {
      await setStatus.mutateAsync({ id: player.id, status });
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function handleRole(player: Profile, role: 'admin' | 'player') {
    setError('');
    try {
      await setRole.mutateAsync({ id: player.id, role });
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const columns: Column<Profile>[] = [
    {
      key: 'nickname',
      header: 'Jugador',
      render: (row) => (
        <div className="min-w-0">
          <Link
            to={routes.playerDetail(row.nickname)}
            className="truncate font-medium text-ink hover:text-primary"
          >
            {row.nickname}
          </Link>
          <p className="truncate text-xs text-ink-dim">
            {cityLabel(row) ? `${cityLabel(row)}, ` : ''}
            {countryName(row.country_code)}
          </p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (row) =>
        row.role === 'admin' ? <Badge tone="magenta">Admin</Badge> : <Badge>Jugador</Badge>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) =>
        row.status === 'active' ? (
          <Badge tone="success">Activo</Badge>
        ) : (
          <Badge tone="danger">Suspendido</Badge>
        ),
    },
    {
      key: 'created',
      header: 'Alta',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-ink-dim">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const isSelf = row.id === profile?.id;

        return (
          <TableActions>
            <button
              onClick={() => setEditing(row)}
              className="text-xs text-steel hover:underline"
            >
              Editar
            </button>

            {/* Nadie se suspende ni se degrada a sí mismo desde aquí: evita
                quedarse fuera del propio panel por un clic mal dado. */}
            {!isSelf && (
              <>
                {row.status === 'active' ? (
                  <button
                    onClick={() => handleStatus(row, 'suspended')}
                    className="text-xs text-danger hover:underline"
                  >
                    Suspender
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatus(row, 'active')}
                    className="text-xs text-success hover:underline"
                  >
                    Reactivar
                  </button>
                )}

                {row.role === 'player' ? (
                  <button
                    onClick={() => setPromoting(row)}
                    className="text-xs text-primary hover:underline"
                  >
                    Hacer admin
                  </button>
                ) : (
                  <button
                    onClick={() => handleRole(row, 'player')}
                    className="text-xs text-ink-soft hover:underline"
                  >
                    Quitar admin
                  </button>
                )}
              </>
            )}
          </TableActions>
        );
      },
    },
  ];

  return (
    <>
      <AdminHeader
        title="JUGADORES"
        description="Los jugadores no se eliminan: se suspenden, para no perder su historial de torneos."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <ArcadePanel beveled={false} className="mb-5 flex gap-3 p-4">
        <UserPlus size={18} className="mt-0.5 shrink-0 text-ink-dim" />
        <div className="text-sm text-ink-soft">
          <p className="font-medium text-ink">Las cuentas se crean solas</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">
            Un jugador aparece aquí cuando se registra en el sitio. No se pueden crear
            cuentas desde el panel porque cada perfil está atado a un usuario real con su
            correo y su contraseña, y crear uno requeriría una llave de servidor que jamás
            debe vivir en el navegador. Para registrar en un torneo a alguien sin cuenta,
            usa el campo de invitado al capturar los resultados: su nombre queda en el
            historial igual.
          </p>
        </div>
      </ArcadePanel>

      <DataTable
        rows={data ?? []}
        columns={columns}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nickname…"
        emptyMessage="Todavía no hay jugadores registrados."
      />

      <EditPlayerDialog player={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={Boolean(promoting)}
        title="Dar permisos de administrador"
        message={`${promoting?.nickname} podrá publicar noticias, crear eventos, capturar resultados y administrar a otros jugadores. El cambio queda registrado en la auditoría.`}
        confirmLabel="Hacer administrador"
        loading={setRole.isPending}
        onCancel={() => setPromoting(null)}
        onConfirm={async () => {
          if (promoting) await handleRole(promoting, 'admin');
          setPromoting(null);
        }}
      />
    </>
  );
}
