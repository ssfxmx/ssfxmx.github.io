import { useEffect, useState } from 'react';
import { Check, Share2 } from 'lucide-react';

/**
 * Botón de compartir.
 *
 * DOS CAMINOS, UNO SOLO VISIBLE. En el teléfono usa el menú nativo del
 * sistema: el mismo que sale al compartir desde cualquier app, con WhatsApp y
 * Telegram donde la persona ya sabe buscarlos. En escritorio, donde ese menú
 * casi nunca existe, copia el enlace al portapapeles.
 *
 * No se ponen botones por red social. Serían cinco iconos que hay que mantener,
 * que envejecen cuando una red cambia su URL de compartir, y que en móvil
 * duplican algo que el sistema ya hace mejor. Además, cada botón oficial suele
 * traer un script de seguimiento de esa red; esto no carga nada.
 *
 * SIEMPRE HAY RESPUESTA VISIBLE. Si al pulsar no pasara nada aparente —porque
 * se canceló el menú o porque copiar es silencioso— la reacción normal es
 * volver a pulsar. Por eso el botón confirma con un cambio de estado.
 */
export function ShareButton({
  title,
  text,
  url,
  className = '',
}: {
  title: string;
  /** Descripción corta que acompaña al enlace en el menú nativo. */
  text?: string;
  /** Por defecto, la dirección actual. */
  url?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  // Devuelve el botón a su estado normal. Se limpia al desmontar para no
  // intentar actualizar un componente que ya no está en pantalla.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleShare() {
    const enlace = url ?? window.location.href;

    // navigator.share solo existe en contexto seguro y sobre todo en móvil.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url: enlace });
        return;
      } catch {
        // Cancelar el menú lanza excepción igual que un fallo real, y cancelar
        // es lo más frecuente. Se cae al portapapeles sin dar por hecho que
        // algo salió mal.
      }
    }

    try {
      await navigator.clipboard.writeText(enlace);
      setCopied(true);
    } catch {
      // Sin permiso de portapapeles queda el último recurso: seleccionar el
      // enlace para que la persona lo copie a mano.
      window.prompt('Copia el enlace:', enlace);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`Compartir: ${title}`}
      className={[
        'inline-flex items-center gap-2 rounded border border-edge px-3 py-2 text-sm',
        'text-ink-soft transition-colors hover:border-primary/50 hover:text-primary',
        className,
      ].join(' ')}
    >
      {copied ? (
        <>
          <Check size={15} className="text-success" />
          <span className="text-success">Enlace copiado</span>
        </>
      ) : (
        <>
          <Share2 size={15} />
          <span>Compartir</span>
        </>
      )}
    </button>
  );
}
