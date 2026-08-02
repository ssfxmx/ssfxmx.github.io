import { Link } from 'react-router-dom';
import { CalendarPlus, FilePlus, Trophy, Users } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { formatDate } from '@/shared/utils/date';
import { ArcadePanel, Badge, LinkButton, Spinner } from '@/shared/components/ui';
import { useAdminNews } from '@/modules/news/hooks';
import { useAdminEvents } from '@/modules/events/hooks';
import { useAdminPlayers } from '@/modules/players/hooks';
import { AdminHeader } from '../shared/AdminKit';

function Metric({
  label,
  value,
  to,
}: {
  label: string;
  value: number | string;
  to: string;
}) {
  return (
    <Link to={to}>
      <ArcadePanel beveled={false} className="p-5 transition-colors hover:border-primary/60">
        <div className="font-display text-xl text-primary">{value}</div>
        <div className="mt-2 text-xs uppercase tracking-wide text-ink-dim">{label}</div>
      </ArcadePanel>
    </Link>
  );
}

/**
 * Resumen del panel.
 *
 * Muestra lo que un administrador necesita saber al entrar: qué hay pendiente
 * de publicar y qué torneo espera resultados. No es un cuadro de mando con
 * gráficas: eso llega en la Fase 3, con datos reales que respalden las cifras.
 */
export function AdminDashboard() {
  const news = useAdminNews();
  const events = useAdminEvents();
  const players = useAdminPlayers('');

  if (news.isLoading || events.isLoading) return <Spinner />;

  const drafts = news.data?.filter((item) => item.status === 'draft') ?? [];
  const finishedWithoutResults = events.data?.filter((e) => e.status === 'finished') ?? [];
  const upcoming =
    events.data?.filter((e) => ['scheduled', 'open', 'live'].includes(e.status)) ?? [];

  return (
    <>
      <AdminHeader
        title="RESUMEN"
        description="Todo lo que necesitas para mantener el sitio al día."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Noticias" value={news.data?.length ?? 0} to={routes.adminNews} />
        <Metric label="Eventos" value={events.data?.length ?? 0} to={routes.adminEvents} />
        <Metric label="Jugadores" value={players.data?.length ?? 0} to={routes.adminPlayers} />
        <Metric label="Borradores" value={drafts.length} to={routes.adminNews} />
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <LinkButton to={routes.adminNewsNew} size="sm">
          <FilePlus size={15} /> Nueva noticia
        </LinkButton>
        <LinkButton to={routes.adminEventsNew} variant="secondary" size="sm">
          <CalendarPlus size={15} /> Nuevo evento
        </LinkButton>
        <LinkButton to={routes.adminResults} variant="secondary" size="sm">
          <Trophy size={15} /> Capturar resultados
        </LinkButton>
        <LinkButton to={routes.adminPlayers} variant="ghost" size="sm">
          <Users size={15} /> Jugadores
        </LinkButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-[10px] uppercase text-steel">
            Próximos eventos
          </h2>
          <ArcadePanel beveled={false} className="divide-y divide-edge">
            {upcoming.length === 0 && (
              <p className="p-4 text-sm text-ink-dim">No hay eventos programados.</p>
            )}
            {upcoming.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                to={routes.adminEventsEdit(event.id)}
                className="flex items-center justify-between gap-3 p-4 hover:bg-surface-raised/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{event.name}</p>
                  <p className="text-xs text-ink-dim">{formatDate(event.starts_at)}</p>
                </div>
                <Badge tone="steel">{event.status}</Badge>
              </Link>
            ))}
          </ArcadePanel>
        </section>

        <section>
          <h2 className="mb-3 font-display text-[10px] uppercase text-steel">
            Torneos terminados
          </h2>
          <ArcadePanel beveled={false} className="divide-y divide-edge">
            {finishedWithoutResults.length === 0 && (
              <p className="p-4 text-sm text-ink-dim">Nada pendiente por aquí.</p>
            )}
            {finishedWithoutResults.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                to={routes.adminResultsEdit(event.id)}
                className="flex items-center justify-between gap-3 p-4 hover:bg-surface-raised/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{event.name}</p>
                  <p className="text-xs text-ink-dim">{formatDate(event.starts_at)}</p>
                </div>
                <span className="shrink-0 text-xs text-steel">Capturar →</span>
              </Link>
            ))}
          </ArcadePanel>
        </section>
      </div>
    </>
  );
}

/** Página de módulos que llegan en fases posteriores. */
export function ComingSoonPage({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <>
      <AdminHeader title={title} description={description} />
      <ArcadePanel className="p-10 text-center">
        <p className="animate-blink font-display text-xs text-primary">EN CONSTRUCCIÓN</p>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft">
          Este módulo llega en la <strong className="text-steel">{phase}</strong>. La ruta,
          los permisos y las tablas de la base de datos ya existen: completarlo será
          rellenar la pantalla, no rediseñar el panel.
        </p>
      </ArcadePanel>
    </>
  );
}
