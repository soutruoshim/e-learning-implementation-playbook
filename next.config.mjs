import { createMDX } from 'fumadocs-mdx/next';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';

const withMDX = createMDX({
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaid],
  },
});

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  basePath: process.env.GITHUB_ACTIONS ? '/e-learning-implementation-playbook' : '',
  images: {
    unoptimized: true,
  },
};

export default withMDX(config);
