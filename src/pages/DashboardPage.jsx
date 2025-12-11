// // src/pages/DashboardPage.jsx
// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { signOut } from '../services/authService';
// import { createMeeting, getUserMeetings, joinMeeting } from '../services/meetingService';

// export default function DashboardPage() {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   const [createTitle, setCreateTitle] = useState('');
//   const [joinId, setJoinId] = useState('');
//   const [loadingCreate, setLoadingCreate] = useState(false);
//   const [loadingJoin, setLoadingJoin] = useState(false);
//   const [meetings, setMeetings] = useState({ hostMeetings: [], participantMeetings: [] });
//   const [loadingMeetings, setLoadingMeetings] = useState(true);

//   async function handleLogout() {
//     try {
//       await signOut();
//       navigate('/auth');
//     } catch (err) {
//       alert(err.message);
//     }
//   }

//   async function handleCreateMeeting(e) {
//     e.preventDefault();
//     if (!createTitle.trim()) {
//       alert('Please enter a meeting title');
//       return;
//     }
//     setLoadingCreate(true);
//     try {
//       const meeting = await createMeeting(user.id, createTitle.trim());
//       // Also insert host as participant
//       await joinMeeting(meeting.id, user.id, 'host');
//       navigate(`/meeting/${meeting.id}`);
//     } catch (err) {
//       console.error(err);
//       alert('Error creating meeting: ' + err.message);
//     } finally {
//       setLoadingCreate(false);
//     }
//   }

//   async function handleJoinMeeting(e) {
//     e.preventDefault();
//     if (!joinId.trim()) {
//       alert('Please enter a meeting ID');
//       return;
//     }
//     setLoadingJoin(true);
//     try {
//       await joinMeeting(joinId.trim(), user.id, 'participant');
//       navigate(`/meeting/${joinId.trim()}`);
//     } catch (err) {
//       console.error(err);
//       alert('Error joining meeting: ' + err.message);
//     } finally {
//       setLoadingJoin(false);
//     }
//   }

//   async function loadMeetings() {
//     setLoadingMeetings(true);
//     try {
//       const data = await getUserMeetings(user.id);
//       setMeetings(data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoadingMeetings(false);
//     }
//   }

//   useEffect(() => {
//     loadMeetings();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user?.id]);

//   return (
//     <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
//       <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
//         <div>
//           <h1>MyMeet Dashboard</h1>
//           <p>Logged in as: {user?.email}</p>
//         </div>
//         <button onClick={handleLogout}>Logout</button>
//       </header>

//       {/* Create Meeting */}
//       <section style={{ marginBottom: 24, padding: 16, background: '#fff', borderRadius: 8 }}>
//         <h2>Create a new meeting</h2>
//         <form onSubmit={handleCreateMeeting} style={{ display: 'flex', gap: 8 }}>
//           <input
//             type="text"
//             placeholder="Meeting title"
//             value={createTitle}
//             onChange={e => setCreateTitle(e.target.value)}
//             style={{ flex: 1, padding: 8 }}
//           />
//           <button type="submit" disabled={loadingCreate}>
//             {loadingCreate ? 'Creating...' : 'Create'}
//           </button>
//         </form>
//       </section>

//       {/* Join Meeting */}
//       <section style={{ marginBottom: 24, padding: 16, background: '#fff', borderRadius: 8 }}>
//         <h2>Join a meeting by ID</h2>
//         <form onSubmit={handleJoinMeeting} style={{ display: 'flex', gap: 8 }}>
//           <input
//             type="text"
//             placeholder="Paste meeting UUID here"
//             value={joinId}
//             onChange={e => setJoinId(e.target.value)}
//             style={{ flex: 1, padding: 8 }}
//           />
//           <button type="submit" disabled={loadingJoin}>
//             {loadingJoin ? 'Joining...' : 'Join'}
//           </button>
//         </form>
//         <p style={{ fontSize: 12, marginTop: 8 }}>
//           (For now, use the meeting ID shown below in your meeting list once you create one.)
//         </p>
//       </section>

//       {/* Meeting list */}
//       <section style={{ padding: 16, background: '#fff', borderRadius: 8 }}>
//         <h2>Your meetings</h2>
//         {loadingMeetings ? (
//           <p>Loading meetings...</p>
//         ) : (
//           <>
//             <h3>As Host</h3>
//             {meetings.hostMeetings.length === 0 ? (
//               <p>No meetings where you are host yet.</p>
//             ) : (
//               <ul>
//                 {meetings.hostMeetings.map(m => (
//                   <li key={`host-${m.id}`}>
//                     <strong>{m.title || 'Untitled'}</strong> — ID: {m.id}{' '}
//                     <button onClick={() => navigate(`/meeting/${m.id}`)}>Open</button>
//                   </li>
//               ))}
//               </ul>
//             )}

