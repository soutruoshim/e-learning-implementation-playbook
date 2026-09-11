import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Geist } from 'next/font/google';
import type { Metadata } from 'next';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: 'E-learning Playbook',
  description: 'Official E-learning documentation and playbook',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
