/**
 * Vendor Registration and Profile Management
 * Functions for vendor registration, profile operations, and complete profile management
 */

import { Platform } from 'react-native';
import api from './api';
import { handleAPIError } from './errorHandler';
import { retryRequest, createFormDataForUpload, logRequestDetails, logResponseDetails } from './vendorUtils';
import * as FileSystem from 'expo-file-system';

/**
 * Helper function to convert Android content:// URI to a valid file object
 * @param {Object} imageFile - Image file object from expo-image-picker
 * @returns {Promise<Object>} Valid file object with uri, name, and type
 */
const convertAndroidContentUri = async (imageFile) => {
  try {
    if (Platform.OS !== 'android' || !imageFile.uri.startsWith('content://')) {
      // Return original file if not Android or not content:// URI
      return imageFile;
    }

    console.info('🤖 Converting Android content:// URI to file:// URI');
    console.info('🤖 Original URI:', imageFile.uri);

    // Get file info to determine the file extension and size
    const fileInfo = await FileSystem.getInfoAsync(imageFile.uri);

    // Extract file extension from original filename or URI
    let fileExtension = 'jpg'; // Default fallback
    if (imageFile.name) {
      const extensionMatch = imageFile.name.match(/\.([^.]+)$/);
      if (extensionMatch) {
        fileExtension = extensionMatch[1].toLowerCase();
      }
    } else if (imageFile.fileName) {
      const extensionMatch = imageFile.fileName.match(/\.([^.]+)$/);
      if (extensionMatch) {
        fileExtension = extensionMatch[1].toLowerCase();
      }
    } else if (imageFile.uri) {
      // Try to extract extension from URI
      const uriExtensionMatch = imageFile.uri.match(/\.([^./?]+)(?:\?|$)/);
      if (uriExtensionMatch) {
        fileExtension = uriExtensionMatch[1].toLowerCase();
      }
    }

    // Create a temporary file path in the cache directory
    const fileName = `vendor_${Date.now()}.${fileExtension}`;
    const tempUri = `${FileSystem.cacheDirectory}${fileName}`;

    // Copy the content:// file to a file:// location
    await FileSystem.copyAsync({
      from: imageFile.uri,
      to: tempUri,
    });

    console.info('🤖 Converted to file:// URI:', tempUri);

    // Determine MIME type based on file extension
    const getMimeType = (extension) => {
      switch (extension.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        case 'pdf':
          return 'application/pdf';
        default:
          return 'image/jpeg'; // Fallback
      }
    };

    const mimeType = imageFile.type || getMimeType(fileExtension);
    console.info('🤖 File extension:', fileExtension);
    console.info('🤖 MIME type:', mimeType);
    console.info('🤖 File size:', fileInfo.size);

    // Return the converted file object
    return {
      uri: tempUri,
      name: imageFile.name || imageFile.fileName || fileName,
      type: mimeType,
      size: fileInfo.size,
    };
  } catch (error) {
    console.error('❌ Error converting Android content URI:', error);
    // If conversion fails, return original file and let the upload attempt proceed
    return imageFile;
  }
};
/**
 * Register a new vendor with all required information and file uploads
 * @param {Object} vendorData - The vendor registration data
 * @param {string} vendorData.name - Vendor name
 * @param {string} vendorData.restaurant_name - Restaurant name
 * @param {string} vendorData.vendor_type_id - Vendor type ID
 * @param {Array} vendorData.food_types - Array of food type IDs
 * @param {Object} vendorData.id_proof - ID proof file object
 * @param {Object} vendorData.profile_photo - Profile photo file object
 * @param {Object} vendorData.logo - Logo file object
 * @param {Object} vendorData.banner_image - Banner image file object
 * @param {string} vendorData.description - Restaurant description
 * @param {string} vendorData.gst_no - GST number
 * @param {Object} vendorData.gst_certificate - GST certificate file object
 * @param {string} vendorData.fassai_license_no - FSSAI license number
 * @param {Object} vendorData.shop_license - Shop license file object
 * @returns {Promise} API response
 */
