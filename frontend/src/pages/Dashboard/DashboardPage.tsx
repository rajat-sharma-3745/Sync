import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoomCard from '../../components/room/RoomCard';
import Button from '../../components/ui/Button';
import { roomApi } from '../../api/roomApi';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../hooks/useAuth';
import { useUi } from '../../hooks/useUi';
import type { Room } from '../../types/room';
import { HttpError } from '../../api/httpClient';

const PUBLIC_PREVIEW_COUNT = 6;

const DashboardPage = () => {
  const { user } = useAuth();
  const { pushToast } = useUi();
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
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
        if (!cancelled) setPublicRooms(rooms.slice(0, PUBLIC_PREVIEW_COUNT));
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
              Create a room, open your existing ones, or browse public rooms below.
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

          <section>
            <h2 className="text-lg font-medium text-neutral-50">My rooms</h2>
            {loadingMyRooms ? (
              <p className="mt-2 text-sm text-neutral-500">Loading…</p>
            ) : myRooms.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-400">
                No rooms yet. Create one or browse public rooms.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {myRooms.map((room) => (
                  <li key={room.id}>
                    <Link
                      to={`/rooms/${room.id}`}
                      className="text-emerald-400 hover:underline"
                    >
                      {room.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium text-neutral-50">Public rooms</h2>
            {loadingPublic ? (
              <p className="mt-2 text-sm text-neutral-500">Loading…</p>
            ) : publicRooms.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-400">No public rooms right now.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publicRooms.map((room) => (
                  <RoomCard key={room.id} room={room} showJoinButton />
                ))}
              </div>
            )}
          </section>
        </section>
      </DashboardLayout>
    </AppLayout>
  );
};

export default DashboardPage;
