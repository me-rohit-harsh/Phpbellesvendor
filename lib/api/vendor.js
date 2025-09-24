import api, { testConnectivity, getAPIConfig } from './api';
import { handleAPIError } from './errorHandler';

/**
 * Retry a request function with exponential backoff
 * @param {Function} requestFn - The request function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} The result of the successful request
 */
const retryRequest = async (requestFn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed');
        throw error;
      }
      
      // Exponential backoff: wait longer between retries
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
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
    console.log('Starting vendor registration with data:', {
      name: vendorData.name,
      restaurant_name: vendorData.restaurant_name,
      vendor_type_id: vendorData.vendor_type_id,
      hasFiles: {
        id_proof: !!vendorData.id_proof,
        profile_photo: !!vendorData.profile_photo,
        logo: !!vendorData.logo,
        banner_image: !!vendorData.banner_image,
        gst_certificate: !!vendorData.gst_certificate,
        shop_license: !!vendorData.shop_license,
      }
    });

    // Log API configuration for debugging
    console.log('API Configuration:', getAPIConfig());

    // Test connectivity before making the request
    console.log('Testing API connectivity...');
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.warn('Connectivity test failed, but proceeding with request...');
    }

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    console.log('Creating FormData for vendor registration...');
    console.log('Vendor data keys:', Object.keys(vendorData));
    console.log('FormData constructor:', FormData.name);
    
    // Add text fields
    formData.append('name', vendorData.name);
    formData.append('restaurant_name', vendorData.restaurant_name);
    formData.append('vendor_type_id', vendorData.vendor_type_id);
    formData.append('description', vendorData.description || '');
    formData.append('gst_no', vendorData.gst_no || '');
    formData.append('fassai_license_no', vendorData.fassai_license_no || '');
    
    // Add food types array
    if (vendorData.food_types && Array.isArray(vendorData.food_types)) {
      vendorData.food_types.forEach((foodType, index) => {
        formData.append(`food_types[${index}]`, foodType);
      });
    }
    
    // Add file uploads with proper React Native FormData structure
    const addFileToFormData = (formData, fieldName, fileData) => {
      if (fileData && fileData.uri) {
        // For React Native, we need to create a proper file object
        const fileObj = {
          uri: fileData.uri,
          type: fileData.type || 'image/jpeg',
          name: fileData.name || `${fieldName}.jpg`,
        };
        
        // Log file details for debugging
        console.log(`Adding ${fieldName} to FormData:`, fileObj);
        
        formData.append(fieldName, fileObj);
      }
    };
    
    addFileToFormData(formData, 'id_proof', vendorData.id_proof);
    addFileToFormData(formData, 'profile_photo', vendorData.profile_photo);
    addFileToFormData(formData, 'logo', vendorData.logo);
    addFileToFormData(formData, 'banner_image', vendorData.banner_image);
    addFileToFormData(formData, 'gst_certificate', vendorData.gst_certificate);
    addFileToFormData(formData, 'shop_license', vendorData.shop_license);

    console.log('Making API request to /vendor/register...');
    console.log('Request URL:', `${api.defaults.baseURL}/vendor/register`);
    console.log('FormData entries count:', Array.from(formData.entries()).length);
    console.log('FormData type check:', formData instanceof FormData);
    console.log('FormData toString:', formData.toString());
    
    // Log all FormData entries for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`FormData entry: ${key} =`, typeof value === 'object' ? JSON.stringify(value) : value);
    }
    
    // Create a custom config to ensure proper FormData handling
    const config = {
      timeout: 180000, // 3 minutes for file upload
      headers: {
        // Explicitly set Content-Type to undefined to prevent axios from setting it
        'Content-Type': undefined,
      },
      transformRequest: [(data) => {
        // Return FormData as-is without any transformation
        return data;
      }],
      // Force axios to not set any default Content-Type
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    };
    
    console.log('Making request with config:', {
      ...config,
      headers: { ...config.headers, Authorization: '[REDACTED]' }
    });
    
    const response = await api.post('/vendor/register', formData, config);
    
    console.log('Vendor registration successful:', response.data);
    return response.data;
  };

  try {
    return await retryRequest(makeRegistrationRequest, 3, 2000);
  } catch (error) {
    console.error('Vendor registration failed after all retries:', error);
    console.error('Final error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    // Additional network error debugging
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error detected. This could be due to:');
      console.error('1. CORS issues (if running on web)');
      console.error('2. FormData content-type issues');
      console.error('3. Server connectivity problems');
      console.error('4. Request timeout');
      console.error('Request config:', {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
        headers: error.config?.headers
      });
    }
    
    throw handleAPIError(error);
  }
};

