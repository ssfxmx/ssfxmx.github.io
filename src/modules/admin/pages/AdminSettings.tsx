import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendlyError } from '@/shared/lib/supabase';
import { listAllSettings, updateSetting } from '@/shared/lib/catalog.service';
import {
  Alert,
  ArcadePanel,
  Button,
  Field,
  Input,
  Spinner,
  Textarea,
} from '@/shared/components/ui';
import type { SiteSetting } from '@/shared/types/database';
import { AdminHeader } from '../shared/AdminKit';

/**
 * Configuración del sitio.
 *
 * ANTES era un editor genérico de clave/valor: mostraba `social.links` como un
 * bloque de JSON crudo y esperaba que quien administra supiera editarlo sin
 * romper la sintaxis. Una llave mal puesta dejaba la configuración inservible.
 *
 * AHORA cada ajuste tiene su propio campo, con su nombre en español y una
 * explicación de dónde se ve. Las redes sociales son cinco casillas normales.
 * Nadie debería tener que escribir JSON para cambiar un enlace de Facebook.
 */

interface FieldSpec {
  key: string;
  label: string;
  hint?: string;
  type: 'text' | 'longtext' | 'switch';
  /** Para valores que viven dentro de un objeto, como social.links */
  subKey?: string;
  placeholder?: string;
}

