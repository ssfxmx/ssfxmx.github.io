import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { routes } from '@/shared/constants/routes';
import { storagePublicUrl } from '@/shared/lib/supabase';
import { formatDate, formatRelative } from '@/shared/utils/date';
import { stripMarkdown, truncate } from '@/shared/utils/format';
import { PageMeta } from '@/shared/components/seo/PageMeta';
import { Markdown } from '@/shared/components/ui/Markdown';
import {
  ArcadePanel,
  Badge,
  EmptyState,
  ErrorState,
  Pagination,
  SectionTitle,
  Spinner,
} from '@/shared/components/ui';
import type { News } from '@/shared/types/database';
import { useNewsDetail, useNewsList } from '../hooks';

const PAGE_SIZE = 9;

export function NewsCard({ item }: { item: News }) {
  const cover = storagePublicUrl('media', item.cover_path);
  const summary = item.excerpt || truncate(stripMarkdown(item.body_md), 140);

  return (
    <Link to={routes.newsDetail(item.slug)} className="group block">
      <ArcadePanel className="h-full overflow-hidden transition-colors group-hover:border-primary/60">
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-surface-raised">
            <span className="font-display text-[10px] text-ink-dim">SSF2X MX</span>
          </div>
        )}

        <div className="space-y-2 p-5">
          <div className="flex items-center gap-2">
            {item.is_featured && <Badge tone="magenta">Destacada</Badge>}
            <span className="text-xs text-ink-dim">
              {item.published_at ? formatDate(item.published_at) : 'Sin publicar'}
            </span>
          </div>
          <h3 className="font-semibold leading-snug text-ink group-hover:text-primary">
            {item.title}
          </h3>
          <p className="text-sm leading-relaxed text-ink-soft">{summary}</p>
        </div>
      </ArcadePanel>
    </Link>
  );
}

export function NewsListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useNewsList(page, PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageMeta
        title="Noticias"
        description="Todas las noticias de la comunidad SSF2X México."
      />
      <SectionTitle>NOTICIAS</SectionTitle>

      {isLoading && <Spinner />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {data && data.items.length === 0 && (
        <EmptyState
          title="Todavía no hay noticias"
          message="Cuando se publique la primera, aparecerá aquí."
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}

export function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, refetch } = useNewsDetail(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data) {
    return (
      <EmptyState
        title="Noticia no encontrada"
        message="Puede que se haya eliminado o que el enlace esté mal."
      />
    );
  }

  const cover = storagePublicUrl('media', data.cover_path);

  return (
    <article className="mx-auto max-w-3xl">
      <PageMeta
        title={data.title}
        description={data.excerpt ?? truncate(stripMarkdown(data.body_md), 160)}
        image={cover}
      />

      <Link
        to={routes.news}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-primary"
      >
        <ArrowLeft size={16} /> Volver a noticias
      </Link>

      <header className="mb-8">
        <h1 className="font-display text-xl leading-relaxed text-primary neon-text sm:text-2xl">
          {data.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-xs text-ink-dim">
          {data.published_at && (
            <>
              <span>{formatDate(data.published_at)}</span>
              <span>·</span>
              <span>{formatRelative(data.published_at)}</span>
            </>
          )}
        </div>
        <div className="mt-4 h-1 w-full bg-gradient-to-r from-primary via-magenta to-transparent" />
      </header>

      {cover && (
        <img
          src={cover}
          alt=""
          className="mb-8 w-full rounded-lg border border-edge object-cover"
        />
      )}

      <Markdown>{data.body_md}</Markdown>
    </article>
  );
}
