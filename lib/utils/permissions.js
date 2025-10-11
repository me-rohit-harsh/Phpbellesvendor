import * as ImagePicker from 'expo-image-picker';
// import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Alert, Linking, Platform } from 'react-native';
import { handlePermissionError, handleFileUploadError, createPermissionError } from './errorHandler';

/**
 * Comprehensive permission utility for handling all file and media permissions
 * This utility ensures consistent permission handling across the app
 */

export const PERMISSION_TYPES = {
  CAMERA: 'camera',
  MEDIA_LIBRARY: 'mediaLibrary',
  LOCATION: 'location',
  AUDIO: 'audio',
  DOCUMENTS: 'documents'
};

export const PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
  RESTRICTED: 'restricted'
};

/**
 * Check if a specific permission is granted
 * @param {string} permissionType - Type of permission to check
 * @returns {Promise<boolean>} - Whether permission is granted
 */
export const checkPermission = async (permissionType) => {
  try {
    switch (permissionType) {
      case PERMISSION_TYPES.CAMERA:
        const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
        return cameraStatus.status === PERMISSION_STATUS.GRANTED;
      
      case PERMISSION_TYPES.MEDIA_LIBRARY:
        // On Android, when using system Photo Picker/Document Picker, media library permission is not required
        if (Platform.OS === 'android') {
          return true;
        }
        const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
        return mediaStatus.status === PERMISSION_STATUS.GRANTED;
      
      case PERMISSION_TYPES.LOCATION:
        const locationStatus = await Location.getForegroundPermissionsAsync();
        return locationStatus.status === PERMISSION_STATUS.GRANTED;
      
      case PERMISSION_TYPES.AUDIO:
        const audioStatus = await Audio.getPermissionsAsync();
        return audioStatus.status === PERMISSION_STATUS.GRANTED;
      
      case PERMISSION_TYPES.DOCUMENTS:
        // DocumentPicker doesn't require explicit permissions on modern platforms
        // The system handles permissions automatically
        return true;
      
      default:
        console.warn(`Unknown permission type: ${permissionType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error checking ${permissionType} permission:`, error);
    return false;
  }
};

/**
 * Request a specific permission
 * @param {string} permissionType - Type of permission to request
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestPermission = async (permissionType) => {
  try {
    switch (permissionType) {
      case PERMISSION_TYPES.CAMERA:
        const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
        return cameraResult.status === PERMISSION_STATUS.GRANTED;
      
      case PERMISSION_TYPES.MEDIA_LIBRARY:
        // On Android, when using system Photo Picker/Document Picker, media library permission is not required
        if (Platform.OS === 'android') {
          return true;
        }
        const mediaResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return mediaResult.status === PERMISSION_STATUS.GRANTED;
      
      case PERMISSION_TYPES.LOCATION:
        const locationResult = await Location.requestForegroundPermissionsAsync();
        return locationResult.status === PERMISSION_STATUS.GRANTED;
      
      case PERMISSION_TYPES.AUDIO:
        const audioResult = await Audio.requestPermissionsAsync();
        return audioResult.status === PERMISSION_STATUS.GRANTED;
      
      case PERMISSION_TYPES.DOCUMENTS:
        // DocumentPicker doesn't require explicit permissions on modern platforms
        // The system handles permissions automatically
        return true;
      
      default:
        console.warn(`Unknown permission type: ${permissionType}`);
        return false;
    }
  } catch (error) {
    console.error(`Error requesting ${permissionType} permission:`, error);
    return false;
  }
};

/**
 * Check and request permission if needed
 * @param {string} permissionType - Type of permission
 * @param {boolean} showAlert - Whether to show alert if permission denied
 * @returns {Promise<boolean>} - Whether permission is available
 */
export const ensurePermission = async (permissionType, showAlert = true) => {
  try {
    // First check if permission is already granted
    const hasPermission = await checkPermission(permissionType);
    if (hasPermission) {
      return true;
    }

    // Request permission if not granted
    const granted = await requestPermission(permissionType);
    
    if (!granted && showAlert) {
      showPermissionDeniedAlert(permissionType);
    }
    
    return granted;
  } catch (error) {
    console.error(`Error ensuring ${permissionType} permission:`, error);
    if (showAlert) {
      Alert.alert(
        'Permission Error',
        `Failed to check ${permissionType} permission. Please try again.`,
        [{ text: 'OK' }]
      );
    }
    return false;
  }
};

/**
 * Show permission alert with option to open settings
 */
const showPermissionAlert = (title, message, onOpenSettings) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: onOpenSettings }
    ]
  );
};

