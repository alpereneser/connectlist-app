import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Sentry configuration
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
      // Only initialize Sentry in production or if DSN is provided
      if (SENTRY_DSN && (ENVIRONMENT === 'production' || DEBUG_MODE)) {
        Sentry.init({
          dsn: SENTRY_DSN,
          environment: ENVIRONMENT,
          debug: __DEV__ && DEBUG_MODE,
          enableAutoSessionTracking: true,
          sessionTrackingIntervalMillis: 30000,
          enableOutOfMemoryTracking: false, // Disable for React Native
          beforeSend: event => {
            // Filter out development errors in production
            if (
              ENVIRONMENT === 'production' &&
              event.environment === 'development'
            ) {
              return null;
            }
            return event;
          },
        });

        this.isInitialized = true;
        console.log('Sentry initialized successfully');
      } else {
        console.log(
          'Sentry not initialized - missing DSN or not in production',
        );
      }
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  // Capture exceptions
  captureException(error, context = {}) {
    try {
      if (this.isInitialized) {
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
      if (this.isInitialized) {
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
      if (this.isInitialized) {
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
      if (this.isInitialized) {
        Sentry.setContext(key, context);
      }
    } catch (error) {
      console.error('Failed to set context:', error);
    }
  }

  // Add breadcrumb
  addBreadcrumb(message, category = 'custom', level = 'info', data = {}) {
    try {
      if (this.isInitialized) {
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
