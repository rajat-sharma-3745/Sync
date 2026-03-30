import { useNavigate } from 'react-router-dom';

import Button from '../../../components/ui/Button';
import { useRoom } from '../../../hooks/useRoom';
import { useUi } from '../../../hooks/useUi';

const RoomHeader = () => {
  const { currentRoom, leaveRoom } = useRoom();
  const { pushToast } = useUi();
  const navigate = useNavigate();

  const handleLeave = () => {
    leaveRoom();
    navigate('/rooms');
  };

  const handleCopyInviteLink = async () => {
    if (!currentRoom?.inviteCode) return;
    const url = `${window.location.origin}/join/${currentRoom.inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      pushToast({ type: 'success', title: 'Copied', message: 'Invite link copied to clipboard.' });
    } catch {
      pushToast({ type: 'error', title: 'Copy failed', message: 'Could not copy to clipboard.' });
    }
  };

  if (!currentRoom) return null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/50 px-4 py-3 md:px-6">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <h1 className="truncate text-lg font-semibold text-neutral-50">
          {currentRoom.name}
        </h1>
        <span className="shrink-0 text-sm text-neutral-400">Host</span>
        {currentRoom.queueLocked && (
          <span
            className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400"
            title="Queue locked"
          >
            Locked
          </span>
        )}
        {currentRoom.inviteCode && (
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="text-sm text-neutral-400">Invite:</span>
            <code className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-xs text-neutral-300">
              {currentRoom.inviteCode}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyInviteLink}
              aria-label="Copy invite link"
            >
              Copy
            </Button>
          </span>
        )}
      </div>
      <Button variant="secondary" size="sm" onClick={handleLeave}>
        Leave
      </Button>
    </header>
  );
};

export default RoomHeader;
