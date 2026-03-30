import type { PropsWithChildren } from 'react';

import PageContainer from './PageContainer';
import Navbar from './Navbar';

const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-text)">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded focus:bg-emerald-500 focus:px-3 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="py-8">
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
};

export default AppLayout;

