import { useParams } from 'react-router-dom';
import { PageMeta } from '@/shared/components/seo/PageMeta';

/**
 * Overlay para OBS — preparado en Fase 1, funcional en Fase 3.
 *
 * Se captura como "fuente de navegador" en OBS, por eso usa BareLayout (sin
 * cabecera ni pie) y fondo transparente.
 *
 * La ruta, el layout y la tabla `overlays` ya existen. Lo que falta es la
 * suscripción por Realtime a `stream_state` y el editor visual del panel. Al
 * estar el cableado hecho, completarlo será rellenar este componente y no
 * rediseñar nada.
 */
export function OverlayPage() {
  const { key } = useParams<{ key: string }>();

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-8">
      <PageMeta title="Overlay" noIndex />

      <div className="rounded border border-primary/40 bg-black/70 px-8 py-6 text-center backdrop-blur">
        <p className="font-display text-xs text-primary">SSF2X MÉXICO</p>
        <p className="mt-3 text-sm text-white/70">
          Overlay <code className="text-cyan">{key}</code> disponible en la Fase 3.
        </p>
      </div>
    </div>
  );
}
