import { useSetting } from '@/shared/hooks';

/**
 * Enlaces a las redes de la comunidad.
 *
 * Se leen de site_settings, así que cambiarlos es editar un campo en el panel,
 * no desplegar el sitio. Los que estén vacíos no se pintan: una red sin cuenta
 * no debe ocupar espacio ni llevar a ningún lado.
 *
 * Los iconos van como SVG en línea. Podría usar una librería, pero son cinco
 * formas simples y así el sitio no descarga un paquete de iconos entero para
 * mostrar cinco enlaces.
 */

export interface SocialLinksValue {
  discord?: string;
  youtube?: string;
  twitch?: string;
  x?: string;
  facebook?: string;
}

const NETWORKS: Array<{
  key: keyof SocialLinksValue;
  label: string;
  path: string;
}> = [
  {
    key: 'facebook',
    label: 'Facebook',
    path: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.5h-2.8V24C19.61 23.1 24 18.1 24 12.07z',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    path: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z',
  },
  {
    key: 'twitch',
    label: 'Twitch',
    path: 'M2.15 0 .54 4.24v17.4h5.96V24h3.27l2.38-2.36h4.85L23 15.35V0H2.15zm18.7 14.27-3.4 3.37h-5.96l-2.38 2.36v-2.36H4.02V2.36h16.83v11.91zM17.45 6.4v6.09h-2.16V6.4h2.16zm-5.4 0v6.09H9.89V6.4h2.16z',
  },
  {
    key: 'discord',
    label: 'Discord',
    path: 'M20.32 4.37A19.8 19.8 0 0 0 15.43 3a13.9 13.9 0 0 0-.62 1.28 18.3 18.3 0 0 0-5.62 0A13.6 13.6 0 0 0 8.56 3a19.7 19.7 0 0 0-4.89 1.37C.56 9 .0 13.5.28 17.95a19.9 19.9 0 0 0 6.06 3.06c.49-.67.92-1.38 1.3-2.12a13 13 0 0 1-2.05-.98c.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.1 0c.16.14.33.27.5.4-.65.39-1.34.72-2.05.99.37.74.81 1.45 1.3 2.12a19.9 19.9 0 0 0 6.06-3.06c.33-5.15-.56-9.61-2.68-13.58zM8.02 15.23c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.09 2.16 2.42 0 1.33-.96 2.41-2.16 2.41zm7.96 0c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.09 2.16 2.42 0 1.33-.95 2.41-2.16 2.41z',
  },
  {
    key: 'x',
    label: 'X',
    path: 'M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z',
  },
];

export function SocialLinks({ size = 20 }: { size?: number }) {
  const links = useSetting<SocialLinksValue>('social.links', {});

  const active = NETWORKS.filter((network) => {
    const url = links[network.key];
    return typeof url === 'string' && url.trim().length > 0;
  });

  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      {active.map((network) => (
        <a
          key={network.key}
          href={links[network.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={network.label}
          className="text-ink-dim transition-colors hover:text-primary"
        >
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="currentColor"
            aria-hidden
          >
            <path d={network.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
