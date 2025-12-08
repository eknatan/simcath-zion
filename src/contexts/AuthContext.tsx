'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  sendOtpCode: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtpCode: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef<ReturnType<typeof supabase.auth.onAuthStateChange> | null>(null);

  useEffect(() => {
    // Check active session on mount (using getUser for security)
    const initializeAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error getting user:', error);
          setSession(null);
          setUser(null);
        } else {
          // Get the session after validating the user
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setSession(currentSession);
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes - only subscribe once
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    );

    subscriptionRef.current = { data: { subscription } };

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Sync user_metadata with profile role
      if (data.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile?.role && data.user.user_metadata?.role !== profile.role) {
            // Update user metadata to match profile
            await supabase.auth.updateUser({
              data: { role: profile.role }
            });
          }
        } catch (metadataError) {
          console.error('Error syncing user metadata:', metadataError);
          // Don't fail login if metadata sync fails
        }
      }

      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Only allow existing users
          emailRedirectTo: `${window.location.origin}/auth/callback?type=magiclink`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Magic link error:', error);
      return { error: error as AuthError };
    }
  };

  const sendOtpCode = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Only allow existing users
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('OTP send error:', error);
      return { error: error as AuthError };
    }
  };

  const verifyOtpCode = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        return { error };
      }

      // Sync user_metadata with profile role
      if (data.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile?.role && data.user.user_metadata?.role !== profile.role) {
            await supabase.auth.updateUser({
              data: { role: profile.role }
            });
          }
        } catch (metadataError) {
          console.error('Error syncing user metadata:', metadataError);
        }
      }

      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      console.error('OTP verify error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error };
      }

      setSession(null);
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    signIn,
    signInWithMagicLink,
    sendOtpCode,
    verifyOtpCode,
    signOut,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
