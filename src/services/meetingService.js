// import { supabase } from '../lib/supabaseClient';

// // Create a new meeting and return it
// export async function createMeeting(hostId, title) {
//   const { data, error } = await supabase
//     .from('meetings')
//     .insert({ host_id: hostId, title })
//     .select()
//     .single();

//   if (error) throw error;
//   return data;
// }

// // Join an existing meeting by ID (insert participant row)
// export async function joinMeeting(meetingId, userId, role = 'participant') {
//   // Check meeting exists
//   const { data: meeting, error: meetingError } = await supabase
//     .from('meetings')
//     .select('*')
//     .eq('id', meetingId)
//     .single();

//   if (meetingError) throw meetingError;
//   if (!meeting) {
//     throw new Error('Meeting not found');
//   }

//   const { data: participant, error: participantError } = await supabase
//     .from('meeting_participants')
//     .insert({
//       meeting_id: meetingId,
//       user_id: userId,
//       role,
//     })
//     .select()
//     .single();

//   if (participantError) throw participantError;

//   return { meeting, participant };
// }

// // Get all meetings where user is host or participant
// export async function getUserMeetings(userId) {
//   // meetings where user is host
//   const { data: hostMeetings, error: hostError } = await supabase
//     .from('meetings')
//     .select('*')
//     .eq('host_id', userId)
//     .order('created_at', { ascending: false });

//   if (hostError) throw hostError;

//   // meetings where user is participant
//   const { data: participantRows, error: partError } = await supabase
//     .from('meeting_participants')
//     .select('meeting_id, meetings(*)')
//     .eq('user_id', userId)
//     .order('joined_at', { ascending: false });

//   if (partError) throw partError;

//   const participantMeetings = (participantRows || []).map(row => row.meetings);

//   return {
//     hostMeetings: hostMeetings || [],
//     participantMeetings: participantMeetings || [],
//   };
// }

// src/services/meetingService.js
import { supabase } from "../lib/supabaseClient";

/**
 * getParticipantCount(meetingId) -> number
 */
export async function getParticipantCount(meetingId) {
  const { data, error } = await supabase
    .from("meeting_participants")
    .select("id")
    .eq("meeting_id", meetingId);

  if (error) throw error;
  return Array.isArray(data) ? data.length : 0;
}

/**
 * addParticipant(meetingId, userId) -> { ok, inserted, data?, error? }
 */
export async function addParticipant(meetingId, userId) {
  // avoid duplicate row
  const { data: exist, error: existErr } = await supabase
    .from("meeting_participants")
    .select("id")
    .eq("meeting_id", meetingId)
    .eq("user_id", userId)
    .limit(1);

  if (existErr) throw existErr;
  if (exist && exist.length > 0) return { ok: true, inserted: false, data: exist };

  const { data, error } = await supabase
    .from("meeting_participants")
    .insert({ meeting_id: meetingId, user_id: userId });

  if (error) return { ok: false, error };
  return { ok: true, inserted: true, data };
}

/**
 * removeParticipant(meetingId, userId)
 */
export async function removeParticipant(meetingId, userId) {
  const { error } = await supabase
    .from("meeting_participants")
    .delete()
    .match({ meeting_id: meetingId, user_id: userId });

  if (error) throw error;
  return true;
}
