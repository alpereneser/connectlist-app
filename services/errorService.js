import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class ErrorService {
  static instance = null;
  
  constructor() {
    if (ErrorService.instance) {
      return ErrorService.instance;
    }
    
    this.errorLogs = [];
    this.maxLogs = 100;
    this.isOnline = true;
    
    ErrorService.instance = this;
  }

  static getInstance() {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  // Error categories
  static ErrorTypes = {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    VALIDATION: 'VALIDATION',
    API: 'API',
    STORAGE: 'STORAGE',
    PERMISSION: 'PERMISSION',
    UNKNOWN: 'UNKNOWN'
  };

  // Error severity levels
  static Severity = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  };

  // Main error handler
  async handleError(error, context = {}) {
    const errorInfo = this.processError(error, context);
    
    // Log error
    await this.logError(errorInfo);
    
    // Show user-friendly message
    this.showUserMessage(errorInfo);
    
    // Haptic feedback for errors
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      // Ignore haptic errors
    }
    
    // Report to analytics/crash reporting if needed
    this.reportError(errorInfo);
    
    return errorInfo;
  }

  // Process error into standardized format
  processError(error, context) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();
    
    let errorInfo = {
      id: errorId,
      timestamp,
      message: 'An unexpected error occurred',
      type: ErrorService.ErrorTypes.UNKNOWN,
      severity: ErrorService.Severity.MEDIUM,
      context,
      originalError: error,
      stack: null,
      userMessage: null
    };

    // Handle different error types
    if (error?.message) {
      errorInfo.message = error.message;
      errorInfo.stack = error.stack;
    } else if (typeof error === 'string') {
      errorInfo.message = error;
    }

    // Categorize error
    errorInfo = this.categorizeError(errorInfo);
    
    // Generate user-friendly message
    errorInfo.userMessage = this.generateUserMessage(errorInfo);
    
    return errorInfo;
  }

  // Categorize error by type and set severity
  categorizeError(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || 
        message.includes('fetch') || 
        message.includes('timeout') ||
        message.includes('connection')) {
      errorInfo.type = ErrorService.ErrorTypes.NETWORK;
      errorInfo.severity = ErrorService.Severity.MEDIUM;
    }
    
    // Authentication errors
    else if (message.includes('auth') || 
             message.includes('login') || 
             message.includes('unauthorized') ||
             message.includes('token')) {
      errorInfo.type = ErrorService.ErrorTypes.AUTH;
      errorInfo.severity = ErrorService.Severity.HIGH;
    }
    
    // Validation errors
    else if (message.includes('validation') || 
             message.includes('required') || 
             message.includes('invalid')) {
      errorInfo.type = ErrorService.ErrorTypes.VALIDATION;
      errorInfo.severity = ErrorService.Severity.LOW;
    }
    
    // API errors
    else if (message.includes('api') || 
             message.includes('server') || 
             message.includes('response')) {
      errorInfo.type = ErrorService.ErrorTypes.API;
      errorInfo.severity = ErrorService.Severity.MEDIUM;
    }
    
    // Storage errors
    else if (message.includes('storage') || 
             message.includes('asyncstorage') || 
             message.includes('cache')) {
      errorInfo.type = ErrorService.ErrorTypes.STORAGE;
      errorInfo.severity = ErrorService.Severity.MEDIUM;
    }
    
    // Permission errors
    else if (message.includes('permission') || 
             message.includes('denied') || 
             message.includes('access')) {
      errorInfo.type = ErrorService.ErrorTypes.PERMISSION;
      errorInfo.severity = ErrorService.Severity.HIGH;
    }

    return errorInfo;
  }

  // Generate user-friendly error messages
  generateUserMessage(errorInfo) {
    const userMessages = {
      [ErrorService.ErrorTypes.NETWORK]: {
        [ErrorService.Severity.LOW]: 'Connection is slow. Please wait...',
        [ErrorService.Severity.MEDIUM]: 'Network connection problem. Please check your internet.',
        [ErrorService.Severity.HIGH]: 'Unable to connect. Please check your internet and try again.',
        [ErrorService.Severity.CRITICAL]: 'No internet connection. Please reconnect and try again.'
      },
      [ErrorService.ErrorTypes.AUTH]: {
        [ErrorService.Severity.LOW]: 'Please sign in again.',
        [ErrorService.Severity.MEDIUM]: 'Your session has expired. Please log in again.',
        [ErrorService.Severity.HIGH]: 'Authentication failed. Please log in again.',
        [ErrorService.Severity.CRITICAL]: 'Account access denied. Please contact support.'
      },
      [ErrorService.ErrorTypes.VALIDATION]: {
        [ErrorService.Severity.LOW]: 'Please check your input and try again.',
        [ErrorService.Severity.MEDIUM]: 'Some information is missing or incorrect.',
        [ErrorService.Severity.HIGH]: 'Please fill in all required fields correctly.',
        [ErrorService.Severity.CRITICAL]: 'Invalid data format. Please contact support.'
      },
      [ErrorService.ErrorTypes.API]: {
        [ErrorService.Severity.LOW]: 'Service temporarily unavailable.',
        [ErrorService.Severity.MEDIUM]: 'Server is busy. Please try again in a moment.',
        [ErrorService.Severity.HIGH]: 'Service is currently unavailable. Please try again later.',
        [ErrorService.Severity.CRITICAL]: 'Service is down. We\'re working to fix this.'
      },
      [ErrorService.ErrorTypes.STORAGE]: {
        [ErrorService.Severity.LOW]: 'Data sync issue. Will retry automatically.',
        [ErrorService.Severity.MEDIUM]: 'Unable to save data. Please try again.',
        [ErrorService.Severity.HIGH]: 'Storage error. Please restart the app.',
        [ErrorService.Severity.CRITICAL]: 'Critical storage error. Please contact support.'
      },
      [ErrorService.ErrorTypes.PERMISSION]: {
        [ErrorService.Severity.LOW]: 'Permission needed for this feature.',
        [ErrorService.Severity.MEDIUM]: 'Please grant the required permissions.',
        [ErrorService.Severity.HIGH]: 'App permissions are required to continue.',
        [ErrorService.Severity.CRITICAL]: 'Critical permissions denied. Please check settings.'
      },
      [ErrorService.ErrorTypes.UNKNOWN]: {
        [ErrorService.Severity.LOW]: 'Something went wrong. Please try again.',
        [ErrorService.Severity.MEDIUM]: 'An unexpected error occurred.',
        [ErrorService.Severity.HIGH]: 'Unexpected error. Please restart the app.',
        [ErrorService.Severity.CRITICAL]: 'Critical error. Please contact support.'
      }
    };

    return userMessages[errorInfo.type]?.[errorInfo.severity] || 
           'An unexpected error occurred. Please try again.';
  }

  // Show user-friendly error message
  showUserMessage(errorInfo) {
    if (errorInfo.severity === ErrorService.Severity.CRITICAL) {
      Alert.alert(
        'Critical Error',
        errorInfo.userMessage,
        [
          { text: 'Contact Support', onPress: () => this.contactSupport(errorInfo) },
          { text: 'OK', style: 'default' }
        ]
      );
    } else if (errorInfo.severity === ErrorService.Severity.HIGH) {
      Alert.alert(
        'Error',
        errorInfo.userMessage,
        [{ text: 'OK', style: 'default' }]
      );
    } else if (errorInfo.severity === ErrorService.Severity.MEDIUM) {
      Alert.alert(
        'Notice',
        errorInfo.userMessage,
        [{ text: 'OK', style: 'default' }]
      );
    }
    // Low severity errors don't show alerts (handled by UI components)
  }

  // Log error for debugging and analytics
  async logError(errorInfo) {
    try {
      // Add to memory logs
      this.errorLogs.unshift(errorInfo);
      if (this.errorLogs.length > this.maxLogs) {
        this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
      }

      // Save to persistent storage
      await AsyncStorage.setItem(
        'error_logs',
        JSON.stringify(this.errorLogs.slice(0, 50)) // Keep last 50 errors
      );

      // Log to console in development
      if (__DEV__) {
        console.error('ErrorService:', errorInfo);
      }
    } catch (e) {
      // Ignore logging errors to prevent infinite loops
      console.warn('Failed to log error:', e);
    }
  }

  // Report error to analytics/crash reporting
  reportError(errorInfo) {
    try {
      // TODO: Integrate with crash reporting service (Sentry, Bugsnag, etc.)
      // For now, just log to console
      if (__DEV__) {
        console.log('Reporting error:', errorInfo.id, errorInfo.type);
      }
    } catch (e) {
      console.warn('Failed to report error:', e);
    }
  }

  // Generate unique error ID
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get recent error logs
  async getErrorLogs() {
    try {
      const storedLogs = await AsyncStorage.getItem('error_logs');
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (e) {
      return this.errorLogs;
    }
  }

  // Clear error logs
  async clearErrorLogs() {
    try {
      this.errorLogs = [];
      await AsyncStorage.removeItem('error_logs');
    } catch (e) {
      console.warn('Failed to clear error logs:', e);
    }
  }

  // Contact support helper
  contactSupport(errorInfo) {
    // TODO: Implement support contact mechanism
    Alert.alert(
      'Contact Support',
      `Error ID: ${errorInfo.id}\n\nPlease include this error ID when contacting support.`,
      [{ text: 'OK' }]
    );
  }

  // Network error handlers
  handleNetworkError(error, context = {}) {
    const networkContext = {
      ...context,
      type: 'network',
      isOnline: this.isOnline
    };
    
    return this.handleError(error, networkContext);
  }

  // Authentication error handlers
  handleAuthError(error, context = {}) {
    const authContext = {
      ...context,
      type: 'auth',
      requiresReauth: true
    };
    
    return this.handleError(error, authContext);
  }

  // API error handlers
  handleApiError(error, context = {}) {
    const apiContext = {
      ...context,
      type: 'api',
      endpoint: context.endpoint || 'unknown'
    };
    
    return this.handleError(error, apiContext);
  }

  // Validation error handlers
  handleValidationError(error, context = {}) {
    const validationContext = {
      ...context,
      type: 'validation',
      field: context.field || 'unknown'
    };
    
    return this.handleError(error, validationContext);
  }

  // Update network status
  setNetworkStatus(isOnline) {
    this.isOnline = isOnline;
  }
}

// Convenience functions
export const errorHandler = ErrorService.getInstance();

export const handleError = (error, context) => {
  return errorHandler.handleError(error, context);
};

export const handleNetworkError = (error, context) => {
  return errorHandler.handleNetworkError(error, context);
};

export const handleAuthError = (error, context) => {
  return errorHandler.handleAuthError(error, context);
};

export const handleApiError = (error, context) => {
  return errorHandler.handleApiError(error, context);
};

export const handleValidationError = (error, context) => {
  return errorHandler.handleValidationError(error, context);
};

// Global error handler for unhandled errors
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  const originalHandler = global.ErrorUtils?.setGlobalHandler;
  
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    errorHandler.handleError(error, {
      type: 'global',
      isFatal,
      timestamp: new Date().toISOString()
    });
    
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (reason, promise) => {
    errorHandler.handleError(reason, {
      type: 'unhandled_promise',
      promise: promise.toString()
    });
  };

  if (typeof global !== 'undefined' && global.process) {
    global.process.on?.('unhandledRejection', handleUnhandledRejection);
  }
};

export default ErrorService;