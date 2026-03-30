import { useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { queueApi } from '../../../api/queueApi';
import { useRoom } from '../../../hooks/useRoom';
import { useAuth } from '../../../hooks/useAuth';
import { useUi } from '../../../hooks/useUi';
import { useSocket } from '../../../hooks/useSocket';
import type { QueueItem as QueueItemType } from '../../../types/room';
import { HttpError } from '../../../api/httpClient';

function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = trimmed.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

async function fetchYoutubeVideoTitle(videoId: string): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return 'Video';
    }
    const payload = (await response.json()) as { title?: unknown };
    if (typeof payload.title === 'string' && payload.title.trim()) {
      return payload.title.trim();
    }
  } catch {
    // Fallback title keeps queue add flow working even if metadata fetch fails.
  }

  return 'Video';
}

const QueuePanel = () => {
  const { currentRoom, queue, presence, setQueueLock } = useRoom();
  const { user } = useAuth();
  const { pushToast } = useUi();
  const { socket } = useSocket();
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [togglingLock, setTogglingLock] = useState(false);

  const isHost = !!currentRoom && !!user && currentRoom.hostId === user.id;
  const canManageQueue = isHost || !currentRoom?.queueLocked;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = parseYoutubeVideoId(input);
    if (!videoId || !currentRoom) {
      pushToast({
        type: 'error',
        title: 'Invalid input',
        message: 'Enter a valid YouTube URL or video ID.',
      });
      return;
    }
    if (queue.some((item) => item.videoId === videoId)) {
      pushToast({
        type: 'error',
        title: 'Already in queue',
        message: 'This video is already in the queue.',
      });
      return;
    }
    setAdding(true);
    try {
      const title = await fetchYoutubeVideoTitle(videoId);
      await queueApi.addToQueue(currentRoom.id, {
        videoId,
        title,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
      setInput('');
    } catch (err) {
      const message =
        err instanceof HttpError ? err.message : 'Failed to add to queue';
      pushToast({ type: 'error', title: 'Error', message });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (item: QueueItemType) => {
    if (!currentRoom || !canManageQueue) return;
    setRemovingId(item.id);
    try {
      await queueApi.removeFromQueue(currentRoom.id, item.id);
    } catch (err) {
      const message =
        err instanceof HttpError ? err.message : 'Failed to remove';
      pushToast({ type: 'error', title: 'Error', message });
    } finally {
      setRemovingId(null);
    }
  };

  const handlePlayFromQueue = (item: QueueItemType) => {
    if (!currentRoom || !socket) return;
    socket.emit('playback:play', {
      roomId: currentRoom.id,
      videoId: item.videoId,
      position: 0,
    });
  };

  const handleToggleQueueLock = async () => {
    if (!currentRoom || !isHost) return;
    setTogglingLock(true);
    try {
      await setQueueLock(!currentRoom.queueLocked);
    } catch (err) {
      const message =
        err instanceof HttpError ? err.message : 'Failed to update queue lock';
      pushToast({ type: 'error', title: 'Error', message });
    } finally {
      setTogglingLock(false);
    }
  };

  if (!currentRoom) return null;

  const sortedQueue = [...queue].sort((a, b) => a.position - b.position);

  const getAddedByUsername = (addedByUserId: string): string => {
    if (user?.id === addedByUserId) return user.username;
    return (
      presence.find((member) => member.userId === addedByUserId)?.username ??
      'Unknown user'
    );
  };

  return (
    <section className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-950/50">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
        <h3 className="text-sm font-medium text-neutral-300">Queue</h3>
        {isHost && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleToggleQueueLock}
            disabled={togglingLock}
            className="h-7 border border-neutral-600/70 cursor-pointer bg-neutral-900/40 px-2 text-xs font-normal text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-300"
          >
            {togglingLock
              ? 'Updating...'
              : currentRoom.queueLocked
                ? 'Unlock queue'
                : 'Lock queue'}
          </Button>
        )}
      </div>
      {canManageQueue && (
        <form
          onSubmit={handleAdd}
          className="flex gap-2 border-b border-neutral-800 p-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="YouTube URL or video ID"
            className="min-w-0 flex-1"
            disabled={adding}
          />
          <Button
            type="submit"
            size="sm"
            disabled={adding || !input.trim()}
            className="cursor-pointer"
          >
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </form>
      )}
      <div className="max-h-[240px] overflow-y-auto p-2">
        {sortedQueue.length === 0 ? (
          <p className="text-sm text-neutral-500">Queue is empty.</p>
        ) : (
          <ul className="space-y-2">
            {sortedQueue.map((item) => (
              <li
                key={item.id}
                className="flex cursor-pointer hover:bg-neutral-800/50 transition-colors duration-300 items-center gap-2 rounded border border-neutral-800 bg-neutral-900/50 p-2"
                onClick={() => handlePlayFromQueue(item)}
              >
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="h-12 w-20 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-20 shrink-0 rounded bg-neutral-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-200">{item.title}</p>
                  <p className="truncate text-xs text-neutral-500">
                    Added by {getAddedByUsername(item.addedByUserId)}
                  </p>
                </div>
                {canManageQueue && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRemove(item);
                    }}
                    disabled={removingId === item.id}
                    className="text-red-500 hover:text-red-400 cursor-pointer"
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default QueuePanel;
