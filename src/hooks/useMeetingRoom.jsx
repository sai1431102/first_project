// // import { useEffect, useRef, useState } from 'react';
// // import { joinMeetingChannel, sendSignal } from '../services/signalingService';
// // import { createPeer } from '../services/webrtcService';

// // export function useMeetingRoom(meetingId, user, isHost) {
// //   const [localStream, setLocalStream] = useState(null);
// //   const [remoteStream, setRemoteStream] = useState(null);
// //   const peerRef = useRef(null);
// //   const channelRef = useRef(null);

// //   useEffect(() => {
// //     async function setup() {
// //       // 1. Capture mic + camera
// //       const stream = await navigator.mediaDevices.getUserMedia({
// //         video: true,
// //         audio: true,
// //       });
// //       setLocalStream(stream);

// //       // 2. Join signaling channel
// //       const channel = joinMeetingChannel(meetingId, handleSignal);
// //       channelRef.current = channel;

// //       // 3. Host creates peer first
// //       if (isHost) {
// //         createAndConnectPeer(stream, true); 
// //       }

// //       // Cleanup
// //       return () => {
// //         stream.getTracks().forEach(t => t.stop());
// //         if (peerRef.current) peerRef.current.destroy();
// //         channel.unsubscribe();
// //       };
// //     }

// //     setup();
// //   }, [meetingId, isHost]);

// //   function createAndConnectPeer(stream, initiator) {
// //     peerRef.current = createPeer({
// //       initiator,
// //       stream,
// //       onSignal: (signalData) => {
// //         sendSignal(channelRef.current, {
// //           from: user.id,
// //           data: signalData,
// //         });
// //       },
// //       onStream: setRemoteStream
// //     });
// //   }

// //   function handleSignal(payload) {
// //     // ignore own messages
// //     if (payload.from === user.id) return;

// //     if (!peerRef.current) {
// //       // guest creates peer when message comes
// //       createAndConnectPeer(localStream, false);
// //     }

// //     peerRef.current.signal(payload.data);
// //   }

// //   return {
// //     localStream,
// //     remoteStream
// //   };
// // }

// // src/hooks/useMeetingRoom.js (or .jsx)
// import { useEffect, useRef, useState } from 'react';
// import { joinMeetingChannel, sendSignal } from '../services/signalingService';
// import { createPeerConnection } from '../services/webrtcService';

// export function useMeetingRoom(meetingId, user, isHost) {
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);

//   const pcRef = useRef(null);
//   const channelRef = useRef(null);
//   const localStreamRef = useRef(null);

//   useEffect(() => {
//     let isMounted = true;

//     async function setup() {
//       try {
//         // 1. Get camera + mic
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//           audio: true,
//         });

//         if (!isMounted) {
//           stream.getTracks().forEach(t => t.stop());
//           return;
//         }

//         localStreamRef.current = stream;
//         setLocalStream(stream);

//         // 2. Join Supabase Realtime signaling channel
//         const channel = joinMeetingChannel(meetingId, handleSignal);
//         channelRef.current = channel;

//         // 3. If host, start offer
//         if (isHost) {
//           await startAsHost(stream);
//         }
//       } catch (err) {
//         console.error('Error setting up meeting room:', err);
//         alert('Could not access camera/microphone. Check permissions and reload.');
//       }
//     }

//     setup();

//     return () => {
//       isMounted = false;

//       if (pcRef.current) {
//         pcRef.current.close();
//         pcRef.current = null;
//       }

//       if (channelRef.current) {
//         channelRef.current.unsubscribe();
//         channelRef.current = null;
//       }

//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(t => t.stop());
//         localStreamRef.current = null;
//       }

//       setLocalStream(null);
//       setRemoteStream(null);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [meetingId, isHost, user.id]);

//   // ---------- Host: create offer ----------

//   async function startAsHost(stream) {
//     const pc = createPeerConnection({
//       localStream: stream,
//       onTrack: setRemoteStream,
//       onIceCandidate: candidate => {
//         if (!channelRef.current) return;
//         sendSignal(channelRef.current, {
//           from: user.id,
//           type: 'candidate',
//           candidate,
//         });
//       },
//     });

//     pcRef.current = pc;

//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);

//     sendSignal(channelRef.current, {
//       from: user.id,
//       type: 'offer',
//       sdp: offer,
//     });
//   }

//   // ---------- Handle incoming signals (both sides) ----------

//   async function handleSignal(payload) {
//     // ignore our own signals
//     if (!payload || payload.from === user.id) return;

