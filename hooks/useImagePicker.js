import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Intent launcher imported dynamically only on Android 13+ to avoid web/native shims issues

// Android Photo Picker is available on Android 13+ (API level 33)
const ANDROID_PHOTO_PICKER_API_LEVEL = 33;

/**
 * useImagePicker
 * - Android 13+ (API 33+): Uses Android Photo Picker via Intent.ACTION_PICK_IMAGES (no runtime permissions)
 * - iOS, Web, and older Android: Falls back to expo-image-picker
 *
 * Returns: { pickImage, imageUri, resetImage }
 * - pickImage: async function
 * - imageUri: string | null
 * - resetImage: function
 */
export default function useImagePicker() {
  const [imageUri, setImageUri] = useState(null);

  const resetImage = useCallback(() => {
    setImageUri(null);
  }, []);

  const pickImage = useCallback(async () => {
    try {
      // Android 13+ uses native Photo Picker (no permissions)
      const isAndroid = Platform.OS === 'android';
      const androidApiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;

      if (isAndroid && androidApiLevel >= ANDROID_PHOTO_PICKER_API_LEVEL) {
        // Dynamically import intent launcher to avoid issues on platforms without native module
        const { startActivityAsync } = await import('expo-intent-launcher');
        const result = await startActivityAsync('android.provider.action.PICK_IMAGES', {
          type: 'image/*',
          extra: { 'android.provider.extra.PICK_IMAGES_MAX': 1 },
        });

        // Treat Activity result codes defensively: 0 = canceled on Android
        if (result?.resultCode === 0) {
          return { canceled: true };
        }

        // Handle cancellation safely
        if (!result || !result.data) {
          // User canceled or no data returned
          return { canceled: true };
        }

        // result.data is a content URI (e.g., content://...)
        setImageUri(result.data);
        return { canceled: false, uri: result.data };
      }

      // Web: prefer window.showOpenFilePicker when available
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
        try {
          const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [
              {
                description: 'Images',
                accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
              },
            ],
          });
          const file = await handle.getFile();
          const url = URL.createObjectURL(file);
          setImageUri(url);
          return { canceled: false, uri: url };
        } catch (err) {
          // User canceled the file picker or unsupported environment
          return { canceled: true };
        }
      }

      // Fallback: iOS uses expo-image-picker; older Android uses DocumentPicker
      if (Platform.OS === 'android') {
        const doc = await (await import('expo-document-picker')).getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
        if (!doc.canceled && doc.assets && doc.assets.length > 0) {
          const uri = doc.assets[0]?.uri ?? null;
          if (!uri) {
            return { canceled: true };
          }
          setImageUri(uri);
          return { canceled: false, uri };
        }
        return { canceled: true };
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
          selectionLimit: 1,
        });
        if (result && !result.canceled && Array.isArray(result.assets) && result.assets.length > 0) {
          const uri = result.assets[0]?.uri ?? null;
          if (!uri) {
            return { canceled: true };
          }
          setImageUri(uri);
          return { canceled: false, uri };
        }
        return { canceled: true };
      }
    } catch (error) {
      // Graceful error handling to avoid crashes like ERR_NETWORK
      // Ensure we don't leave any native module in a bad state
      console.warn('Image picking failed:', error?.message || String(error));
      return { canceled: true, error };
    }
  }, []);

  return { pickImage, imageUri, resetImage };
}