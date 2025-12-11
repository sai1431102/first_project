import { supabase } from '../lib/supabaseClient';

// Join a realtime channel specific to one meeting's chat
export function joinChatChannel(meetingId, onMessage) {
  const channel = supabase.channel(`chat-${meetingId}`);

  channel
    .on(
      'broadcast',
      { event: 'message' },
      payload => {
        if (onMessage) onMessage(payload.payload);
      }
    )
    .subscribe();

  return channel;
}

// Broadcast a message to everyone in this meeting
export function sendChatBroadcast(channel, messageRow) {
  if (!channel) return;

  channel.send({
    type: 'broadcast',
    event: 'message',
    payload: messageRow, // same shape as DB row
  });
}
