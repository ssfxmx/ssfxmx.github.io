import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Tema claro / oscuro.
 *
 * TRES ESTADOS, NO DOS. Además de "claro" y "oscuro" existe "sistema", que es
 * el valor por defecto. La diferencia importa: alguien que tiene el teléfono en
 * modo noche automático espera que el sitio lo siga, y si al entrar la primera
 * vez lo forzáramos a oscuro, ese seguimiento no volvería a ocurrir nunca.
 *
 * LO QUE SE GUARDA es la preferencia, no el color resultante. Guardar "oscuro"
 * cuando alguien eligió "sistema" congelaría la decisión: al cambiar el
 * teléfono a modo día, el sitio se quedaría de noche.
 *
 * EL PARPADEO se evita antes de llegar aquí, con el script en línea de
 * index.html. Este componente no puede resolverlo: para cuando React arranca,
 * el fondo equivocado ya se pintó.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'ssf2x-theme';

interface ThemeContextValue {
  /** Lo que la persona eligió, incluido "system". */
  preference: ThemePreference;
  /** El tema que se está mostrando de verdad. */
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  /** Alterna entre claro y oscuro, saliendo de "system" al primer clic. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function storedPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // Navegación privada o almacenamiento bloqueado: se sigue sin recordar.
  }
  return 'system';
}

/** Color de la barra del navegador en móvil, para que no desentone. */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: '#0B0B1A',
  light: '#F7F5EF',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(storedPreference);
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  // Si la preferencia es "sistema", hay que enterarse cuando el sistema cambia
  // —al anochecer, por ejemplo— sin que haga falta recargar.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setSystem(media.matches ? 'light' : 'dark');

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolved: ResolvedTheme = preference === 'system' ? system : preference;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
    // Le dice al navegador si los controles nativos (barras, campos de fecha)
    // deben pintarse claros u oscuros. Sin esto, el selector de fecha del
    // panel sale negro sobre un sitio blanco.
    document.documentElement.style.colorScheme = resolved;

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[resolved]);
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento el tema dura lo que la pestaña. Es aceptable.
    }
  }, []);

  const toggle = useCallback(() => {
    setPreferenceState((current) => {
      const actual = current === 'system' ? systemTheme() : current;
      const next: ThemePreference = actual === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* vacío a propósito */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, toggle }),
    [preference, resolved, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  }
  return context;
}
