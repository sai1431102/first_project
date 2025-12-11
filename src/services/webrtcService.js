// import Peer from 'simple-peer';

// export function createPeer({ initiator, stream, onSignal, onStream }) {
//   const peer = new Peer({
//     initiator,
//     stream,
//     trickle: true,
//     config: {
//       iceServers: [
//         {
//           urls: 'stun:stun.l.google.com:19302', // free STUN
//         },
//       ],
//     }
//   });

//   peer.on('signal', data => {
//     if (onSignal) onSignal(data);
//   });

//   peer.on('stream', remoteStream => {
//     if (onStream) onStream(remoteStream);
//   });

//   return peer;
// }


// src/services/webrtcService.js

const ICE_SERVERS = [
  {
    urls: 'stun:stun.l.google.com:19302', // free STUN for prototype
  },
];

// Create a new RTCPeerConnection and attach local tracks + handlers
export function createPeerConnection({ localStream, onTrack, onIceCandidate }) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // Send our media to the other peer
  if (localStream) {
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });
  }

  // When we receive remote media
  pc.ontrack = event => {
    const [remoteStream] = event.streams;
    if (onTrack) onTrack(remoteStream);
  };

  // When ICE candidates are found, send them to the other peer
  pc.onicecandidate = event => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  return pc;
}
