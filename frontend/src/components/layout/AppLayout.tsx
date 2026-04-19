import type { PropsWithChildren } from 'react';

import PageContainer from './PageContainer';
import Navbar from './Navbar';

const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-(--color-bg) text-(--color-text)">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded focus:bg-emerald-500 focus:px-3 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        Skip to main content
      </a>
      <Navbar />
      <main
        id="main-content"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4 sm:py-8"
      >
        <PageContainer className="flex min-h-0 flex-1 flex-col">{children}</PageContainer>
      </main>
    </div>
  );
};

export default AppLayout;

