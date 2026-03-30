import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoomCard from '../../components/room/RoomCard';
import Button from '../../components/ui/Button';
import { roomApi } from '../../api/roomApi';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../hooks/useAuth';
import { useUi } from '../../hooks/useUi';
import type { MyRoomListItem, RoomListItem } from '../../types/room';
import { HttpError } from '../../api/httpClient';
import clsx from 'clsx';

type RoomsTab = 'mine' | 'public';

const DashboardPage = () => {
  const { user } = useAuth();
  const { pushToast } = useUi();
  const tabListId = useId();
  const [activeTab, setActiveTab] = useState<RoomsTab>('mine');
  const [myRooms, setMyRooms] = useState<MyRoomListItem[]>([]);
  const [publicRooms, setPublicRooms] = useState<RoomListItem[]>([]);
  const [loadingMyRooms, setLoadingMyRooms] = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(true);

  useEffect(() => {
    let cancelled = false;
    userApi
      .getMyRooms()
      .then(({ rooms }) => {
        if (!cancelled) setMyRooms(rooms);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof HttpError ? err.message : 'Failed to load your rooms';
          pushToast({ type: 'error', title: 'Error', message });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMyRooms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  useEffect(() => {
    let cancelled = false;
    roomApi
      .listPublicRooms()
      .then(({ rooms }) => {
        if (!cancelled) setPublicRooms(rooms);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof HttpError ? err.message : 'Failed to load public rooms';
          pushToast({ type: 'error', title: 'Error', message });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPublic(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  const username = user?.username ?? 'there';

  return (
    <AppLayout>
      <DashboardLayout>
        <section className="space-y-8">
          <header>
            <p className="text-sm font-medium text-emerald-400">Rooms</p>
            <h1 className="mt-1 text-2xl font-semibold text-neutral-50">
              Welcome, {username}
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Create a room, open your existing ones, or switch to the public tab to browse open rooms.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/rooms/new">Create room</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/join">Join with invite code</Link>
              </Button>
            </div>
          </header>

          <div
            role="tablist"
            aria-label="Room lists"
            id={tabListId}
            className="flex gap-1 rounded-lg border border-neutral-800 bg-neutral-900/60 p-1"
          >
            <button
              type="button"
              role="tab"
              id={`${tabListId}-mine`}
              aria-selected={activeTab === 'mine'}
              aria-controls={`${tabListId}-panel`}
              className={clsx(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
                activeTab === 'mine'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-200',
              )}
              onClick={() => setActiveTab('mine')}
            >
              My rooms
            </button>
            <button
              type="button"
              role="tab"
              id={`${tabListId}-public`}
              aria-selected={activeTab === 'public'}
              aria-controls={`${tabListId}-panel`}
              className={clsx(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
                activeTab === 'public'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-200',
              )}
              onClick={() => setActiveTab('public')}
            >
              Public rooms
            </button>
          </div>

          <section
            role="tabpanel"
            id={`${tabListId}-panel`}
            aria-labelledby={
              activeTab === 'mine' ? `${tabListId}-mine` : `${tabListId}-public`
            }
          >
            {activeTab === 'mine' ? (
              <>
                <h2 className="sr-only">My rooms</h2>
                {loadingMyRooms ? (
                  <p className="text-sm text-neutral-500">Loading…</p>
                ) : myRooms.length === 0 ? (
                  <p className="text-sm text-neutral-400">
                    No rooms yet. Create one or open the Public rooms tab to browse.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {myRooms.map((room) => (
                      <RoomCard key={room.id} room={room} showJoinButton={false} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="sr-only">Public rooms</h2>
                {loadingPublic ? (
                  <p className="text-sm text-neutral-500">Loading…</p>
                ) : publicRooms.length === 0 ? (
                  <p className="text-sm text-neutral-400">No public rooms right now.</p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {publicRooms.map((room) => (
                      <RoomCard key={room.id} room={room} showJoinButton />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </DashboardLayout>
    </AppLayout>
  );
};

export default DashboardPage;
