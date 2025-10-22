import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showImagePickerOptions } from '../../lib/utils/permissions';
import api from '../../lib/api/api';

/**
 * Test Image Upload Component
 * Simple screen to test image upload functionality
 */
const TestImageUpload = () => {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const pickImage = () => {
    showImagePickerOptions(
      (imageFile) => {
        console.log('📸 Selected image for test upload:', imageFile);
        setSelectedImage(imageFile);
        setUploadResult(null); // Clear previous result
      },
      {
        allowsEditing: false,
        quality: 0.8,
      }
    );
  };

  const testUpload = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      console.log('🧪 Testing image upload with standard FormData method...');
      console.log('🧪 Image file object:', selectedImage);

      // Create FormData with standard file object structure
      const formData = new FormData();
      
      // Create the file object for FormData
      const fileObj = {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: selectedImage.name || 'test_image.jpg',
      };

      // Append the file to FormData
      formData.append('asset', fileObj);

      console.log('📦 FormData created with file object');
      console.log('📦 File object details:', fileObj);
      console.log('📦 FormData type:', typeof formData);
      console.log('📦 FormData has _parts:', Array.isArray(formData._parts));
      
      if (formData._parts) {
        console.log('📦 FormData _parts:', formData._parts);
      }

      // Make the API request to test endpoint
      console.log('📡 Sending request to /store-img...');
      const apiResponse = await api.post('/store-img', formData, {
        timeout: 60000,
      });

      console.log('✅ Upload test successful:', apiResponse.data);
      
      setUploadResult({
        success: true,
        message: 'Upload successful with standard FormData!',
        data: apiResponse.data,
      });

      Alert.alert(
        'Success!',
        'Image uploaded successfully using standard FormData method',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Upload test failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      setUploadResult({
        success: false,
        message: error.message || 'Upload failed',
        error: error.response?.data || error.message,
      });

      Alert.alert(
        'Upload Failed',
        `Error: ${error.message}\n\nCheck console for details`,
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test Image Upload</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧪 Upload Test</Text>
          <Text style={styles.instructionText}>
            This screen tests the basic image upload functionality using the /store-img endpoint with standard FormData.
          </Text>
          <Text style={styles.instructionText}>
            1. Select an image from your device
          </Text>
          <Text style={styles.instructionText}>
            2. Tap "Upload" to test the API
          </Text>
          <Text style={styles.instructionText}>
            3. Check the results below
          </Text>
        </View>

        {/* Image Picker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Image</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                <Text style={styles.placeholderText}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          {selectedImage && (
            <View style={styles.imageInfo}>
              <Text style={styles.imageInfoText}>📄 Name: {selectedImage.name || 'Unknown'}</Text>
              <Text style={styles.imageInfoText}>📐 Type: {selectedImage.type || 'Unknown'}</Text>
              <Text style={styles.imageInfoText}>📏 Size: {selectedImage.size ? `${(selectedImage.size / 1024).toFixed(2)} KB` : 'Unknown'}</Text>
              <Text style={styles.imageInfoText}>📍 URI: {selectedImage.uri.substring(0, 50)}...</Text>
            </View>
          )}
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, (!selectedImage || uploading) && styles.uploadButtonDisabled]}
          onPress={testUpload}
          disabled={!selectedImage || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>
                {selectedImage ? 'Upload to Test Endpoint' : 'Select Image First'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {uploadResult && (
          <View style={[styles.card, uploadResult.success ? styles.successCard : styles.errorCard]}>
            <View style={styles.resultHeader}>
              <Ionicons
                name={uploadResult.success ? 'checkmark-circle' : 'close-circle'}
                size={32}
                color={uploadResult.success ? '#10B981' : '#EF4444'}
              />
              <Text style={styles.resultTitle}>
                {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
              </Text>
            </View>
            <Text style={styles.resultMessage}>{uploadResult.message}</Text>
            
            {uploadResult.data && (
              <View style={styles.resultData}>
                <Text style={styles.resultDataTitle}>Response Data:</Text>
                <Text style={styles.resultDataText}>
                  {JSON.stringify(uploadResult.data, null, 2)}
                </Text>
              </View>
            )}
            
            {uploadResult.error && (
              <View style={styles.resultData}>
                <Text style={styles.resultDataTitle}>Error Details:</Text>
                <Text style={styles.resultDataText}>
                  {typeof uploadResult.error === 'string' 
                    ? uploadResult.error 
                    : JSON.stringify(uploadResult.error, null, 2)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Debug Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Debug Information</Text>
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>API Endpoint: /store-img</Text>
            <Text style={styles.debugText}>Method: POST</Text>
            <Text style={styles.debugText}>Content-Type: multipart/form-data (auto-detected)</Text>
            <Text style={styles.debugText}>Field Name: asset</Text>
            <Text style={styles.debugText}>Platform: {require('react-native').Platform.OS}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imageInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  imageInfoText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  resultData: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  resultDataTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  resultDataText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  debugInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default TestImageUpload;
