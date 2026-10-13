import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getPageImageUrl, getPageMarkdownUrl, gitConfig } from '@/lib/shared';
import { getBreadcrumbs } from '@/lib/knowledge/navigation';
import { getCollection } from '@/lib/knowledge/loader';
import { Breadcrumbs } from '@/components/knowledge/Breadcrumbs';
import { CollectionOverview } from '@/components/knowledge/CollectionOverview';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  // If page is not found, check if this is a collection root that has no index.md
  if (!page) {
    if (params.slug?.length === 1) {
      const collection = getCollection(params.slug[0]);
      if (collection) {
        const breadcrumbs = getBreadcrumbs(params.slug, collection.title);
        return (
          <DocsPage breadcrumb={{ enabled: false }}>
            <Breadcrumbs items={breadcrumbs} />
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {collection.type}
              </span>
            </div>
            <DocsTitle className="text-primary tracking-tight font-extrabold">
              {collection.title}
            </DocsTitle>
            <DocsDescription className="mb-0">
              {collection.description}
            </DocsDescription>
            <DocsBody>
              <CollectionOverview collection={collection} />
            </DocsBody>
          </DocsPage>
        );
      }
    }
    notFound();
  }

  const isCollectionRoot = Boolean(params.slug && params.slug.length === 1);
  const collection = isCollectionRoot && params.slug ? getCollection(params.slug[0]) : undefined;
  const breadcrumbs = getBreadcrumbs(params.slug, page.data.title);
  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      breadcrumb={{ enabled: false }}
    >
      <Breadcrumbs items={breadcrumbs} />
      {collection && (
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            {collection.type}
          </span>
        </div>
      )}
      <DocsTitle className="text-primary tracking-tight font-extrabold">
        {page.data.title}
      </DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>

      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>

      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
        {collection && <CollectionOverview collection={collection} />}
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    if (params.slug?.length === 1) {
      const col = getCollection(params.slug[0]);
      if (col) {
        return {
          title: col.title,
          description: col.description,
        };
      }
    }
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
