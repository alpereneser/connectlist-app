import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';
import errorService from '../services/errorService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to crash reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error info for debugging
    this.setState({
      error,
      errorInfo,
    });

    // Send error to Sentry
    errorService.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      component: this.props.name || 'Unknown',
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons
              name="warning-outline"
              size={64}
              color={Colors.error}
              style={styles.icon}
            />
            <Text style={styles.title}>Bir şeyler ters gitti</Text>
            <Text style={styles.message}>
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Hata Detayları:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  icon: {
    marginBottom: Spacing.large,
  },
  title: {
    fontSize: FontSize.h3,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.medium,
  },
  message: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.large,
  },
  errorDetails: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.large,
    width: '100%',
    maxHeight: 200,
  },
  errorTitle: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  errorText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.error,
    marginBottom: Spacing.small,
  },
  errorStack: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    fontSize: FontSize.medium,
    fontFamily: FontFamily.semiBold,
    color: Colors.white,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
