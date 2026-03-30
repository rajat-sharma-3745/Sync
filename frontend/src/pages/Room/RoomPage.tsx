import { useEffect, useState } from 'react';
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
  const [mobilePanel, setMobilePanel] = useState<'queue' | 'chat' | 'members'>(
    'queue',
  );
  const [desktopPanel, setDesktopPanel] = useState<'chat' | 'members'>('chat');

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
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <PlayerSection />
            <div className="hidden lg:block">
              <QueuePanel />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:hidden">
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-neutral-800 bg-neutral-950/50 p-1">
              <button
                type="button"
                onClick={() => setMobilePanel('queue')}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  mobilePanel === 'queue'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Queue
              </button>
              <button
                type="button"
                onClick={() => setMobilePanel('chat')}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  mobilePanel === 'chat'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setMobilePanel('members')}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  mobilePanel === 'members'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Members
              </button>
            </div>

            {mobilePanel === 'queue' && <QueuePanel />}
            {mobilePanel === 'chat' && <ChatPanel />}
            {mobilePanel === 'members' && <PresencePanel />}
          </div>

          <aside className="hidden w-full shrink-0 lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-8rem)] lg:w-96 lg:flex-col lg:gap-3 lg:self-start">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-800 bg-neutral-950/50 p-1">
              <button
                type="button"
                onClick={() => setDesktopPanel('chat')}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  desktopPanel === 'chat'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setDesktopPanel('members')}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  desktopPanel === 'members'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Members
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto">
              {desktopPanel === 'chat' ? <ChatPanel /> : <PresencePanel />}
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default RoomPage;
