import { hapticPatterns } from './haptics';

// Form validation utilities
export class FormValidator {
  constructor() {
    this.errors = {};
  }

  // Validation rules
  static rules = {
    required: (value, fieldName) => {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return `${fieldName} is required`;
      }
      return null;
    },

    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    },

    minLength: (value, min, fieldName) => {
      if (value && value.length < min) {
        return `${fieldName} must be at least ${min} characters`;
      }
      return null;
    },

    maxLength: (value, max, fieldName) => {
      if (value && value.length > max) {
        return `${fieldName} must be no more than ${max} characters`;
      }
      return null;
    },

    username: (value) => {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (value && !usernameRegex.test(value)) {
        return 'Username must be 3-20 characters, letters, numbers, and underscores only';
      }
      return null;
    },

    password: (value) => {
      if (!value) return null;
      
      const errors = [];
      if (value.length < 8) errors.push('at least 8 characters');
      if (!/[A-Z]/.test(value)) errors.push('one uppercase letter');
      if (!/[a-z]/.test(value)) errors.push('one lowercase letter');
      if (!/\d/.test(value)) errors.push('one number');
      
      if (errors.length > 0) {
        return `Password must contain ${errors.join(', ')}`;
      }
      return null;
    },

    confirmPassword: (value, originalPassword) => {
      if (value !== originalPassword) {
        return 'Passwords do not match';
      }
      return null;
    },

    phone: (value) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (value && !phoneRegex.test(value)) {
        return 'Please enter a valid phone number';
      }
      return null;
    },

    url: (value) => {
      try {
        if (value) {
          new URL(value);
        }
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
    }
  };

  // Validate a single field
  validateField(value, rules, fieldName = 'Field') {
    for (const rule of rules) {
      let error = null;

      if (typeof rule === 'string') {
        // Simple rule name
        error = FormValidator.rules[rule]?.(value, fieldName);
      } else if (typeof rule === 'object') {
        // Rule with parameters
        const { name, params = [] } = rule;
        error = FormValidator.rules[name]?.(value, ...params, fieldName);
      } else if (typeof rule === 'function') {
        // Custom validation function
        error = rule(value, fieldName);
      }

      if (error) {
        return error;
      }
    }

    return null;
  }

  // Validate entire form
  validateForm(formData, validationSchema) {
    const errors = {};
    let hasErrors = false;

    for (const [fieldName, rules] of Object.entries(validationSchema)) {
      const value = formData[fieldName];
      const error = this.validateField(value, rules, this.formatFieldName(fieldName));
      
      if (error) {
        errors[fieldName] = error;
        hasErrors = true;
      }
    }

    this.errors = errors;
    
    if (hasErrors) {
      hapticPatterns.validationError();
    }

    return {
      isValid: !hasErrors,
      errors
    };
  }

  // Format field name for display
  formatFieldName(fieldName) {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Get error for specific field
  getError(fieldName) {
    return this.errors[fieldName];
  }

  // Clear errors
  clearErrors() {
    this.errors = {};
  }

  // Clear specific field error
  clearFieldError(fieldName) {
    delete this.errors[fieldName];
  }
}

// Real-time validation hook helper
export const useFormValidation = (initialData = {}, validationSchema = {}) => {
  const [formData, setFormData] = React.useState(initialData);
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const validator = React.useRef(new FormValidator()).current;

  const validateField = React.useCallback((fieldName, value) => {
    const rules = validationSchema[fieldName];
    if (!rules) return null;

    const error = validator.validateField(value, rules, validator.formatFieldName(fieldName));
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return error;
  }, [validationSchema, validator]);

  const updateField = React.useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = React.useCallback(() => {
    const result = validator.validateForm(formData, validationSchema);
    setErrors(result.errors);
    return result;
  }, [formData, validationSchema, validator]);

  const handleSubmit = React.useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    const validation = validateForm();
    if (!validation.isValid) {
      setIsSubmitting(false);
      return { success: false, errors: validation.errors };
    }

    try {
      const result = await onSubmit(formData);
      setIsSubmitting(false);
      return { success: true, data: result };
    } catch (error) {
      setIsSubmitting(false);
      return { success: false, error };
    }
  }, [formData, validateForm]);

  const reset = React.useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsSubmitting(false);
    validator.clearErrors();
  }, [initialData, validator]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    hasErrors: Object.keys(errors).length > 0
  };
};

// Common validation schemas
export const validationSchemas = {
  login: {
    email: ['required', 'email'],
    password: ['required']
  },

  register: {
    email: ['required', 'email'],
    username: ['required', 'username'],
    fullName: [
      'required', 
      { name: 'minLength', params: [2] },
      { name: 'maxLength', params: [50] }
    ],
    password: ['required', 'password'],
    confirmPassword: ['required']
  },

  createList: {
    title: [
      'required',
      { name: 'minLength', params: [3] },
      { name: 'maxLength', params: [100] }
    ],
    description: [
      { name: 'maxLength', params: [500] }
    ],
    category: ['required']
  },

  profile: {
    fullName: [
      'required',
      { name: 'minLength', params: [2] },
      { name: 'maxLength', params: [50] }
    ],
    bio: [
      { name: 'maxLength', params: [160] }
    ],
    website: ['url']
  },

  comment: {
    content: [
      'required',
      { name: 'minLength', params: [1] },
      { name: 'maxLength', params: [500] }
    ]
  }
};

// Input validation helpers for real-time feedback
export const inputHelpers = {
  // Email validation with real-time feedback
  validateEmail: (email) => {
    if (!email) return { isValid: true, message: '' };
    
    const isValid = FormValidator.rules.email(email) === null;
    return {
      isValid,
      message: isValid ? '' : 'Please enter a valid email address'
    };
  },

  // Username availability check (would integrate with API)
  validateUsername: async (username) => {
    if (!username) return { isValid: true, message: '' };
    
    const formatError = FormValidator.rules.username(username);
    if (formatError) {
      return { isValid: false, message: formatError };
    }

    // Mock API call - replace with actual API
    return new Promise(resolve => {
      setTimeout(() => {
        const isAvailable = !['admin', 'user', 'test'].includes(username.toLowerCase());
        resolve({
          isValid: isAvailable,
          message: isAvailable ? 'Username is available' : 'Username is already taken'
        });
      }, 500);
    });
  },

  // Password strength indicator
  getPasswordStrength: (password) => {
    if (!password) return { strength: 0, message: '', color: '#gray' };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;
    
    const strengthLevels = {
      0: { message: 'Very weak', color: '#ef4444' },
      1: { message: 'Weak', color: '#f97316' },
      2: { message: 'Fair', color: '#eab308' },
      3: { message: 'Good', color: '#22c55e' },
      4: { message: 'Strong', color: '#16a34a' },
      5: { message: 'Very strong', color: '#15803d' }
    };

    return {
      strength,
      checks,
      ...strengthLevels[strength]
    };
  }
};