import api from './api';
import { handleAPIError } from './errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Authentication API functions using fetch
 */

/**
 * Request OTP for phone and email verification
 * @param {Object} data - OTP request data
 * @param {string} data.phone - Phone number with country code
 * @param {string} data.email - Email address
 * @returns {Promise<Object>} OTP request response
 */
export const requestOTP = async (data) => {
  try {
    const response = await api.post('/request-otp', data);
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};

/**
 * Verify OTP and get authentication token
 * @param {Object} data - OTP verification data
 * @param {string} data.phone - Phone number with country code
 * @param {string} data.email - Email address
 * @param {string} data.otp - OTP code
 * @returns {Promise<Object>} Verification response with token
 */
export const verifyOTP = async (data) => {
  try {
    console.info('Sending OTP verification request:', {
      phone: data.phone,
      email: data.email,
      otp: data.otp ? '***' + data.otp.slice(-2) : 'undefined'
    });
    
    const response = await api.post('/verify-otp', data);
    
    console.info('OTP verification API response:', {
      status: response.status,
      data: response.data
    });
    
    // Validate response structure
    if (!response.data) {
      throw new Error('Invalid response from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('OTP verification API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw handleAPIError(error);
  }
};

/**
 * Login user with credentials
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Login response with token
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};

/**
 * Logout user and clear all authentication data
 * @returns {Promise<Object>} Logout result
 */
export const logout = async () => {
  try {
    console.info('🚪 Starting logout process...');
    
    // Clear all authentication related data from AsyncStorage
    const keysToRemove = [
      'auth_token',
      'authToken',
      'isVendorLoggedIn',
      'vendorData',
      'user',
      'userProfile'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.info('✅ Authentication data cleared from storage');
    
    // Optionally call server logout endpoint if it exists
    try {
      await api.post('/logout');
      console.info('✅ Server logout successful');
    } catch (serverError) {
      // Server logout is optional, log but don't fail
      console.warn('⚠️ Server logout failed (non-critical):', serverError.message);
    }
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('❌ Error during logout:', error);
    // Even if there's an error, try to clear storage
    try {
      await AsyncStorage.clear();
    } catch (clearError) {
      console.error('❌ Failed to clear storage:', clearError);
    }
    throw handleAPIError(error);
  }
};