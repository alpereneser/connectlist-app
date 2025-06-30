import React from 'react';
import { render as rtlRender } from '@testing-library/react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { NavigationContainer } from '@react-navigation/native';

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: '2023-01-01T00:00:00.000Z',
  created_at: '2023-01-01T00:00:00.000Z',
  user_metadata: {
    username: 'testuser',
    full_name: 'Test User',
  },
};

export const mockUserProfile = {
  id: 'test-user-id',
  username: 'testuser',
  full_name: 'Test User',
  bio: 'Test user bio',
  avatar_url: null,
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
};

// Mock auth context values
export const mockAuthContextValue = {
  user: mockUser,
  userProfile: mockUserProfile,
  isLoading: false,
  isAuthenticated: true,
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  createUserProfile: jest.fn(),
  fetchUserProfile: jest.fn(),
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
};

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
};

export const mockRoute = {
  params: {},
  name: 'TestScreen',
  key: 'test-key',
};

// Custom render function with providers
export function renderWithProviders(
  ui,
  {
    authContextValue = mockAuthContextValue,
    navigationMock = mockNavigation,
    routeMock = mockRoute,
    withNavigation = true,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    const content = (
      <AuthContext.Provider value={authContextValue}>
        {children}
      </AuthContext.Provider>
    );

    if (withNavigation) {
      return (
        <NavigationContainer>
          {content}
        </NavigationContainer>
      );
    }

    return content;
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Custom render for screens that need navigation props
export function renderScreen(Screen, props = {}) {
  return renderWithProviders(
    <Screen navigation={mockNavigation} route={mockRoute} {...props} />
  );
}

// Mock API responses
export const mockApiResponses = {
  success: (data) => ({
    data,
    error: null,
    status: 200,
    statusText: 'OK',
  }),

  error: (message = 'API Error', code = 'API_ERROR') => ({
    data: null,
    error: {
      message,
      code,
      details: message,
    },
    status: 400,
    statusText: 'Bad Request',
  }),

  networkError: () => ({
    data: null,
    error: {
      message: 'Network Error',
      code: 'NETWORK_ERROR',
      details: 'Unable to connect to server',
    },
    status: 0,
    statusText: 'Network Error',
  }),
};

// Test data factories
export const createMockList = (overrides = {}) => ({
  id: 'mock-list-id',
  title: 'Mock List',
  description: 'A mock list for testing',
  category: 'movie',
  user_id: mockUser.id,
  is_public: true,
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  items: [],
  user_profile: mockUserProfile,
  likes_count: 0,
  comments_count: 0,
  ...overrides,
});

export const createMockListItem = (overrides = {}) => ({
  id: 'mock-item-id',
  list_id: 'mock-list-id',
  external_id: '12345',
  title: 'Mock Item',
  description: 'A mock item for testing',
  image_url: 'https://example.com/image.jpg',
  category: 'movie',
  order_index: 0,
  metadata: {},
  created_at: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockComment = (overrides = {}) => ({
  id: 'mock-comment-id',
  list_id: 'mock-list-id',
  user_id: mockUser.id,
  content: 'This is a mock comment',
  parent_id: null,
  created_at: '2023-01-01T00:00:00.000Z',
  user_profile: mockUserProfile,
  replies: [],
  ...overrides,
});

// Utility functions for testing
export const waitForLoadingToFinish = () => 
  new Promise((resolve) => setTimeout(resolve, 0));

export const createMockSupabaseClient = (overrides = {}) => ({
  auth: {
    getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ 
      data: { subscription: { unsubscribe: jest.fn() } } 
    })),
    ...overrides.auth,
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    ...overrides.database,
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    ...overrides.realtime,
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'mock-url' } })),
      remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
      ...overrides.storage,
    })),
  },
});

// Test helpers for async operations
export const mockAsyncOperation = (result, delay = 100) => {
  return jest.fn(() => 
    new Promise((resolve) => 
      setTimeout(() => resolve(result), delay)
    )
  );
};

export const mockFailingAsyncOperation = (error, delay = 100) => {
  return jest.fn(() => 
    new Promise((_, reject) => 
      setTimeout(() => reject(error), delay)
    )
  );
};

// Re-export everything from React Testing Library
export * from '@testing-library/react-native';