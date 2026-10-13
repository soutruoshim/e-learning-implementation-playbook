import Image from 'next/image';
import heroImage from '@/public/hero.png';
import {
  KNOWLEDGE_GROUP_ORDER,
  KNOWLEDGE_TYPE_DESCRIPTIONS,
  KNOWLEDGE_TYPE_LABELS,
} from '@/lib/knowledge/types';
import { getGroupedCollections } from '@/lib/knowledge/loader';
import { CollectionCard } from './CollectionCard';
import { Layers } from 'lucide-react';

export function KnowledgeHome() {
  const grouped = getGroupedCollections();

  return (
    <div className="flex flex-col flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Header */}
      <header className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
          <Layers className="w-3.5 h-3.5" />
          <span>Internal Knowledge Base</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
          Knowledge Base & Architecture Playbooks
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          Centralized engineering documentation, implementation blueprints, architecture roadmaps, and developer guides.
        </p>

        <div className="relative w-full max-w-4xl aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-primary/20 bg-muted/40">
          <Image
            src={heroImage}
            alt="Knowledge Base Overview"
            fill
            className="object-cover"
            priority
          />
        </div>
      </header>

      {/* Main Groups (Projects, Roadmaps, Guides, Documentation) */}
      <main className="space-y-16">
        {KNOWLEDGE_GROUP_ORDER.map((type) => {
          const label = KNOWLEDGE_TYPE_LABELS[type];
          const description = KNOWLEDGE_TYPE_DESCRIPTIONS[type];
          const collections = grouped[type] || [];
          const anchorId = `${type.toLowerCase()}s`;

          return (
            <section key={type} id={anchorId} className="scroll-mt-20">
              <div className="border-b border-border/60 pb-3 mb-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {label}
                  </h2>
                  <span className="text-xs font-medium text-muted-foreground">
                    {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              </div>

              {collections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collections.map((collection) => (
                    <CollectionCard
                      key={collection.slug}
                      collection={collection}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-border/60 bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">
                    No {label.toLowerCase()} collections published yet.
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