//     const stream = localStreamRef.current;
//     if (!stream) {
//       console.warn('Got signal before local stream ready');
//       return;
//     }

//     if (payload.type === 'offer' && !isHost) {
//       // Guest receives offer from host
//       const pc = createPeerConnection({
//         localStream: stream,
//         onTrack: setRemoteStream,
//         onIceCandidate: candidate => {
//           if (!channelRef.current) return;
//           sendSignal(channelRef.current, {
//             from: user.id,
//             type: 'candidate',
//             candidate,
//           });
//         },
//       });

//       pcRef.current = pc;

//       await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);

//       sendSignal(channelRef.current, {
//         from: user.id,
//         type: 'answer',
//         sdp: answer,
//       });
//     } else if (payload.type === 'answer' && isHost) {
//       // Host receives answer from guest
//       const pc = pcRef.current;
//       if (!pc) return;
//       await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
//     } else if (payload.type === 'candidate') {
//       // Either side receives ICE candidate
//       const pc = pcRef.current;
//       if (!pc) return;
//       try {
//         await pc.addIceCandidate(payload.candidate);
//       } catch (err) {
//         console.error('Error adding ICE candidate:', err);
//       }
//     }
//   }

//   // ---------- Controls ----------

//   function toggleMic() {
//     const stream = localStreamRef.current;
//     if (!stream) return;

//     const newState = !isMicOn;
//     setIsMicOn(newState);
//     stream.getAudioTracks().forEach(track => {
//       track.enabled = newState;
//     });
//   }

//   function toggleCamera() {
//     const stream = localStreamRef.current;
//     if (!stream) return;

//     const newState = !isCameraOn;
//     setIsCameraOn(newState);
//     stream.getVideoTracks().forEach(track => {
//       track.enabled = newState;
//     });
//   }

//   function leaveMeeting() {
//     if (pcRef.current) {
//       pcRef.current.close();
//       pcRef.current = null;
//     }

//     if (channelRef.current) {
//       channelRef.current.unsubscribe();
//       channelRef.current = null;
//     }

//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(t => t.stop());
//       localStreamRef.current = null;
//     }

//     setLocalStream(null);
//     setRemoteStream(null);
//   }

//   return {
//     localStream,
//     remoteStream,
//     isMicOn,
//     isCameraOn,
//     toggleMic,
//     toggleCamera,
//     leaveMeeting,
//   };
// }

// src/hooks/useMeetingRoom.js
import { useEffect, useRef, useState } from "react";
import { joinMeetingChannel, sendSignal } from "../services/signalingService";
import { removeParticipant } from "../services/meetingService";

/**
 * useMeetingRoom
 *
 * - meetingId: string
 * - user: { id, email, ... }
 * - isHost: boolean (true if host)
 *
 * Returns:
 * { localStream, remoteStream, isMicOn, isCameraOn, toggleMic, toggleCamera, leaveMeeting, startScreenShare }
 *
 * NOTES:
 * - This hook uses only public STUN servers (free). No TURN servers included.
 * - Keeps a queue of ICE candidates that arrive before remoteDescription is set.
 * - On leave, removes the participant row from DB (so new user can join).
 */

