// Sentry disabled in this build to avoid native iOS compilation issues
const Sentry = null;
import { Platform } from 'react-native';

// Sentry configuration (kept for compatibility but not used)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
const DEBUG_MODE = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

class ErrorService {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  init() {
    try {
      // Explicitly disable Sentry to prevent native integration
      this.isInitialized = false;
      console.log('Sentry is disabled for this build (native integration removed).');
    } catch (error) {
      console.error('Failed to initialize error service:', error);
    }
  }

  // Capture exceptions
  captureException(error, context = {}) {
    try {
      if (this.isInitialized && Sentry) {
        Sentry.captureException(error, {
          extra: context,
          tags: {
            platform: Platform.OS,
            environment: ENVIRONMENT,
          },
        });
      }

      // Always log to console in development
      if (__DEV__) {
        console.error('Error captured:', error, context);
      }
    } catch (sentryError) {
      console.error('Failed to capture exception:', sentryError);
    }
  }

  // Capture messages
  captureMessage(message, level = 'info', context = {}) {
    try {
      if (this.isInitialized && Sentry) {
        Sentry.captureMessage(message, level, {
          extra: context,
          tags: {
            platform: Platform.OS,
            environment: ENVIRONMENT,
          },
        });
      }

      // Always log to console in development
      if (__DEV__) {
        console.log(`[${level.toUpperCase()}] ${message}`, context);
      }
    } catch (sentryError) {
      console.error('Failed to capture message:', sentryError);
    }
  }

  // Set user context
  setUser(user) {
    try {
      if (this.isInitialized && Sentry) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.username,
        });
      }
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  }

  // Set custom context
  setContext(key, context) {
    try {
      if (this.isInitialized && Sentry) {
        Sentry.setContext(key, context);
      }
    } catch (error) {
      console.error('Failed to set context:', error);
    }
  }

  // Add breadcrumb
  addBreadcrumb(message, category = 'custom', level = 'info', data = {}) {
    try {
      if (this.isInitialized && Sentry) {
        Sentry.addBreadcrumb({
          message,
          category,
          level,
          data,
          timestamp: Date.now() / 1000,
        });
      }
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  // Network error handler
  captureNetworkError(error, url, method = 'GET') {
    this.captureException(error, {
      type: 'network_error',
      url,
      method,
      timestamp: new Date().toISOString(),
    });
  }

  // Authentication error handler
  captureAuthError(error, action) {
    this.captureException(error, {
      type: 'auth_error',
      action,
      timestamp: new Date().toISOString(),
    });
  }

  // Database error handler
  captureDatabaseError(error, query, table) {
    this.captureException(error, {
      type: 'database_error',
      query,
      table,
      timestamp: new Date().toISOString(),
    });
  }
}

// Create singleton instance
const errorService = new ErrorService();

export default errorService;

// Export individual methods for convenience
export const {
  captureException,
  captureMessage,
  setUser,
  setContext,
  addBreadcrumb,
  captureNetworkError,
  captureAuthError,
  captureDatabaseError,
} = errorService;
