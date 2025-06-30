import { ErrorService, handleError, handleAuthError, handleNetworkError } from '../../services/errorService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock Haptics
jest.mock('expo-haptics');

describe('ErrorService', () => {
  let errorService;

  beforeEach(() => {
    errorService = new ErrorService();
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('Error Processing', () => {
    test('should process basic error correctly', async () => {
      const error = new Error('Test error message');
      const context = { action: 'test_action' };

      const result = await errorService.handleError(error, context);

      expect(result).toMatchObject({
        message: 'Test error message',
        type: 'UNKNOWN',
        severity: 'MEDIUM',
        context: expect.objectContaining(context),
      });
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should categorize network errors correctly', async () => {
      const error = new Error('Network connection failed');
      
      const result = await errorService.handleError(error);

      expect(result.type).toBe('NETWORK');
      expect(result.severity).toBe('MEDIUM');
      expect(result.userMessage).toContain('Network connection problem');
    });

    test('should categorize auth errors correctly', async () => {
      const error = new Error('Authentication failed');
      
      const result = await errorService.handleError(error);

      expect(result.type).toBe('AUTH');
      expect(result.severity).toBe('HIGH');
      expect(result.userMessage).toContain('Authentication failed');
    });

    test('should categorize validation errors correctly', async () => {
      const error = new Error('Validation failed: email is required');
      
      const result = await errorService.handleError(error);

      expect(result.type).toBe('VALIDATION');
      expect(result.severity).toBe('LOW');
      expect(result.userMessage).toContain('check your input');
    });
  });

  describe('Error Logging', () => {
    test('should log errors to memory and storage', async () => {
      const error = new Error('Test error');
      
      await errorService.handleError(error);

      expect(errorService.errorLogs).toHaveLength(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'error_logs',
        expect.any(String)
      );
    });

    test('should limit error logs to maximum count', async () => {
      // Set a small limit for testing
      errorService.maxLogs = 3;

      // Generate more errors than the limit
      for (let i = 0; i < 5; i++) {
        await errorService.handleError(new Error(`Error ${i}`));
      }

      expect(errorService.errorLogs).toHaveLength(3);
      // Should keep the most recent errors
      expect(errorService.errorLogs[0].message).toBe('Error 4');
      expect(errorService.errorLogs[2].message).toBe('Error 2');
    });
  });

  describe('Error Retrieval', () => {
    test('should retrieve error logs from storage', async () => {
      const mockLogs = [
        { id: '1', message: 'Error 1', timestamp: '2023-01-01' },
        { id: '2', message: 'Error 2', timestamp: '2023-01-02' },
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLogs));

      const logs = await errorService.getErrorLogs();

      expect(logs).toEqual(mockLogs);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('error_logs');
    });

    test('should return memory logs if storage retrieval fails', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      errorService.errorLogs = [{ id: '1', message: 'Memory error' }];

      const logs = await errorService.getErrorLogs();

      expect(logs).toEqual(errorService.errorLogs);
    });
  });

  describe('Error Clearing', () => {
    test('should clear all error logs', async () => {
      errorService.errorLogs = [{ id: '1', message: 'Error 1' }];

      await errorService.clearErrorLogs();

      expect(errorService.errorLogs).toHaveLength(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('error_logs');
    });
  });

  describe('Network Status', () => {
    test('should update network status', () => {
      expect(errorService.isOnline).toBe(true);

      errorService.setNetworkStatus(false);

      expect(errorService.isOnline).toBe(false);
    });
  });

  describe('User Message Generation', () => {
    test('should generate appropriate user messages for different error types and severities', () => {
      const testCases = [
        {
          type: 'NETWORK',
          severity: 'HIGH',
          expected: 'Unable to connect. Please check your internet and try again.',
        },
        {
          type: 'AUTH',
          severity: 'MEDIUM',
          expected: 'Your session has expired. Please log in again.',
        },
        {
          type: 'VALIDATION',
          severity: 'LOW',
          expected: 'Please check your input and try again.',
        },
        {
          type: 'UNKNOWN',
          severity: 'CRITICAL',
          expected: 'Critical error. Please contact support.',
        },
      ];

      testCases.forEach(({ type, severity, expected }) => {
        const errorInfo = {
          type: ErrorService.ErrorTypes[type],
          severity: ErrorService.Severity[severity],
        };

        const message = errorService.generateUserMessage(errorInfo);
        expect(message).toBe(expected);
      });
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleError should work as standalone function', async () => {
    const error = new Error('Test error');
    const context = { source: 'test' };

    const result = await handleError(error, context);

    expect(result).toMatchObject({
      message: 'Test error',
      context: expect.objectContaining(context),
    });
  });

  test('handleAuthError should add auth context', async () => {
    const error = new Error('Auth error');
    const context = { userId: 'test-user' };

    const result = await handleAuthError(error, context);

    expect(result.context).toMatchObject({
      ...context,
      type: 'auth',
    });
  });

  test('handleNetworkError should add network context', async () => {
    const error = new Error('Network error');
    const context = { endpoint: '/api/test' };

    const result = await handleNetworkError(error, context);

    expect(result.context).toMatchObject({
      ...context,
      type: 'network',
      isOnline: true,
    });
  });
});

describe('Error ID Generation', () => {
  test('should generate unique error IDs', () => {
    const errorService = new ErrorService();
    
    const id1 = errorService.generateErrorId();
    const id2 = errorService.generateErrorId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^err_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^err_\d+_[a-z0-9]+$/);
  });
});

describe('Singleton Pattern', () => {
  test('should return same instance', () => {
    const instance1 = ErrorService.getInstance();
    const instance2 = ErrorService.getInstance();

    expect(instance1).toBe(instance2);
  });

  test('should maintain state across instances', async () => {
    const instance1 = ErrorService.getInstance();
    await instance1.handleError(new Error('Test'));

    const instance2 = ErrorService.getInstance();
    
    expect(instance2.errorLogs).toHaveLength(1);
  });
});