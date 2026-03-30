import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoomCard from '../../components/room/RoomCard';
import Button from '../../components/ui/Button';
import { roomApi } from '../../api/roomApi';
import { useUi } from '../../hooks/useUi';
import type { Room } from '../../types/room';
import { HttpError } from '../../api/httpClient';

const RoomsMarketplacePage = () => {
  const { pushToast } = useUi();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    roomApi
      .listPublicRooms()
      .then(({ rooms: list }) => {
        if (!cancelled) setRooms(list);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof HttpError ? err.message : 'Failed to load public rooms';
          pushToast({ type: 'error', title: 'Error', message });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  return (
    <AppLayout>
      <DashboardLayout>
        <section className="space-y-8">
          <header>
            <p className="text-sm font-medium text-emerald-400">Public rooms</p>
            <h1 className="mt-1 text-2xl font-semibold text-neutral-50">
              Join any room to watch together
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Browse public Sync rooms and join with one click.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link to="/rooms/new">Create a room</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/join">Join with invite code</Link>
              </Button>
            </div>
          </header>

          {loading ? (
            <p className="text-sm text-neutral-500">Loading rooms…</p>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-neutral-400">No public rooms right now. Create one to get started.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} showJoinButton />
              ))}
            </div>
          )}
        </section>
      </DashboardLayout>
    </AppLayout>
  );
};

export default RoomsMarketplacePage;
