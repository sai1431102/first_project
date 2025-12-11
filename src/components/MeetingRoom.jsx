



// // src/components/MeetingRoom.jsx
// import { useEffect, useRef, useState } from 'react';
// import { useAuth } from '../hooks/useAuth';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useMeetingRoom } from '../hooks/useMeetingRoom';

// export default function MeetingRoom() {
//   const { user } = useAuth();
//   const { id: meetingId } = useParams();
//   const navigate = useNavigate();

//   const isHost = window.location.search.includes('host=true');

//   const {
//     localStream,
//     remoteStream,
//     isMicOn,
//     isCameraOn,
//     toggleMic,
//     toggleCamera,
//     leaveMeeting,
//   } = useMeetingRoom(meetingId, user, isHost);

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const [liveText, setLiveText] = useState('');
//   const [fullTranscript, setFullTranscript] = useState('');

//   useEffect(() => {
//     if (localVideoRef.current && localStream) {
//       localVideoRef.current.srcObject = localStream;
//     }
//   }, [localStream]);

//   useEffect(() => {
//     if (remoteVideoRef.current && remoteStream) {
//       remoteVideoRef.current.srcObject = remoteStream;
//     }
//   }, [remoteStream]);

//   function handleLeave() {
//     leaveMeeting();
//     navigate('/');
//   }

//   return (
//     <div style={{ padding: 24 }}>
//       <h2>Meeting: {meetingId}</h2>
//       <p>You are: {isHost ? 'Host' : 'Participant'}</p>

//       <div
//         style={{
//           display: 'flex',
//           gap: 20,
//           justifyContent: 'center',
//           marginTop: 16,
//           marginBottom: 16,
//         }}
//       >
//         <div>
//           <h3>You</h3>
//           <video
//             ref={localVideoRef}
//             autoPlay
//             muted
//             playsInline
//             style={{ width: 320, height: 240, backgroundColor: '#000', borderRadius: 8 }}
//           />
//         </div>

//         <div>
//           <h3>Remote</h3>
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             style={{ width: 320, height: 240, backgroundColor: '#000', borderRadius: 8 }}
//           />
//         </div>
//       </div>

//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'center',
//           gap: 12,
//           marginTop: 8,
//         }}
//       >
//         <button onClick={toggleMic}>{isMicOn ? 'Mute Mic' : 'Unmute Mic'}</button>

//         <button onClick={toggleCamera}>
//           {isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
//         </button>

//         <button
//           onClick={handleLeave}
//           style={{ backgroundColor: '#e53935', color: 'white', border: 'none', padding: '8px 16px' }}
//         >
//           Leave Meeting
//         </button>
//       </div>
//     </div>
//   );
// }


/// src/components/MeetingRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMeetingRoom } from "../hooks/useMeetingRoom";

/**
 * MeetingRoom
 * Assumes:
 * - useMeetingRoom(meetingId, user, isHost) is implemented (previous hook).
 * - This component is rendered at route /meeting/:id
 *
 * Features:
 * - Local & remote video elements
 * - Mute/unmute, camera on/off
 * - Start screen share (uses getDisplayMedia)
 * - Leave meeting (calls hook.leaveMeeting and navigates away)
 *
 * Paste this into src/components/MeetingRoom.jsx
 */

