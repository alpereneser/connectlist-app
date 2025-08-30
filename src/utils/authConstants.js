// Authentication error messages
export const ERROR_MESSAGES = {
  // Validation errors
  INVALID_EMAIL: 'Please enter a valid email address',
  WEAK_PASSWORD:
    'Password must be at least 8 characters with mixed case and numbers',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  USERNAME_REQUIRED: 'Username is required',
  FULLNAME_REQUIRED: 'Full name is required',

  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'An account with this email already exists',
  USERNAME_TAKEN: 'This username is already taken',
  USER_NOT_FOUND: 'No account found with this email',
  ACCOUNT_DISABLED: 'Your account has been disabled',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please try again later',

  // Network errors
  NETWORK_ERROR: 'Please check your internet connection',
  SERVER_ERROR: 'Something went wrong. Please try again',
  TIMEOUT_ERROR: 'Request timed out. Please try again',

  // Verification errors
  VERIFICATION_EXPIRED:
    'Verification code has expired. Please request a new one',
  INVALID_CODE: 'Invalid verification code',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',

  // Password reset errors
  RESET_TOKEN_EXPIRED: 'Password reset link has expired',
  INVALID_RESET_TOKEN: 'Invalid password reset link',

  // General errors
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again',
  FEATURE_NOT_AVAILABLE: 'This feature is not available right now',
};

// Success messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS:
    'Account created successfully! Please verify your email',
  LOGIN_SUCCESS: 'Welcome back!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully!',
  VERIFICATION_SENT: 'Verification code sent to your email',
  PROFILE_UPDATED: 'Profile updated successfully',
};

// Authentication storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER_DATA: '@user_data',
  BIOMETRIC_ENABLED: '@biometric_enabled',
  REMEMBER_ME: '@remember_me',
};

// API endpoints (these would be environment-specific in a real app)
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
  CHECK_USERNAME: '/auth/check-username',
  CHECK_EMAIL: '/auth/check-email',
};

// Validation constants
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  FULLNAME_MIN_LENGTH: 2,
  FULLNAME_MAX_LENGTH: 50,
  VERIFICATION_CODE_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes in milliseconds
  RESEND_CODE_COOLDOWN: 60 * 1000, // 1 minute in milliseconds
};

// Authentication states
export const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  EMAIL_VERIFICATION_REQUIRED: 'email_verification_required',
  PASSWORD_RESET_REQUIRED: 'password_reset_required',
};

// Screen names for navigation
export const AUTH_SCREENS = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  EMAIL_VERIFICATION: 'EmailVerification',
};

// Biometric authentication types
export const BIOMETRIC_TYPES = {
  FINGERPRINT: 'fingerprint',
  FACE_ID: 'faceId',
  IRIS: 'iris',
  NONE: 'none',
};