export const registerVendor = async (vendorData) => {
  const makeRegistrationRequest = async () => {
    // removed console.log by codemod — use logger for persistent logs

    // removed console.log by codemod — use logger for persistent logs


    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // removed console.log by codemod — use logger for persistent logs
    // removed console.log by codemod — use logger for persistent logs
    // removed console.log by codemod — use logger for persistent logs
    formData.append('name', vendorData.name);
    formData.append('restaurant_name', vendorData.restaurant_name);
    formData.append('vendor_type_id', vendorData.vendor_type_id);
    formData.append('description', vendorData.description || '');
    formData.append('gst_no', vendorData.gst_no || '');
    formData.append('fassai_license_no', vendorData.fassai_license_no || '');
    
    // Add food types array
    if (vendorData.food_types && Array.isArray(vendorData.food_types)) {
      vendorData.food_types.forEach((foodType, index) => {
        formData.append(`food_types[${index}]`, foodType.toString());
      });
    }
    
    // Add file uploads with proper React Native FormData structure and Android URI conversion
    const fileFields = ['id_proof', 'profile_photo', 'logo', 'banner_image', 'gst_certificate', 'shop_license'];
    
    // Process each file field with Android content URI conversion
    for (const fieldName of fileFields) {
      const file = vendorData[fieldName];
      if (file && file.uri) {
        console.info(`🖼️ Processing file for ${fieldName}...`);
        
        // Convert Android content:// URI to file:// URI if needed
        const processedFile = await convertAndroidContentUri(file);
        
        console.info(`🖼️ Processed file for ${fieldName}:`, processedFile);
        
        // Create file object for FormData
        let fileObj;
        
        if (Platform.OS === 'android') {
          // Android-specific handling with processed file
          const fileExtension = processedFile.uri.split('.').pop() || 'jpg';
          const fileName = processedFile.name || `${fieldName}.${fileExtension}`;
          const mimeType = processedFile.type || `image/${fileExtension}`;
          
          fileObj = {
            uri: processedFile.uri,
            type: mimeType,
            name: fileName,
          };
          
          console.info(`🤖 Android file object for ${fieldName}:`, fileObj);
        } else {
          // iOS and other platforms: Use original logic
          fileObj = {
            uri: processedFile.uri,
            type: processedFile.type || 'image/jpeg',
            name: processedFile.name || `${fieldName}.jpg`,
          };
          
          console.info(`🍎 iOS file object for ${fieldName}:`, fileObj);
        }
        
        formData.append(fieldName, fileObj);
        console.info(`✅ File appended to FormData: ${fieldName}`);
      }
    }
    
    // removed console.log by codemod — use logger for persistent logs
    
    
    console.info('🚀 Sending vendor registration request...');
    const response = await api.post('/vendor/register', formData, {
      timeout: 300000, // 5 minutes for file uploads
    });
    
    console.info('✅ Vendor registration successful:', response.data);
    return response.data;
  };

  try {
    return await retryRequest(makeRegistrationRequest, 3, 2000);
  } catch (error) {
    console.error('❌ Vendor registration failed after all retries:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get vendor profile information
 * @returns {Promise} API response with vendor profile data
 */
export const getVendorProfile = async () => {
  try {
    logRequestDetails('Fetching vendor profile', '/profile');
    const response = await api.get('/profile');
    logResponseDetails('Vendor profile fetch', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get complete vendor profile information
 * @returns {Promise} API response with complete profile data
 */
export const getCompleteProfile = async () => {
  try {
    logRequestDetails('Fetching complete vendor profile', '/vendor/profile');
    const response = await api.get('/vendor/profile');
    logResponseDetails('Complete profile fetch', response);
    return response;
  } catch (error) {
    console.error('Error fetching complete profile:', error);
    throw handleAPIError(error);
  }
};

/**
 * Update complete vendor profile information
 * @param {Object|FormData} profileData - The complete profile data to update (can be JSON or FormData)
 * @returns {Promise} API response confirming the update
 */
export const updateCompleteProfile = async (profileData) => {
  try {
    // Check if profileData is FormData (for file uploads)
    const isFormData = profileData instanceof FormData;
    
    if (isFormData) {
      console.info('🔄 Updating vendor profile with file uploads (FormData)');
      
      // Process FormData to handle Android content:// URIs
      const processedFormData = new FormData();
      
      // Access React Native FormData internal _parts array
      const parts = profileData._parts || [];
      console.info(`📋 FormData has ${parts.length} parts`);
      
      // Process each part
      for (const [key, value] of parts) {
        console.info(`🔑 Processing key: ${key}`);
        
        // Check if this is a file object (has uri, type, and name properties)
        if (value && typeof value === 'object' && value.uri) {
          console.info(`🖼️ Processing file for ${key}...`);
          console.info(`📋 Original file object:`, JSON.stringify(value, null, 2));
          
          // Convert Android content:// URI to file:// URI if needed
          const processedFile = await convertAndroidContentUri(value);
          
          console.info(`🖼️ Processed file for ${key}:`, processedFile);
          
          // Create file object for FormData based on platform
          let fileObj;
          
          if (Platform.OS === 'android') {
            // Android-specific handling with processed file
            const fileExtension = processedFile.uri.split('.').pop() || 'jpg';
            const fileName = processedFile.name || `${key}.${fileExtension}`;
            const mimeType = processedFile.type || `image/${fileExtension}`;
            
            fileObj = {
              uri: processedFile.uri,
              type: mimeType,
              name: fileName,
            };
            
            console.info(`🤖 Android file object for ${key}:`, fileObj);
          } else {
            // iOS and other platforms: Use original logic
            fileObj = {
              uri: processedFile.uri,
              type: processedFile.type || 'image/jpeg',
              name: processedFile.name || `${key}.jpg`,
            };
            
            console.info(`🍎 iOS file object for ${key}:`, fileObj);
          }
          
          processedFormData.append(key, fileObj);
          console.info(`✅ File appended to FormData: ${key}`);
        } else {
          // Regular field (text, number, etc.)
          console.info(`📝 Appending regular field ${key}:`, value);
          processedFormData.append(key, value);
        }
      }
      
      console.info('🚀 Sending profile update request with files...');
      console.info(`📊 Final FormData has ${processedFormData._parts.length} parts`);
      // For FormData, use POST with multipart/form-data
      const response = await api.post('/vendor/profile', processedFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for file uploads
      });
      
      console.info('✅ Profile updated successfully with files');
      logResponseDetails('Complete profile update with files', response);
      return response;
    } else {
      // For JSON data, use PUT
      logRequestDetails('Updating complete vendor profile', '/vendor/profile', profileData);
      const response = await api.put('/vendor/profile', profileData);
      logResponseDetails('Complete profile update', response);
      return response;
    }
  } catch (error) {
    console.error('❌ Error updating complete profile:', error);
    throw handleAPIError(error);
  }
};