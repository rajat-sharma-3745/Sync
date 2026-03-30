import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { roomApi } from '../../api/roomApi';
import { useUi } from '../../hooks/useUi';
import { HttpError } from '../../api/httpClient';

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
  const [code, setCode] = useState(inviteCodeParam?.trim() ?? '');
  const [joining, setJoining] = useState(false);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

  const parsedCode = parseInviteCode(code);

  useEffect(() => {
    if (!inviteCodeParam?.trim() || autoJoinAttempted || joining) return;
    const codeFromUrl = parseInviteCode(inviteCodeParam);
    if (!codeFromUrl) return;
    setAutoJoinAttempted(true);
    setJoining(true);
    roomApi
      .joinByInviteCode(codeFromUrl)
      .then((room) => {
        pushToast({ type: 'success', title: 'Joined', message: `You joined "${room.name}".` });
        navigate(`/rooms/${room.id}`);
      })
      .catch((err) => {
        const message = err instanceof HttpError ? err.message : 'Could not join with this invite code';
        pushToast({ type: 'error', title: 'Join failed', message });
        setCode(codeFromUrl);
      })
      .finally(() => {
        setJoining(false);
      });
  }, [inviteCodeParam, autoJoinAttempted, joining, navigate, pushToast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const toJoin = parseInviteCode(code);
    if (!toJoin) {
      pushToast({ type: 'error', title: 'Validation', message: 'Enter an invite code or paste the join link.' });
      return;
    }
    setJoining(true);
    try {
      const room = await roomApi.joinByInviteCode(toJoin);
      pushToast({ type: 'success', title: 'Joined', message: `You joined "${room.name}".` });
      navigate(`/rooms/${room.id}`);
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
                <Button type="submit" disabled={joining || !parsedCode}>
                  {joining ? 'Joining…' : 'Join room'}
                </Button>
                <Button asChild variant="secondary" disabled={joining}>
                  <Link to="/rooms">Back to rooms</Link>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default JoinByInvitePage;
