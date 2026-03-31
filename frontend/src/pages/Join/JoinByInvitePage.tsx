import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { roomApi } from '../../api/roomApi';
import { useUi } from '../../hooks/useUi';
import { HttpError } from '../../api/httpClient';
import { useSocket } from '../../hooks/useSocket';
import type { Room, RoomJoinRequest } from '../../types/room';

/** Extract invite code from pasted value: full join URL or plain code. */
function parseInviteCode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\/join\/([^/?]+)/);
  return match ? match[1].trim() : trimmed;
}

const JoinByInvitePage = () => {
  const { inviteCode: inviteCodeParam } = useParams<{ inviteCode?: string }>();
  const navigate = useNavigate();
  const { pushToast } = useUi();
  const { socket } = useSocket();
  const [code, setCode] = useState(inviteCodeParam?.trim() ?? '');
  const [joining, setJoining] = useState(false);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<RoomJoinRequest | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  const parsedCode = parseInviteCode(code);

  const submitJoinIntent = useCallback(async (inviteCode: string): Promise<void> => {
    try {
      const request = await roomApi.requestJoinByInviteCode(inviteCode);
      setPendingRequest(request);
      pushToast({
        type: 'success',
        title: 'Request sent',
        message: 'Waiting for host approval.',
      });
      return;
    } catch (err) {
      if (
        err instanceof HttpError &&
        (err.status === 400 || err.status === 409)
      ) {
        const room = await roomApi.joinByInviteCode(inviteCode);
        pushToast({ type: 'success', title: 'Joined', message: `You joined "${room.name}".` });
        navigate(`/rooms/${room.id}`);
        return;
      }
      throw err;
    }
  }, [navigate, pushToast]);

  const pendingExpiresAtMs = pendingRequest?.expiresAt
    ? Date.parse(pendingRequest.expiresAt)
    : undefined;
  const pendingExpired = Boolean(
    pendingExpiresAtMs && Number.isFinite(pendingExpiresAtMs) && pendingExpiresAtMs <= nowMs,
  );

  useEffect(() => {
    if (!pendingRequest) return undefined;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [pendingRequest]);

  useEffect(() => {
    if (!inviteCodeParam?.trim() || autoJoinAttempted || joining) return;
    const codeFromUrl = parseInviteCode(inviteCodeParam);
    if (!codeFromUrl) return;
    setAutoJoinAttempted(true);
    setJoining(true);
    submitJoinIntent(codeFromUrl)
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : 'Could not join with this invite code';
        pushToast({ type: 'error', title: 'Join failed', message });
        setCode(codeFromUrl);
      })
      .finally(() => {
        setJoining(false);
      });
  }, [inviteCodeParam, autoJoinAttempted, joining, pushToast, submitJoinIntent]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleApproved = (payload: { room?: Room }) => {
      if (!pendingRequest || !payload.room) return;
      pushToast({
        type: 'success',
        title: 'Request approved',
        message: `You can now join "${payload.room.name}".`,
      });
      setPendingRequest(null);
      navigate(`/rooms/${payload.room.id}`);
    };

    const handleDenied = () => {
      if (!pendingRequest) return;
      setPendingRequest(null);
      pushToast({
        type: 'error',
        title: 'Request denied',
        message: 'The host denied your join request.',
      });
    };

    socket.on('room:join-approved', handleApproved);
    socket.on('room:join-denied', handleDenied);

    return () => {
      socket.off('room:join-approved', handleApproved);
      socket.off('room:join-denied', handleDenied);
    };
  }, [socket, pendingRequest, navigate, pushToast]);

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;
    setReviewingRequest(true);
    try {
      await roomApi.cancelJoinRequest(pendingRequest.roomId, pendingRequest.id);
      setPendingRequest(null);
      pushToast({
        type: 'success',
        title: 'Request cancelled',
        message: 'Your join request has been cancelled.',
      });
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Could not cancel join request';
      pushToast({ type: 'error', title: 'Cancel failed', message });
    } finally {
      setReviewingRequest(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const toJoin = parseInviteCode(code);
    if (!toJoin) {
      pushToast({ type: 'error', title: 'Validation', message: 'Enter an invite code or paste the join link.' });
      return;
    }
    setJoining(true);
    try {
      await submitJoinIntent(toJoin);
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Could not join with this invite code';
      pushToast({ type: 'error', title: 'Join failed', message });
    } finally {
      setJoining(false);
    }
  };

  const showAutoJoinLoading = inviteCodeParam?.trim() && (joining || !autoJoinAttempted);
  if (showAutoJoinLoading) {
    return (
      <AppLayout>
        <DashboardLayout>
          <div className="flex flex-1 items-center justify-center py-12">
            <p className="text-sm text-neutral-400">Joining room…</p>
          </div>
        </DashboardLayout>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold text-neutral-50">Join with invite code</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Paste the invite code or the full join link shared by the room host.
          </p>
          <Card className="mt-6 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="invite-code" className="mb-1 block text-sm font-medium text-neutral-300">
                  Invite code
                </label>
                <Input
                  id="invite-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste code or link (e.g. ABC123 or https://…/join/ABC123)"
                  autoComplete="off"
                  disabled={joining}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={joining || !parsedCode || (Boolean(pendingRequest) && !pendingExpired)}>
                  {joining
                    ? 'Sending…'
                    : pendingRequest && !pendingExpired
                      ? 'Awaiting approval'
                      : 'Request to join'}
                </Button>
                <Button asChild variant="secondary" disabled={joining}>
                  <Link to="/rooms">Back to rooms</Link>
                </Button>
              </div>
              {pendingRequest && !pendingExpired && (
                <>
                  <p className="text-sm text-amber-300">
                    Join request sent. Keep this page open while the host reviews.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancelRequest}
                      disabled={reviewingRequest}
                    >
                      {reviewingRequest ? 'Cancelling…' : 'Cancel request'}
                    </Button>
                  </div>
                </>
              )}
              {pendingRequest && pendingExpired && (
                <p className="text-sm text-amber-300">
                  Your last request expired. Click "Request to join" to send a new one.
                </p>
              )}
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default JoinByInvitePage;
