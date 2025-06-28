import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Service role client for admin operations (use carefully)
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE;
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Auth helper functions
export const auth = {
  // Sign up new user
  signUp: async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData, // Additional user metadata
        },
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  // Sign in user
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      console.error('Get user error:', error);
      return { user: null, error };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'connectlist://reset-password',
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions
export const db = {
  // Generic select
  select: async (table, query = '*', filters = {}) => {
    try {
      let queryBuilder = supabase.from(table).select(query);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
      
      const { data, error } = await queryBuilder;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Select from ${table} error:`, error);
      return { data: null, error };
    }
  },

  // Generic insert
  insert: async (table, data) => {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error(`Insert to ${table} error:`, error);
      return { data: null, error };
    }
  },

  // Generic update
  update: async (table, data, filters = {}) => {
    try {
      let queryBuilder = supabase.from(table).update(data);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
      
      const { data: result, error } = await queryBuilder.select();
      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error(`Update ${table} error:`, error);
      return { data: null, error };
    }
  },

  // Generic delete
  delete: async (table, filters = {}) => {
    try {
      let queryBuilder = supabase.from(table).delete();
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
      
      const { data, error } = await queryBuilder;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Delete from ${table} error:`, error);
      return { data: null, error };
    }
  },
};

export default supabase;