import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { routes } from '@/shared/constants/routes';
import { friendlyError } from '@/shared/lib/supabase';
import { COUNTRIES } from '@/shared/utils/format';
import { useCharacters } from '@/shared/hooks';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import {
  Alert,
  ArcadePanel,
  Button,
  Field,
  Input,
  Select,
  SectionTitle,
  Spinner,
} from '@/shared/components/ui';
import * as auth from '../services/auth.service';

/**
 * Pantallas de autenticación.
 *
 * La validación se hace con Zod en el cliente para dar respuesta inmediata,
 * pero es solo una cortesía: las mismas reglas están como CHECK en la base de
 * datos. Validar en dos sitios es intencional, y el que manda es el de abajo.
 */

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md">
      <SectionTitle>{title}</SectionTitle>
      {subtitle && <p className="mb-6 text-sm text-ink-soft">{subtitle}</p>}
      <ArcadePanel className="p-6">{children}</ArcadePanel>
    </div>
  );
}

/* ========================================================================== */
/* Login                                                                       */
/* ========================================================================== */

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.signIn(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? routes.profile, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="Entrar" noIndex />
      <AuthShell title="ENTRAR">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label="Correo electrónico" required htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Contraseña" required htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>

          <div className="flex justify-between pt-2 text-sm">
            <Link to={routes.recover} className="text-ink-soft hover:text-primary">
              Olvidé mi contraseña
            </Link>
            <Link to={routes.register} className="text-cyan hover:text-primary">
              Crear cuenta
            </Link>
          </div>
        </form>
      </AuthShell>
    </>
  );
}

/* ========================================================================== */
/* Registro                                                                    */
/* ========================================================================== */

const registerSchema = z.object({
  nickname: z
    .string()
    .min(3, 'Mínimo 3 caracteres.')
    .max(20, 'Máximo 20 caracteres.')
    .regex(/^[A-Za-z0-9_.\-]+$/, 'Solo letras, números, guion, punto y guion bajo.'),
  fullName: z.string().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().email('Correo no válido.'),
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
  birthDate: z.string().min(1, 'Selecciona tu fecha de nacimiento.'),
  countryCode: z.string().length(2),
  city: z.string().min(2, 'Escribe tu ciudad.').max(80),
  mainCharacterId: z.number().int().positive('Elige tu personaje principal.'),
});

export function RegisterPage() {
  const { data: characters, isLoading } = useCharacters();
  const [form, setForm] = useState({
    nickname: '',
    fullName: '',
    email: '',
    password: '',
    birthDate: '',
    countryCode: 'MX',
    city: '',
    mainCharacterId: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setGlobalError('');
    setErrors({});

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // Se comprueba antes de enviar para dar un mensaje claro. Si dos personas
      // se registran a la vez con el mismo nickname, el trigger de la base le
      // añade un sufijo en lugar de fallar el alta.
      const available = await auth.isNicknameAvailable(form.nickname);
      if (!available) {
        setErrors({ nickname: 'Ese nickname ya está ocupado.' });
        setLoading(false);
        return;
      }

      await auth.signUp(parsed.data);
      setDone(true);
    } catch (err) {
      setGlobalError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <>
        <PageMeta title="Revisa tu correo" noIndex />
        <AuthShell title="CASI LISTO">
          <div className="space-y-4 text-sm text-ink-soft">
            <Alert tone="success">
              Te enviamos un correo de confirmación a <strong>{form.email}</strong>.
            </Alert>
            <p>
              Abre el enlace del correo para activar tu cuenta. Si no lo ves en unos
              minutos, revisa la carpeta de spam.
            </p>
            <Link to={routes.login} className="inline-block text-cyan hover:text-primary">
              Ir a iniciar sesión →
            </Link>
          </div>
        </AuthShell>
      </>
    );
  }

  if (isLoading) return <Spinner label="CARGANDO" />;

  return (
    <>
      <PageMeta title="Crear cuenta" noIndex />
      <AuthShell
        title="CREAR CUENTA"
        subtitle="Tu nombre real y tu fecha de nacimiento nunca se muestran en el sitio."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {globalError && <Alert tone="danger">{globalError}</Alert>}

          <Field
            label="Nickname"
            required
            error={errors.nickname}
            hint="Así te verá la comunidad. Se puede cambiar después."
          >
            <Input
              value={form.nickname}
              onChange={(e) => set('nickname', e.target.value)}
              maxLength={20}
              autoComplete="username"
            />
          </Field>

          <Field label="Nombre completo" required error={errors.fullName} hint="Privado.">
            <Input
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              autoComplete="name"
            />
          </Field>

          <Field label="Correo electrónico" required error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              autoComplete="email"
            />
          </Field>

          <Field label="Contraseña" required error={errors.password} hint="Mínimo 8 caracteres.">
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
            />
          </Field>

          <Field label="Fecha de nacimiento" required error={errors.birthDate} hint="Privada.">
            <Input
              type="date"
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="País" required error={errors.countryCode}>
              <Select
                value={form.countryCode}
                onChange={(e) => set('countryCode', e.target.value)}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Ciudad" required error={errors.city}>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </Field>
          </div>

          <Field
            label="Personaje principal"
            required
            error={errors.mainCharacterId}
            hint="Se usará como tu avatar hasta que subas una imagen."
          >
            <Select
              value={form.mainCharacterId || ''}
              onChange={(e) => set('mainCharacterId', Number(e.target.value))}
            >
              <option value="">Elige un personaje…</option>
              {characters?.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </Select>
          </Field>

          <Button type="submit" loading={loading} className="w-full">
            Crear cuenta
          </Button>

          <p className="pt-2 text-center text-sm text-ink-soft">
            ¿Ya tienes cuenta?{' '}
            <Link to={routes.login} className="text-cyan hover:text-primary">
              Entrar
            </Link>
          </p>
        </form>
      </AuthShell>
    </>
  );
}

/* ========================================================================== */
/* Recuperar contraseña                                                        */
/* ========================================================================== */

export function RecoverPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="Recuperar contraseña" noIndex />
      <AuthShell title="RECUPERAR ACCESO">
        {sent ? (
          <Alert tone="success">
            Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la
            contraseña.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Field label="Correo electrónico" required>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Button type="submit" loading={loading} className="w-full">
              Enviar enlace
            </Button>
            <p className="pt-2 text-center text-sm">
              <Link to={routes.login} className="text-ink-soft hover:text-primary">
                Volver a entrar
              </Link>
            </p>
          </form>
        )}
      </AuthShell>
    </>
  );
}

/* ========================================================================== */
/* Nueva contraseña                                                            */
/* ========================================================================== */

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await auth.updatePassword(password);
      navigate(routes.profile, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="Nueva contraseña" noIndex />
      <AuthShell title="NUEVA CONTRASEÑA">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Nueva contraseña" required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmar contraseña" required>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Guardar
          </Button>
        </form>
      </AuthShell>
    </>
  );
}

/* ========================================================================== */
/* Callback de confirmación                                                    */
/* ========================================================================== */

/**
 * Destino del enlace de confirmación de correo.
 * supabase-js procesa el token de la URL automáticamente (detectSessionInUrl),
 * así que aquí solo hay que esperar y redirigir.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate(routes.profile, { replace: true }), 1200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return <Spinner label="CONFIRMANDO CUENTA" />;
}
