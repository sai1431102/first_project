// import { supabase } from '../lib/supabaseClient';

// export function joinMeetingChannel(meetingId, onSignal) {
//   const channel = supabase.channel(`meeting-${meetingId}`);

//   channel
//     .on('broadcast', { event: 'signal' }, payload => {
//       if (onSignal) onSignal(payload.payload);
//     })
//     .subscribe();

//   return channel;
// }

// export function sendSignal(channel, data) {
//   channel.send({
//     type: 'broadcast',
//     event: 'signal',
//     payload: data,
//   });
// }



// src/services/signalingService.js
// src/services/signalingService.js
import { supabase } from "../lib/supabaseClient";

/**
 * joinMeetingChannel(meetingId, onMessage)
 * - returns channel object (has .unsubscribe())
 * - onMessage(payload) called for incoming messages (payload is what sender sent)
 */
export function joinMeetingChannel(meetingId, onMessage) {
  const channelName = `signaling-${meetingId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "broadcast",
      { event: "signal" },
      (msg) => {
        // msg.payload is what was broadcast by a sender
        if (onMessage) onMessage(msg.payload);
      }
    )
    .subscribe((status) => {
      // status can be "SUBSCRIBED" etc. You can debug if needed.
      // console.log("channel status", status);
    });

  // channel has send() method used below by sendSignal
  return channel;
}

/**
 * sendSignal(channel, payload)
 * - payload should be serializable e.g. { from, type, sdp?, candidate? }
 */
export function sendSignal(channel, payload) {
  if (!channel) return;
  channel.send({
    type: "broadcast",
    event: "signal",
    payload,
  });
}

