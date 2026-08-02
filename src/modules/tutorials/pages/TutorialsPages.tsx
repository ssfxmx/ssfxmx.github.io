import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, GraduationCap, ListOrdered } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { storagePublicUrl } from '@/shared/lib/supabase';
import { DIFFICULTY_LABELS, slugify, stripMarkdown, truncate } from '@/shared/utils/format';
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
                <h3 className="font-display text-xs text-steel">
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
            <h3 className="mb-4 font-display text-xs text-steel">OTRAS GUÍAS</h3>
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

/**
 * Índice de la guía.
 *
 * Se genera leyendo los encabezados de nivel 2 del Markdown. En un tutorial de
 * instalación, poder ver de un vistazo cuántas secciones faltan cambia la
 * sensación de "esto es larguísimo" por "son seis pasos". También permite
 * volver a un punto concreto sin releer.
 *
 * Se oculta si hay menos de tres secciones: un índice de dos entradas estorba
 * más de lo que ayuda.
 */
function TableOfContents({ body }: { body: string }) {
  const sections = useMemo(() => {
    const matches = [...body.matchAll(/^##\s+(.+)$/gm)];
    return matches.map((match) => {
      const title = match[1]!.trim();
      return { title, id: slugify(title) };
    });
  }, [body]);

  if (sections.length < 3) return null;

  return (
    <nav aria-label="Contenido de la guía" className="mb-10">
      <ArcadePanel beveled={false} className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <ListOrdered size={15} className="text-primary" />
          <h2 className="font-display text-[10px] uppercase tracking-wide text-ink-dim">
            En esta guía
          </h2>
        </div>

        <ol className="space-y-2">
          {sections.map((section, index) => (
            <li key={section.id} className="flex gap-3 text-sm">
              <span className="w-5 shrink-0 text-right font-display text-[10px] text-ink-dim">
                {index + 1}
              </span>
              <a
                href={`#${section.id}`}
                className="text-ink-soft transition-colors hover:text-primary"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </ArcadePanel>
    </nav>
  );
}

export function TutorialDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, refetch } = useTutorialDetail(slug);
  const { data: categories } = useTutorialCategories();

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data) return <EmptyState title="Tutorial no encontrado" />;

  const cover = storagePublicUrl('media', data.cover_path);
  const category = categories?.find((c) => c.id === data.category_id);

  return (
    <article className="mx-auto max-w-2xl">
      <PageMeta
        title={data.title}
        description={data.summary ?? truncate(stripMarkdown(data.body_md), 160)}
        image={cover}
      />

      <Link
        to={routes.tutorials}
        className="mb-8 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-primary"
      >
        <ArrowLeft size={16} /> Volver a tutoriales
      </Link>

      <header className="mb-10">
        {category && (
          <p className="mb-4 font-display text-[10px] uppercase tracking-[0.2em] text-steel">
            {category.name}
          </p>
        )}

        <h1 className="font-display text-lg leading-[1.8] text-primary neon-text sm:text-xl">
          {data.title}
        </h1>

        {data.summary && (
          <p className="mt-5 text-[19px] leading-relaxed text-ink-soft">{data.summary}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-edge pt-5">
          <Badge tone={data.difficulty === 1 ? 'success' : data.difficulty === 2 ? 'primary' : 'danger'}>
            {DIFFICULTY_LABELS[data.difficulty] ?? 'Guía'}
          </Badge>
          {data.estimated_min && (
            <span className="flex items-center gap-1.5 text-xs text-ink-dim">
              <Clock size={13} /> {data.estimated_min} minutos de lectura
            </span>
          )}
        </div>
      </header>

      {cover && (
        <img src={cover} alt="" className="mb-10 w-full rounded-lg border border-edge" />
      )}

      <TableOfContents body={data.body_md} />

      <Markdown>{data.body_md}</Markdown>

      <footer className="mt-16 border-t border-edge pt-8">
        <p className="text-sm text-ink-dim">
          ¿Algo no quedó claro o encontraste un error en la guía? Escríbenos y la
          corregimos.
        </p>
        <Link
          to={routes.tutorials}
          className="mt-4 inline-flex items-center gap-2 text-sm text-steel hover:text-primary"
        >
          <ArrowLeft size={15} /> Ver todas las guías
        </Link>
      </footer>
    </article>
  );
}
