/**
 * Rutas del sitio, definidas una sola vez.
 *
 * Ningún componente escribe una ruta a mano. Si mañana /noticias pasa a /blog,
 * es una edición de una línea y no una cacería por todo el repositorio.
 */
export const routes = {
  home: '/',

  news: '/noticias',
  newsDetail: (slug: string) => `/noticias/${slug}`,

  events: '/eventos',
  calendar: '/eventos/calendario',
  eventDetail: (slug: string) => `/eventos/${slug}`,

  results: '/resultados',
  resultDetail: (slug: string) => `/resultados/${slug}`,

  players: '/jugadores',
  playerDetail: (nickname: string) => `/jugadores/${encodeURIComponent(nickname)}`,

  highlights: '/highlights',
  highlightDetail: (slug: string) => `/highlights/${slug}`,

  tutorials: '/tutoriales',
  tutorialDetail: (slug: string) => `/tutoriales/${slug}`,

  login: '/auth/login',
  register: '/auth/registro',
  recover: '/auth/recuperar',
  resetPassword: '/auth/nueva-contrasena',
  authCallback: '/auth/callback',

  profile: '/perfil',
  profileEdit: '/perfil/editar',

  admin: '/admin',
  adminNews: '/admin/noticias',
  adminNewsNew: '/admin/noticias/nueva',
  adminNewsEdit: (id: string) => `/admin/noticias/${id}`,
  adminEvents: '/admin/eventos',
  adminEventsNew: '/admin/eventos/nuevo',
  adminEventsEdit: (id: string) => `/admin/eventos/${id}`,
  adminResults: '/admin/resultados',
  adminResultsEdit: (eventId: string) => `/admin/resultados/${eventId}`,
  adminPlayers: '/admin/jugadores',
  adminCharacters: '/admin/personajes',
  adminCities: '/admin/ciudades',
  adminTutorials: '/admin/tutoriales',
  adminTutorialsNew: '/admin/tutoriales/nuevo',
  adminTutorialsEdit: (id: string) => `/admin/tutoriales/${id}`,
  adminHighlights: '/admin/highlights',
  adminHighlightsNew: '/admin/highlights/nuevo',
  adminHighlightsEdit: (id: string) => `/admin/highlights/${id}`,
  adminReports: '/admin/reportes',
  adminSettings: '/admin/configuracion',
  adminOverlays: '/admin/stream/overlays',
  adminPolls: '/admin/stream/votaciones',

  overlay: (key: string) => `/overlay/${key}`,
} as const;

/**
 * Navegación principal del sitio público.
 *
 * Los emoji son parte de la etiqueta, no un icono aparte. Nota: cada sistema
 * operativo los dibuja con su propia fuente, así que en Windows, Android e iOS
 * se ven distintos. Es el precio de usarlos; a cambio, funcionan sin descargar
 * ningún archivo y se leen igual de rápido.
 */
export const MAIN_NAV = [
  { label: 'Inicio', emoji: '🕹️', to: routes.home },
  { label: 'Noticias', emoji: '📰', to: routes.news },
  { label: 'Eventos', emoji: '📅', to: routes.events },
  { label: 'Resultados', emoji: '🏆', to: routes.results },
  { label: 'Highlights', emoji: '🎬', to: routes.highlights },
  { label: 'Jugadores', emoji: '👥', to: routes.players },
  { label: 'Tutoriales', emoji: '📖', to: routes.tutorials },
] as const;
