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
import { AdminHeader } from '../shared/AdminKit';

/**
 * Configuración del sitio.
 *
 * Los valores viven en site_settings como JSON, así que cambiar el lema o un
 * enlace de redes no requiere desplegar. Se editan como texto plano y se
 * serializan al guardar: pedirle JSON crudo a quien administra sería una
 * trampa.
 */
export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: listAllSettings,
  });

  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    for (const setting of data) {
      next[setting.key] =
        typeof setting.value === 'string'
          ? setting.value
          : JSON.stringify(setting.value, null, 2);
    }
    setValues(next);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!data) return;
      for (const setting of data) {
        const raw = values[setting.key] ?? '';
        const original =
          typeof setting.value === 'string'
            ? setting.value
            : JSON.stringify(setting.value, null, 2);

        if (raw === original) continue;

        // Si el valor original era texto, se guarda como texto. Si era objeto o
        // booleano, se intenta interpretar y, si falla, se guarda como texto
        // para no romper la configuración por un error de sintaxis.
        let parsed: unknown = raw;
        if (typeof setting.value !== 'string') {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
        }

        await updateSetting(setting.key, parsed);
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

  return (
    <>
      <AdminHeader
        title="CONFIGURACIÓN"
        description="Textos y enlaces del sitio. Los cambios se aplican sin desplegar."
      />

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="mt-5 max-w-2xl space-y-4">
        {data?.map((setting) => {
          const isMultiline = typeof setting.value !== 'string';

          return (
            <ArcadePanel key={setting.key} beveled={false} className="p-5">
              <Field
                label={setting.key}
                hint={setting.description ?? undefined}
              >
                {isMultiline ? (
                  <Textarea
                    value={values[setting.key] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                    }
                    className="min-h-[100px] font-mono text-xs"
                  />
                ) : (
                  <Input
                    value={values[setting.key] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                    }
                  />
                )}
              </Field>

              {!setting.is_public && (
                <p className="mt-2 text-xs text-ink-dim">
                  Ajuste interno: no se expone al público.
                </p>
              )}
            </ArcadePanel>
          );
        })}
      </div>

      <div className="mt-6">
        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Guardar configuración
        </Button>
      </div>
    </>
  );
}