/**
 * Show alert when permission is denied
 * @param {string} permissionType - Type of permission that was denied
 */
export const showPermissionDeniedAlert = (permissionType) => {
  const permissionMessages = {
    [PERMISSION_TYPES.CAMERA]: {
      title: 'Camera Permission Required',
      message: 'This app needs camera access to take photos for your menu items and profile. Please enable camera permission in your device settings.',
    },
    [PERMISSION_TYPES.MEDIA_LIBRARY]: {
      title: 'Photo Library Permission Required',
      message: 'This app needs access to your photo library to upload images for your menu items and profile. Please enable photo library permission in your device settings.',
    },
    [PERMISSION_TYPES.LOCATION]: {
      title: 'Location Permission Required',
      message: 'This app needs location access to help customers find your restaurant. Please enable location permission in your device settings.',
    },
    [PERMISSION_TYPES.AUDIO]: {
      title: 'Microphone Permission Required',
      message: 'This app needs microphone access for customer support features. Please enable microphone permission in your device settings.',
    },
    [PERMISSION_TYPES.DOCUMENTS]: {
      title: 'File Access Permission Required',
      message: 'This app needs file access to upload documents like licenses and certificates. Please enable file access permission in your device settings.',
    }
  };

  const config = permissionMessages[permissionType] || {
    title: 'Permission Required',
    message: 'This app needs additional permissions to function properly. Please enable the required permissions in your device settings.'
  };

  showPermissionAlert(
    config.title,
    config.message,
    () => Linking.openSettings()
  );
};

/**
 * Safe image picker with permission handling
 * @param {Object} options - ImagePicker options
 * @param {string} source - 'camera' or 'library'
 * @returns {Promise<Object|null>} - Selected image or null if cancelled/failed
 */
export const safeImagePicker = async (options = {}, source = 'library') => {
  try {
    const permissionType = source === 'camera' ? PERMISSION_TYPES.CAMERA : PERMISSION_TYPES.MEDIA_LIBRARY;
    
    // Ensure permission is granted (no-op for media library on Android)
    const hasPermission = await ensurePermission(permissionType);
    if (!hasPermission) {
      return null;
    }

    const defaultOptions = {
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
      ...options
    };

    // Android 13+ (API 33+) uses the native Photo Picker via intent without permissions
    if (Platform.OS === 'android') {
      const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;
      if (apiLevel >= 33 && source !== 'camera') {
        try {
          const { startActivityAsync } = await import('expo-intent-launcher');
          const result = await startActivityAsync('android.provider.action.PICK_IMAGES', {
            type: 'image/*',
            extra: { 'android.provider.extra.PICK_IMAGES_MAX': 1 },
          });
          if (!result || result.resultCode === 0 || !result.data) {
            return null;
          }
          return {
            uri: result.data,
            type: 'image/*',
            name: `image_${Date.now()}.jpg`,
          };
        } catch (e) {
          console.warn('Android Photo Picker unavailable, falling back to DocumentPicker:', e?.message);
        }
      }
    }

    let result;
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync(defaultOptions);
    } else if (Platform.OS === 'android') {
      // Use DocumentPicker on Android when Photo Picker is unavailable (pre-API 33)
      const doc = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (!doc.canceled && doc.assets && doc.assets[0]) {
        const asset = doc.assets[0];
        return {
          uri: asset.uri,
          type: asset.mimeType || 'image/*',
          name: asset.name || `image_${Date.now()}.jpg`,
          size: asset.size || 0,
        };
      }
      return null;
    } else {
      result = await ImagePicker.launchImageLibraryAsync(defaultOptions);
    }

    if (!result?.canceled && Array.isArray(result.assets) && result.assets.length > 0) {
      const asset = result.assets[0];
      const imageFile = {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `image_${Date.now()}.jpg`,
        size: asset.fileSize || 0,
      };
      return imageFile;
    }
    return null;
  } catch (error) {
    console.error(`Error picking image from ${source}:`, error);
    Alert.alert(
      'Image Selection Error',
      `Failed to select image from ${source}. Please try again.`,
      [{ text: 'OK' }]
    );
    return null;
  }
};

/**
 * Safe wrapper for DocumentPicker with permission handling
 */
