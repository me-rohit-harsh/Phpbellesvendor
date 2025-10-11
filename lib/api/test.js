/**
 * Test file for API integration
 * This file demonstrates how to use the vendor registration API
 */

import { registerVendor, APIError, isValidationError, formatValidationErrors } from './index';

/**
 * Example usage of the vendor registration API
 * This matches the curl command structure provided
 */
export const testVendorRegistration = async () => {
  try {
    // Example vendor data matching the curl command
    const vendorData = {
      name: "John Doe",
      restaurant_name: "John's Cafe",
      vendor_type_id: "1",
      food_types: ["1", "2"],
      description: "A cozy cafe serving delicious food.",
      gst_no: "GST1234567890",
      fassai_license_no: "FSSAI12345",
      
      // File objects (these would come from image picker in real app)
      id_proof: {
        uri: 'file://path/to/id_proof.jpg',
        type: 'image/jpeg',
        name: 'id_proof.jpg'
      },
      profile_photo: {
        uri: 'file://path/to/profile_photo.jpg',
        type: 'image/jpeg',
        name: 'profile_photo.jpg'
      },
      logo: {
        uri: 'file://path/to/logo.jpg',
        type: 'image/jpeg',
        name: 'logo.jpg'
      },
      banner_image: {
        uri: 'file://path/to/banner_image.jpg',
        type: 'image/jpeg',
        name: 'banner_image.jpg'
      },
      gst_certificate: {
        uri: 'file://path/to/gst_certificate.jpg',
        type: 'image/jpeg',
        name: 'gst_certificate.jpg'
      },
      shop_license: {
        uri: 'file://path/to/shop_license.jpg',
        type: 'image/jpeg',
        name: 'shop_license.jpg'
      }
    };

    const response = await registerVendor(vendorData);
    console.info('✅ Vendor registration successful!');
    console.info('Response:', response);
    return response;
    
  } catch (error) {
    if (error instanceof APIError) {
      console.error('API Error:', error.message);
      console.error('Status:', error.status);
      
      if (isValidationError(error)) {
        const validationErrors = formatValidationErrors(error.data);
        console.error('Validation errors:', validationErrors);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
};

/**
 * Example of how to use the API in a React Native component
 */
export const exampleComponentUsage = `
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { registerVendor, APIError, isValidationError, formatValidationErrors } from '../lib/api';

const VendorRegistrationComponent = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    restaurant_name: '',
    vendor_type_id: '1',
    food_types: ['1', '2'],
    description: '',
    gst_no: '',
    fassai_license_no: '',
    // File states
    id_proof: null,
    profile_photo: null,
    logo: null,
    banner_image: null,
    gst_certificate: null,
    shop_license: null,
  });

  const pickImage = async (field) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: \`\${field}.jpg\`
        }
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await registerVendor(formData);
      Alert.alert('Success', 'Vendor registration completed successfully!');
      console.info('Registration response:', response);
    } catch (error) {
      if (error instanceof APIError) {
        if (isValidationError(error)) {
          const validationErrors = formatValidationErrors(error.data);
          Alert.alert('Validation Error', Object.values(validationErrors).join('\\n'));
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Your form components here */}
      <Button title="Register Vendor" onPress={handleSubmit} disabled={loading} />
    </View>
  );
};

export default VendorRegistrationComponent;
`;

console.info('API Test file created. Example usage:');
console.info(exampleComponentUsage);