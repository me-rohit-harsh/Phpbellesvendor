// Main API instance
export { default as api } from './api';

// Authentication APIs
export { login, requestOTP, verifyOTP } from './auth';

// Vendor APIs
export { registerVendor, getVendorProfile, updateVendorProfile, getVendorTypes, getFoodTypes, toggleVendorStatus, getVendorStatus } from './vendor';

// Error handling utilities
export { 
  APIError, 
  handleAPIError, 
  getErrorMessage, 
  formatValidationErrors,
  isNetworkError,
  isAuthError,
  isValidationError 
} from './errorHandler';