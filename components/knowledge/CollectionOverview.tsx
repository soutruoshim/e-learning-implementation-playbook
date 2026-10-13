import Link from 'next/link';
import { CollectionItem } from '@/lib/knowledge/types';
import { getCollectionDocs } from '@/lib/knowledge/loader';
import { BookOpen, ArrowRight, FileText } from 'lucide-react';

interface CollectionOverviewProps {
  collection: CollectionItem;
}

export function CollectionOverview({ collection }: CollectionOverviewProps) {
  const docs = getCollectionDocs(collection.slug);

  return (
    <div className="flex flex-col space-y-8 my-8">
      <div className="p-6 rounded-2xl bg-muted/30 border border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 mb-2">
              <span>{collection.type}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {collection.title} Index
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {collection.description || `Browse all documentation and specifications for ${collection.title}.`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>{docs.length} total documents</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
          Documents in this collection
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={doc.url}
              className="group flex items-start justify-between p-4 rounded-xl border border-border/60 hover:border-primary/40 bg-card hover:bg-card/90 transition-all text-left"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {doc.title}
                  </h4>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
