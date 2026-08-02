import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Lock, Upload } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { friendlyError } from '@/shared/lib/supabase';
import { queryKeys } from '@/shared/lib/queryClient';
import { prepareAvatarFile, resolveAvatar } from '@/shared/utils/avatar';
import { COUNTRIES, countryName } from '@/shared/utils/format';
import { formatDate } from '@/shared/utils/date';
import { useCharacters } from '@/shared/hooks';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import {
  Alert,
  ArcadePanel,
  Avatar,
  Button,
  Field,
  Input,
  LinkButton,
  SectionTitle,
  Select,
  Spinner,
  Textarea,
} from '@/shared/components/ui';
import { useSession } from '@/modules/auth/hooks/useSession';
import * as auth from '@/modules/auth/services/auth.service';

/* ========================================================================== */
/* Vista privada del perfil                                                    */
/* ========================================================================== */

export function ProfilePage() {
  const { session, profile } = useSession();
  const { data: characters } = useCharacters();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.profile(session?.user.id ?? ''),
    queryFn: () => auth.getOwnProfile(session!.user.id),
    enabled: Boolean(session?.user.id),
  });

  if (isLoading || !profile) return <Spinner />;

  const character = characters?.find((c) => c.id === profile.main_character_id);
  const avatar = resolveAvatar({
    ...profile,
    character_initials: character?.initials,
    character_color: character?.color_hex,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageMeta title="Mi perfil" noIndex />

      <SectionTitle
        action={
          <div className="flex gap-2">
            <LinkButton to={routes.playerDetail(profile.nickname)} variant="ghost" size="sm">
              <Eye size={15} /> Ver público
            </LinkButton>
            <LinkButton to={routes.profileEdit} variant="primary" size="sm">
              Editar
            </LinkButton>
          </div>
        }
      >
        MI PERFIL
      </SectionTitle>

      <ArcadePanel className="mb-6 p-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar src={avatar} alt="" size={88} ring />
          <div>
            <h2 className="font-display text-sm text-primary">{profile.nickname}</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {profile.city ? `${profile.city}, ` : ''}
              {countryName(profile.country_code)}
            </p>
            {character && <p className="mt-1 text-sm text-cyan">Main: {character.name}</p>}
          </div>
        </div>
      </ArcadePanel>

      <ArcadePanel className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={15} className="text-ink-dim" />
          <h3 className="text-sm font-semibold text-ink">Información privada</h3>
        </div>

        <p className="mb-5 text-xs text-ink-dim">
          Estos datos nunca aparecen en tu perfil público ni se envían al navegador de
          otros visitantes.
        </p>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-edge pb-3">
            <dt className="text-ink-dim">Correo</dt>
            <dd className="truncate text-ink">{session?.user.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-edge pb-3">
            <dt className="text-ink-dim">Nombre</dt>
            <dd className="text-ink">{data?.private?.full_name ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-edge pb-3">
            <dt className="text-ink-dim">Fecha de nacimiento</dt>
            <dd className="text-ink">
              {data?.private?.birth_date ? formatDate(data.private.birth_date) : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-dim">Miembro desde</dt>
            <dd className="text-ink">{formatDate(profile.created_at)}</dd>
          </div>
        </dl>
      </ArcadePanel>
    </div>
  );
}

/* ========================================================================== */
/* Edición                                                                     */
/* ========================================================================== */

export function ProfileEditPage() {
  const { session, profile, refreshProfile } = useSession();
  const { data: characters } = useCharacters();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    city: '',
    country_code: 'MX',
    bio: '',
    main_character_id: 0,
    avatar_source: 'character' as 'character' | 'upload',
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Credenciales, en un formulario aparte para no mezclarlas con el perfil.
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credMessage, setCredMessage] = useState('');
  const [credError, setCredError] = useState('');

  useEffect(() => {
    if (!profile) return;
    setForm({
      city: profile.city ?? '',
      country_code: profile.country_code,
      bio: profile.bio ?? '',
      main_character_id: profile.main_character_id ?? 0,
      avatar_source: profile.avatar_source,
    });
  }, [profile]);

  if (!profile || !session) return <Spinner />;

  const character = characters?.find((c) => c.id === form.main_character_id);
  const currentAvatar =
    preview ??
    resolveAvatar({
      avatar_source: form.avatar_source,
      avatar_path: profile.avatar_path,
      nickname: profile.nickname,
      character_initials: character?.initials,
      character_color: character?.color_hex,
    });

  function handleFile(selected: File | null) {
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    if (selected) setForm((prev) => ({ ...prev, avatar_source: 'upload' }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      let avatarPath = profile!.avatar_path;

      if (file) {
        // Se redimensiona y convierte a WebP en el navegador antes de subir:
        // así el bucket no se llena de fotos de varios megabytes.
        const blob = await prepareAvatarFile(file);
        avatarPath = await auth.uploadAvatar(session!.user.id, blob);
      }

      await auth.updateOwnProfile(session!.user.id, {
        city: form.city.trim() || null,
        country_code: form.country_code,
        bio: form.bio.trim() || null,
        main_character_id: form.main_character_id || null,
        avatar_source: form.avatar_source,
        avatar_path: form.avatar_source === 'upload' ? avatarPath : profile!.avatar_path,
      });

      await refreshProfile();
      setMessage('Cambios guardados.');
      setFile(null);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCredentials(event: FormEvent) {
    event.preventDefault();
    setCredError('');
    setCredMessage('');

    try {
      if (newEmail.trim()) {
        await auth.updateEmail(newEmail);
        setCredMessage('Te enviamos un correo para confirmar la nueva dirección.');
        setNewEmail('');
      }
      if (newPassword) {
        if (newPassword.length < 8) {
          setCredError('La contraseña debe tener al menos 8 caracteres.');
          return;
        }
        await auth.updatePassword(newPassword);
        setCredMessage('Contraseña actualizada.');
        setNewPassword('');
      }
    } catch (err) {
      setCredError(friendlyError(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageMeta title="Editar perfil" noIndex />
      <SectionTitle>EDITAR PERFIL</SectionTitle>

      <ArcadePanel className="mb-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {message && <Alert tone="success">{message}</Alert>}
          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar src={currentAvatar} alt="" size={88} ring />

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={form.avatar_source === 'character' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, avatar_source: 'character' }));
                    setPreview(null);
                    setFile(null);
                  }}
                >
                  Usar personaje
                </Button>

                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded border border-edge bg-surface-raised px-3 py-1.5 text-xs hover:border-cyan hover:text-cyan">
                  <Upload size={14} /> Subir imagen
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <p className="text-xs text-ink-dim">
                El avatar de personaje se genera automáticamente. Si subes una imagen, se
                recorta en cuadrado y se optimiza antes de guardarla.
              </p>
            </div>
          </div>

          <Field label="Personaje principal">
            <Select
              value={form.main_character_id || ''}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, main_character_id: Number(e.target.value) }))
              }
            >
              <option value="">Sin definir</option>
              {characters?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="País">
              <Select
                value={form.country_code}
                onChange={(e) => setForm((prev) => ({ ...prev, country_code: e.target.value }))}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Ciudad">
              <Input
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                maxLength={80}
              />
            </Field>
          </div>

          <Field label="Bio" hint={`${form.bio.length}/280 caracteres. Es público.`}>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              maxLength={280}
            />
          </Field>

          <div className="flex gap-3">
            <Button type="submit" loading={saving}>
              Guardar cambios
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(routes.profile)}>
              Cancelar
            </Button>
          </div>
        </form>
      </ArcadePanel>

      <ArcadePanel className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink">Correo y contraseña</h3>

        <form onSubmit={handleCredentials} className="space-y-4">
          {credMessage && <Alert tone="success">{credMessage}</Alert>}
          {credError && <Alert tone="danger">{credError}</Alert>}

          <Field label="Nuevo correo" hint="Se enviará un enlace de confirmación.">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={session.user.email ?? ''}
            />
          </Field>

          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>

          <Button type="submit" variant="secondary">
            Actualizar credenciales
          </Button>
        </form>
      </ArcadePanel>

      <p className="mt-6 text-center text-xs text-ink-dim">
        ¿Quieres cambiar tu nickname?{' '}
        <Link to={routes.home} className="text-cyan hover:text-primary">
          Escríbenos
        </Link>
        , lo hacemos manualmente para evitar suplantaciones.
      </p>
    </div>
  );
}
