import { Link } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';

const NotFoundPage = () => {
  return (
    <AppLayout>
      <section className="flex min-h-[60vh] flex-col items-start justify-center space-y-6">
        <div>
          <p className="text-sm font-medium text-emerald-400">404</p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-50">Page not found</h1>
          <p className="mt-2 max-w-md text-sm text-neutral-400">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved. Try heading back to the home page
            or your rooms.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/rooms">Go to rooms</Link>
          </Button>
        </div>
      </section>
    </AppLayout>
  );
};

export default NotFoundPage;

