import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Radio, Users } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { storagePublicUrl } from '@/shared/lib/supabase';
import { formatDateTime, formatEventDay, formatTime } from '@/shared/utils/date';
import { ArcadePanel, Badge } from '@/shared/components/ui';
import type { EventRecord, EventStatus } from '@/shared/types/database';

/** Piezas reutilizables del módulo de eventos. */

const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; tone: 'neutral' | 'primary' | 'cyan' | 'magenta' | 'success' | 'danger'; pulse?: boolean }
> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  scheduled: { label: 'Programado', tone: 'cyan' },
  open: { label: 'Inscripciones abiertas', tone: 'primary' },
  live: { label: 'EN VIVO', tone: 'magenta', pulse: true },
  finished: { label: 'Finalizado', tone: 'neutral' },
  cancelled: { label: 'Cancelado', tone: 'danger' },
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge tone={config.tone} pulse={config.pulse}>
      {config.label}
    </Badge>
  );
}

export const KIND_LABELS: Record<string, string> = {
  tournament: 'Torneo',
  casual: 'Casuales',
  exhibition: 'Exhibición',
  workshop: 'Taller',
};

export const MODE_LABELS: Record<string, string> = {
  online: 'En línea',
  presencial: 'Presencial',
  hibrido: 'Híbrido',
};

export function EventCard({ event }: { event: EventRecord }) {
  const cover = storagePublicUrl('media', event.cover_path);

  return (
    <Link to={routes.eventDetail(event.slug)} className="group block">
      <ArcadePanel className="h-full overflow-hidden transition-colors group-hover:border-primary/60">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="h-36 w-full object-cover" />
        ) : (
          <div className="flex h-36 items-center justify-center bg-gradient-to-br from-surface-raised to-surface">
            <CalendarDays size={28} className="text-ink-dim" />
          </div>
        )}

        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge status={event.status} />
            <Badge>{KIND_LABELS[event.kind] ?? event.kind}</Badge>
          </div>

          <h3 className="font-semibold leading-snug text-ink group-hover:text-primary">
            {event.name}
          </h3>

          <dl className="space-y-1.5 text-sm text-ink-soft">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="shrink-0 text-ink-dim" />
              <span>
                {formatEventDay(event.starts_at)} · {formatTime(event.starts_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {event.mode === 'online' ? (
                <Radio size={14} className="shrink-0 text-ink-dim" />
              ) : (
                <MapPin size={14} className="shrink-0 text-ink-dim" />
              )}
              <span>{event.venue_name ?? MODE_LABELS[event.mode]}</span>
            </div>
            {event.max_participants && (
              <div className="flex items-center gap-2">
                <Users size={14} className="shrink-0 text-ink-dim" />
                <span>Cupo: {event.max_participants}</span>
              </div>
            )}
          </dl>
        </div>
      </ArcadePanel>
    </Link>
  );
}

/** Bloque destacado del próximo evento, para la portada. */
export function NextEventBanner({ event }: { event: EventRecord }) {
  return (
    <ArcadePanel glow className="overflow-hidden">
      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge status={event.status} />
            <span className="font-display text-[10px] text-ink-dim">PRÓXIMO EVENTO</span>
          </div>

          <h2 className="font-display text-base leading-relaxed text-primary neon-text sm:text-lg">
            {event.name}
          </h2>

          <p className="text-sm text-ink-soft">{formatDateTime(event.starts_at)}</p>

          {event.venue_name && (
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <MapPin size={14} /> {event.venue_name}
            </p>
          )}
        </div>

        <Link
          to={routes.eventDetail(event.slug)}
          className="inline-flex min-h-[44px] items-center justify-center rounded bg-primary px-6 py-3 font-semibold text-base transition-colors hover:bg-primary/85"
        >
          Ver detalles
        </Link>
      </div>
    </ArcadePanel>
  );
}
