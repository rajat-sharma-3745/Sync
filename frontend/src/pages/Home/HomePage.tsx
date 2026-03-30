import { Link } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageContainer from '../../components/layout/PageContainer';
import { useAuth } from '../../hooks/useAuth';

const FEATURES = [
  {
    title: 'Synced playback',
    description: 'Everyone watches in perfect sync. Play, pause, and seek together in real time.',
  },
  {
    title: 'Shared queue & playlist',
    description: 'Add, reorder, and skip tracks as a group. Host can lock the queue or let everyone contribute.',
  },
  {
    title: 'In-room chat',
    description: 'Text chat with typing indicators and join/leave messages so the room stays social.',
  },
  {
    title: 'Public & private rooms',
    description: 'Invite links, host controls, and a marketplace to discover or create your own rooms.',
  },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <AppLayout>
      <section className="py-16">
        <PageContainer>
          <div className="max-w-3xl space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-400">Watch together in real time</p>
              <h1 className="text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
                Sync YouTube rooms with your friends.
              </h1>
              <p className="max-w-xl text-sm text-neutral-400 sm:text-base">
                Create a room, drop a link, and enjoy perfectly synced playback, shared queues, and chat — all in one
                place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Button asChild size="lg">
                  <Link to="/rooms">Get started</Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link to="/login">Get started</Link>
                </Button>
              )}
              <Button asChild variant="secondary" size="lg">
                <Link to="/rooms">Browse public rooms</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="border-t border-neutral-800 py-20">
        <PageContainer>
          <div className="mb-12 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-emerald-400/90">
              Why Sync
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">
              Watch together, stay in sync
            </h2>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map(({ title, description }) => (
              <li key={title}>
                <Card className="group h-full border-neutral-800/80 bg-neutral-900/40 p-6 transition-colors hover:border-emerald-500/20 hover:bg-neutral-900/60">
                  <div className="flex gap-4">
                    <span
                      className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-2">
                      <h3 className="text-lg font-semibold text-neutral-50">{title}</h3>
                      <p className="text-sm leading-relaxed text-neutral-400">{description}</p>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </PageContainer>
      </section>
    </AppLayout>
  );
};

export default HomePage;

