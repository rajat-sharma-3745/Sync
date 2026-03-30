import type { PropsWithChildren } from 'react';

const PageContainer = ({ children }: PropsWithChildren) => {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>;
};

export default PageContainer;