const GROUPS: Array<{ title: string; description: string; fields: FieldSpec[] }> = [
  {
    title: 'Identidad',
    description: 'Los textos que ve todo el mundo al entrar.',
    fields: [
      {
        key: 'site.title',
        label: 'Nombre del sitio',
        type: 'text',
        hint: 'Aparece en la pestaña del navegador.',
      },
      {
        key: 'site.tagline',
        label: 'Lema',
        type: 'text',
        hint: 'Frase bajo el título en la portada.',
      },
      {
        key: 'home.hero_text',
        label: 'Texto de portada',
        type: 'longtext',
        hint: 'La frase secundaria de la portada.',
      },
      {
        key: 'site.contact_email',
        label: 'Correo de contacto',
        type: 'text',
        hint: 'Público. Es donde te escribirá la gente.',
      },
    ],
  },
  {
    title: 'Redes sociales',
    description: 'Aparecen como iconos en el pie del sitio. Las vacías no se muestran.',
    fields: [
      { key: 'social.links', subKey: 'facebook', label: 'Facebook', type: 'text', placeholder: 'https://facebook.com/…' },
      { key: 'social.links', subKey: 'youtube', label: 'YouTube', type: 'text', placeholder: 'https://youtube.com/@…' },
      { key: 'social.links', subKey: 'twitch', label: 'Twitch', type: 'text', placeholder: 'https://twitch.tv/…' },
      { key: 'social.links', subKey: 'discord', label: 'Discord', type: 'text', placeholder: 'https://discord.gg/…' },
      { key: 'social.links', subKey: 'x', label: 'X', type: 'text', placeholder: 'https://x.com/…' },
    ],
  },
  {
    title: 'Comportamiento',
    description: 'Interruptores que cambian cómo funciona el sitio.',
    fields: [
      {
        key: 'registration.enabled',
        label: 'Registro abierto',
        type: 'switch',
        hint: 'Si lo apagas, nadie puede crear cuentas nuevas. Útil si hubiera abuso.',
      },
      {
        key: 'features.captcha_enabled',
        label: 'CAPTCHA en el registro',
        type: 'switch',
        hint: 'Preparado para la Fase 2. Todavía no hace nada.',
      },
      {
        key: 'events.default_timezone',
        label: 'Zona horaria de los eventos',
        type: 'text',
        hint: 'Las fechas se guardan siempre en UTC; esto solo cambia cómo se muestran.',
      },
    ],
  },
];

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: listAllSettings,
  });

  /** Estado del formulario: clave completa → valor mostrado como texto. */
  const [values, setValues] = useState<Record<string, string>>({});
  const [switches, setSwitches] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;

    const byKey = new Map(data.map((setting) => [setting.key, setting]));
    const nextValues: Record<string, string> = {};
    const nextSwitches: Record<string, boolean> = {};

    for (const group of GROUPS) {
      for (const field of group.fields) {
        const setting = byKey.get(field.key);
        if (!setting) continue;

        if (field.type === 'switch') {
          nextSwitches[field.key] = Boolean(setting.value);
          continue;
        }

        if (field.subKey) {
          const parent = (setting.value ?? {}) as Record<string, string>;
          nextValues[`${field.key}.${field.subKey}`] = parent[field.subKey] ?? '';
        } else {
          nextValues[field.key] =
            typeof setting.value === 'string' ? setting.value : String(setting.value ?? '');
        }
      }
    }

    setValues(nextValues);
    setSwitches(nextSwitches);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      // Los campos que viven dentro de un objeto se agrupan antes de guardar:
      // las cinco redes son una sola fila en la base de datos.
      const objects: Record<string, Record<string, string>> = {};

      for (const group of GROUPS) {
        for (const field of group.fields) {
          if (field.type === 'switch') {
            await updateSetting(field.key, switches[field.key] ?? false);
            continue;
          }

          if (field.subKey) {
            (objects[field.key] ??= {})[field.subKey] =
              values[`${field.key}.${field.subKey}`]?.trim() ?? '';
            continue;
          }

          await updateSetting(field.key, values[field.key] ?? '');
        }
      }

      for (const [key, value] of Object.entries(objects)) {
        await updateSetting(key, value);
      }
    },
    onSuccess: () => {
      setMessage('Configuración guardada.');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      setError(friendlyError(err));
      setMessage('');
    },
  });

  if (isLoading) return <Spinner />;

  const known = new Set(GROUPS.flatMap((g) => g.fields.map((f) => f.key)));
  const extras = (data ?? []).filter((setting) => !known.has(setting.key));

  return (
    <>
      <AdminHeader
        title="CONFIGURACIÓN"
        description="Textos, enlaces y opciones del sitio. Los cambios se aplican sin desplegar."
      />

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="mt-5 max-w-2xl space-y-6">
        {GROUPS.map((group) => (
          <ArcadePanel key={group.title} beveled={false} className="p-6">
            <h2 className="font-display text-[10px] uppercase tracking-wide text-primary">
              {group.title}
            </h2>
            <p className="mb-5 mt-2 text-xs text-ink-dim">{group.description}</p>

            <div className="space-y-4">
              {group.fields.map((field) => {
                const id = field.subKey ? `${field.key}.${field.subKey}` : field.key;

                if (field.type === 'switch') {
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-start gap-3 rounded border border-edge p-3"
                    >
                      <input
                        type="checkbox"
                        checked={switches[field.key] ?? false}
                        onChange={(e) =>
                          setSwitches((prev) => ({ ...prev, [field.key]: e.target.checked }))
                        }
                        className="mt-0.5 h-4 w-4 accent-[rgb(var(--color-primary))]"
                      />
                      <span>
                        <span className="block text-sm text-ink">{field.label}</span>
                        {field.hint && (
                          <span className="mt-0.5 block text-xs text-ink-dim">
                            {field.hint}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                }

                return (
                  <Field key={id} label={field.label} hint={field.hint}>
                    {field.type === 'longtext' ? (
                      <Textarea
                        value={values[id] ?? ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [id]: e.target.value }))
                        }
                        className="min-h-[80px]"
                      />
                    ) : (
                      <Input
                        value={values[id] ?? ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [id]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                  </Field>
                );
              })}
            </div>
          </ArcadePanel>
        ))}

        {/* Cualquier ajuste que exista en la base pero no esté contemplado
            arriba. Evita que un valor quede invisible y sin forma de tocarlo. */}
        {extras.length > 0 && (
          <ArcadePanel beveled={false} className="p-6">
            <h2 className="font-display text-[10px] uppercase tracking-wide text-ink-dim">
              Otros ajustes
            </h2>
            <p className="mb-4 mt-2 text-xs text-ink-dim">
              Valores que existen en la base pero aún no tienen un campo propio.
            </p>
            <ul className="space-y-1 text-xs text-ink-dim">
              {extras.map((setting: SiteSetting) => (
                <li key={setting.key}>
                  <code className="text-steel">{setting.key}</code>
                  {setting.description && ` — ${setting.description}`}
                </li>
              ))}
            </ul>
          </ArcadePanel>
        )}
      </div>

      <div className="mt-6">
        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Guardar configuración
        </Button>
      </div>
    </>
  );
}
