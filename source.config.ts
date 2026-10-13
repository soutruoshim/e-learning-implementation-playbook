import { defineConfig } from 'fumadocs-mdx/config';
import { remarkMdxMermaid, rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      ...rehypeCodeDefaultOptions,
      fallbackLanguage: 'text',
    },
    remarkPlugins: (defaults) => [remarkMdxMermaid, ...defaults],
  },
});
