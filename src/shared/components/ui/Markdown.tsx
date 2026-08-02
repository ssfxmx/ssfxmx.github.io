import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { slugify } from '@/shared/utils/format';

/**
 * Convierte el contenido de un encabezado en un identificador de ancla.
 * Debe coincidir con el que usa el índice del tutorial, por eso ambos parten
 * de la misma función `slugify`.
 */
function headingId(children: ReactNode): string {
  const text = Array.isArray(children)
    ? children.map((child) => (typeof child === 'string' ? child : '')).join('')
    : String(children ?? '');
  return slugify(text);
}

/**
 * Renderiza el contenido en Markdown de noticias y tutoriales.
 *
 * Solo los administradores escriben este contenido, pero igualmente NO se
 * permite HTML crudo (react-markdown lo ignora por defecto y aquí no se activa
 * rehype-raw). Es defensa en profundidad: si algún día una cuenta de admin se
 * ve comprometida, el daño no escala a ejecución de scripts en el navegador de
 * cada visitante.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-arcade max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Los enlaces externos se abren en pestaña nueva, con rel seguro.
          a: ({ href, children: content }) => {
            const external = href?.startsWith('http');
            return (
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {content}
              </a>
            );
          },

          // Los encabezados llevan ancla para que el índice pueda saltar a
          // ellos y para poder compartir el enlace de una sección concreta.
          h2: ({ children: content }) => (
            <h2 id={headingId(content)} className="scroll-mt-24">
              {content}
            </h2>
          ),
          h3: ({ children: content }) => (
            <h3 id={headingId(content)} className="scroll-mt-24">
              {content}
            </h3>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
