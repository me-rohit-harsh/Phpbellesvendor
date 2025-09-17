/**
 * Complete OTP Flow Test
 * This file demonstrates and tests the complete flow from OTP request to vendor registration
 */

import { requestOTP, verifyOTP, registerVendor, APIError, isValidationError, formatValidationErrors } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Test the complete OTP to vendor registration flow
 * @param {Object} testData - Test data for the flow
 * @param {string} testData.phone - Phone number (without country code)
 * @param {string} testData.email - Email address
 * @param {string} testData.otp - OTP code (for testing)
 * @param {Object} testData.vendorData - Vendor registration data
 */
export const testCompleteFlow = async (testData) => {
  console.log('🚀 Starting complete OTP to vendor registration flow test...');
  
  try {
    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP...');
    const otpResponse = await requestOTP({
      phone: `+91${testData.phone}`,
      email: testData.email
    });
    console.log('✅ OTP request successful:', otpResponse);
    
    // Step 2: Verify OTP
    console.log('🔐 Step 2: Verifying OTP...');
    const verifyResponse = await verifyOTP({
      phone: `+91${testData.phone}`,
      email: testData.email,
      otp: testData.otp
    });
    console.log('✅ OTP verification successful:', verifyResponse);
    
    // Step 3: Store token
    if (verifyResponse.token) {
      console.log('💾 Step 3: Storing authentication token...');
      await AsyncStorage.setItem('auth_token', verifyResponse.token);
      console.log('✅ Token stored successfully');
    }
    
    // Step 4: Register vendor
    console.log('🏪 Step 4: Registering vendor...');
    const registrationResponse = await registerVendor(testData.vendorData);
    console.log('✅ Vendor registration successful:', registrationResponse);
    
    console.log('🎉 Complete flow test successful!');
    return {
      success: true,
      otpResponse,
      verifyResponse,
      registrationResponse
    };
    
  } catch (error) {
    console.error('❌ Flow test failed:', error);
    
    if (error instanceof APIError) {
      console.error('API Error Details:');
      console.error('- Status:', error.status);
      console.error('- Message:', error.message);
      
      if (isValidationError(error)) {
        const validationErrors = formatValidationErrors(error.data);
        console.error('- Validation Errors:', validationErrors);
      }
    }
    
    throw error;
  }
};

/**
 * Example test data for the complete flow
 */
export const exampleTestData = {
  phone: '9876543210',
  email: 'test@example.com',
  otp: '123456', // This would be the actual OTP received
  vendorData: {
    name: "Test Vendor",
    restaurant_name: "Test Restaurant",
    vendor_type_id: "1",
    food_types: ["1", "2"],
    description: "A test restaurant for API testing",
    gst_no: "TEST123456789",
    fassai_license_no: "FSSAITEST123",
    
    // Mock file objects (in real app these would come from image picker)
    id_proof: {
      uri: 'file://test/id_proof.jpg',
      type: 'image/jpeg',
      name: 'id_proof.jpg'
    },
    profile_photo: {
      uri: 'file://test/profile_photo.jpg',
      type: 'image/jpeg',
      name: 'profile_photo.jpg'
    },
    logo: {
      uri: 'file://test/logo.jpg',
      type: 'image/jpeg',
      name: 'logo.jpg'
    },
    banner_image: {
      uri: 'file://test/banner_image.jpg',
      type: 'image/jpeg',
      name: 'banner_image.jpg'
    },
    gst_certificate: {
      uri: 'file://test/gst_certificate.jpg',
      type: 'image/jpeg',
      name: 'gst_certificate.jpg'
    },
    shop_license: {
      uri: 'file://test/shop_license.jpg',
      type: 'image/jpeg',
      name: 'shop_license.jpg'
    }
  }
};

/**
 * Test individual steps of the flow
 */
export const testIndividualSteps = {
  /**
   * Test OTP request only
   */
  testOTPRequest: async (phone, email) => {
    try {
      console.log('📱 Testing OTP request...');
      const response = await requestOTP({
        phone: `+91${phone}`,
        email: email
      });
      console.log('✅ OTP request test successful:', response);
      return response;
    } catch (error) {
      console.error('❌ OTP request test failed:', error);
      throw error;
    }
  },

  /**
   * Test OTP verification only
   */
  testOTPVerification: async (phone, email, otp) => {
    try {
      console.log('🔐 Testing OTP verification...');
      const response = await verifyOTP({
        phone: `+91${phone}`,
        email: email,
        otp: otp
      });
      console.log('✅ OTP verification test successful:', response);
      return response;
    } catch (error) {
      console.error('❌ OTP verification test failed:', error);
      throw error;
    }
  },

  /**
   * Test vendor registration only (requires valid token)
   */
  testVendorRegistration: async (vendorData) => {
    try {
      console.log('🏪 Testing vendor registration...');
      const response = await registerVendor(vendorData);
      console.log('✅ Vendor registration test successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Vendor registration test failed:', error);
      throw error;
    }
  }
};

/**
 * Usage example in React Native component
 */
export const componentUsageExample = `
// Example usage in a React Native component

import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { testCompleteFlow, exampleTestData } from '../lib/api/otp-flow-test';

const TestComponent = () => {
  const [testing, setTesting] = useState(false);

  const runCompleteFlowTest = async () => {
    setTesting(true);
    try {
      // Modify the test data with real values
      const testData = {
        ...exampleTestData,
        phone: '9876543210', // Your test phone number
        email: 'your-test@email.com', // Your test email
        otp: '123456' // The actual OTP you receive
      };

      const result = await testCompleteFlow(testData);
      Alert.alert('Success', 'Complete flow test passed!');
      console.log('Test result:', result);
    } catch (error) {
      Alert.alert('Error', 'Flow test failed: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View>
      <Button 
        title={testing ? "Testing..." : "Test Complete Flow"} 
        onPress={runCompleteFlowTest}
        disabled={testing}
      />
    </View>
  );
};
`;

console.log('OTP Flow Test module loaded. Use testCompleteFlow() to test the entire flow.');