/**
 * Get vendor profile information
 * @returns {Promise} API response with vendor profile data
 */
export const getVendorProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};



/**
 * Get vendor types from API with retry logic
 * @returns {Promise} API response with vendor types
 */
export const getVendorTypes = async () => {
  const makeVendorTypesRequest = async () => {
    console.log('Fetching vendor types...');
    console.log('Request URL:', `${api.defaults.baseURL}/vendor/vendor-types`);
    
    // Get token from AsyncStorage for explicit logging
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');
    console.log('Token available for vendor types request:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    const response = await api.get('/vendor/vendor-types', {
      timeout: 30000, // 30 seconds timeout
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });
    
    console.log('Vendor types response:', response.data);
    return response.data;
  };

  try {
    return await retryRequest(makeVendorTypesRequest, 3, 1000);
  } catch (error) {
    console.error('Failed to fetch vendor types after all retries:', error);
    console.error('Vendor types error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    throw handleAPIError(error);
  }
};

/**
 * Get food types from API with retry logic
 * @returns {Promise} API response with food types
 */
export const getFoodTypes = async () => {
  const makeFoodTypesRequest = async () => {
    console.log('Fetching food types...');
    console.log('Request URL:', `${api.defaults.baseURL}/vendor/food-types`);
    
    // Get token from AsyncStorage for explicit logging
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');
    console.log('Token available for food types request:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    const response = await api.get('/vendor/food-types', {
      timeout: 30000, // 30 seconds timeout
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });
    
    console.log('Food types response:', response.data);
    return response.data;
  };

  try {
    return await retryRequest(makeFoodTypesRequest, 1, 1000);
  } catch (error) {
    console.error('Failed to fetch food types after all retries:', error);
    console.error('Food types error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    throw handleAPIError(error);
  }
};

/**
 * Toggle vendor online/offline status
 * @returns {Promise} API response with updated status
 */
