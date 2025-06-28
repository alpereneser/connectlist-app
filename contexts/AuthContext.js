import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, auth } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        
        if (isInitialized) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [isInitialized]);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const createUserProfile = async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from('users_profiles')
        .insert([
          {
            id: userId,
            username: profileData.username,
            full_name: profileData.full_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return { data: null, error };
      }

      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.fullName,
          }
        }
      });

      if (error) {
        return { data: null, error };
      }

      // If user is created and confirmed immediately
      if (data.user && data.user.email_confirmed_at) {
        await createUserProfile(data.user.id, {
          username: userData.username,
          full_name: userData.fullName,
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error };
      }

      setUser(null);
      setUserProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'connectlist://reset-password',
      });
      
      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    createUserProfile,
    fetchUserProfile,
    // Supabase service functions
    supabase: supabaseService,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;