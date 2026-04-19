import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import RoomHeader from './components/RoomHeader';
import PlayerSection from './components/PlayerSection';
import QueuePanel from './components/QueuePanel';
import ChatPanel from './components/ChatPanel';
import PresencePanel from './components/PresencePanel';
import { useRoom } from '../../hooks/useRoom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { roomApi } from '../../api/roomApi';
import type { RoomJoinRequest } from '../../types/room';
import Button from '../../components/ui/Button';
import { useUi } from '../../hooks/useUi';

const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentRoom, loadingRoom, joinRoom, leaveRoom } = useRoom();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { pushToast } = useUi();
  const [mobilePanel, setMobilePanel] = useState<'queue' | 'chat' | 'members'>(
    'queue',
  );
  const [desktopPanel, setDesktopPanel] = useState<'chat' | 'members'>('chat');
  const [joinRequests, setJoinRequests] = useState<RoomJoinRequest[]>([]);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [memberActionUserId, setMemberActionUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    joinRoom(roomId).catch(() => {
      navigate('/rooms');
    });
    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom, navigate]);

  useEffect(() => {
    if (!currentRoom || !user || currentRoom.hostId !== user.id) {
      setJoinRequests([]);
      return;
    }

    roomApi
      .listPendingJoinRequests(currentRoom.id)
      .then(({ requests }) => {
        setJoinRequests(requests);
      })
      .catch(() => {
        setJoinRequests([]);
      });
  }, [currentRoom, user]);

  useEffect(() => {
    if (!socket || !currentRoom || !user || currentRoom.hostId !== user.id) {
      return undefined;
    }

    const handleJoinRequested = (request: RoomJoinRequest) => {
      if (request.roomId !== currentRoom.id) return;
      setJoinRequests((prev) =>
        prev.some((r) => r.id === request.id) ? prev : [request, ...prev],
      );
    };

    socket.on('room:join-requested', handleJoinRequested);
    return () => {
      socket.off('room:join-requested', handleJoinRequested);
    };
  }, [socket, currentRoom, user]);

  const handleReviewJoinRequest = async (
    requestId: string,
    action: 'approve' | 'deny',
  ) => {
    if (!currentRoom) return;
    setReviewingRequestId(requestId);
    try {
      if (action === 'approve') {
        await roomApi.approveJoinRequest(currentRoom.id, requestId);
      } else {
        await roomApi.denyJoinRequest(currentRoom.id, requestId);
      }
      setJoinRequests((prev) => prev.filter((request) => request.id !== requestId));
      pushToast({
        type: 'success',
        title: action === 'approve' ? 'Request approved' : 'Request denied',
        message: 'Join request updated.',
      });
    } catch {
      pushToast({
        type: 'error',
        title: 'Request update failed',
        message: 'Could not update this join request.',
      });
    } finally {
      setReviewingRequestId(null);
    }
  };

  const isHost = currentRoom?.hostId === user?.id;

  const handleKickMember = async (targetUserId: string) => {
    if (!currentRoom || !isHost) return;
    setMemberActionUserId(targetUserId);
    try {
      await roomApi.kickMember(currentRoom.id, targetUserId);
      pushToast({
        type: 'success',
        title: 'Member kicked',
        message: 'The member was removed from this room.',
      });
    } catch {
      pushToast({
        type: 'error',
        title: 'Kick failed',
        message: 'Could not kick this member.',
      });
    } finally {
      setMemberActionUserId(null);
    }
  };

  const handleBanMember = async (targetUserId: string) => {
    if (!currentRoom || !isHost) return;
    setMemberActionUserId(targetUserId);
    try {
      await roomApi.banMember(currentRoom.id, targetUserId);
      pushToast({
        type: 'success',
        title: 'Member banned',
        message: 'The member can no longer join this room.',
      });
    } catch {
      pushToast({
        type: 'error',
        title: 'Ban failed',
        message: 'Could not ban this member.',
      });
    } finally {
      setMemberActionUserId(null);
    }
  };

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
        {isHost && joinRequests.length > 0 && (
          <div className="mx-4 mt-4 rounded-xl border border-amber-600/40 bg-amber-500/10 p-3 md:mx-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-amber-200">Join requests</p>
              <span className="text-xs text-amber-300">{joinRequests.length} pending</span>
            </div>
            <div className="space-y-2">
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-950/70 px-3 py-2"
                >
                  <p className="text-sm text-neutral-100">{request.requesterUsername}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReviewJoinRequest(request.id, 'approve')}
                      disabled={reviewingRequestId === request.id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReviewJoinRequest(request.id, 'deny')}
                      disabled={reviewingRequestId === request.id}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
            {mobilePanel === 'members' && (
              <PresencePanel
                showModerationActions={isHost}
                currentUserId={user?.id}
                pendingActionUserId={memberActionUserId}
                onKickMember={handleKickMember}
                onBanMember={handleBanMember}
              />
            )}
          </div>

          <aside className="hidden w-full shrink-0 lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-8rem)] lg:w-96 lg:flex-col lg:gap-3 lg:self-start">
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
              {desktopPanel === 'chat' ? (
                <ChatPanel />
              ) : (
                <PresencePanel
                  showModerationActions={isHost}
                  currentUserId={user?.id}
                  pendingActionUserId={memberActionUserId}
                  onKickMember={handleKickMember}
                  onBanMember={handleBanMember}
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default RoomPage;
