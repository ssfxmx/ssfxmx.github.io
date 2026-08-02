import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { friendlyError } from '@/shared/lib/supabase';
import { formatDate } from '@/shared/utils/date';
import { countryName } from '@/shared/utils/format';
import { Alert, Badge, Spinner } from '@/shared/components/ui';
import { useSession } from '@/modules/auth/hooks/useSession';
import { useAdminPlayers, useSetPlayerRole, useSetPlayerStatus } from '@/modules/players/hooks';
import type { Profile } from '@/shared/types/database';
import {
  AdminHeader,
  ConfirmDialog,
  DataTable,
  TableActions,
  type Column,
} from '../shared/AdminKit';

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

  const setStatus = useSetPlayerStatus();
  const setRole = useSetPlayerRole();

  const [error, setError] = useState('');
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
            {row.city ? `${row.city}, ` : ''}
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
        // Nadie se administra a sí mismo desde aquí: evita que alguien se
        // suspenda por error y se quede fuera de su propio panel.
        if (row.id === profile?.id) {
          return <span className="text-xs text-ink-dim">Tú</span>;
        }

        return (
          <TableActions>
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
                className="text-xs text-cyan hover:underline"
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

      <div className="mt-4">
        <DataTable
          rows={data ?? []}
          columns={columns}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nickname…"
          emptyMessage="Todavía no hay jugadores registrados."
        />
      </div>

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
