import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Critical Auth Error:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
      setLoading(false);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const getRedirectUrl = () => {
    // Returns the current origin (e.g., http://localhost:5173 or https://krastale.github.io)
    // We add the path for GitHub Pages if we're not on localhost
    return window.location.origin.includes('localhost') 
      ? window.location.origin 
      : 'https://krastale.github.io/alexoslifts/';
  };

  const signUp = (email, password) => supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: getRedirectUrl(),
    }
  });

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();
  
  const resetPassword = (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(),
    });
  };
  const updatePassword = (newPassword) => supabase.auth.updateUser({ password: newPassword });

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, resetPassword, updatePassword, loading, isRecoveryMode, setIsRecoveryMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