export const safeDocumentPicker = async (onDocumentSelected, options = {}, onError = null) => {
  try {
    // Note: DocumentPicker doesn't require explicit permissions on modern Android (API 30+) and iOS
    // The system handles permissions automatically through the document picker interface

    const defaultOptions = {
      type: '*/*',
      copyToCacheDirectory: true,
      ...options
    };

    const result = await DocumentPicker.getDocumentAsync(defaultOptions);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const document = result.assets[0];
      
      // Create a file object similar to ImagePicker format
      const fileObject = {
        uri: document.uri,
        name: document.name,
        type: document.mimeType || 'application/octet-stream',
        size: document.size
      };

      try {
        onDocumentSelected(fileObject);
      } catch (callbackError) {
        console.error('Document selection callback error:', callbackError);
        if (onError) {
          onError(callbackError);
        } else {
          handleFileUploadError(callbackError, 'document');
        }
      }
    }
  } catch (error) {
    console.error('Document picker error:', error);
    
    if (error.message && error.message.toLowerCase().includes('permission')) {
      const permissionError = createPermissionError('documents', error.message);
      if (onError) {
        onError(permissionError);
      } else {
        handlePermissionError(permissionError, 'Document selection');
      }
    } else {
      if (onError) {
        onError(error);
      } else {
        handleFileUploadError(error, 'document');
      }
    }
  }
};

/**
 * Check all required permissions for the app
 * @returns {Promise<Object>} - Object with permission status for each type
 */
export const checkAllPermissions = async () => {
  const permissions = {};
  
  for (const type of Object.values(PERMISSION_TYPES)) {
    if (type !== PERMISSION_TYPES.DOCUMENTS) { // Documents don't have a specific permission check
      permissions[type] = await checkPermission(type);
    }
  }
  
  return permissions;
};

/**
 * Request all required permissions for the app
 * @returns {Promise<Object>} - Object with permission status for each type
 */
export const requestAllPermissions = async () => {
  const permissions = {};
  
  for (const type of Object.values(PERMISSION_TYPES)) {
    if (type !== PERMISSION_TYPES.DOCUMENTS) { // Documents don't have a specific permission check
      permissions[type] = await requestPermission(type);
    }
  }
  
  return permissions;
};

/**
 * Show image picker options (camera or gallery)
 * @param {Function} onImageSelected - Callback when image is selected
 * @param {Object} imagePickerOptions - Options for image picker
 * @param {string} preferredSource - Optional preferred source ('camera' or 'gallery')
 */
export const showImagePickerOptions = (onImageSelected, imagePickerOptions = {}, preferredSource = null) => {
  const defaultOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    ...imagePickerOptions
  };

  const handleError = (error, source) => {
    console.error(`Image picker error (${source}):`, error);
    
    if (error.message && error.message.toLowerCase().includes('permission')) {
      const permissionType = source === 'camera' ? 'camera' : 'media_library';
      handlePermissionError(createPermissionError(permissionType), 'Image selection');
    } else {
      handleFileUploadError(error, 'image');
    }
  };

  const safeOnImageSelected = (imageFile) => {
    try {
      onImageSelected(imageFile);
    } catch (error) {
      handleFileUploadError(error, 'image');
    }
  };

  const launchCamera = async () => {
    try {
      const image = await safeImagePicker(defaultOptions, 'camera');
      if (image) {
        safeOnImageSelected(image);
      }
    } catch (error) {
      handleError(error, 'camera');
    }
  };

  const launchGallery = async () => {
    try {
      const image = await safeImagePicker(defaultOptions, 'library');
      if (image) {
        safeOnImageSelected(image);
      }
    } catch (error) {
      handleError(error, 'gallery');
    }
  };

  if (preferredSource === 'camera') {
    launchCamera();
  } else if (preferredSource === 'gallery') {
    launchGallery();
  } else {
    // Show options to choose between camera and gallery
    Alert.alert(
      'Select Image',
      'Choose an option to select an image',
      [
        { text: 'Camera', onPress: launchCamera },
        { text: 'Gallery', onPress: launchGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }
};

export default {
  PERMISSION_TYPES,
  PERMISSION_STATUS,
  checkPermission,
  requestPermission,
  ensurePermission,
  showPermissionDeniedAlert,
  safeImagePicker,
  safeDocumentPicker,
  checkAllPermissions,
  requestAllPermissions,
  showImagePickerOptions
};