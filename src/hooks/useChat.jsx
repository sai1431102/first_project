// import { useEffect, useState } from 'react';
// import { sendMessage, fetchMessages, subscribeToMessages } from '../services/chatService';

// export function useChat(meetingId, user) {
//   const [messages, setMessages] = useState([]);

//   useEffect(() => {
//     let channel = null;

//     async function load() {
//       const existing = await fetchMessages(meetingId);
//       setMessages(existing);

//       channel = subscribeToMessages(meetingId, newMessage => {
//         setMessages(prev => [...prev, newMessage]);
//       });
//     }

//     load();

//     return () => {
//       if (channel) channel.unsubscribe();
//     };
//   }, [meetingId]);

//   async function send(content) {
//     if (!content.trim()) return;
//     await sendMessage(meetingId, user.id, content);
//   }

//   return {
//     messages,
//     send,
//   };
// }


// src/hooks/useChat.js
import { useEffect, useRef, useState } from 'react';
import { sendMessage, fetchMessages } from '../services/chatService';
import { joinChatChannel, sendChatBroadcast } from '../services/chatRealtimeService';

export function useChat(meetingId, user) {
  const [messages, setMessages] = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function setup() {
      // 1) Load history from DB
      const existing = await fetchMessages(meetingId);
      if (!active) return;
      setMessages(existing);

      // 2) Join realtime channel
      const channel = joinChatChannel(meetingId, newMessage => {
        setMessages(prev => [...prev, newMessage]);
      });

      channelRef.current = channel;
    }

    setup();

    return () => {
      active = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [meetingId]);

  // 🔧 FIXED: update local state immediately for sender
  async function send(content) {
    if (!content.trim()) return;

    // Save in DB
    const row = await sendMessage(meetingId, user.id, content);

    // 1) Sender sees their message immediately
    setMessages(prev => [...prev, row]);

    // 2) Broadcast to other participants
    if (channelRef.current) {
      sendChatBroadcast(channelRef.current, row);
    }
  }

  return {
    messages,
    send,
  };
}
