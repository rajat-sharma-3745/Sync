import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

type PageContainerProps = PropsWithChildren<{
  className?: string;
}>;

const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div className={clsx('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
  );
};

export default PageContainer;

