import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

/**
 * Interruptor de tema.
 *
 * Un solo botón, no un desplegable de tres opciones. La opción "sistema" existe
 * y es la de partida, pero no ocupa sitio en la cabecera: quien no la toca ya
 * la tiene, y quien pulsa está diciendo justamente que quiere decidir él.
 *
 * El icono muestra ADÓNDE se va, no dónde se está. Un sol en modo oscuro
 * significa "pulsa para aclarar", que es lo que la persona quiere saber.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const irA = resolved === 'dark' ? 'claro' : 'oscuro';

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Cambiar a modo ${irA}`}
      aria-label={`Cambiar a modo ${irA}`}
      className={[
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-edge',
        'text-ink-soft transition-colors hover:border-primary/50 hover:text-primary',
        className,
      ].join(' ')}
    >
      {resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
