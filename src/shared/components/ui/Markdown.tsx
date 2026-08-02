import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
