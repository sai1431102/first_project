// import { useParams } from 'react-router-dom';

// export default function MeetingPage() {
//   const { id } = useParams();

//   return (
//     <div style={{ padding: 24 }}>
//       <h1>Meeting Room</h1>
//       <p>Meeting ID: {id}</p>
//       <p>
//         In the next phases, this page will show the WebRTC video room (local + remote streams, controls,
//         chat, etc.).
//       </p>
//     </div>
//   );
// }

// src/pages/MeetingPage.jsx
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import MeetingRoom from "../components/MeetingRoom";

export default function MeetingPage() {
  const { user, loading } = useAuth(); // assuming useAuth exposes loading
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (loading) return; // still checking session

    if (!user) {
      // not logged in → go to auth with redirect back
      navigate(`/auth?redirect=/meeting/${id}`, { replace: true });
    }
  }, [user, loading, id, navigate]);

  // While checking auth or redirecting, show minimal loading
  if (loading || !user) {
    return <div style={{ padding: 24 }}>Checking session...</div>;
  }

  return <MeetingRoom />;
}
