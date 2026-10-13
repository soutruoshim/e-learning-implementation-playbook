import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BreadcrumbItem } from '@/lib/knowledge/navigation';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center space-x-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap py-1 mb-4"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-1.5">
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
            )}
            {item.url && !isLast ? (
              <Link
                href={item.url}
                className="hover:text-foreground hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              >
                {item.title}
              </Link>
            ) : (
              <span
                className={isLast ? 'text-foreground font-medium truncate max-w-[240px] sm:max-w-none' : ''}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.title}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
