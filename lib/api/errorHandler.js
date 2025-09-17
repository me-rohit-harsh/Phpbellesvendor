/**
 * API Error Handler Utility
 * Provides standardized error handling for API responses
 */

export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Handle API errors and format them consistently
 * @param {Object} error - The error object from axios
 * @returns {APIError} Formatted error object
 */
export const handleAPIError = (error) => {
  console.log('API Error Details:', {
    message: error.message,
    response: error.response,
    request: error.request,
    config: error.config
  });

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    // Check if response is HTML (common when API returns error pages)
    if (typeof data === 'string' && data.includes('<html>')) {
      return new APIError('Server error. Please try again later.', status, null);
    }
    
    // Check if response contains Laravel/PHP error
    if (typeof data === 'string' && (data.includes('syntax error') || data.includes('Route'))) {
      return new APIError('Server configuration error. Please contact support.', status, null);
    }
    
    const message = data?.message || data?.error || `HTTP Error ${status}`;
    
    return new APIError(message, status, data);
  } else if (error.request) {
    // Request was made but no response received
    console.log('Network error details:', {
      code: error.code,
      message: error.message,
      request: error.request,
      config: error.config
    });
    
    if (error.code === 'ECONNABORTED') {
      return new APIError('Request timeout. Please check your internet connection and try again.', 408, null);
    } else if (error.name === 'CORSError') {
      return new APIError('Network connection failed. For web testing, please use a mobile device or emulator.', 0, null);
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      // Check if we're on web platform for more specific error message
      const platform = typeof window !== 'undefined' ? 'web' : 'mobile';
      if (platform === 'web') {
        return new APIError('Network connection failed. CORS or connectivity issue detected. Please use the mobile app or check your internet connection.', 0, null);
      } else {
        return new APIError('Network connection failed. Please check your internet connection and try again.', 0, null);
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new APIError('Cannot connect to server. Please check your internet connection or try again later.', 0, null);
    } else if (error.message && error.message.includes('Invalid URL')) {
      return new APIError('Invalid server configuration. Please contact support.', 0, null);
    }
    return new APIError('Network error. Please check your internet connection and try again.', 0, null);
  } else {
    // Something else happened
    return new APIError(error.message || 'An unexpected error occurred', 0, null);
  }
};

/**
 * Get user-friendly error message based on status code
 * @param {number} status - HTTP status code
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (status) => {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication failed. Please login again.';
    case 403:
      return 'Access denied. You don\'t have permission for this action.';
    case 404:
      return 'Resource not found.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};

/**
 * Format validation errors from Laravel backend
 * @param {Object} errorData - Error data from API response
 * @returns {Object} Formatted validation errors
 */
export const formatValidationErrors = (errorData) => {
  if (errorData?.errors) {
    const formattedErrors = {};
    Object.keys(errorData.errors).forEach(field => {
      formattedErrors[field] = errorData.errors[field][0]; // Get first error message
    });
    return formattedErrors;
  }
  return {};
};

/**
 * Check if error is a network error
 * @param {APIError} error - The API error object
 * @returns {boolean} True if it's a network error
 */
export const isNetworkError = (error) => {
  return error.status === 0;
};

/**
 * Check if error is an authentication error
 * @param {APIError} error - The API error object
 * @returns {boolean} True if it's an auth error
 */
export const isAuthError = (error) => {
  return error.status === 401;
};

/**
 * Check if error is a validation error
 * @param {APIError} error - The API error object
 * @returns {boolean} True if it's a validation error
 */
export const isValidationError = (error) => {
  return error.status === 422;
};