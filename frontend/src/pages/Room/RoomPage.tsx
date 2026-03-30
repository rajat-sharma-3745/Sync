import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import RoomHeader from './components/RoomHeader';
import PlayerSection from './components/PlayerSection';
import QueuePanel from './components/QueuePanel';
import ChatPanel from './components/ChatPanel';
import PresencePanel from './components/PresencePanel';
import { useRoom } from '../../hooks/useRoom';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentRoom, loadingRoom, joinRoom, leaveRoom } = useRoom();

  useEffect(() => {
    if (!roomId) return;
    joinRoom(roomId).catch(() => {
      navigate('/rooms');
    });
    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom, navigate]);

  if (!roomId) {
    navigate('/rooms');
    return null;
  }

  if (loadingRoom || !currentRoom) {
    return (
      <AppLayout>
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-sm text-neutral-400">Loading room…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex min-h-0 flex-1 flex-col">
        <RoomHeader />
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:flex-row md:p-6">
          <div className="min-w-0 flex-1">
            <PlayerSection />
          </div>
          <div className="flex w-full flex-col gap-4 md:w-80 md:shrink-0">
            <QueuePanel />
            <ChatPanel />
            <PresencePanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RoomPage;
