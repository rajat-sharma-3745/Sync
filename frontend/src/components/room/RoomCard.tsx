import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { roomApi } from '../../api/roomApi';
import type { Room } from '../../types/room';
import { useUi } from '../../hooks/useUi';
import { HttpError } from '../../api/httpClient';
import Button from '../ui/Button';
import Card from '../ui/Card';

const DESCRIPTION_MAX_LENGTH = 100;

interface RoomCardProps {
  room: Room;
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
      {showJoinButton && (
        <Button
          size="sm"
          onClick={handleJoin}
          disabled={joining}
          className="w-full"
        >
          {joining ? 'Joining…' : 'Join'}
        </Button>
      )}
    </Card>
  );
};

export default RoomCard;
