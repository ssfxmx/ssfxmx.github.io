import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Shield, User, X } from 'lucide-react';
import { MAIN_NAV, routes } from '@/shared/constants/routes';
import { useSession } from '@/modules/auth/hooks/useSession';
import { signOut } from '@/modules/auth/services/auth.service';
import { Button, LinkButton } from '@/shared/components/ui';

/**
 * Estructura del sitio público: cabecera, contenido y pie.
 *
 * Móvil primero: se asume que la mayor parte del tráfico llegará desde enlaces
 * compartidos en WhatsApp y Discord, es decir, desde un teléfono.
 */
export function PublicLayout() {
  const { isAuthenticated, isAdmin, profile } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    navigate(routes.home);
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'px-3 py-2 text-sm transition-colors',
      isActive ? 'text-primary' : 'text-ink-soft hover:text-ink',
    ].join(' ');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-edge bg-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to={routes.home} className="flex items-center gap-3">
            <span className="font-display text-sm text-primary neon-text">SSF2X</span>
            <span className="hidden text-xs tracking-[0.3em] text-ink-dim sm:inline">
              MÉXICO
            </span>
          </Link>

          {/* Navegación de escritorio */}
          <nav className="hidden items-center lg:flex">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === routes.home} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {isAdmin && (
              <LinkButton to={routes.admin} variant="ghost" size="sm">
                <Shield size={15} /> Panel
              </LinkButton>
            )}
            {isAuthenticated ? (
              <>
                <LinkButton to={routes.profile} variant="secondary" size="sm">
                  <User size={15} /> {profile?.nickname ?? 'Mi perfil'}
                </LinkButton>
                <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Cerrar sesión">
                  <LogOut size={15} />
                </Button>
              </>
            ) : (
              <>
                <LinkButton to={routes.login} variant="ghost" size="sm">
                  Entrar
                </LinkButton>
                <LinkButton to={routes.register} variant="primary" size="sm">
                  Registrarse
                </LinkButton>
              </>
            )}
          </div>

          <button
            className="p-2 text-ink-soft lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <Menu size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className="h-0.5 bg-gradient-to-r from-primary via-magenta to-cyan" />
      </header>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-base/98 pt-16 lg:hidden">
          <div className="flex justify-end px-4">
            <button className="p-2 text-ink-soft" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-6 py-4">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === routes.home}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    'border-b border-edge py-4 font-display text-xs',
                    isActive ? 'text-primary' : 'text-ink-soft',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="mt-6 flex flex-col gap-3">
              {isAdmin && (
                <LinkButton to={routes.admin} variant="secondary">
                  <Shield size={16} /> Panel de administración
                </LinkButton>
              )}
              {isAuthenticated ? (
                <>
                  <LinkButton to={routes.profile} variant="secondary">
                    <User size={16} /> Mi perfil
                  </LinkButton>
                  <Button variant="ghost" onClick={handleSignOut}>
                    <LogOut size={16} /> Cerrar sesión
                  </Button>
                </>
              ) : (
                <>
                  <LinkButton to={routes.login} variant="secondary">
                    Entrar
                  </LinkButton>
                  <LinkButton to={routes.register} variant="primary">
                    Registrarse
                  </LinkButton>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-edge bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-xs text-primary">SSF2X MÉXICO</p>
              <p className="mt-3 max-w-md text-sm text-ink-dim">
                Comunidad mexicana de Super Street Fighter II X Grand Master Challenge.
                Hecho por fanáticos, para fanáticos.
              </p>
            </div>
            <nav className="flex flex-col gap-2 text-sm">
              {MAIN_NAV.map((item) => (
                <Link key={item.to} to={item.to} className="text-ink-dim hover:text-primary">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8 border-t border-edge pt-6 text-xs leading-relaxed text-ink-dim">
            <p>
              Sitio no oficial creado por la comunidad. No está afiliado ni patrocinado por
              ninguna empresa. Todas las marcas registradas pertenecen a sus respectivos
              propietarios.
            </p>
            <p className="mt-2">© {new Date().getFullYear()} SSF2X México</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
