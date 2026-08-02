import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth } from './guards';

import { HomePage } from '@/modules/news/pages/HomePage';
import { NewsDetailPage, NewsListPage } from '@/modules/news/pages/NewsPages';
import {
  CalendarPage,
  EventDetailPage,
  EventsListPage,
} from '@/modules/events/pages/EventsPages';
import { ResultDetailPage, ResultsListPage } from '@/modules/results/pages/ResultsPages';
import { PlayerProfilePage, PlayersListPage } from '@/modules/players/pages/PlayersPages';
import {
  TutorialDetailPage,
  TutorialsListPage,
} from '@/modules/tutorials/pages/TutorialsPages';
import { HighlightsPage } from '@/modules/highlights/pages/HighlightsPage';
import {
  AuthCallbackPage,
  LoginPage,
  RecoverPage,
  RegisterPage,
  ResetPasswordPage,
} from '@/modules/auth/pages/AuthPages';
import { ProfileEditPage, ProfilePage } from '@/modules/profile/pages/ProfilePages';
import { OverlayPage } from '@/modules/overlay/pages/OverlayPage';

import { AdminDashboard, ComingSoonPage } from '@/modules/admin/pages/AdminDashboard';
import { AdminNewsForm, AdminNewsList } from '@/modules/admin/pages/AdminNews';
import { AdminEventForm, AdminEventsList } from '@/modules/admin/pages/AdminEvents';
import { AdminResultsForm, AdminResultsList } from '@/modules/admin/pages/AdminResults';
import { AdminPlayersList } from '@/modules/admin/pages/AdminPlayers';
import { AdminCharactersPage } from '@/modules/admin/pages/AdminCharacters';
import { AdminCitiesPage } from '@/modules/admin/pages/AdminCities';
import { AdminReportsPage } from '@/modules/admin/pages/AdminReports';
import {
  AdminTutorialForm,
  AdminTutorialsList,
} from '@/modules/admin/pages/AdminTutorials';
import { AdminSettingsPage } from '@/modules/admin/pages/AdminSettings';
import {
  AdminHighlightForm,
  AdminHighlightsList,
} from '@/modules/admin/pages/AdminHighlights';
import { EmptyState, LinkButton } from '@/shared/components/ui';

function NotFoundPage() {
  return (
    <EmptyState
      title="Página no encontrada"
      message="El enlace puede estar mal escrito o el contenido ya no existe."
      action={<LinkButton to={routes.home}>Volver al inicio</LinkButton>}
    />
  );
}

/**
 * Definición central de rutas.
 *
 * El `basename` sale de la misma variable que usa Vite para el `base`, así que
 * mover el sitio a una subcarpeta o a un dominio propio no toca este archivo.
 *
 * Tres layouts:
 *   PublicLayout : cabecera + pie
 *   AdminLayout  : barra lateral de administración
 *   sin layout   : overlays de OBS, que se capturan sin ningún adorno
 */
export const router = createBrowserRouter(
  [
    {
      element: <PublicLayout />,
      children: [
        { path: routes.home, element: <HomePage /> },

        { path: routes.news, element: <NewsListPage /> },
        { path: '/noticias/:slug', element: <NewsDetailPage /> },

        { path: routes.events, element: <EventsListPage /> },
        { path: routes.calendar, element: <CalendarPage /> },
        { path: '/eventos/:slug', element: <EventDetailPage /> },

        { path: routes.results, element: <ResultsListPage /> },
        { path: '/resultados/:slug', element: <ResultDetailPage /> },

        { path: routes.players, element: <PlayersListPage /> },
        { path: '/jugadores/:nickname', element: <PlayerProfilePage /> },

        { path: routes.highlights, element: <HighlightsPage /> },

        { path: routes.tutorials, element: <TutorialsListPage /> },
        { path: '/tutoriales/:slug', element: <TutorialDetailPage /> },

        {
          element: (
            <RedirectIfAuthenticated>
              <Outlet />
            </RedirectIfAuthenticated>
          ),
          children: [
            { path: routes.login, element: <LoginPage /> },
            { path: routes.register, element: <RegisterPage /> },
            { path: routes.recover, element: <RecoverPage /> },
          ],
        },

        { path: routes.resetPassword, element: <ResetPasswordPage /> },
        { path: routes.authCallback, element: <AuthCallbackPage /> },

        {
          element: (
            <RequireAuth>
              <Outlet />
            </RequireAuth>
          ),
          children: [
            { path: routes.profile, element: <ProfilePage /> },
            { path: routes.profileEdit, element: <ProfileEditPage /> },
          ],
        },

        { path: '*', element: <NotFoundPage /> },
      ],
    },

    {
      element: (
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      ),
      children: [
        { path: routes.admin, element: <AdminDashboard /> },

        { path: routes.adminNews, element: <AdminNewsList /> },
        { path: '/admin/noticias/:id', element: <AdminNewsForm /> },

        { path: routes.adminEvents, element: <AdminEventsList /> },
        { path: '/admin/eventos/:id', element: <AdminEventForm /> },

        { path: routes.adminResults, element: <AdminResultsList /> },
        { path: '/admin/resultados/:eventId', element: <AdminResultsForm /> },

        { path: routes.adminPlayers, element: <AdminPlayersList /> },
        { path: routes.adminCharacters, element: <AdminCharactersPage /> },
        { path: routes.adminCities, element: <AdminCitiesPage /> },

        { path: routes.adminTutorials, element: <AdminTutorialsList /> },
        { path: '/admin/tutoriales/:id', element: <AdminTutorialForm /> },

        { path: routes.adminHighlights, element: <AdminHighlightsList /> },
        { path: '/admin/highlights/:id', element: <AdminHighlightForm /> },

        { path: routes.adminSettings, element: <AdminSettingsPage /> },

        // Módulos preparados: la ruta, el permiso y el menú ya funcionan.
        { path: routes.adminReports, element: <AdminReportsPage /> },
        {
          path: routes.adminOverlays,
          element: (
            <ComingSoonPage
              title="OVERLAYS OBS"
              description="Generador de overlays para transmisiones."
              phase="Fase 3"
            />
          ),
        },
        {
          path: routes.adminPolls,
          element: (
            <ComingSoonPage
              title="VOTACIONES"
              description="Encuestas en vivo durante el stream."
              phase="Fase 3"
            />
          ),
        },

        { path: '/admin/*', element: <Navigate to={routes.admin} replace /> },
      ],
    },

    // Sin layout: se captura como fuente de navegador en OBS.
    { path: '/overlay/:key', element: <OverlayPage /> },
  ],
  { basename: import.meta.env.VITE_BASE_PATH || '/' }
);
