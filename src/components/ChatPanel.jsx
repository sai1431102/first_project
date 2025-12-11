import { useState } from 'react';

export default function ChatPanel({ messages, user, onSend }) {
  const [msg, setMsg] = useState('');

  function handleSend(e) {
    e.preventDefault();
    if (!msg.trim()) return;
    onSend(msg);
    setMsg('');
  }

  return (
    <div
      style={{
        width: 300,
        borderLeft: '1px solid #ddd',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <h3>Chat</h3>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 10,
          marginBottom: 10,
          borderBottom: '1px solid #ddd',
        }}
      >
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>{m.sender_id === user.id ? 'You' : 'Other'}:</strong>
            <p style={{ margin: 0 }}>{m.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 6 }}>
        <input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Type message..."
          style={{ flex: 1, padding: 6 }}
        />
        <button>Send</button>
      </form>
    </div>
  );
}
