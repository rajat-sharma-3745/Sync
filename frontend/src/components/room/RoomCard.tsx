import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { roomApi } from '../../api/roomApi';
import type { RoomListItem } from '../../types/room';
import { useUi } from '../../hooks/useUi';
import { HttpError } from '../../api/httpClient';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';

const DESCRIPTION_MAX_LENGTH = 100;
const MEMBER_AVATAR_MAX = 4;

interface RoomCardProps {
  room: RoomListItem;
  showJoinButton?: boolean;
}

const RoomCard = ({ room, showJoinButton = true }: RoomCardProps) => {
  const navigate = useNavigate();
  const { pushToast } = useUi();
  const [joining, setJoining] = useState(false);

  const description =
    room.description && room.description.length > DESCRIPTION_MAX_LENGTH
      ? `${room.description.slice(0, DESCRIPTION_MAX_LENGTH)}…`
      : room.description ?? null;

  const memberPreview = room.memberPreview ?? [];
  const memberCount = room.memberCount ?? 0;
  const overflow = Math.max(0, memberCount - memberPreview.length);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await roomApi.joinRoom(room.id);
      navigate(`/rooms/${room.id}`);
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Failed to join room';
      pushToast({ type: 'error', title: 'Could not join', message });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-neutral-50">{room.name}</h3>
              {room.isPublic && (
                <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
                  Public
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Avatar
            name={room.hostUsername}
            src={room.hostAvatarUrl}
            variant="dark"
            className="h-8 w-8 text-[10px]"
          />
          <span className="min-w-0 truncate text-sm text-neutral-300">
            <span className="text-neutral-500">Host </span>
            {room.hostUsername}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-neutral-400">
          <span className="text-neutral-500">Now playing: </span>
          {room.currentVideoTitle ?? 'Nothing playing'}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <div className="flex -space-x-2">
            {memberPreview.slice(0, MEMBER_AVATAR_MAX).map((m, i) => (
              <Avatar
                key={m.userId}
                name={m.username}
                src={m.avatarUrl}
                variant="dark"
                className="h-7 w-7 text-[9px] ring-2 ring-neutral-900"
                style={{ zIndex: MEMBER_AVATAR_MAX - i }}
              />
            ))}
          </div>
          {overflow > 0 ? (
            <span className="text-xs font-medium text-neutral-500">+{overflow}</span>
          ) : null}
          <span className="text-xs text-neutral-500">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {showJoinButton ? (
        <Button size="sm" onClick={handleJoin} disabled={joining} className="w-full">
          {joining ? 'Joining…' : 'Join'}
        </Button>
      ) : (
        <Button asChild size="sm" className="w-full">
          <Link to={`/rooms/${room.id}`}>Open</Link>
        </Button>
      )}
    </Card>
  );
};

export default RoomCard;
