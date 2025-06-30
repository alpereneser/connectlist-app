import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorBoundary, { useErrorHandler, withErrorBoundary } from '../../components/ErrorBoundary';

// Mock the error service
const mockHandleError = jest.fn();
jest.mock('../../services/errorService', () => ({
  handleError: mockHandleError,
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <Text testID="no-error">No error</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleError.mockResolvedValue({
      id: 'test-error-id',
      message: 'Test error',
      type: 'UNKNOWN',
      severity: 'MEDIUM',
    });

    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('should render children when there is no error', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByTestId('no-error')).toBeTruthy();
  });

  test('should render error UI when child component throws', () => {
    const { getByText, getByTestId } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
    expect(getByText('Report Error')).toBeTruthy();
  });

  test('should call error service when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Custom error" />
      </ErrorBoundary>
    );

    expect(mockHandleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        context: 'react_error_boundary',
        errorBoundary: 'default',
      })
    );
  });

  test('should retry when retry button is pressed', () => {
    const { getByText, getByTestId, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(getByText('Oops! Something went wrong')).toBeTruthy();

    // Press retry button
    fireEvent.press(getByText('Try Again'));

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content
    expect(getByTestId('no-error')).toBeTruthy();
  });

  test('should show custom message when provided', () => {
    const customMessage = 'Custom error message for testing';
    
    const { getByText } = render(
      <ErrorBoundary message={customMessage}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText(customMessage)).toBeTruthy();
  });

  test('should show custom fallback UI when provided', () => {
    const customFallback = (error, retry) => (
      <View>
        <Text testID="custom-error">Custom Error UI</Text>
        <Text testID="custom-retry" onPress={retry}>Custom Retry</Text>
      </View>
    );

    const { getByTestId } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('custom-error')).toBeTruthy();
    expect(getByTestId('custom-retry')).toBeTruthy();
  });

  test('should render minimal error UI when fallbackType is minimal', () => {
    const { getByText } = render(
      <ErrorBoundary fallbackType="minimal">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  test('should render inline error UI when fallbackType is inline', () => {
    const { getByText } = render(
      <ErrorBoundary fallbackType="inline">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Unable to load content')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  test('should call onRetry callback when provided', () => {
    const mockOnRetry = jest.fn();
    
    const { getByText } = render(
      <ErrorBoundary onRetry={mockOnRetry}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.press(getByText('Try Again'));

    expect(mockOnRetry).toHaveBeenCalled();
  });

  test('should show go back button when onGoBack is provided', () => {
    const mockOnGoBack = jest.fn();
    
    const { getByText } = render(
      <ErrorBoundary onGoBack={mockOnGoBack}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Go Back')).toBeTruthy();
    
    fireEvent.press(getByText('Go Back'));
    expect(mockOnGoBack).toHaveBeenCalled();
  });

  describe('in development mode', () => {
    const originalDev = __DEV__;

    beforeAll(() => {
      global.__DEV__ = true;
    });

    afterAll(() => {
      global.__DEV__ = originalDev;
    });

    test('should show debug information in development', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Debug error" />
        </ErrorBoundary>
      );

      expect(getByText('Debug Information (Dev Mode):')).toBeTruthy();
      expect(getByText(/Error ID:/)).toBeTruthy();
    });
  });

  describe('in production mode', () => {
    const originalDev = __DEV__;

    beforeAll(() => {
      global.__DEV__ = false;
    });

    afterAll(() => {
      global.__DEV__ = originalDev;
    });

    test('should show error ID in production without debug info', () => {
      const { getByText, queryByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText(/Error ID:/)).toBeTruthy();
      expect(queryByText('Debug Information (Dev Mode):')).toBeNull();
    });
  });
});

describe('useErrorHandler hook', () => {
  test('should handle async errors', async () => {
    const TestComponent = () => {
      const { handleAsyncError } = useErrorHandler();
      
      const handleError = async () => {
        await handleAsyncError(new Error('Async error'), { source: 'test' });
      };

      return (
        <Text testID="handle-error" onPress={handleError}>
          Handle Error
        </Text>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    
    fireEvent.press(getByTestId('handle-error'));

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockHandleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        source: 'useErrorHandler',
      })
    );
  });
});

describe('withErrorBoundary HOC', () => {
  test('should wrap component with error boundary', () => {
    const TestComponent = () => <Text testID="wrapped-component">Wrapped</Text>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    const { getByTestId } = render(<WrappedComponent />);

    expect(getByTestId('wrapped-component')).toBeTruthy();
  });

  test('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    const { getByText } = render(<WrappedComponent shouldThrow={true} />);

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
  });

  test('should use specified fallback type', () => {
    const WrappedComponent = withErrorBoundary(ThrowError, 'minimal');

    const { getByText } = render(<WrappedComponent shouldThrow={true} />);

    expect(getByText('Something went wrong')).toBeTruthy();
  });
});