//             <h3>As Participant</h3>
//             {meetings.participantMeetings.length === 0 ? (
//               <p>No meetings joined yet.</p>
//             ) : (
//               <ul>
//                 {meetings.participantMeetings.map(m => (
//                   <li key={`participant-${m.id}`}>
//                     <strong>{m.title || 'Untitled'}</strong> — ID: {m.id}{' '}
//                     <button onClick={() => navigate(`/meeting/${m.id}`)}>Open</button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </>
//         )}
//       </section>
//     </div>
//   );
// }




// src/pages/DashboardPage.jsx
// Replace the existing file with this complete version.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

/**
 * DashboardPage
 * - Create meetings
 * - Join by ID
 * - List hosted meetings and participant meetings
 * - Copy invite links and open as host/guest
 *
 * IMPORTANT:
 * - Ensure `useAuth` exports { user, loading } (loading optional but recommended)
 * - Ensure `src/lib/supabaseClient.js` exports `supabase`
 */

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(); // loading optional
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [joinId, setJoinId] = useState("");

  const [hostMeetings, setHostMeetings] = useState([]);
  const [participantMeetings, setParticipantMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadMeetings() {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1) Host meetings
      const hostResp = await supabase
        .from("meetings")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (hostResp.error) throw hostResp.error;
      setHostMeetings(hostResp.data || []);

      // 2) Participant meetings (via meeting_participants)
      const partResp = await supabase
        .from("meeting_participants")
        .select("meeting_id")
        .eq("user_id", user.id);

      if (partResp.error) throw partResp.error;

      const ids = (partResp.data || []).map(r => r.meeting_id).filter(Boolean);
      if (ids.length > 0) {
        const participantResp = await supabase
          .from("meetings")
          .select("*")
          .in("id", ids)
          .order("created_at", { ascending: false });

        if (participantResp.error) throw participantResp.error;

        // Exclude meetings created by this user to avoid duplicate listing
        const filtered = (participantResp.data || []).filter(m => m.created_by !== user.id);
        setParticipantMeetings(filtered);
      } else {
        setParticipantMeetings([]);
      }
    } catch (err) {
      console.error("Error loading meetings:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------
  // Safe create meeting handler
  // ------------------------------
  async function handleCreateMeeting(e) {
    e?.preventDefault();

    // 0. Ensure user is present
    if (!user || !user.id) {
      alert("You must be signed in to create a meeting. Please login first.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a meeting title");
      return;
    }

    setCreating(true);

    try {
      // create meeting and ask supabase to return the row
      const insertResp = await supabase
        .from("meetings")
        .insert({
          title: title.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      // debug log to inspect the response
      console.log("create meeting response:", insertResp);

      const meeting = insertResp.data;
      const insertErr = insertResp.error;

      if (insertErr) {
        console.error("Insert error creating meeting:", insertErr);
        alert("Error creating meeting: " + (insertErr.message || String(insertErr)));
        return;
      }

      if (!meeting || !meeting.id) {
        console.error("Create meeting returned no meeting row:", insertResp);
        alert("Could not create meeting (no row returned). Check console/network for details.");
        return;
      }

      // insert a participant row for the host (so the host shows up in participant lists)
      const partResp = await supabase
        .from("meeting_participants")
        .insert({
          meeting_id: meeting.id,
          user_id: user.id,
        });

      if (partResp.error) {
        // not fatal — warn and continue
        console.warn("Could not insert meeting_participants row:", partResp.error);
      } else {
        console.log("Inserted meeting_participant:", partResp.data);
      }

      // navigate the host directly into the meeting as host
      navigate(`/meeting/${meeting.id}?host=true`);

      // clear title (navigation will move away; clearing is just safe)
      setTitle("");
    } catch (err) {
      console.error("Create meeting error (unexpected):", err);
      alert("Unexpected error creating meeting: " + (err.message || String(err)));
    } finally {
      setCreating(false);
    }
  }

  // ------------------------------
  // Invite link helpers & navigation
  // ------------------------------
  function copyInviteLink(meetingId) {
    const origin = window.location.origin;
    const inviteLink = `${origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(inviteLink).then(
      () => alert("Invite link copied to clipboard!"),
      () => {
        // fallback
        prompt("Copy invite link (Ctrl/Cmd+C):", inviteLink);
      }
    );
  }

  function openAsHost(meetingId) {
    navigate(`/meeting/${meetingId}?host=true`);
  }

  function openAsGuest(meetingId) {
    navigate(`/meeting/${meetingId}`);
  }

  function handleJoinById(e) {
    e?.preventDefault();
    if (!joinId.trim()) {
      alert("Please paste a meeting ID");
      return;
    }
    navigate(`/meeting/${joinId.trim()}`);
  }

  // simple sign out
  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err) {
      console.error("Sign out error:", err);
      alert("Sign out failed");
    }
  }

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      padding: "2rem"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
          padding: "1.5rem 2rem",
          background: "white",
          borderRadius: "1rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
          <div>
            <h1 style={{
              fontSize: "2rem",
              fontWeight: 700,
              margin: 0,
              marginBottom: "0.25rem",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              MyMeet Dashboard
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
              {user?.email || (authLoading ? "Checking session..." : "Not signed in")}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
            }}
          >
            Sign Out
          </button>
        </header>

        {/* Action Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
          {/* Create Meeting Card */}
          <div style={{
            background: "white",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "#1e293b"
            }}>
              Create New Meeting
            </h2>
            <form onSubmit={handleCreateMeeting} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                placeholder="Meeting title (e.g. Planning sync)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  padding: "0.875rem 1.25rem",
                  fontSize: "0.9375rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  transition: "all 0.2s",
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6366f1";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: "0.875rem 1.5rem",
                  background: creating ? "#9ca3af" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  cursor: creating ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  if (!creating) {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                }}
              >
                {creating ? "Creating..." : "Create Meeting"}
              </button>
            </form>
          </div>

          {/* Join Meeting Card */}
          <div style={{
            background: "white",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "#1e293b"
            }}>
              Join Meeting
            </h2>
            <form onSubmit={handleJoinById} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                placeholder="Paste meeting ID (uuid)"
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
                style={{
                  padding: "0.875rem 1.25rem",
                  fontSize: "0.9375rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  transition: "all 0.2s",
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6366f1";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "0.875rem 1.5rem",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                }}
              >
                Join Meeting
              </button>
            </form>
          </div>
        </div>

        {/* Meetings Lists */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "1.5rem" }}>
          {/* Hosted Meetings */}
          <div style={{
            background: "white",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span style={{
                width: "4px",
                height: "20px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                borderRadius: "2px"
              }}></span>
              Your Hosted Meetings
            </h3>
            {loading ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>Loading...</p>
            ) : hostMeetings.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "#94a3b8"
              }}>
                <p style={{ fontSize: "1rem", margin: 0 }}>No meetings created yet.</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Create your first meeting above!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {hostMeetings.map(m => (
                  <div
                    key={`host-${m.id}`}
                    style={{
                      padding: "1.25rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.75rem",
                      background: "#f8fafc",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#6366f1";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: "0.25rem"
                      }}>
                        {m.title || "Untitled Meeting"}
                      </div>
                      <div style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontFamily: "monospace",
                        wordBreak: "break-all"
                      }}>
                        ID: {m.id}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => openAsHost(m.id)}
                        style={{
                          padding: "0.625rem 1.25rem",
                          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "none";
                        }}
                      >
                        Open as Host
                      </button>
                      <button
                        onClick={() => copyInviteLink(m.id)}
                        style={{
                          padding: "0.625rem 1.25rem",
                          background: "white",
                          color: "#6366f1",
                          border: "2px solid #6366f1",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#6366f1";
                          e.target.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "white";
                          e.target.style.color = "#6366f1";
                        }}
                      >
                        Copy Invite Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Participant Meetings */}
          <div style={{
            background: "white",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span style={{
                width: "4px",
                height: "20px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderRadius: "2px"
              }}></span>
              Meetings You're In
            </h3>
            {loading ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>Loading...</p>
            ) : participantMeetings.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "#94a3b8"
              }}>
                <p style={{ fontSize: "1rem", margin: 0 }}>No meetings found.</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Join a meeting to get started!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {participantMeetings.map(m => (
                  <div
                    key={`participant-${m.id}`}
                    style={{
                      padding: "1.25rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.75rem",
                      background: "#f8fafc",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#10b981";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: "0.25rem"
                      }}>
                        {m.title || "Untitled Meeting"}
                      </div>
                      <div style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontFamily: "monospace",
                        wordBreak: "break-all"
                      }}>
                        ID: {m.id}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => openAsGuest(m.id)}
                        style={{
                          padding: "0.625rem 1.25rem",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-1px)";
                          e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "none";
                        }}
                      >
                        Open Meeting
                      </button>
                      <button
                        onClick={() => copyInviteLink(m.id)}
                        style={{
                          padding: "0.625rem 1.25rem",
                          background: "white",
                          color: "#10b981",
                          border: "2px solid #10b981",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "#10b981";
                          e.target.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "white";
                          e.target.style.color = "#10b981";
                        }}
                      >
                        Copy Invite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem 1.5rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "0.75rem",
            color: "#dc2626"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
