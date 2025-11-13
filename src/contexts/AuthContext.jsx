import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
          await updateOnlineStatus(session.user.id, true);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOnlineStatus = async (userId, isOnline) => {
    try {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const signUp = async (email, password, username, fullName) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username,
            full_name: fullName,
            status_text: 'Hey there! I am using VibeChat',
          });
        if (profileError) throw profileError;
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    if (user) {
      await updateOnlineStatus(user.id, false);
    }
    await supabase.auth.signOut();
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return <div>Loading...</div>; // Or your preferred loading component
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};