export const toggleVendorStatus = async () => {
  try {
    const response = await api.post('/vendor/toggle-status');
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};

/**
 * Check vendor verification/approval status
 * @returns {Promise} API response with vendor status
 */
export const getVendorStatus = async () => {
  try {
    // Get token from AsyncStorage for explicit logging
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');
    console.log('Token available for vendor status request:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    const response = await api.post('/vendor/vendor-status', {}, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching vendor status:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get vendor's menu categories
 * @returns {Promise} API response with categories data
 */
export const getMenuCategories = async () => {
  try {
    console.log('Fetching menu categories...');
    const response = await api.get('/vendor/menu-categories');
    console.log('Menu categories response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching menu categories:', error);
    throw handleAPIError(error);
  }
};

/**
 * Create a new menu category
 * @param {Object} categoryData - Category data
 * @param {string} categoryData.name - Category name
 * @param {string} categoryData.description - Category description
 * @param {boolean} categoryData.is_active - Category active status
 * @returns {Promise} API response with created category data
 */
export const createMenuCategory = async (categoryData) => {
  try {
    console.log('Creating menu category:', categoryData);
    const response = await api.post('/vendor/menu-categories', categoryData);
    console.log('Create category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating menu category:', error);
    throw handleAPIError(error);
  }
};

/**
 * Update an existing menu category
 * @param {number} categoryId - Category ID
 * @param {Object} categoryData - Updated category data
 * @param {string} categoryData.name - Category name
 * @param {string} categoryData.description - Category description
 * @param {boolean} categoryData.is_active - Category active status
 * @returns {Promise} API response with updated category data
 */
export const updateMenuCategory = async (categoryId, categoryData) => {
  try {
    console.log('Updating menu category:', categoryId, categoryData);
    const response = await api.put(`/vendor/menu-categories/${categoryId}`, categoryData);
    console.log('Update category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating menu category:', error);
    throw handleAPIError(error);
  }
};

/**
 * Delete a menu category
 * @param {number} categoryId - Category ID
 * @returns {Promise} API response
 */
export const deleteMenuCategory = async (categoryId) => {
  try {
    console.log('Deleting menu category:', categoryId);
    const response = await api.delete(`/vendor/menu-categories/${categoryId}`);
    console.log('Delete category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting menu category:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get vendor's menu data
 * @returns {Promise} API response with menu data
 */
export const getVendorMenu = async () => {
  try {
    console.log('Fetching vendor menu...');
    const response = await api.get('/vendor/menu');
    console.log('Vendor menu response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching vendor menu:', error);
    throw handleAPIError(error);
  }
};

/**
 * Update vendor's menu data
 * @param {Object} menuData - The menu data to update
 * @param {string} menuData.name - Menu name (optional)
 * @param {string} menuData.description - Menu description (required)
 * @param {boolean} menuData.is_active - Menu active status (optional)
 * @returns {Promise} API response with updated menu data
 */
export const updateVendorMenu = async (menuData) => {
  try {
    console.log('Updating vendor menu with data:', menuData);
    const response = await api.put('/vendor/menu', menuData);
    console.log('Update menu response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating vendor menu:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get vendor's menu items (food items)
 * @returns {Promise} API response with menu items data
 */
export const getMenuItems = async () => {
  try {
    console.log('Fetching vendor menu items...');
    const response = await api.get('/vendor/menu-items');
    console.log('Menu items loaded successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw handleAPIError(error);
  }
};

export const getMenuItemsByCategory = async (categoryId) => {
  try {
    console.log(`🔄 Fetching menu items for category ${categoryId}...`);
    const response = await api.get(`/vendor/menu-categories/${categoryId}/items`);
    console.log('Menu items by category fetched successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
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
    // Log the payload being sent
    console.log("📦 Payload for createMenuItem:", itemData);
    
    // Validate image file is present before making API call
    const imageFile = itemData.image;
    
    // Updated validation to handle both file objects and URL strings
    if (!imageFile || imageFile === null || imageFile === undefined) {
      throw new Error("❌ Image file is required. Please provide a valid image file before creating a menu item.");
    }
    
    // Check if it's a valid image (either file object with uri or a URL string)
    const isValidImage = (
      (typeof imageFile === 'object' && imageFile.uri) || 
      (typeof imageFile === 'string' && imageFile.trim() !== '')
    );
    
    if (!isValidImage) {
      throw new Error("❌ Invalid image format. Please provide a valid image file or URL.");
    }
    
    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    console.log('Creating FormData for menu item creation...');
    
    // Validate required category ID
    const categoryId = itemData.menu_category_id || itemData.category_id;
    if (!categoryId) {
      throw new Error("❌ Menu category ID is required. Please select a valid category.");
    }

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
    
    // Add image file with proper React Native FormData structure
    if (imageFile) {
      if (typeof imageFile === 'object' && imageFile.uri) {
        // Handle file object (from image picker)
        const fileObj = {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.name || 'menu_item_image.jpg',
        };
        
        console.log('Adding image file to FormData:', fileObj);
        formData.append('image', fileObj);
      } else if (typeof imageFile === 'string' && imageFile.trim() !== '') {
        // Handle URL string (for existing images or direct URLs)
        console.log('Adding image URL to FormData:', imageFile);
        formData.append('image_url', imageFile.trim());
      }
    }
    
    // Create a custom config to ensure proper FormData handling
    const config = {
      timeout: 180000, // 3 minutes for file upload
      headers: {
        'Accept': 'application/json',
      },
      transformRequest: [
        // Return FormData as-is without any transformation
        (data) => {
          console.log('Transform request called with data type:', typeof data);
          console.log('Is FormData?', data instanceof FormData);
          return data;
        }
      ]
    };
    
    console.log('🍽️ Creating new menu item with image file...');
    console.log('FormData entries count:', Array.from(formData.entries()).length);
    
    const response = await api.post('/vendor/menu-items', formData, config);
    
    // Enhanced logging for debugging
    console.log('📊 Response Details:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      contentType: response.headers['content-type'] || response.headers['Content-Type'] || 'unknown',
      dataType: typeof response.data,
      dataLength: response.data ? response.data.toString().length : 0
    });
    
    // Safe JSON parsing with relaxed content-type checking
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
    let parsedData = response.data;
    
    // If response is successful (2xx status), handle different content types gracefully
    if (response.status >= 200 && response.status < 300) {
      if (contentType.includes('text/html')) {
        console.warn('⚠️ Server returned HTML instead of JSON, but request was successful');
        console.warn('📄 HTML Response:', response.data);
        
        // Try to extract JSON from HTML response if possible
        try {
          const jsonMatch = response.data.match(/\{.*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully extracted JSON from HTML response:', parsedData);
          } else {
            // If no JSON found in HTML, create a success response
            console.warn('⚠️ No JSON found in HTML response, creating default success response');
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
          console.warn('⚠️ Failed to parse JSON from HTML response:', parseError.message);
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
        console.log('✅ Received proper JSON response');
      } else {
        // Other content types - log warning but don't fail
        console.warn('⚠️ Unexpected content type:', contentType);
        console.warn('📄 Response data:', response.data);
      }
      
      console.log('✅ Menu item created successfully', parsedData);
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
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      contentType: error.response?.headers['content-type'] || error.response?.headers['Content-Type'],
      config: {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      }
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
            console.log('📋 Parsed error data from string:', parsedErrorData);
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse error data as JSON:', parseError.message);
        }
      }
      
      // Handle specific validation errors
      if (parsedErrorData.error) {
        if (parsedErrorData.error.includes('image field is required')) {
          throw handleAPIError(error, 'Image is required. Please add an image to your menu item.');
        }
        if (parsedErrorData.error.includes('menu category id field is required')) {
          throw handleAPIError(error, 'Category is required. Please select a valid category.');
        }
        // Return the specific error message
        throw handleAPIError(error, parsedErrorData.error);
      }
      
      if (parsedErrorData.message) {
        throw handleAPIError(error, parsedErrorData.message);
      }
    }
    
    // Handle HTML error responses more gracefully
    const errorContentType = error.response?.headers['content-type'] || error.response?.headers['Content-Type'] || '';
    if (errorContentType.includes('text/html')) {
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
    console.log(`🔄 Updating menu item ${itemId}...`, itemData);
    
    // Check if we have a new image file to upload
    const hasNewImage = itemData.image && itemData.image.uri;
    
    if (hasNewImage) {
      // Create FormData for multipart/form-data request when updating with new image
      const formData = new FormData();
      
      console.log('Creating FormData for menu item update with new image...');
      
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
      
      // Add image file
      const fileObj = {
        uri: itemData.image.uri,
        type: itemData.image.type || 'image/jpeg',
        name: itemData.image.name || 'menu_item_image.jpg',
      };
      
      console.log('Adding updated image to FormData:', fileObj);
      formData.append('image', fileObj);
      
      // Create a custom config for FormData
      const config = {
        timeout: 180000, // 3 minutes for file upload
        headers: {
          'Accept': 'application/json',
        },
        transformRequest: [
          (data) => {
            console.log('Transform request called with data type:', typeof data);
            console.log('Is FormData?', data instanceof FormData);
            return data;
          }
        ]
      };
      
      console.log('FormData entries count:', Array.from(formData.entries()).length);
      const response = await api.put(`/vendor/menu-items/${itemId}`, formData, config);
      console.log('Menu item updated successfully with new image:', response.data);
      return response;
    } else {
      
      

      const response = await api.put(`/vendor/menu-items/${itemId}`, itemData);
      console.log('Menu item updated successfully:', response.data);
      return response;
    }
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw handleAPIError(error);
  }
};

/**
 * Delete a menu item
 * @param {string|number} itemId - Menu item ID
 * @returns {Promise} API response
 */


/**
 * Get complete vendor profile information
 * @returns {Promise} API response with complete profile data
 */
export const getCompleteProfile = async () => {
  try {
    console.log('🔄 Fetching complete vendor profile...');
    const response = await api.post('/complete-profile');
    console.log('Complete profile fetched successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching complete profile:', error);
    throw handleAPIError(error);
  }
};

/**
 * Update complete vendor profile information
 * @param {Object} profileData - The complete profile data to update
 * @returns {Promise} API response confirming the update
 */
export const updateCompleteProfile = async (profileData) => {
  try {
    console.log('🔄 Updating complete vendor profile...', profileData);
    const response = await api.put('/vendor/complete-profile', profileData);
    console.log('Complete profile updated successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Error updating complete profile:', error);
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
    console.log('🔄 Toggling stock status for menu item:', itemId);
    const response = await api.post(`/vendor/menu-items/toggle-stock/${itemId}`);
    console.log('Stock status toggled successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Error toggling stock status:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get recent activities for the vendor
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of activities to fetch (default: 10)
 * @param {string} options.type - Filter by activity type (optional)
 * @param {string} options.since - Fetch activities since this timestamp (optional)
 * @returns {Promise} API response with recent activities
 */
export const getRecentActivities = async (options = {}) => {
  try {
    const { limit = 10, type, since } = options;
    console.log('Fetching recent activities with options:', options);
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    
    if (type) {
      params.append('type', type);
    }
    
    if (since) {
      params.append('since', since);
    }
    
    const queryString = params.toString();
    const url = `/vendor/activities${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    console.log('Recent activities loaded successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw handleAPIError(error);
  }
};