const ICE_SERVERS = [
  // free public STUN for NAT traversal (no TURN => some rare connections may fail)
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useMeetingRoom(meetingId, user, isHost) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  // Create RTCPeerConnection with our ICE servers
  function createPeerConnection({ onTrack, onIceCandidate }) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // When remote track arrives
    pc.ontrack = (evt) => {
      // For one-to-one we expect one stream with tracks
      if (evt.streams && evt.streams[0]) {
        onTrack(evt.streams[0]);
      } else {
        // assemble tracks into a MediaStream
        const ms = new MediaStream();
        evt.track && ms.addTrack(evt.track);
        onTrack(ms);
      }
    };

    // ICE candidates -> send to remote via signaling
    pc.onicecandidate = (evt) => {
      if (evt.candidate && onIceCandidate) {
        onIceCandidate(evt.candidate);
      }
    };

    return pc;
  }

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        // 1) get local media (camera + mic)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // 2) join signaling channel
        const channel = joinMeetingChannel(meetingId, handleSignal);
        channelRef.current = channel;

        // If host, immediately create PC and send offer
        if (isHost) {
          await startAsHost(stream);
        }
      } catch (err) {
        console.error("useMeetingRoom setup error:", err);
        // user friendly fallback (you can show a UI message instead)
        alert("Could not access camera/mic. Check permissions.");
      }
    }

    setup();

    return () => {
      mounted = false;
      // cleanup
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      pendingCandidatesRef.current = [];
      setLocalStream(null);
      setRemoteStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, isHost, user?.id]);

  // Host flow: create offer and send via signaling
  async function startAsHost(stream) {
    const pc = createPeerConnection({
      onTrack: setRemoteStream,
      onIceCandidate: (candidate) => {
        if (!channelRef.current) return;
        sendSignal(channelRef.current, {
          from: user.id,
          type: "candidate",
          candidate,
        });
      },
    });

    // add local tracks to pc
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignal(channelRef.current, {
      from: user.id,
      type: "offer",
      sdp: offer,
    });
  }

  // Guest flow: create peer, set remote desc, answer
  async function startAsGuest(stream, offerSdp) {
    const pc = createPeerConnection({
      onTrack: setRemoteStream,
      onIceCandidate: (candidate) => {
        if (!channelRef.current) return;
        sendSignal(channelRef.current, {
          from: user.id,
          type: "candidate",
          candidate,
        });
      },
    });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;

    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

    // apply any queued candidates
    for (const c of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(c);
      } catch (err) {
        console.warn("Error applying queued candidate:", err);
      }
    }
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    sendSignal(channelRef.current, {
      from: user.id,
      type: "answer",
      sdp: answer,
    });
  }

  // handle incoming signaling messages (offer/answer/candidate)
  async function handleSignal(payload) {
    try {
      if (!payload || payload.from === user.id) return;

      // ensure we have a local stream ready
      const stream = localStreamRef.current;
      if (!stream) {
        console.warn("Signal received before local stream ready");
        return;
      }

      if (payload.type === "offer" && !isHost) {
        // Guest receives offer
        await startAsGuest(stream, payload.sdp);
      } else if (payload.type === "answer" && isHost) {
        // Host receives answer
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        // apply queued candidates
        for (const c of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(c);
          } catch (err) {
            console.warn("Error applying queued candidate:", err);
          }
        }
        pendingCandidatesRef.current = [];
      } else if (payload.type === "candidate") {
        const pc = pcRef.current;
        const candidate = payload.candidate;

        // If pc not ready or remoteDescription not set yet, queue candidate
        if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
          pendingCandidatesRef.current.push(candidate);
          return;
        }

        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    } catch (err) {
      console.error("handleSignal error:", err);
    }
  }

  // Toggle mic
  function toggleMic() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newState = !isMicOn;
    setIsMicOn(newState);
    stream.getAudioTracks().forEach((t) => (t.enabled = newState));
  }

  // Toggle camera
  function toggleCamera() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    stream.getVideoTracks().forEach((t) => (t.enabled = newState));
  }

  // Start screen share (replaces outgoing video track). Free: uses getDisplayMedia().
  async function startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const pc = pcRef.current;
      if (!pc) {
        console.warn("PeerConnection not ready for screen share");
        // update local preview anyway
        localStreamRef.current = screenStream;
        setLocalStream(screenStream);
        return;
      }

      const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, screenStream);
      }

      // set local preview to screen
      localStreamRef.current = screenStream;
      setLocalStream(screenStream);

      // restore camera when screen track ends
      screenTrack.onended = async () => {
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          const camTrack = camStream.getVideoTracks()[0];
          if (videoSender) {
            await videoSender.replaceTrack(camTrack);
          } else {
            pc.addTrack(camTrack, camStream);
          }
          localStreamRef.current = camStream;
          setLocalStream(camStream);
        } catch (err) {
          console.error("Failed to restore camera after screen share:", err);
        }
      };
    } catch (err) {
      console.error("startScreenShare error:", err);
      // user may cancel the browser screen picker — not always an error
    }
  }

  // Leave meeting: close pc, unsubscribe channel, stop tracks, and remove participant row from DB
  async function leaveMeeting() {
    try {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      // remove participant from DB so slot is free (ignore errors)
      try {
        await removeParticipant(meetingId, user.id);
      } catch (err) {
        console.warn("removeParticipant failed:", err);
      }

      pendingCandidatesRef.current = [];
      setLocalStream(null);
      setRemoteStream(null);
    } catch (err) {
      console.error("leaveMeeting error:", err);
    }
  }

  return {
    localStream,
    remoteStream,
    isMicOn,
    isCameraOn,
    toggleMic,
    toggleCamera,
    leaveMeeting,
    startScreenShare,
  };
}
