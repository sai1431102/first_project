
// // src/pages/AuthPage.jsx
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { signInWithEmail, signUpWithEmail } from '../services/authService';

// export default function AuthPage() {
//   const [mode, setMode] = useState('login'); // 'login' | 'signup'
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       if (mode === 'login') {
//         await signInWithEmail(email, password);
//         navigate('/');
//       } else {
//         const result = await signUpWithEmail(email, password);
//         // If email confirmation is enabled, tell user
//         alert('Sign up successful. Check your email to confirm your account.');
//         // Optionally redirect to login
//         setMode('login');
//       }
//     } catch (err) {
//       alert(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div style={{ maxWidth: 400, margin: '40px auto', padding: 16, background: '#fff', borderRadius: 8 }}>
//       <h2 style={{ textAlign: 'center' }}>
//         {mode === 'login' ? 'Login to MyMeet' : 'Create a MyMeet Account'}
//       </h2>

//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: 8 }}>
//           <input
//             type="email"
//             placeholder="Email"
//             value={email}
//             onChange={e => setEmail(e.target.value)}
//             style={{ width: '100%', padding: 8 }}
//             required
//           />
//         </div>
//         <div style={{ marginBottom: 8 }}>
//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={e => setPassword(e.target.value)}
//             style={{ width: '100%', padding: 8 }}
//             required
//           />
//         </div>
//         <button type="submit" disabled={loading} style={{ width: '100%', padding: 8 }}>
//           {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
//         </button>
//       </form>

//       <div style={{ marginTop: 16, textAlign: 'center' }}>
//         {mode === 'login' ? (
//           <p>
//             Don&apos;t have an account?{' '}
//             <button type="button" onClick={() => setMode('signup')}>
//               Sign up
//             </button>
//           </p>
//         ) : (
//           <p>
//             Already have an account?{' '}
//             <button type="button" onClick={() => setMode('login')}>
//               Login
//             </button>
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }



// src/pages/AuthPage.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/";

  // Redirect authenticated users away from auth page
  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, redirectTo]);

  // Show loading while checking authentication
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        // signUp may require email confirmation depending on Supabase settings
      }
      navigate(redirectTo);
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "white",
        borderRadius: "1.5rem",
        padding: "3rem",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            MyMeet
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9375rem" }}>
            {mode === "login" ? "Welcome back! Sign in to continue" : "Create your account to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
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
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
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
          </div>

          {error && (
            <div style={{
              padding: "0.75rem 1rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "0.5rem",
              color: "#dc2626",
              fontSize: "0.875rem"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.875rem 1.5rem",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
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
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <button
            onClick={() => setMode(prev => (prev === "login" ? "signup" : "login"))}
            style={{
              background: "transparent",
              border: "none",
              color: "#6366f1",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              padding: "0.5rem",
              textDecoration: "underline",
              textUnderlineOffset: "2px"
            }}
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
