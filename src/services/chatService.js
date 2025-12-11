// import { supabase } from '../lib/supabaseClient';

// export async function sendMessage(meetingId, senderId, content) {
//   const { data, error } = await supabase
//     .from('meeting_messages')
//     .insert({
//       meeting_id: meetingId,
//       sender_id: senderId,
//       content,
//     })
//     .select()
//     .single();

//   if (error) throw error;
//   return data;
// }

// export async function fetchMessages(meetingId) {
//   const { data, error } = await supabase
//     .from('meeting_messages')
//     .select('*')
//     .eq('meeting_id', meetingId)
//     .order('created_at', { ascending: true });

//   if (error) throw error;
//   return data || [];
// }

// export function subscribeToMessages(meetingId, callback) {
//   const channel = supabase
//     .channel(`messages-${meetingId}`)
//     .on(
//       'postgres_changes',
//       {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'meeting_messages',
//         filter: `meeting_id=eq.${meetingId}`,
//       },
//       payload => {
//         callback(payload.new);
//       }
//     )
//     .subscribe();

//   return channel;
// }


import { supabase } from '../lib/supabaseClient';

// Save a message to DB and return the inserted row
export async function sendMessage(meetingId, senderId, content) {
  const { data, error } = await supabase
    .from('meeting_messages')
    .insert({
      meeting_id: meetingId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Load all messages for a meeting (for initial history)
export async function fetchMessages(meetingId) {
  const { data, error } = await supabase
    .from('meeting_messages')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}
