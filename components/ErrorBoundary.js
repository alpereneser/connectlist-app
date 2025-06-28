import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WarningCircle, ArrowCounterClockwise } from 'phosphor-react-native';
import tokens from '../utils/designTokens';
import { a11yProps } from '../utils/accessibility';
import { hapticPatterns } from '../utils/haptics';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    if (__DEV__) {
      console.log('Error details:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    hapticPatterns.buttonPress('secondary');
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Call retry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <WarningCircle 
              size={64} 
              color={tokens.colors.semantic.error} 
              weight="regular"
            />
            
            <Text 
              style={styles.errorTitle}
              {...a11yProps.header(1, 'Something went wrong')}
            >
              Oops! Something went wrong
            </Text>
            
            <Text style={styles.errorMessage}>
              {this.props.message || 
                "We're sorry, but something unexpected happened. Please try again."
              }
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Mode):</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
                {...a11yProps.button(
                  'Try again',
                  'Attempt to reload the content'
                )}
              >
                <ArrowCounterClockwise 
                  size={20} 
                  color={tokens.colors.background.primary}
                  style={styles.retryIcon}
                />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {this.props.onGoBack && (
                <TouchableOpacity
                  style={styles.goBackButton}
                  onPress={() => {
                    hapticPatterns.navigation('back');
                    this.props.onGoBack();
                  }}
                  {...a11yProps.button(
                    'Go back',
                    'Return to previous screen'
                  )}
                >
                  <Text style={styles.goBackButtonText}>Go Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

// Functional components for specific error types
export const NetworkErrorBoundary = ({ children, onRetry }) => (
  <ErrorBoundary
    message="Unable to connect to the network. Please check your connection and try again."
    onRetry={onRetry}
    fallback={(error, retry) => (
      <View style={styles.networkErrorContainer}>
        <Text style={styles.networkErrorTitle}>No Internet Connection</Text>
        <Text style={styles.networkErrorMessage}>
          Please check your network connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const SearchErrorBoundary = ({ children, onRetry }) => (
  <ErrorBoundary
    message="Search is temporarily unavailable. Please try again in a moment."
    onRetry={onRetry}
    fallback={(error, retry) => (
      <View style={styles.searchErrorContainer}>
        <MagnifyingGlass size={48} color={tokens.colors.gray[400]} />
        <Text style={styles.searchErrorTitle}>Search Unavailable</Text>
        <Text style={styles.searchErrorMessage}>
          We're having trouble with search right now. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const ListErrorBoundary = ({ children, onRetry, onGoBack }) => (
  <ErrorBoundary
    message="Unable to load lists. Please try refreshing."
    onRetry={onRetry}
    onGoBack={onGoBack}
  >
    {children}
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
    backgroundColor: tokens.colors.background.primary,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: tokens.typography.fontSize.xxl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.gray[900],
    textAlign: 'center',
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  errorMessage: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[600],
    textAlign: 'center',
    lineHeight: tokens.typography.fontSize.md * tokens.typography.lineHeight.relaxed,
    marginBottom: tokens.spacing.xl,
  },
  errorDetails: {
    backgroundColor: tokens.colors.gray[100],
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.medium,
    marginBottom: tokens.spacing.xl,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.gray[700],
    marginBottom: tokens.spacing.xs,
  },
  errorDetailsText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.gray[600],
    fontFamily: 'monospace',
  },
  errorActions: {
    width: '100%',
    gap: tokens.spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.medium,
    minHeight: tokens.touchTarget.minimum,
  },
  retryIcon: {
    marginRight: tokens.spacing.sm,
  },
  retryButtonText: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.background.primary,
  },
  goBackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.medium,
    borderWidth: 1,
    borderColor: tokens.colors.gray[300],
    minHeight: tokens.touchTarget.minimum,
  },
  goBackButtonText: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.gray[700],
  },
  
  // Network error styles
  networkErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  networkErrorTitle: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.gray[900],
    marginBottom: tokens.spacing.sm,
  },
  networkErrorMessage: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  
  // Search error styles  
  searchErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  searchErrorTitle: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.gray[900],
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  searchErrorMessage: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.gray[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
});

export default ErrorBoundary;