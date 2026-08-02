import { Link } from 'react-router-dom';
import { routes } from '@/shared/constants/routes';
import { resolveAvatar } from '@/shared/utils/avatar';
import { medalFor, positionLabel } from '@/shared/utils/format';
import { ArcadePanel, Avatar, Badge } from '@/shared/components/ui';
import type { EventResultPublic } from '@/shared/types/database';

/**
 * Tabla de posiciones de un torneo.
 *
 * Los jugadores registrados enlazan a su perfil; los invitados (sin cuenta en el
 * sitio) se muestran igual pero sin enlace. Distinguirlos importa: el historial
 * queda completo aunque el ganador no tenga cuenta.
 */
export function ResultsTable({ results }: { results: EventResultPublic[] }) {
  return (
    <ArcadePanel className="overflow-hidden">
      <ul className="divide-y divide-edge">
        {results.map((result) => {
          const medal = medalFor(result.position);
          // Se pasan las iniciales del catálogo, no las dos primeras letras del
          // nombre: "Chun-Li" debe dar "CH", no "Ch". Y el icono del personaje,
          // que antes faltaba y hacía que esta tabla mostrara siempre el
          // monograma aunque el personaje ya tuviera imagen propia.
          const avatar = resolveAvatar({
            avatar_source: result.avatar_source,
            avatar_path: result.avatar_path,
            nickname: result.display_nickname,
            character_initials: result.character_initials,
            character_color: result.character_color,
            character_icon_path: result.character_icon_path,
          });

          return (
            <li
              key={result.id}
              className={[
                'flex items-center gap-4 p-4',
                result.position === 1 ? 'bg-primary/5' : '',
              ].join(' ')}
            >
              <div className="w-10 shrink-0 text-center">
                {medal ? (
                  <span className="text-xl" aria-hidden>
                    {medal}
                  </span>
                ) : (
                  <span className="font-display text-xs text-ink-dim">{result.position}</span>
                )}
                <span className="sr-only">{positionLabel(result.position)}</span>
              </div>

              <Avatar
                src={avatar}
                alt=""
                size={40}
                ring={result.position === 1}
              />

              <div className="min-w-0 flex-1">
                {result.is_registered && result.display_nickname ? (
                  <Link
                    to={routes.playerDetail(result.display_nickname)}
                    className="font-medium text-ink hover:text-primary"
                  >
                    {result.display_nickname}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{result.display_nickname}</span>
                )}

                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-dim">
                  <span>{positionLabel(result.position)}</span>
                  {result.player_city && (
                    <>
                      <span>·</span>
                      <span>{result.player_city}</span>
                    </>
                  )}
                  {!result.is_registered && (
                    <>
                      <span>·</span>
                      <span className="text-ink-dim">invitado</span>
                    </>
                  )}
                </div>
              </div>

              {result.character_name && (
                <Badge tone="cyan">{result.character_name}</Badge>
              )}
            </li>
          );
        })}
      </ul>
    </ArcadePanel>
  );
}
