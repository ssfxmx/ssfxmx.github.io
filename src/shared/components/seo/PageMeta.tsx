import { useEffect } from 'react';

/**
 * Metaetiquetas por página.
 *
 * El prerenderizado del build (scripts/prerender.mjs) resuelve las etiquetas
 * para los robots que no ejecutan JavaScript. Este componente cubre el otro
 * caso: la navegación dentro de la SPA, donde el HTML ya no se recarga y el
 * título de la pestaña debe seguir al contenido.
 *
 * Se implementa a mano en lugar de con react-helmet: son treinta líneas y
 * evitan una dependencia más que mantener durante años.
 */

interface PageMetaProps {
  title: string;
  description?: string;
  image?: string | null;
  noIndex?: boolean;
}

const SITE_NAME = 'SSF2X México';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function PageMeta({ title, description, image, noIndex }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
    document.title = fullTitle;

    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href);

    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    }

    if (image) {
      setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    }

    setMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex' : 'index, follow');
  }, [title, description, image, noIndex]);

  return null;
}
