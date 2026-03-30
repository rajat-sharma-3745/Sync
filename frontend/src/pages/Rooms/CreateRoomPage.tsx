import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { roomApi } from '../../api/roomApi';
import { useUi } from '../../hooks/useUi';
import { HttpError } from '../../api/httpClient';

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const { pushToast } = useUi();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      pushToast({ type: 'error', title: 'Validation', message: 'Room name is required.' });
      return;
    }
    setSubmitting(true);
    try {
      const room = await roomApi.createRoom({
        name: trimmedName,
        description: description.trim() || undefined,
        isPublic,
      });
      pushToast({ type: 'success', title: 'Room created', message: `"${room.name}" is ready.` });
      navigate(`/rooms/${room.id}`);
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Failed to create room';
      pushToast({ type: 'error', title: 'Could not create room', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-neutral-50">Create a room</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Set a name and visibility. You can change these later.
            </p>
            <Card className="mt-6 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="room-name" className="mb-1 block text-sm font-medium text-neutral-300">
                    Name
                  </label>
                  <Input
                    id="room-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Friday watch party"
                    minLength={3}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="room-description" className="mb-1 block text-sm font-medium text-neutral-300">
                    Description <span className="text-neutral-500">(optional)</span>
                  </label>
                  <textarea
                    id="room-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this room for?"
                    rows={3}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="room-public"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="room-public" className="text-sm text-neutral-300">
                    Public room (anyone can find and join)
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create room'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/rooms')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
        </div>
      </DashboardLayout>
    </AppLayout>
  );
};

export default CreateRoomPage;