export default function MeetingRoom() {
  const { id: meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get("host") === "true";
  const { user } = useAuth();
  const navigate = useNavigate();

  // Hook that handles WebRTC logic
  const {
    localStream,
    remoteStream,
    isMicOn,
    isCameraOn,
    toggleMic,
    toggleCamera,
    startScreenShare,
    leaveMeeting,
  } = useMeetingRoom(meetingId, user, isHost);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    // attach local stream to local video element
    if (localVideoRef.current) {
      if (localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true; // mute self-preview
        localVideoRef.current.play().catch(() => {});
      } else {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [localStream]);

  useEffect(() => {
    // attach remote stream to remote video element
    if (remoteVideoRef.current) {
      if (remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      } else {
        remoteVideoRef.current.srcObject = null;
      }
    }
  }, [remoteStream]);

  // Detect when screen share starts/stops by checking localStream's video track label
  useEffect(() => {
    if (!localStream) {
      setSharing(false);
      return;
    }
    const vTrack = localStream.getVideoTracks()[0];
    if (!vTrack) {
      setSharing(false);
      return;
    }
    // common heuristic: screen capture track often has "Screen" / "screen" in label depending on browser
    const label = (vTrack.label || "").toLowerCase();
    setSharing(label.includes("screen") || label.includes("display") || label.includes("screen"));
  }, [localStream]);

  // wrappers with debug logs
  async function handleStartScreenShare() {
    console.log("User requested screen share");
    try {
      await startScreenShare();
      // startScreenShare handles onended restoration; UI will update from hook's localStream
    } catch (err) {
      console.error("startScreenShare failed:", err);
      alert("Screen share failed: " + (err?.message || String(err)));
    }
  }

  async function handleLeave() {
    try {
      await leaveMeeting();
    } catch (err) {
      console.warn("leaveMeeting error:", err);
    } finally {
      navigate("/dashboard"); // or wherever you want users to land
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "white"
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.5rem 2rem",
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <h2 style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Meeting Room
          </h2>
          <div style={{
            fontSize: "0.75rem",
            color: "#94a3b8",
            fontFamily: "monospace",
            padding: "0.25rem 0.75rem",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "0.5rem"
          }}>
            ID: {meetingId?.substring(0, 8)}...
          </div>
          {isHost && (
            <div style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              HOST
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={toggleMic}
            style={{
              padding: "0.75rem 1.25rem",
              background: isMicOn ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: isMicOn ? "#10b981" : "#ef4444",
              border: `2px solid ${isMicOn ? "#10b981" : "#ef4444"}`,
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            {isMicOn ? "🔊 Mute" : "🔇 Unmute"}
          </button>
          <button
            onClick={toggleCamera}
            style={{
              padding: "0.75rem 1.25rem",
              background: isCameraOn ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: isCameraOn ? "#10b981" : "#ef4444",
              border: `2px solid ${isCameraOn ? "#10b981" : "#ef4444"}`,
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            {isCameraOn ? "📹 Camera Off" : "📷 Camera On"}
          </button>
          <button
            onClick={handleStartScreenShare}
            style={{
              padding: "0.75rem 1.25rem",
              background: "rgba(99, 102, 241, 0.2)",
              color: "#818cf8",
              border: "2px solid #6366f1",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(99, 102, 241, 0.3)";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(99, 102, 241, 0.2)";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            🖥️ Share Screen
          </button>
          <button
            onClick={handleLeave}
            style={{
              padding: "0.75rem 1.25rem",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            🚪 Leave
          </button>
        </div>
      </header>

      {/* Video Grid */}
      <main style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "1.5rem",
        padding: "2rem",
        overflow: "auto"
      }}>
        {/* Local Video */}
        <div style={{
          position: "relative",
          background: "#0f172a",
          borderRadius: "1rem",
          overflow: "hidden",
          border: "2px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            zIndex: 10,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "white"
          }}>
            You {sharing && "— SCREEN SHARING"}
          </div>
          <video
            ref={localVideoRef}
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              background: "#000"
            }}
          />
          <div style={{
            position: "absolute",
            bottom: "1rem",
            left: "1rem",
            right: "1rem",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            color: "#cbd5e1"
          }}>
            {user?.email || "Local Participant"}
          </div>
        </div>

        {/* Remote Video */}
        <div style={{
          position: "relative",
          background: "#0f172a",
          borderRadius: "1rem",
          overflow: "hidden",
          border: "2px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            zIndex: 10,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "white"
          }}>
            Remote
          </div>
          <video
            ref={remoteVideoRef}
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              background: "#000"
            }}
          />
          <div style={{
            position: "absolute",
            bottom: "1rem",
            left: "1rem",
            right: "1rem",
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            color: "#cbd5e1"
          }}>
            Remote Participant
          </div>
        </div>
      </main>
    </div>
  );
}
