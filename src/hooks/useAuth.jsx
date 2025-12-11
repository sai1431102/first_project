// src/hooks/useAuth.js
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('supabase getSession error', err);
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      try {
        listener.subscription.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // sign up
  async function signUp(email, password) {
    const resp = await supabase.auth.signUp({
      email,
      password,
    });
    if (resp.error) throw resp.error;
    return resp;
  }

  // sign in (password)
  async function signIn(email, password) {
    const resp = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (resp.error) throw resp.error;
    setUser(resp.data?.user ?? null);
    return resp;
  }

  // sign out
  async function signOut() {
    const resp = await supabase.auth.signOut();
    if (resp.error) throw resp.error;
    setUser(null);
    return resp;
  }

  // get session (optional)
  async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    getSession,
  };
}
