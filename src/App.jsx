// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import AuthPage from './pages/AuthPage';
// import DashboardPage from './pages/DashboardPage';
// import MeetingPage from './pages/MeetingPage';
// import { AuthProvider, useAuth } from './hooks/useAuth';

// function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!user) {
//     return <Navigate to="/auth" replace />;
//   }

//   return children;
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Routes>
//           <Route path="/auth" element={<AuthPage />} />
//           <Route
//             path="/"
//             element={
//               <ProtectedRoute>
//                 <DashboardPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/meeting/:id"
//             element={
//               <ProtectedRoute>
//                 <MeetingPage />
//               </ProtectedRoute>
//             }
//           />
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import MeetingRoom from "./components/MeetingRoom";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontSize: "1.25rem"
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting/:id"
            element={
              <ProtectedRoute>
                <MeetingRoom />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

