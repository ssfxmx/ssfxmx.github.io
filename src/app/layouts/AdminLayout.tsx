import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { routes } from '@/shared/constants/routes';

/**
 * Estructura del panel de administración.
 *
 * El menú incluye Reportes y Stream desde la Fase 1 aunque su funcionalidad
 * llegue después. La ruta, el permiso y el elemento de menú ya funcionan:
 * completarlos será rellenar una página, no rediseñar el panel.
 */

const SECTIONS = [
  {
    title: '📝 Contenido',
    items: [
      { to: routes.admin, label: 'Resumen', emoji: '📊', end: true },
      { to: routes.adminNews, label: 'Noticias', emoji: '📰' },
      { to: routes.adminEvents, label: 'Eventos', emoji: '📅' },
      { to: routes.adminResults, label: 'Resultados', emoji: '🏆' },
      { to: routes.adminHighlights, label: 'Highlights', emoji: '🎬' },
      { to: routes.adminTutorials, label: 'Tutoriales', emoji: '📖' },
    ],
  },
  {
    title: '🎮 Comunidad',
    items: [
      { to: routes.adminPlayers, label: 'Jugadores', emoji: '👥' },
      { to: routes.adminCharacters, label: 'Personajes', emoji: '🥋' },
      { to: routes.adminCities, label: 'Ciudades', emoji: '📍' },
    ],
  },
  {
    title: '📡 Stream',
    items: [
      { to: routes.adminOverlays, label: 'Overlays OBS', emoji: '🖥️', soon: true },
      { to: routes.adminPolls, label: 'Votaciones', emoji: '🗳️', soon: true },
    ],
  },
  {
    title: '🔧 Sistema',
    items: [
      { to: routes.adminReports, label: 'Reportes', emoji: '📈', soon: true },
      { to: routes.adminSettings, label: 'Configuración', emoji: '⚙️' },
    ],
  },
] as const;

export function AdminLayout() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors',
      isActive
        ? 'bg-primary/15 text-primary border-l-2 border-primary'
        : 'text-ink-soft hover:bg-surface hover:text-ink border-l-2 border-transparent',
    ].join(' ');

  const nav = (
    <nav className="space-y-6">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 font-display text-[9px] uppercase tracking-wider text-ink-dim">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                <span aria-hidden className="w-5 text-center text-sm">{item.emoji}</span>
                <span className="flex-1">{item.label}</span>
                {'soon' in item && item.soon && (
                  <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[9px] text-ink-dim">
                    pronto
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-edge bg-base">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="p-1 text-ink-soft lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-display text-xs text-primary">ADMIN</span>
          </div>
          <Link to={routes.home} className="text-sm text-ink-soft hover:text-primary">
            Ver sitio →
          </Link>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-primary via-magenta to-steel" />
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">{nav}</aside>

        {open && (
          <div className="fixed inset-0 top-[57px] z-40 bg-base p-6 lg:hidden">{nav}</div>
        )}

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
