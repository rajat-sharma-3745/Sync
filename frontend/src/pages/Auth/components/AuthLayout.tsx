import type { PropsWithChildren, ReactNode } from 'react';

import AppLayout from '../../../components/layout/AppLayout';
import Card from '../../../components/ui/Card';

import AuthIllustration from './AuthIllustration';

interface AuthLayoutProps extends PropsWithChildren {
  readonly title: string;
  readonly subtitle?: string;
  readonly footer?: ReactNode;
}

const AuthLayout = ({ title, subtitle, footer, children }: AuthLayoutProps) => {
  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <Card className="grid w-full max-w-4xl grid-cols-1 overflow-hidden border-neutral-800 bg-neutral-950/90 md:grid-cols-2">
          <div className="p-8 sm:p-10">
            <h2 className="text-2xl font-semibold text-neutral-50">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
            ) : null}

            <div className="mt-8 space-y-5">{children}</div>

            {footer ? <div className="mt-6 text-sm text-neutral-400">{footer}</div> : null}
          </div>

          <AuthIllustration />
        </Card>
      </div>
    </AppLayout>
  );
};

export default AuthLayout;

