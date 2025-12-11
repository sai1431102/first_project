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
import { removeParticipant, addParticipant } from "../services/meetingService";

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
  const remoteStreamRef = useRef(null);

  // Create RTCPeerConnection with our ICE servers
  function createPeerConnection({ onTrack, onIceCandidate }) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Create a persistent remote stream to collect all tracks
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
    }

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log("PeerConnection state:", pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.warn("Connection state:", pc.connectionState);
      }
      if (pc.connectionState === "connected") {
        console.log("PeerConnection connected!");
      }
    };

    // ICE connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    // When remote track arrives
    pc.ontrack = (evt) => {
      console.log("Remote track received:", evt.track.kind, evt.track.id, "label:", evt.track.label, "from stream:", evt.streams?.length || 0);
      
      let trackAdded = false;
      let trackReplaced = false;
      
      // Handle track replacement (e.g., when screen share replaces camera)
      if (evt.track.kind === "video") {
        // Remove old video track if it exists
        const oldVideoTracks = remoteStreamRef.current.getVideoTracks();
        oldVideoTracks.forEach(oldTrack => {
          if (oldTrack.id !== evt.track.id) {
            console.log("Removing old video track:", oldTrack.id, oldTrack.label);
            remoteStreamRef.current.removeTrack(oldTrack);
            oldTrack.stop();
            trackReplaced = true;
          }
        });
      }
      
      // Add track to our persistent remote stream
      if (evt.track) {
        const existingTrack = remoteStreamRef.current.getTracks().find(t => t.id === evt.track.id);
        if (!existingTrack) {
          remoteStreamRef.current.addTrack(evt.track);
          trackAdded = true;
          console.log("Added track to remote stream. Total tracks:", remoteStreamRef.current.getTracks().length);
          
          // Listen for track ending (e.g., when screen share stops)
          evt.track.onended = () => {
            console.log("Remote track ended:", evt.track.kind, evt.track.id);
            // The track will be automatically removed from the stream
            // Update the remote stream state
            const newStream = new MediaStream();
            remoteStreamRef.current.getTracks().forEach(t => {
              if (t.readyState !== "ended") {
                newStream.addTrack(t);
              }
            });
            onTrack(newStream);
          };
        } else {
          console.log("Track already exists, might be a replacement");
          trackReplaced = true;
        }
      }
      
      // Also handle streams if available
      if (evt.streams && evt.streams.length > 0) {
        evt.streams.forEach(stream => {
          stream.getTracks().forEach(track => {
            // For video tracks, replace old ones
            if (track.kind === "video") {
              const oldVideoTracks = remoteStreamRef.current.getVideoTracks();
              oldVideoTracks.forEach(oldTrack => {
                if (oldTrack.id !== track.id) {
                  console.log("Removing old video track from stream:", oldTrack.id);
                  remoteStreamRef.current.removeTrack(oldTrack);
                  oldTrack.stop();
                  trackReplaced = true;
                }
              });
            }
            
            const existingTrack = remoteStreamRef.current.getTracks().find(t => t.id === track.id);
            if (!existingTrack) {
              remoteStreamRef.current.addTrack(track);
              trackAdded = true;
              console.log("Added track from stream:", track.kind, track.id, track.label);
            }
          });
        });
      }
      
      // Update state with a new MediaStream reference so React detects the change
      if (trackAdded || trackReplaced || remoteStreamRef.current.getTracks().length > 0) {
        const newStream = new MediaStream();
        remoteStreamRef.current.getTracks().forEach(track => {
          if (track.readyState !== "ended") {
            newStream.addTrack(track);
          }
        });
        console.log("Updating remote stream state with", newStream.getTracks().length, "tracks");
        const videoTracks = newStream.getVideoTracks();
        const audioTracks = newStream.getAudioTracks();
        if (videoTracks.length > 0) {
          console.log("Video track info:", videoTracks[0].label, videoTracks[0].enabled, videoTracks[0].readyState);
        }
        onTrack(newStream);
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

        // 2) Register as participant in database
        if (user?.id) {
          try {
            await addParticipant(meetingId, user.id);
            console.log("Registered as participant");
          } catch (err) {
            console.warn("Failed to register participant (non-fatal):", err);
          }
        }

        // 3) join signaling channel
        const channel = joinMeetingChannel(meetingId, handleSignal);
        channelRef.current = channel;

        // If host, immediately create PC and send offer
        if (isHost) {
          await startAsHost(stream);
        } else {
          // Guest: send a join signal to request offer from host
          sendSignal(channel, {
            from: user.id,
            type: "join-request",
          });
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
      remoteStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, isHost, user?.id]);

  // Host flow: create offer and send via signaling
  async function startAsHost(stream) {
    console.log("Starting as host, creating peer connection");
    
    // Reset remote stream for new connection
    remoteStreamRef.current = new MediaStream();
    setRemoteStream(null);
    
    const pc = createPeerConnection({
      onTrack: (stream) => {
        console.log("Host received remote stream with", stream.getTracks().length, "tracks");
        setRemoteStream(stream);
      },
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
    stream.getTracks().forEach((t) => {
      pc.addTrack(t, stream);
      console.log("Host added local track:", t.kind, t.id);
    });
    pcRef.current = pc;

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      console.log("Host created offer, sending to guest");

      sendSignal(channelRef.current, {
        from: user.id,
        type: "offer",
        sdp: offer,
      });
    } catch (err) {
      console.error("Error creating host offer:", err);
    }
  }

  // Guest flow: create peer, set remote desc, answer
  async function startAsGuest(stream, offerSdp) {
    console.log("Starting as guest, creating peer connection");
    
    // Reset remote stream for new connection
    remoteStreamRef.current = new MediaStream();
    setRemoteStream(null);
    
    const pc = createPeerConnection({
      onTrack: (stream) => {
        console.log("Guest received remote stream with", stream.getTracks().length, "tracks");
        setRemoteStream(stream);
      },
      onIceCandidate: (candidate) => {
        if (!channelRef.current) return;
        sendSignal(channelRef.current, {
          from: user.id,
          type: "candidate",
          candidate,
        });
      },
    });

    stream.getTracks().forEach((t) => {
      pc.addTrack(t, stream);
      console.log("Guest added local track:", t.kind, t.id);
    });
    pcRef.current = pc;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      console.log("Guest set remote description");

      // apply any queued candidates
      for (const c of pendingCandidatesRef.current) {
        try {
          await pc.addIceCandidate(c);
        } catch (err) {
          console.warn("Error applying queued candidate:", err);
        }
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);
      console.log("Guest created answer, sending to host");

      sendSignal(channelRef.current, {
        from: user.id,
        type: "answer",
        sdp: answer,
      });
    } catch (err) {
      console.error("Error in guest setup:", err);
    }
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
        console.log("Guest received offer, creating answer");
        await startAsGuest(stream, payload.sdp);
      } else if (payload.type === "answer" && isHost) {
        // Host receives answer
        console.log("Host received answer");
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
      } else if (payload.type === "join-request" && isHost) {
        // Host receives join request from guest - re-send offer
        console.log("Host received join request, re-sending offer");
        const stream = localStreamRef.current;
        if (!stream) {
          console.warn("Cannot send offer: local stream not ready");
          return;
        }
        
        // If PC exists and is in a valid state, create new offer
        if (pcRef.current && pcRef.current.signalingState !== "closed" && pcRef.current.signalingState !== "have-local-offer") {
          try {
            // Create new offer (this will replace any existing offer)
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            sendSignal(channelRef.current, {
              from: user.id,
              type: "offer",
              sdp: offer,
            });
            console.log("Re-sent offer to guest");
          } catch (err) {
            console.error("Error creating re-offer:", err);
            // If that fails, create a new PC
            if (pcRef.current) {
              pcRef.current.close();
              pcRef.current = null;
            }
            await startAsHost(stream);
          }
        } else {
          // If PC doesn't exist or is in wrong state, create new one
          if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
          }
          remoteStreamRef.current = null;
          setRemoteStream(null);
          await startAsHost(stream);
        }
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
      console.log("Starting screen share...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          cursor: "always",
          displaySurface: "monitor"
        } 
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      console.log("Screen track obtained:", screenTrack.id, screenTrack.label);
      
      const pc = pcRef.current;
      if (!pc) {
        console.warn("PeerConnection not ready for screen share");
        // update local preview anyway
        localStreamRef.current = screenStream;
        setLocalStream(screenStream);
        return;
      }

      // Find the video sender
      const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        console.log("Replacing video track with screen track");
        await videoSender.replaceTrack(screenTrack);
        console.log("Screen track replaced successfully");
      } else {
        console.log("No video sender found, adding screen track");
        pc.addTrack(screenTrack, screenStream);
      }

      // Store original camera stream for restoration
      const originalStream = localStreamRef.current;
      
      // set local preview to screen
      localStreamRef.current = screenStream;
      setLocalStream(screenStream);

      // restore camera when screen track ends
      screenTrack.onended = async () => {
        console.log("Screen share ended, restoring camera");
        try {
          // Stop the screen track
          screenTrack.stop();
          
          // Get camera stream again
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          const camTrack = camStream.getVideoTracks()[0];
          
          const currentVideoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (currentVideoSender) {
            console.log("Replacing screen track with camera track");
            await currentVideoSender.replaceTrack(camTrack);
          } else {
            console.log("No video sender found, adding camera track");
            pc.addTrack(camTrack, camStream);
          }
          
          localStreamRef.current = camStream;
          setLocalStream(camStream);
          console.log("Camera restored");
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
      remoteStreamRef.current = null;
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
