import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, GraduationCap } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { storagePublicUrl } from '@/shared/lib/supabase';
import { DIFFICULTY_LABELS, stripMarkdown, truncate } from '@/shared/utils/format';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import { Markdown } from '@/shared/components/ui/Markdown';
import {
  ArcadePanel,
  Badge,
  EmptyState,
  ErrorState,
  SectionTitle,
  Spinner,
} from '@/shared/components/ui';
import type { Tutorial } from '@/shared/types/database';
import { useTutorialCategories, useTutorialDetail, useTutorials } from '../hooks';

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Link to={routes.tutorialDetail(tutorial.slug)} className="group block">
      <ArcadePanel className="h-full p-5 transition-colors group-hover:border-primary/60">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone={tutorial.difficulty === 1 ? 'success' : tutorial.difficulty === 2 ? 'primary' : 'danger'}>
            {DIFFICULTY_LABELS[tutorial.difficulty] ?? 'Guía'}
          </Badge>
          {tutorial.estimated_min && (
            <span className="flex items-center gap-1 text-xs text-ink-dim">
              <Clock size={11} /> {tutorial.estimated_min} min
            </span>
          )}
        </div>

        <h3 className="font-semibold leading-snug text-ink group-hover:text-primary">
          {tutorial.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {tutorial.summary || truncate(stripMarkdown(tutorial.body_md), 120)}
        </p>
      </ArcadePanel>
    </Link>
  );
}

export function TutorialsListPage() {
  const { data: tutorials, isLoading, isError, refetch } = useTutorials();
  const { data: categories } = useTutorialCategories();

  /** Agrupa por categoría respetando el orden del catálogo. */
  const grouped = useMemo(() => {
    if (!tutorials || !categories) return [];

    return categories
      .map((category) => ({
        category,
        items: tutorials.filter((tutorial) => tutorial.category_id === category.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [tutorials, categories]);

  const uncategorized = tutorials?.filter((tutorial) => !tutorial.category_id) ?? [];

  return (
    <>
      <PageMeta
        title="Tutoriales"
        description="Guías para empezar a jugar Super Street Fighter II X y mejorar."
      />

      <SectionTitle>TUTORIALES</SectionTitle>

      {isLoading && <Spinner />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && grouped.length === 0 && uncategorized.length === 0 && (
        <EmptyState
          title="Todavía no hay guías"
          message="La primera será cómo instalar Fightcade."
        />
      )}

      <div className="space-y-12">
        {grouped.map(({ category, items }) => (
          <section key={category.id}>
            <div className="mb-4 flex items-center gap-3">
              <GraduationCap size={18} className="text-primary" />
              <div>
                <h3 className="font-display text-xs text-cyan">
                  {category.name.toUpperCase()}
                </h3>
                {category.description && (
                  <p className="mt-1 text-xs text-ink-dim">{category.description}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>
          </section>
        ))}

        {uncategorized.length > 0 && (
          <section>
            <h3 className="mb-4 font-display text-xs text-cyan">OTRAS GUÍAS</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uncategorized.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

export function TutorialDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, refetch } = useTutorialDetail(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data) return <EmptyState title="Tutorial no encontrado" />;

  const cover = storagePublicUrl('media', data.cover_path);

  return (
    <article className="mx-auto max-w-3xl">
      <PageMeta
        title={data.title}
        description={data.summary ?? truncate(stripMarkdown(data.body_md), 160)}
        image={cover}
      />

      <Link
        to={routes.tutorials}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-primary"
      >
        <ArrowLeft size={16} /> Volver a tutoriales
      </Link>

      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={data.difficulty === 1 ? 'success' : data.difficulty === 2 ? 'primary' : 'danger'}>
            {DIFFICULTY_LABELS[data.difficulty] ?? 'Guía'}
          </Badge>
          {data.estimated_min && (
            <span className="flex items-center gap-1 text-xs text-ink-dim">
              <Clock size={12} /> {data.estimated_min} minutos
            </span>
          )}
        </div>

        <h1 className="font-display text-xl leading-relaxed text-primary neon-text sm:text-2xl">
          {data.title}
        </h1>

        {data.summary && <p className="text-ink-soft">{data.summary}</p>}

        <div className="h-1 w-full bg-gradient-to-r from-primary via-magenta to-transparent" />
      </header>

      {cover && (
        <img src={cover} alt="" className="mb-8 w-full rounded-lg border border-edge" />
      )}

      <Markdown>{data.body_md}</Markdown>
    </article>
  );
}
