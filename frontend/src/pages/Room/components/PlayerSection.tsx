import { useEffect, useRef, useState } from 'react';

import Button from '../../../components/ui/Button';
import { useRoom } from '../../../hooks/useRoom';
import { useSocket } from '../../../hooks/useSocket';
import { useUi } from '../../../hooks/useUi';

interface PlaybackState {
  videoId: string | null;
  position: number;
  isPlaying: boolean;
  playbackRate: number;
}

interface PlaybackStateMessage {
  roomId?: string;
  videoId?: string | null;
  position?: number;
  isPlaying?: boolean;
  playbackRate?: number;
}

interface PlaybackPlayMessage {
  roomId?: string;
  videoId?: string;
  position?: number;
}

interface PlaybackPositionMessage {
  roomId?: string;
  position?: number;
}

interface PlaybackPauseMessage extends PlaybackPositionMessage {
  triggeredBy?: { userId: string; username: string };
}

type PresenceStatus = 'synced' | 'behind' | 'buffering' | 'away';

const playbackDebugEnabled = (): boolean =>
  import.meta.env.DEV ||
  import.meta.env.VITE_DEBUG_PLAYBACK === '1' ||
  import.meta.env.VITE_DEBUG_PLAYBACK === 'true';

function playbackDebugLog(
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!playbackDebugEnabled()) return;
  const context =
    typeof navigator !== 'undefined'
      ? {
          uaMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
          visibility:
            typeof document !== 'undefined'
              ? document.visibilityState
              : undefined,
        }
      : {};
  console.info(`[playback] ${message}`, { ...context, ...data });
}

function youtubeStateName(data: number): string {
  const YT = (window as unknown as { YT?: { PlayerState?: Record<string, number> } })
    .YT?.PlayerState;
  if (!YT) return String(data);
  const entries = Object.entries(YT) as [string, number][];
  const match = entries.find(([, value]) => value === data);
  return match?.[0] ?? String(data);
}

