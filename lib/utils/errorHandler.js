import { Alert, Linking } from 'react-native';

/**
 * Enhanced error handler for permission-related failures
 */
export class PermissionError extends Error {
  constructor(message, permissionType, canRetry = true) {
    super(message);
    this.name = 'PermissionError';
    this.permissionType = permissionType;
    this.canRetry = canRetry;
  }
}

/**
 * Handle permission-related errors with user-friendly messages and actions
 */
export const handlePermissionError = (error, context = '') => {
  console.error('Permission Error:', error);
  
  let title = 'Permission Required';
  let message = 'This feature requires permission to access your device.';
  let buttons = [{ text: 'OK', style: 'cancel' }];

  if (error instanceof PermissionError) {
    switch (error.permissionType) {
      case 'camera':
        title = 'Camera Permission Required';
        message = 'Please allow camera access to take photos. You can enable this in your device settings.';
        buttons = [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ];
        break;
        
      case 'media_library':
        title = 'Photo Library Permission Required';
        message = 'Please allow photo library access to select images. You can enable this in your device settings.';
        buttons = [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ];
        break;
        
      case 'documents':
        title = 'File Access Permission Required';
        message = 'Please allow file access to select documents. You can enable this in your device settings.';
        buttons = [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ];
        break;
        
      case 'location':
        title = 'Location Permission Required';
        message = 'Please allow location access for this feature. You can enable this in your device settings.';
        buttons = [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ];
        break;
        
      default:
        message = error.message;
    }
  } else if (error.message) {
    // Handle other permission-related error messages
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
      if (errorMsg.includes('camera')) {
        title = 'Camera Permission Denied';
        message = 'Camera permission was denied. Please enable it in Settings to take photos.';
      } else if (errorMsg.includes('photo') || errorMsg.includes('media') || errorMsg.includes('library')) {
        title = 'Photo Library Permission Denied';
        message = 'Photo library permission was denied. Please enable it in Settings to select images.';
      } else if (errorMsg.includes('file') || errorMsg.includes('document')) {
        title = 'File Access Permission Denied';
        message = 'File access permission was denied. Please enable it in Settings to select documents.';
      } else {
        message = 'Permission was denied. Please enable the required permissions in Settings.';
      }
      
      buttons = [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ];
    } else {
      message = error.message;
    }
  }

  // Add context if provided
  if (context) {
    message = `${context}: ${message}`;
  }

  Alert.alert(title, message, buttons);
};

/**
 * Handle file upload errors with specific messaging
 */
export const handleFileUploadError = (error, fileType = 'file') => {
  console.error('File Upload Error:', error);
  
  let title = 'Upload Failed';
  let message = `Failed to upload ${fileType}. Please try again.`;
  
  if (error.message) {
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('permission')) {
      return handlePermissionError(error, `${fileType} upload`);
    } else if (errorMsg.includes('size') || errorMsg.includes('large')) {
      title = 'File Too Large';
      message = `The selected ${fileType} is too large. Please choose a smaller file (max 5MB).`;
    } else if (errorMsg.includes('format') || errorMsg.includes('type')) {
      title = 'Invalid File Format';
      message = `The selected ${fileType} format is not supported. Please choose a valid file.`;
    } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
      title = 'Network Error';
      message = `Failed to upload ${fileType} due to network issues. Please check your connection and try again.`;
    } else if (errorMsg.includes('timeout')) {
      title = 'Upload Timeout';
      message = `${fileType} upload timed out. Please try again with a smaller file or better connection.`;
    } else {
      message = error.message;
    }
  }
  
  Alert.alert(title, message, [{ text: 'OK' }]);
};

/**
 * Handle general app errors with user-friendly messages
 */
export const handleAppError = (error, context = '') => {
  console.error('App Error:', error);
  
  // Check if it's a permission-related error first
  if (error.message && (
    error.message.toLowerCase().includes('permission') ||
    error.message.toLowerCase().includes('denied') ||
    error instanceof PermissionError
  )) {
    return handlePermissionError(error, context);
  }
  
  let title = 'Error';
  let message = 'An unexpected error occurred. Please try again.';
  
  if (error.message) {
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('network') || errorMsg.includes('connection')) {
      title = 'Network Error';
      message = 'Please check your internet connection and try again.';
    } else if (errorMsg.includes('timeout')) {
      title = 'Request Timeout';
      message = 'The request timed out. Please try again.';
    } else if (errorMsg.includes('server') || errorMsg.includes('500')) {
      title = 'Server Error';
      message = 'Server is temporarily unavailable. Please try again later.';
    } else if (errorMsg.includes('validation')) {
      title = 'Validation Error';
      message = 'Please check your input and try again.';
    } else {
      message = error.message;
    }
  }
  
  // Add context if provided
  if (context) {
    message = `${context}: ${message}`;
  }
  
  Alert.alert(title, message, [{ text: 'OK' }]);
};

/**
 * Create a permission error with specific type
 */
export const createPermissionError = (permissionType, customMessage = null) => {
  const messages = {
    camera: 'Camera permission is required to take photos',
    media_library: 'Photo library permission is required to select images',
    documents: 'File access permission is required to select documents',
    location: 'Location permission is required for this feature'
  };
  
  const message = customMessage || messages[permissionType] || 'Permission is required for this feature';
  return new PermissionError(message, permissionType);
};