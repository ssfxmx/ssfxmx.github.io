/**
 * Componentes base del sistema de diseño arcade.
 *
 * Todos viven en un solo archivo a propósito: son piezas pequeñas, muy
 * relacionadas entre sí, y tenerlas juntas evita veinte archivos de quince
 * líneas. Cuando alguno crezca lo suficiente, se saca a su propio módulo.
 *
 * Ninguno contiene lógica de negocio ni habla con Supabase.
 */

import { forwardRef } from 'react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/* ========================================================================== */
/* Panel                                                                       */
/* ========================================================================== */

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Esquina biselada estilo gabinete. */
  beveled?: boolean;
  glow?: boolean;
}

export function ArcadePanel({
  children,
  beveled = true,
  glow = false,
  className,
  ...rest
}: PanelProps) {
  return (
    <div
      className={cx(
        'bg-surface border border-edge',
        beveled ? 'arcade-clip' : 'rounded-lg',
        glow && 'shadow-neon',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Encabezado de sección con barra de energía. */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-lg text-primary neon-text leading-relaxed">
          {children}
        </h2>
        <div className="mt-2 h-1 w-24 bg-gradient-to-r from-primary via-magenta to-transparent" />
      </div>
      {action}
    </div>
  );
}

/* ========================================================================== */
/* Botones                                                                     */
/* ========================================================================== */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-base font-semibold hover:bg-primary/85 hover:shadow-neon active:translate-y-px',
  secondary:
    'bg-surface-raised text-ink border border-edge hover:border-cyan hover:text-cyan',
  ghost: 'text-ink-soft hover:text-primary hover:bg-surface',
  danger: 'bg-danger text-white font-semibold hover:bg-danger/85',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded transition-all duration-150 ' +
  'disabled:opacity-50 disabled:pointer-events-none min-h-[44px]';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, children, className, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(BUTTON_BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
});

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  children,
  className,
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={cx(BUTTON_BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  );
}

/* ========================================================================== */
/* Formularios                                                                 */
/* ========================================================================== */

const FIELD_BASE =
  'w-full rounded border bg-base px-3 py-2.5 text-ink placeholder:text-ink-dim ' +
  'transition-colors focus:border-cyan focus:outline-none min-h-[44px]';

function fieldClass(error?: string) {
  return cx(FIELD_BASE, error ? 'border-danger' : 'border-edge');
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, error, hint, required, children, htmlFor }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-dim">{hint}</p>}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(function Input({ error, className, ...rest }, ref) {
  return <input ref={ref} className={cx(fieldClass(error), className)} {...rest} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(function Textarea({ error, className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx(fieldClass(error), 'min-h-[120px] resize-y', className)}
      {...rest}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(function Select({ error, className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx(fieldClass(error), className)} {...rest}>
      {children}
    </select>
  );
});

/* ========================================================================== */
/* Indicadores                                                                 */
/* ========================================================================== */

type BadgeTone = 'neutral' | 'primary' | 'cyan' | 'magenta' | 'success' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-raised text-ink-soft border-edge',
  primary: 'bg-primary/15 text-primary border-primary/40',
  cyan: 'bg-cyan/15 text-cyan border-cyan/40',
  magenta: 'bg-magenta/15 text-magenta border-magenta/40',
  success: 'bg-success/15 text-success border-success/40',
  danger: 'bg-danger/15 text-danger border-danger/40',
};

export function Badge({
  children,
  tone = 'neutral',
  pulse = false,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  pulse?: boolean;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium',
        TONES[tone]
      )}
    >
      {pulse && <span className="h-1.5 w-1.5 animate-blink rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Barra de energía: separador y a la vez indicador de progreso. */
export function EnergyBar({ value = 100, tone = 'primary' }: { value?: number; tone?: 'primary' | 'cyan' }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-sm bg-surface-raised">
      <div
        className={cx(
          'h-full transition-all duration-500',
          tone === 'primary' ? 'bg-gradient-to-r from-primary to-magenta' : 'bg-cyan'
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ========================================================================== */
/* Estados                                                                     */
/* ========================================================================== */

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="font-display text-[10px] text-ink-dim">{label}</span>
    </div>
  );
}

/** Estado vacío con guiño arcade. */
export function EmptyState({
  title = 'Nada por aquí',
  message,
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="animate-blink font-display text-xs text-primary">INSERT COIN</p>
      <h3 className="font-semibold text-ink">{title}</h3>
      {message && <p className="max-w-md text-sm text-ink-soft">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message = 'No se pudo cargar la información.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-xs text-danger">ERROR</p>
      <p className="max-w-md text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

/** Aviso en línea para formularios y secciones. */
export function Alert({
  tone = 'primary',
  children,
}: {
  tone?: 'primary' | 'success' | 'danger' | 'cyan';
  children: ReactNode;
}) {
  const tones = {
    primary: 'border-primary/40 bg-primary/10 text-primary',
    success: 'border-success/40 bg-success/10 text-success',
    danger: 'border-danger/40 bg-danger/10 text-danger',
    cyan: 'border-cyan/40 bg-cyan/10 text-cyan',
  };
  return (
    <div className={cx('rounded border px-4 py-3 text-sm', tones[tone])} role="alert">
      {children}
    </div>
  );
}

/* ========================================================================== */
/* Navegación de listados                                                      */
/* ========================================================================== */

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-3 pt-8" aria-label="Paginación">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </Button>
      <span className="font-display text-[10px] text-ink-dim">
        {page} / {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
      </Button>
    </nav>
  );
}

/* ========================================================================== */
/* Avatar                                                                      */
/* ========================================================================== */

export function Avatar({
  src,
  alt,
  size = 48,
  ring = false,
}: {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={cx(
        'arcade-clip shrink-0 bg-surface-raised object-cover',
        ring && 'ring-1 ring-primary/40'
      )}
      style={{ width: size, height: size }}
    />
  );
}
