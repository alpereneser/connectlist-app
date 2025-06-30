import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { createMockSupabaseClient, mockUser, mockUserProfile } from '../utils/testUtils';

// Mock the supabase client
const mockSupabase = createMockSupabaseClient();
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock the error service
jest.mock('../../services/errorService', () => ({
  handleAuthError: jest.fn(),
  handleError: jest.fn(),
}));

// Mock supabaseService
jest.mock('../../services/supabaseService', () => ({
  supabaseService: {},
}));

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: null } 
    });
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.userProfile).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });

  describe('Session Management', () => {
    test('should handle existing session on initialization', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession }
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUserProfile,
          error: null,
        }),
      });

      const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

      // Wait for the effect to complete
      await act(async () => {
        await waitForNextUpdate();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.userProfile).toEqual(mockUserProfile);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle auth state changes', async () => {
      let authCallback;
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Simulate sign in
      await act(async () => {
        authCallback('SIGNED_IN', { user: mockUser });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);

      // Simulate sign out
      await act(async () => {
        authCallback('SIGNED_OUT', null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.userProfile).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Sign Up', () => {
    test('should handle successful sign up', async () => {
      const userData = {
        username: 'testuser',
        fullName: 'Test User',
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { ...mockUser, email_confirmed_at: null } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp(
          'test@example.com',
          'password123',
          userData
        );
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            username: userData.username,
            full_name: userData.fullName,
          }
        }
      });

      expect(signUpResult.error).toBeNull();
      expect(signUpResult.data).toBeDefined();
    });

    test('should handle sign up error', async () => {
      const mockError = { message: 'Email already exists' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp(
          'test@example.com',
          'password123',
          { username: 'test', fullName: 'Test' }
        );
      });

      expect(signUpResult.error).toEqual(mockError);
      expect(signUpResult.data).toBeNull();
    });
  });

  describe('Sign In', () => {
    test('should handle successful sign in', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn(
          'test@example.com',
          'password123'
        );
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(signInResult.error).toBeNull();
      expect(signInResult.data).toBeDefined();
    });

    test('should handle sign in error', async () => {
      const mockError = { message: 'Invalid login credentials' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn(
          'test@example.com',
          'wrongpassword'
        );
      });

      expect(signInResult.error).toEqual(mockError);
      expect(signInResult.data).toBeNull();
    });
  });

  describe('Sign Out', () => {
    test('should handle successful sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set initial state
      act(() => {
        result.current.user = mockUser;
        result.current.userProfile = mockUserProfile;
      });

      let signOutResult;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(signOutResult.error).toBeNull();
    });

    test('should handle sign out error', async () => {
      const mockError = { message: 'Sign out failed' };
      
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let signOutResult;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(signOutResult.error).toEqual(mockError);
    });
  });

  describe('Profile Management', () => {
    test('should fetch user profile', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUserProfile,
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.fetchUserProfile('test-user-id');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('users_profiles');
      expect(result.current.userProfile).toEqual(mockUserProfile);
    });

    test('should create user profile', async () => {
      const profileData = {
        username: 'testuser',
        full_name: 'Test User',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockUserProfile, ...profileData },
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let createResult;
      await act(async () => {
        createResult = await result.current.createUserProfile(
          'test-user-id',
          profileData
        );
      });

      expect(createResult.error).toBeNull();
      expect(createResult.data).toMatchObject(profileData);
    });
  });

  describe('Password Reset', () => {
    test('should handle password reset request', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: { message: 'Reset email sent' },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com');
      });

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'connectlist://reset-password' }
      );

      expect(resetResult.error).toBeNull();
      expect(resetResult.data).toBeDefined();
    });
  });

  describe('Loading States', () => {
    test('should manage loading state during async operations', async () => {
      // Mock a slow response
      mockSupabase.auth.signInWithPassword.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ data: { user: mockUser }, error: null }), 100)
        )
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      const signInPromise = act(async () => {
        result.current.signIn('test@example.com', 'password');
      });

      // Should still be loading during the async operation
      expect(result.current.isLoading).toBe(true);

      await signInPromise;

      // Should finish loading after the operation
      expect(result.current.isLoading).toBe(false);
    });
  });
});