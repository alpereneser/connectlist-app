import DOMPurify from 'isomorphic-dompurify';

// Input validation utilities
export class ValidationUtils {
  // Email validation
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') {return false;}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Password validation
  static isValidPassword(password) {
    if (!password || typeof password !== 'string') {return false;}
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Username validation
  static isValidUsername(username) {
    if (!username || typeof username !== 'string') {return false;}
    // 3-20 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username.trim());
  }

  // URL validation
  static isValidUrl(url) {
    if (!url || typeof url !== 'string') {return false;}
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Phone number validation (basic)
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') {return false;}
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
  }

  // Text length validation
  static isValidLength(text, min = 0, max = Infinity) {
    if (typeof text !== 'string') {return false;}
    const length = text.trim().length;
    return length >= min && length <= max;
  }

  // Numeric validation
  static isValidNumber(value, min = -Infinity, max = Infinity) {
    const num = Number(value);
    return !isNaN(num) && isFinite(num) && num >= min && num <= max;
  }

  // Date validation
  static isValidDate(dateString) {
    if (!dateString) {return false;}
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // File validation
  static isValidFileType(file, allowedTypes = []) {
    if (!file || !file.type) {return false;}
    return allowedTypes.length === 0 || allowedTypes.includes(file.type);
  }

  static isValidFileSize(file, maxSizeInMB = 10) {
    if (!file || !file.size) {return false;}
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
}

// XSS Protection utilities
export class SecurityUtils {
  // Sanitize HTML content
  static sanitizeHtml(dirty) {
    if (!dirty || typeof dirty !== 'string') {return '';}
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  }

  // Escape HTML entities
  static escapeHtml(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') {return '';}
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Remove potentially dangerous characters
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') {return '';}
    return input
      .trim()
      .replace(/[<>"'&]/g, '') // Remove dangerous characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  // Validate and sanitize search query
  static sanitizeSearchQuery(query) {
    if (!query || typeof query !== 'string') {return '';}
    return query
      .trim()
      .replace(/[<>"'&;()]/g, '') // Remove dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Limit length
  }

  // SQL injection prevention (basic)
  static sanitizeSqlInput(input) {
    if (!input || typeof input !== 'string') {return '';}
    return input
      .replace(/[';"\\]/g, '') // Remove SQL dangerous characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove SQL block comments
      .replace(/\*\//g, '')
      .trim();
  }

  // Check for suspicious patterns
  static containsSuspiciousContent(input) {
    if (!input || typeof input !== 'string') {return false;}

    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }
}

// Form validation utilities
export class FormValidator {
  constructor() {
    this.errors = {};
  }

  // Add error
  addError(field, message) {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
  }

  // Clear errors
  clearErrors(field = null) {
    if (field) {
      delete this.errors[field];
    } else {
      this.errors = {};
    }
  }

  // Check if has errors
  hasErrors(field = null) {
    if (field) {
      return this.errors[field] && this.errors[field].length > 0;
    }
    return Object.keys(this.errors).length > 0;
  }

  // Get errors
  getErrors(field = null) {
    if (field) {
      return this.errors[field] || [];
    }
    return this.errors;
  }

  // Validate field
  validateField(field, value, rules = {}) {
    this.clearErrors(field);

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      this.addError(field, `${field} is required`);
      return false;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return true;
    }

    // Email validation
    if (rules.email && !ValidationUtils.isValidEmail(value)) {
      this.addError(field, 'Please enter a valid email address');
    }

    // Password validation
    if (rules.password && !ValidationUtils.isValidPassword(value)) {
      this.addError(
        field,
        'Password must be at least 8 characters with uppercase, lowercase, and number',
      );
    }

    // Username validation
    if (rules.username && !ValidationUtils.isValidUsername(value)) {
      this.addError(
        field,
        'Username must be 3-20 characters, alphanumeric and underscore only',
      );
    }

    // Length validation
    if (
      rules.minLength &&
      !ValidationUtils.isValidLength(value, rules.minLength)
    ) {
      this.addError(
        field,
        `${field} must be at least ${rules.minLength} characters`,
      );
    }

    if (
      rules.maxLength &&
      !ValidationUtils.isValidLength(value, 0, rules.maxLength)
    ) {
      this.addError(
        field,
        `${field} must be no more than ${rules.maxLength} characters`,
      );
    }

    // URL validation
    if (rules.url && !ValidationUtils.isValidUrl(value)) {
      this.addError(field, 'Please enter a valid URL');
    }

    // Custom validation
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        this.addError(field, customResult || `${field} is invalid`);
      }
    }

    // Security check
    if (SecurityUtils.containsSuspiciousContent(value)) {
      this.addError(field, 'Input contains potentially dangerous content');
    }

    return !this.hasErrors(field);
  }

  // Validate multiple fields
  validateForm(formData, validationRules) {
    this.clearErrors();
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const fieldValid = this.validateField(
        field,
        formData[field],
        validationRules[field],
      );
      if (!fieldValid) {
        isValid = false;
      }
    });

    return isValid;
  }
}

// Export default validation instance
export const validator = new FormValidator();

// Common validation rules
export const ValidationRules = {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    password: true,
  },
  username: {
    required: true,
    username: true,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  bio: {
    maxLength: 500,
  },
  url: {
    url: true,
  },
  searchQuery: {
    maxLength: 100,
  },
};
