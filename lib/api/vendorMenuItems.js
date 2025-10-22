/**
 * Vendor Menu Items Management
 * Functions for managing menu items (food items) - CRUD operations
 */

import api from './api';
import { handleAPIError } from './errorHandler';
import { logRequestDetails, logResponseDetails, validateImageFile } from './vendorUtils';
import { Platform } from 'react-native';
import { getAndroidMenuItems, getAndroidMenuItemsByCategory } from './androidNetworkFix';
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
    const fileName = `menu_item_${Date.now()}.${fileExtension}`;
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
 * Get vendor's menu items (food items) with Android-specific handling
 * @returns {Promise} API response with menu items data
 */
export const getMenuItems = async () => {
  // Use Android-specific fix for Android platform
  if (Platform.OS === 'android') {
    return getAndroidMenuItems();
  }
  
  try {
    logRequestDetails('Fetching vendor menu items', '/vendor/menu-items');
    const response = await api.get('/vendor/menu-items');
    logResponseDetails('Menu items fetch', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get menu items by category
 * @param {string|number} categoryId - The category ID
 * @returns {Promise} API response with menu items data for the category
 */
export const getMenuItemsByCategory = async (categoryId) => {
  // Use Android-specific fix for Android platform
  if (Platform.OS === 'android') {
    return getAndroidMenuItemsByCategory(categoryId);
  }
  
  try {
    logRequestDetails('Fetching menu items by category', `/vendor/menu-categories/${categoryId}/items`);
    const response = await api.get(`/vendor/menu-categories/${categoryId}/items`);
    logResponseDetails('Menu items by category fetch', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get a specific menu item by ID
 * @param {string|number} itemId - The menu item ID
 * @returns {Promise} API response with menu item data
 */
export const getMenuItemById = async (itemId) => {
  try {
    logRequestDetails('Fetching menu item by ID', `/vendor/menu-items/${itemId}`);
    const response = await api.get(`/vendor/menu-items/${itemId}`);
    logResponseDetails('Menu item by ID fetch', response);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu item ${itemId}:`, error);
    throw handleAPIError(error);
  }
};

/**
 * Create a new menu item with improved error handling and content-type flexibility
 * @param {Object} itemData - Menu item data including name, description, price, category_id, image
 * @returns {Promise} API response with created item data
 */
export const createMenuItem = async (itemData) => {
  try {
    
    // Validate required fields
    if (!itemData.name || itemData.name.trim() === '') {
      throw new Error("❌ Item name is required.");
    }
    
    if (!itemData.price || itemData.price <= 0) {
      throw new Error("❌ Item price is required and must be greater than 0.");
    }
    
    // Validate required category ID
    const categoryId = itemData.menu_category_id || itemData.category_id;
    if (!categoryId) {
      throw new Error("❌ Menu category ID is required. Please select a valid category.");
    }
    
    // Validate image file - REQUIRED by API
    const imageFile = itemData.image;
    if (!imageFile) {
      throw new Error("❌ Image is required. Please select an image for your menu item.");
    }
    
    // Validate image format if provided
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      throw new Error(`❌ ${validation.error}`);
    }
    
    // Create FormData for multipart/form-data request
    const formData = new FormData();

    // Add text fields
    formData.append('name', itemData.name);
    formData.append('description', itemData.description || '');
    formData.append('price', itemData.price ? itemData.price.toString() : '0');
    // Fix: Use menu_category_id as the API expects this field name
    formData.append('menu_category_id', categoryId.toString());

    // Add optional fields if they exist
    if (itemData.is_available !== undefined) {
      formData.append('is_available', itemData.is_available ? '1' : '0');
    }
    if (itemData.preparation_time) {
      formData.append('preparation_time', itemData.preparation_time.toString());
    }
    if (itemData.discount_price) {
      formData.append('discount_price', itemData.discount_price.toString());
    }
    if (itemData.type) {
      formData.append('type', itemData.type);
    }
    if (itemData.tags) {
      formData.append('tags', Array.isArray(itemData.tags) ? itemData.tags.join(',') : itemData.tags);
    }
    if (itemData.calories) {
      formData.append('calories', itemData.calories.toString());
    }
    if (itemData.sort_order) {
      formData.append('sort_order', itemData.sort_order.toString());
    }
    if (itemData.stock) {
      formData.append('stock', itemData.stock.toString());
    }
    if (itemData.in_stock !== undefined) {
      formData.append('in_stock', itemData.in_stock ? '1' : '0');
    }
    if (itemData.ingredients) {
      formData.append('ingredients', itemData.ingredients);
    }
    if (itemData.allergens) {
      formData.append('allergens', itemData.allergens);
    }
    if (itemData.nutritional_info) {
      formData.append('nutritional_info', itemData.nutritional_info);
    }
    
    // Add image file with platform-specific handling to fix Android upload issues
    if (typeof imageFile === 'object' && imageFile.uri) {
      // Convert Android content:// URI to valid file object
      const processedImageFile = await convertAndroidContentUri(imageFile);
      
      console.info('🖼️ Preparing image for upload...');
      console.info('🖼️ Processed image file:', processedImageFile);
      
      // Handle file object (from image picker) with platform-specific logic
      let fileObj;
      
      if (Platform.OS === 'android') {
        // Android-specific handling: Use processed file with proper URI
        const fileExtension = processedImageFile.uri.split('.').pop() || 'jpg';
        const fileName = processedImageFile.name || `menu_item_image_${Date.now()}.${fileExtension}`;
        const mimeType = processedImageFile.type || `image/${fileExtension}`;
        
        fileObj = {
          uri: processedImageFile.uri,
          type: mimeType,
          name: fileName,
        };
        
        console.info('🤖 Android file object for FormData:', fileObj);
      } else {
        // iOS and other platforms: Use original logic
        fileObj = {
          uri: processedImageFile.uri,
          type: processedImageFile.type || 'image/jpeg',
          name: processedImageFile.name || 'menu_item_image.jpg',
        };
        
        console.info('🍎 iOS file object for FormData:', fileObj);
      }
      
      formData.append('image', fileObj);
      console.info('✅ Image appended to FormData');
    } else if (typeof imageFile === 'string' && imageFile.trim() !== '') {
      // Handle URL string (for existing images or direct URLs)
      formData.append('image_url', imageFile.trim());
    } else {
      // This should not happen due to validation above, but just in case
      throw new Error("❌ Invalid image format. Please select a valid image file.");
    }
    
    console.info('📡 Sending create menu item request...');
    console.info('📡 Request URL: /vendor/menu-items');
    console.info('📡 Platform:', Platform.OS);
    
    const response = await api.post('/vendor/menu-items', formData, {
      timeout: 180000, // 3 minutes for file upload
    });
    
    // Safe JSON parsing with relaxed content-type checking
    const contentType = response.headers.get ? response.headers.get('content-type') : (response.headers['content-type'] || '');
    let parsedData = response.data;
    
    // If response is successful (2xx status), handle different content types gracefully
    if (response.status >= 200 && response.status < 300) {
      if (contentType.includes('text/html')) {
        // Try to extract JSON from HTML response if possible
        try {
          const jsonMatch = response.data.match(/\{.*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          } else {
            // If no JSON found in HTML, create a success response
            parsedData = {
              success: true,
              message: 'Menu item created successfully',
              data: {
                name: itemData.name,
                category_id: categoryId,
                price: itemData.price
              }
            };
          }
        } catch (parseError) {
          // Create a default success response since the HTTP status indicates success
          parsedData = {
            success: true,
            message: 'Menu item created successfully',
            warning: 'Server returned HTML instead of JSON, but operation completed successfully',
            data: {
              name: itemData.name,
              category_id: categoryId,
              price: itemData.price
            }
          };
        }
      } else if (contentType.includes('application/json')) {
        // Standard JSON response - use as is
        // removed console.log by codemod — use logger for persistent logs
      } else {
        // Other content types - log warning but don't fail
        console.warn('⚠️ Unexpected content type:', contentType);
        console.warn('📄 Response data:', response.data);
      }
      
      console.info('✅ Menu item created successfully', parsedData);
      return parsedData;
    } else {
      // Non-success status codes should still be treated as errors
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    // Enhanced error logging with comprehensive details
    console.error('❌ Error creating menu item:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    // Handle specific API validation errors
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Try to parse error data if it's a string
      let parsedErrorData = errorData;
      if (typeof errorData === 'string') {
        try {
          // Check if the string contains JSON
          const jsonMatch = errorData.match(/\{.*\}/);
          if (jsonMatch) {
            parsedErrorData = JSON.parse(jsonMatch[0]);
            // removed console.log by codemod — use logger for persistent logs
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse error data as JSON:', parseError.message);
        }
      }
      
      // Handle specific validation errors
      if (parsedErrorData.error) {
        const errorMsg = parsedErrorData.error.toLowerCase();
        
        if (errorMsg.includes('image field is required')) {
          throw handleAPIError(error, 'Image is required. Please add an image to your menu item.');
        }
        if (errorMsg.includes('menu category id field is required')) {
          throw handleAPIError(error, 'Category is required. Please select a valid category.');
        }
        if (errorMsg.includes('file') && (errorMsg.includes('size') || errorMsg.includes('large'))) {
          throw handleAPIError(error, 'File size is too large. Please choose a smaller image (max 5MB).');
        }
        if (errorMsg.includes('file') && (errorMsg.includes('format') || errorMsg.includes('type'))) {
          throw handleAPIError(error, 'Invalid file format. Please choose a valid image file (JPG, PNG, etc.).');
        }
        if (errorMsg.includes('permission') || errorMsg.includes('access')) {
          throw handleAPIError(error, 'Permission denied. Please check file access permissions and try again.');
        }
        if (errorMsg.includes('timeout') || errorMsg.includes('upload')) {
          throw handleAPIError(error, 'Upload failed. Please check your connection and try again.');
        }
        
        // Return the specific error message
        throw handleAPIError(error, parsedErrorData.error);
      }
      
      if (parsedErrorData.message) {
        throw handleAPIError(error, parsedErrorData.message);
      }
    }
    
    // Handle HTML error responses more gracefully
    const errorContentType = error.response?.headers?.get ? error.response.headers.get('content-type') : (error.response?.headers?.['content-type'] || '');
    if (errorContentType && errorContentType.includes('text/html')) {
      console.error('❌ Server returned HTML error page');
      console.error('📄 HTML Error Content:', error.response?.data);
      
      // Try to extract meaningful error information from HTML
      let errorMessage = 'Server error: Received HTML response instead of JSON';
      if (error.response?.data && typeof error.response.data === 'string') {
        // Look for common error patterns in HTML
        if (error.response.data.includes('500')) {
          errorMessage = 'Internal server error (500). Please try again later.';
        } else if (error.response.data.includes('404')) {
          errorMessage = 'API endpoint not found (404). Please check server configuration.';
        } else if (error.response.data.includes('validation')) {
          errorMessage = 'Validation error. Please check your input data.';
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // For network errors or other issues, use the standard error handler
    throw handleAPIError(error);
  }
};

/**
 * Update an existing menu item
 * @param {string|number} itemId - Menu item ID
 * @param {Object} itemData - Updated menu item data
 * @returns {Promise} API response with updated item data
 */
export const updateMenuItem = async (itemId, itemData) => {
  try {
    // removed console.log by codemod — use logger for persistent logs
    
    // Check if we have a new image file to upload
    const hasNewImage = itemData.image && itemData.image.uri;
    
    if (hasNewImage) {
      // Validate the new image
      const validation = validateImageFile(itemData.image);
      if (!validation.isValid) {
        throw new Error(`❌ ${validation.error}`);
      }
      
      // Create FormData for multipart/form-data request when updating with new image
      const formData = new FormData();
      
      // removed console.log by codemod — use logger for persistent logs
      
      // Add text fields
      if (itemData.name) formData.append('name', itemData.name);
      if (itemData.description !== undefined) formData.append('description', itemData.description || '');
      if (itemData.price) formData.append('price', itemData.price.toString());
      if (itemData.menu_category_id || itemData.category_id) formData.append('category_id', (itemData.menu_category_id || itemData.category_id).toString());
      
      // Add optional fields if they exist
      if (itemData.is_available !== undefined) {
        formData.append('is_available', itemData.is_available ? '1' : '0');
      }
      if (itemData.preparation_time) {
        formData.append('preparation_time', itemData.preparation_time.toString());
      }
      if (itemData.discount_price) {
        formData.append('discount_price', itemData.discount_price.toString());
      }
      if (itemData.type) {
        formData.append('type', itemData.type);
      }
      if (itemData.tags) {
        formData.append('tags', Array.isArray(itemData.tags) ? itemData.tags.join(',') : itemData.tags);
      }
      if (itemData.calories) {
        formData.append('calories', itemData.calories.toString());
      }
      if (itemData.sort_order) {
        formData.append('sort_order', itemData.sort_order.toString());
      }
      if (itemData.stock) {
        formData.append('stock', itemData.stock.toString());
      }
      if (itemData.in_stock !== undefined) {
        formData.append('in_stock', itemData.in_stock ? '1' : '0');
      }
      if (itemData.ingredients) {
        formData.append('ingredients', itemData.ingredients);
      }
      if (itemData.allergens) {
        formData.append('allergens', itemData.allergens);
      }
      if (itemData.nutritional_info) {
        formData.append('nutritional_info', itemData.nutritional_info);
      }
      
      // Add image file with platform-specific handling
      // Convert Android content:// URI to valid file object
      const processedImageFile = await convertAndroidContentUri(itemData.image);
      
      console.info('🖼️ Preparing image for update...');
      console.info('🖼️ Processed image file:', processedImageFile);
      
      let fileObj;
      
      if (Platform.OS === 'android') {
        // Android-specific handling: Use processed file with proper URI
        const fileExtension = processedImageFile.uri.split('.').pop() || 'jpg';
        const fileName = processedImageFile.name || `menu_item_image_${Date.now()}.${fileExtension}`;
        const mimeType = processedImageFile.type || `image/${fileExtension}`;
        
        fileObj = {
          uri: processedImageFile.uri,
          type: mimeType,
          name: fileName,
        };
        
        console.info('🤖 Android file object for FormData:', fileObj);
      } else {
        // iOS and other platforms: Use original logic
        fileObj = {
          uri: processedImageFile.uri,
          type: processedImageFile.type || 'image/jpeg',
          name: processedImageFile.name || 'menu_item_image.jpg',
        };
        
        console.info('🍎 iOS file object for FormData:', fileObj);
      }
      
      formData.append('image', fileObj);
      console.info('✅ Image appended to FormData');
      
      console.info('📡 Sending update menu item request...');
      console.info('📡 Request URL:', `/vendor/menu-items/${itemId}?_method=PUT`);
      console.info('📡 Platform:', Platform.OS);
      
      const response = await api.post(`/vendor/menu-items/${itemId}?_method=PUT`, formData, {
        timeout: 180000, // 3 minutes for file upload
      });
      return response;
    } else {
      // Regular JSON update without new image
      const response = await api.post(`/vendor/menu-items/${itemId}?_method=PUT`, itemData);
      return response;
    } 
  } catch (error) {
    throw handleAPIError(error);
  }
};

/**
 * Toggle menu item stock status
 * @param {string|number} itemId - Menu item ID
 * @returns {Promise} API response with updated stock status
 */
export const toggleMenuItemStock = async (itemId) => {
  try {
    logRequestDetails('Toggling stock status for menu item', `/vendor/menu-items/toggle-stock/${itemId}`);
    const response = await api.post(`/vendor/menu-items/toggle-stock/${itemId}`);
    logResponseDetails('Stock status toggle', response);
    return response;
  } catch (error) {
    console.error('Error toggling stock status:', error);
    throw handleAPIError(error);
  }
};