const PlayerSection = () => {
  const { currentRoom, queue, presence } = useRoom();
  const { socket } = useSocket();
  const { pushToast } = useUi();
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any | null>(null);
  const displayVideoIdRef = useRef<string | null>(null);
  const suppressPlayerStateUntilRef = useRef(0);
  const lastNativeEmitRef = useRef<{
    action: 'play' | 'pause' | null;
    at: number;
    position: number;
  }>({
    action: null,
    at: 0,
    position: 0,
  });
  const [playback, setPlayback] = useState<PlaybackState>({
    videoId: null,
    position: 0,
    isPlaying: false,
    playbackRate: 1,
  });
  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const isSoloRoomRef = useRef(true);
  const playbackAnchorRef = useRef<PlaybackState & { updatedAt: number }>({
    videoId: null,
    position: 0,
    isPlaying: false,
    playbackRate: 1,
    updatedAt: Date.now(),
  });
  const lastPresenceStatusRef = useRef<PresenceStatus | null>(null);
  const lastPresenceEmitAtRef = useRef(0);

  const roomId = currentRoom?.id;
  const isSoloRoom = presence.length <= 1;
  const firstQueueVideoId = queue.length > 0 ? queue[0].videoId : null;
  const displayVideoId = playback.videoId ?? firstQueueVideoId;
  const currentVideoTitle =
    queue.find((item) => item.videoId === displayVideoId)?.title ?? null;

  displayVideoIdRef.current = displayVideoId;
  isSoloRoomRef.current = isSoloRoom;

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleState = (payload: PlaybackStateMessage) => {
      if (payload.roomId !== roomId) return;
      const prevPlaying = playbackRef.current.isPlaying;
      const nextState: PlaybackState = {
        videoId:
          Object.prototype.hasOwnProperty.call(payload, 'videoId')
            ? (payload.videoId ?? null)
            : playbackRef.current.videoId,
        position: payload.position ?? playbackRef.current.position,
        isPlaying: payload.isPlaying ?? playbackRef.current.isPlaying,
        playbackRate: payload.playbackRate ?? playbackRef.current.playbackRate,
      };
      playbackDebugLog('socket:playback:state', {
        payload,
        prevPlaying,
        nextPlaying: nextState.isPlaying,
        isPlayingChanged: prevPlaying !== nextState.isPlaying,
      });
      playbackAnchorRef.current = {
        ...nextState,
        updatedAt: Date.now(),
      };
      setPlayback((prev) => ({
        videoId:
          Object.prototype.hasOwnProperty.call(payload, 'videoId')
            ? (payload.videoId ?? null)
            : prev.videoId,
        position: payload.position ?? prev.position,
        isPlaying: payload.isPlaying ?? prev.isPlaying,
        playbackRate: payload.playbackRate ?? prev.playbackRate,
      }));
    };

    const handlePlay = (payload: PlaybackPlayMessage) => {
      if (payload.roomId !== roomId) return;
      playbackDebugLog('socket:playback:play', { payload });
      playbackAnchorRef.current = {
        videoId: payload.videoId ?? playbackRef.current.videoId,
        position: payload.position ?? playbackRef.current.position,
        isPlaying: true,
        playbackRate: playbackRef.current.playbackRate,
        updatedAt: Date.now(),
      };
      setPlayback((prev) => ({
        videoId: payload.videoId ?? prev.videoId,
        position: payload.position ?? prev.position,
        isPlaying: true,
        playbackRate: prev.playbackRate,
      }));
    };

    const handlePause = (payload: PlaybackPauseMessage) => {
      if (payload.roomId !== roomId) return;
      playbackDebugLog('socket:playback:pause → applying room pause', {
        payload,
        triggeredBy: payload.triggeredBy,
      });
      playbackAnchorRef.current = {
        ...playbackRef.current,
        position: payload.position ?? playbackRef.current.position,
        isPlaying: false,
        updatedAt: Date.now(),
      };
      setPlayback((prev) => ({
        ...prev,
        position: payload.position ?? prev.position,
        isPlaying: false,
      }));
    };

    const handleSeek = (payload: PlaybackPositionMessage) => {
      if (payload.roomId !== roomId) return;
      playbackAnchorRef.current = {
        ...playbackRef.current,
        position: payload.position ?? playbackRef.current.position,
        updatedAt: Date.now(),
      };
      setPlayback((prev) => ({
        ...prev,
        position: payload.position ?? prev.position,
      }));
    };

    const handleError = (payload: { message?: string }) => {
      pushToast({
        type: 'error',
        title: 'Playback',
        message: payload.message ?? 'Playback error',
      });
    };

    playbackDebugLog('emit playback:state-request', { roomId });
    socket.emit('playback:state-request', { roomId });
    socket.on('playback:state', handleState);
    socket.on('playback:play', handlePlay);
    socket.on('playback:pause', handlePause);
    socket.on('playback:seek', handleSeek);
    socket.on('playback:error', handleError);

    return () => {
      socket.off('playback:state', handleState);
      socket.off('playback:play', handlePlay);
      socket.off('playback:pause', handlePause);
      socket.off('playback:seek', handleSeek);
      socket.off('playback:error', handleError);
    };
  }, [socket, roomId, pushToast]);

  useEffect(() => {
    playbackAnchorRef.current = {
      ...playback,
      updatedAt: Date.now(),
    };
  }, [playback.videoId]);

  // Create/destroy the player only when the displayed video id changes.
  // Position and play/pause are applied via separate effects (seekTo / playVideo / pauseVideo)
  // so we do not call loadVideoById on every sync (which reloads the video and flashes 0:00).
  useEffect(() => {
    if (!displayVideoId) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
      return;
    }

    const container = playerContainerRef.current;
    if (!container) {
      return;
    }

    const setupPlayer = () => {
      const YT = (window as any).YT;
      if (!YT || typeof YT.Player !== 'function') return;

      const videoId = displayVideoIdRef.current;
      const mountEl = playerContainerRef.current;
      if (!videoId || !mountEl) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }

      playerRef.current = new YT.Player(mountEl, {
        videoId,
        playerVars: {
          autoplay: 0,
        },
        events: {
          onReady: (event: any) => {
            const snap = playbackRef.current;
            if (snap.position > 0) {
              event.target.seekTo(snap.position, true);
            }
            if (snap.isPlaying && !isSoloRoomRef.current) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (!socket || !roomId) return;
            const playerState = (window as any).YT?.PlayerState;
            if (!playerState) return;

            const now = Date.now();
            const suppressUntil = suppressPlayerStateUntilRef.current;
            if (now < suppressUntil) {
              if (event.data === playerState.PAUSED) {
                playbackDebugLog('yt:onStateChange PAUSED ignored (suppress)', {
                  state: youtubeStateName(event.data),
                  suppressMsLeft: suppressUntil - now,
                  roomThinksPlaying: playbackRef.current.isPlaying,
                });
              }
              return;
            }

            if (event.data === playerState.PLAYING) {
              // Only emit if the room thinks we're not playing yet.
              // YouTube can flip BUFFERING <-> PLAYING while already playing;
              // emitting on every PLAYING would spam sockets and cause jitter.
              if (playbackRef.current.isPlaying) return;
              const videoId = displayVideoIdRef.current;
              if (!videoId) return;
              const position = getEventPosition(event.target);
              if (shouldSkipDuplicateEmit('play', position)) {
                playbackDebugLog('yt:PLAYING emit skipped (duplicate guard)', {
                  position,
                });
                return;
              }
              playbackDebugLog('yt:PLAYING → emit playback:play', {
                videoId,
                position,
              });
              socket.emit('playback:play', {
                roomId,
                videoId,
                position,
              });
            } else if (event.data === playerState.PAUSED) {
              // Only emit if the room thinks we're playing.
              if (!playbackRef.current.isPlaying) {
                playbackDebugLog('yt:PAUSED (room already paused, no emit)', {
                  position: getEventPosition(event.target),
                });
                return;
              }
              const position = getEventPosition(event.target);
              if (shouldSkipDuplicateEmit('pause', position)) {
                playbackDebugLog('yt:PAUSED emit skipped (duplicate guard)', {
                  position,
                });
                return;
              }
              playbackDebugLog('yt:PAUSED → emit playback:pause', {
                position,
                roomThinksPlaying: playbackRef.current.isPlaying,
              });
              socket.emit('playback:pause', { roomId, position });
            } else if (event.data === playerState.ENDED) {
              const videoId = displayVideoIdRef.current;
              if (!videoId) return;
              socket.emit('playback:ended', { roomId, videoId });
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      setupPlayer();
    } else {
      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') {
          prevCallback();
        }
        setupPlayer();
      };

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [displayVideoId]);

  // Sync local playback state changes to the underlying player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (playback.isPlaying && !isSoloRoom) {
      if (typeof player.playVideo === 'function') {
        suppressPlayerStateUntilRef.current = Date.now() + 300;
        playbackDebugLog('player sync: playVideo()', {
          isSoloRoom,
          isPlaying: playback.isPlaying,
        });
        player.playVideo();
      }
    } else {
      if (typeof player.pauseVideo === 'function') {
        suppressPlayerStateUntilRef.current = Date.now() + 300;
        playbackDebugLog('player sync: pauseVideo()', {
          isSoloRoom,
          isPlaying: playback.isPlaying,
          reason: !playback.isPlaying ? 'room paused' : 'solo room',
        });
        player.pauseVideo();
      }
    }
  }, [playback.isPlaying, isSoloRoom]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (typeof player.seekTo === 'function') {
      suppressPlayerStateUntilRef.current = Date.now() + 300;
      player.seekTo(playback.position, true);
    }
  }, [playback.position]);

  const getCurrentPosition = () => {
    const player = playerRef.current;
    if (player && typeof player.getCurrentTime === 'function') {
      try {
        const time = player.getCurrentTime();
        if (typeof time === 'number' && !Number.isNaN(time)) {
          return time;
        }
      } catch {
        // ignore and fall back
      }
    }
    return playback.position;
  };

  const getEventPosition = (eventTarget?: any) => {
    if (eventTarget && typeof eventTarget.getCurrentTime === 'function') {
      try {
        const time = eventTarget.getCurrentTime();
        if (typeof time === 'number' && !Number.isNaN(time)) {
          return time;
        }
      } catch {
        // ignore and fall back
      }
    }
    return getCurrentPosition();
  };

  const shouldSkipDuplicateEmit = (
    action: 'play' | 'pause',
    position: number,
  ): boolean => {
    const previous = lastNativeEmitRef.current;
    const now = Date.now();
    const isSameAction = previous.action === action;
    const closeInTime = now - previous.at < 350;
    const closeInPosition = Math.abs(previous.position - position) < 0.25;

    if (isSameAction && closeInTime && closeInPosition) {
      return true;
    }

    lastNativeEmitRef.current = {
      action,
      at: now,
      position,
    };
    return false;
  };

  const handleSeekClick = () => {
    if (!socket || !roomId) return;
    const position = getCurrentPosition();
    socket.emit('playback:seek', { roomId, position });
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    const computeStatus = (): PresenceStatus => {
      if (typeof document !== 'undefined' && document.hidden) {
        return 'away';
      }

      if (isSoloRoomRef.current) {
        return 'synced';
      }

      const player = playerRef.current;
      const YT = (window as any).YT;
      const playerState = YT?.PlayerState;

      if (
        player &&
        playerState &&
        typeof player.getPlayerState === 'function' &&
        player.getPlayerState() === playerState.BUFFERING
      ) {
        return 'buffering';
      }

      const anchor = playbackAnchorRef.current;
      if (!anchor.videoId) {
        return 'away';
      }

      const elapsedSeconds = anchor.isPlaying
        ? ((Date.now() - anchor.updatedAt) / 1000) * anchor.playbackRate
        : 0;
      const expectedPosition = anchor.position + elapsedSeconds;
      const localPosition = getCurrentPosition();
      const drift = Math.abs(localPosition - expectedPosition);

      return drift > 1.5 ? 'behind' : 'synced';
    };

    const emitPresenceStatus = (force = false) => {
      const status = computeStatus();
      const now = Date.now();
      const statusChanged = lastPresenceStatusRef.current !== status;
      const heartbeatDue = now - lastPresenceEmitAtRef.current >= 10_000;

      if (!force && !statusChanged && !heartbeatDue) {
        return;
      }

      socket.emit('presence:client-state', { roomId, status });
      lastPresenceStatusRef.current = status;
      lastPresenceEmitAtRef.current = now;
    };

    const intervalId = window.setInterval(() => emitPresenceStatus(false), 1500);
    const onVisibilityChange = () => emitPresenceStatus(true);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    emitPresenceStatus(true);

    return () => {
      window.clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [socket, roomId, playback.videoId]);

  return (
    <section className="flex flex-col">
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
        {displayVideoId ? (
          <div
            ref={playerContainerRef}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-500">
            No video — add one to the queue
          </div>
        )}
      </div>
      {currentVideoTitle && (
        <p className="mt-2 truncate text-sm font-medium text-neutral-200">
          Now Playing: {currentVideoTitle}
        </p>
      )}
      {displayVideoId && (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSeekClick}
            disabled={!socket || !roomId}
          >
            Sync position
          </Button>
        </div>
      )}
    </section>
  );
};

export default PlayerSection;
