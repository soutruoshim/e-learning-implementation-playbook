import Link from 'next/link';
import { CollectionItem, KnowledgeType } from '@/lib/knowledge/types';
import { BookOpen, FolderGit2, Map, Compass, FileText, ArrowRight } from 'lucide-react';

interface CollectionCardProps {
  collection: CollectionItem;
}

const TYPE_STYLES: Record<
  KnowledgeType,
  {
    badgeClass: string;
    icon: typeof BookOpen;
    label: string;
  }
> = {
  PROJECT: {
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: FolderGit2,
    label: 'PROJECT',
  },
  ROADMAP: {
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: Map,
    label: 'ROADMAP',
  },
  GUIDE: {
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: Compass,
    label: 'GUIDE',
  },
  DOCUMENTATION: {
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: FileText,
    label: 'DOCUMENTATION',
  },
};

export function CollectionCard({ collection }: CollectionCardProps) {
  const meta = TYPE_STYLES[collection.type] || TYPE_STYLES.DOCUMENTATION;
  const IconComponent = meta.icon;

  return (
    <Link
      href={`/docs/${collection.slug}`}
      className="group relative flex flex-col justify-between p-6 bg-card hover:bg-card/90 rounded-2xl border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-200 text-left"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${meta.badgeClass}`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {collection.docCount} {collection.docCount === 1 ? 'doc' : 'docs'}
          </span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors mb-2">
          {collection.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {collection.description || `${collection.title} documentation and resources.`}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-medium text-primary">
        <span>Explore Collection</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
