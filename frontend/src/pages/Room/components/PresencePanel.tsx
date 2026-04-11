import { useRoom } from '../../../hooks/useRoom';
import Button from '../../../components/ui/Button';

const statusLabel: Record<string, string> = {
  synced: 'Synced',
  behind: 'Behind',
  buffering: 'Buffering',
  away: 'Away',
};

interface PresencePanelProps {
  showModerationActions?: boolean;
  currentUserId?: string;
  pendingActionUserId?: string | null;
  onKickMember?: (userId: string) => void;
  onBanMember?: (userId: string) => void;
}

const PresencePanel = ({
  showModerationActions = false,
  currentUserId,
  pendingActionUserId = null,
  onKickMember,
  onBanMember,
}: PresencePanelProps) => {
  const { presence } = useRoom();

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
      <h3 className="mb-2 text-sm font-medium text-neutral-300">
        In this room
      </h3>
      {presence.length === 0 ? (
        <p className="text-sm text-neutral-500">No one else here yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {presence.map((member) => (
            <li
              key={member.userId}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate text-neutral-200">
                {member.username}
              </span>
              <div className="flex items-center gap-1.5">
                {member.status && (
                  <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
                    {statusLabel[member.status] ?? member.status}
                  </span>
                )}
                {showModerationActions && member.userId !== currentUserId && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pendingActionUserId === member.userId}
                      onClick={() => onKickMember?.(member.userId)}
                    >
                      Kick
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-rose-300 hover:bg-rose-900/30"
                      disabled={pendingActionUserId === member.userId}
                      onClick={() => onBanMember?.(member.userId)}
                    >
                      Ban
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default PresencePanel;
