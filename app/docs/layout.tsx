import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { getGroupedPageTree } from '@/lib/knowledge/navigation';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const groupedTree = getGroupedPageTree(source.getPageTree());

  return (
    <DocsLayout tree={groupedTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
