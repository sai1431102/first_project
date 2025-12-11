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
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import MeetingRoom from "./components/MeetingRoom";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/meeting/:id" element={<MeetingRoom />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
