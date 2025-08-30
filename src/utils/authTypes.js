// User model structure
export const createUser = ({
  id = '',
  email = '',
  username = '',
  fullName = '',
  avatar = null,
  isEmailVerified = false,
  createdAt = new Date(),
  lastLoginAt = null,
  bio = '',
  location = '',
  website = '',
  phone = '',
} = {}) => ({
  id,
  email,
  username,
  fullName,
  avatar,
  isEmailVerified,
  createdAt,
  lastLoginAt,
  bio,
  location,
  website,
  phone,
});

// Authentication state structure
export const createAuthState = ({
  isAuthenticated = false,
  user = null,
  token = null,
  refreshToken = null,
  isLoading = false,
  error = null,
  authState = 'unauthenticated',
} = {}) => ({
  isAuthenticated,
  user,
  token,
  refreshToken,
  isLoading,
  error,
  authState,
});

// Validation error structure
export const createValidationError = ({
  field = '',
  message = '',
  code = '',
} = {}) => ({
  field,
  message,
  code,
});

// Login request structure
export const createLoginRequest = ({
  email = '',
  password = '',
  rememberMe = false,
} = {}) => ({
  email,
  password,
  rememberMe,
});

// Registration request structure
export const createRegistrationRequest = ({
  fullName = '',
  username = '',
  email = '',
  password = '',
  confirmPassword = '',
  acceptTerms = false,
} = {}) => ({
  fullName,
  username,
  email,
  password,
  confirmPassword,
  acceptTerms,
});

// Password reset request structure
export const createPasswordResetRequest = ({ email = '' } = {}) => ({
  email,
});

// New password request structure
export const createNewPasswordRequest = ({
  token = '',
  password = '',
  confirmPassword = '',
} = {}) => ({
  token,
  password,
  confirmPassword,
});

// Email verification request structure
export const createEmailVerificationRequest = ({
  email = '',
  code = '',
} = {}) => ({
  email,
  code,
});

// API response structure
export const createApiResponse = ({
  success = false,
  data = null,
  message = '',
  errors = [],
  statusCode = 200,
} = {}) => ({
  success,
  data,
  message,
  errors,
  statusCode,
});

// Form field structure
export const createFormField = ({
  value = '',
  error = '',
  touched = false,
  isValid = true,
} = {}) => ({
  value,
  error,
  touched,
  isValid,
});

// Biometric authentication info
export const createBiometricInfo = ({
  isAvailable = false,
  type = 'none',
  isEnabled = false,
  isEnrolled = false,
} = {}) => ({
  isAvailable,
  type,
  isEnabled,
  isEnrolled,
});

// Password strength info
export const createPasswordStrength = ({
  score = 0,
  level = 'Very Weak',
  color = '#ff4444',
  feedback = [],
} = {}) => ({
  score,
  level,
  color,
  feedback,
});

// Validation helper functions
export const isValidUser = user => {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.username === 'string' &&
    typeof user.fullName === 'string'
  );
};

export const isValidAuthState = authState => {
  return (
    authState &&
    typeof authState.isAuthenticated === 'boolean' &&
    typeof authState.isLoading === 'boolean'
  );
};

export const isValidFormField = field => {
  return (
    field &&
    typeof field.value === 'string' &&
    typeof field.error === 'string' &&
    typeof field.touched === 'boolean' &&
    typeof field.isValid === 'boolean'
  );
};
