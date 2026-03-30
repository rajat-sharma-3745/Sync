import { useRef, useEffect, useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useRoom } from '../../../hooks/useRoom';
import { useSocket } from '../../../hooks/useSocket';

const ChatPanel = () => {
  const { currentRoom, messages } = useRoom();
  const { socket } = useSocket();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !currentRoom || !socket) return;
    socket.emit('chat:send', { roomId: currentRoom.id, content });
    setInput('');
  };

  if (!currentRoom) return null;

  return (
    <section className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-950/50">
      <h3 className="border-b border-neutral-800 px-3 py-2 text-sm font-medium text-neutral-300">
        Chat
      </h3>
      <div
        ref={listRef}
        className="flex min-h-[120px] max-h-[280px] flex-1 flex-col overflow-y-auto p-3"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">No messages yet.</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={
                  msg.type === 'SYSTEM'
                    ? 'text-xs text-neutral-500'
                    : 'text-sm text-neutral-200'
                }
              >
                {msg.type === 'USER' && (msg.username || msg.userId) && (
                  <span className="font-medium text-neutral-400">
                    {msg.username ??
                      (msg.userId ? msg.userId.slice(0, 8) : 'User')}
                    :{' '}
                  </span>
                )}
                {msg.content}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-neutral-800 p-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="min-w-0 flex-1"
          maxLength={2000}
        />
        <Button type="submit" size="sm" disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
};

export default ChatPanel;
