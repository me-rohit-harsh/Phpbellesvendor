import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import CustomAlert from '../CustomAlert';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const Step3ProfileSetup = ({ formData, setFormData, onNext, onBack }) => {
  const [fullName, setFullName] = useState(formData.fullName || '');
  const [idProof, setIdProof] = useState(formData.idProof || null);
  const [profilePhoto, setProfilePhoto] = useState(formData.profilePhoto || null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error', buttons: [] });

  const validateFullName = (text) => {
    // Only allow letters, spaces, and common name characters
    const nameRegex = /^[a-zA-Z\s.']*$/;
    return nameRegex.test(text);
  };

  const showErrorAlert = (message) => {
    setAlertConfig({
      title: 'Error',
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showSuccessAlert = (message) => {
    setAlertConfig({
      title: 'Success',
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showPermissionAlert = (title, message, onOpenSettings) => {
    setAlertConfig({
      title,
      message,
      type: 'warning',
      buttons: [
        { text: 'Cancel', onPress: () => setShowAlert(false), style: 'cancel' },
        { text: 'Open Settings', onPress: () => { setShowAlert(false); onOpenSettings(); } }
      ]
    });
    setShowAlert(true);
  };

  const showPhotoPickerAlert = (onCamera, onGallery) => {
    setAlertConfig({
      title: 'Select Photo',
      message: 'Choose how you want to add your profile photo',
      type: 'info',
      buttons: [
        { text: 'Camera', onPress: () => { setShowAlert(false); onCamera(); } },
        { text: 'Gallery', onPress: () => { setShowAlert(false); onGallery(); } },
        { text: 'Cancel', onPress: () => setShowAlert(false), style: 'cancel' }
      ]
    });
    setShowAlert(true);
  };

  const handleFullNameChange = (text) => {
    if (validateFullName(text)) {
      setFullName(text);
    }
  };

  const handleIdProofUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          setIdProof(file);
        } else {
          showErrorAlert('File size should be less than 5MB');
        }
      }
    } catch (error) {
      showErrorAlert('Failed to pick document');
    }
  };

  const handleProfilePhotoUpload = async () => {
    try {
      showPhotoPickerAlert(openCamera, openGallery);
    } catch (error) {
      showErrorAlert('Failed to open photo picker');
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        showPermissionAlert(
          'Permission Required',
          'Please allow access to your camera in Settings to take photos.',
          () => Linking.openSettings()
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        if (photo.uri) {
          setProfilePhoto(photo);
          showSuccessAlert('Profile photo captured successfully!');
        } else {
          showErrorAlert('Invalid photo captured. Please try again.');
        }
      }
    } catch (error) {
      console.log('Camera error:', error);
      showErrorAlert(`Failed to take photo: ${error.message || 'Unknown error'}`);
    }
  };

  const openGallery = async () => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        showPermissionAlert(
          'Permission Required',
          'Please allow access to your photo library in Settings to upload images.',
          () => Linking.openSettings()
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        if (photo.uri) {
          setProfilePhoto(photo);
          showSuccessAlert('Profile photo uploaded successfully!');
        } else {
          showErrorAlert('Invalid image selected. Please try again.');
        }
      }
    } catch (error) {
      console.log('Gallery error:', error);
      showErrorAlert(`Failed to pick image from gallery: ${error.message || 'Unknown error'}`);
    }
  };

  const handleNext = () => {
    if (!fullName.trim()) {
      showErrorAlert('Please enter your full name');
      return;
    }
    if (fullName.trim().length < 2) {
      showErrorAlert('Full name must be at least 2 characters long');
      return;
    }
    if (!idProof) {
      showErrorAlert('Please upload your ID proof');
      return;
    }

    setFormData({
      ...formData,
      fullName,
      idProof,
      profilePhoto
    });
    onNext();
  };

  const isFormValid = fullName.trim().length > 0 && idProof;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter your full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={handleFullNameChange}
            autoCapitalize="words"
          />
        </View>

        {/* ID Proof Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            ID Proof Upload{' '}
            <Text style={styles.labelSubtext}>(Aadhar/PAN/Driving license)</Text>
          </Text>
          <TouchableOpacity style={styles.uploadContainer} onPress={handleIdProofUpload}>
            <View style={styles.uploadContent}>
              <Ionicons name="cloud-upload-outline" size={32} color="#4F46E5" />
              <Text style={styles.uploadText}>Choose your file</Text>
              <Text style={styles.uploadSubtext}>PNG, PDF, JPG, Docx, up to 5 mb</Text>
            </View>
          </TouchableOpacity>
          {idProof && (
            <View style={styles.fileInfo}>
              <Ionicons name="document-outline" size={16} color="#10B981" />
              <Text style={styles.fileName}>{idProof.name}</Text>
            </View>
          )}
        </View>

        {/* Profile Photo Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Profile Photo{' '}
            <Text style={styles.labelSubtext}>(Optional)</Text>
          </Text>
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoUploadContainer} onPress={handleProfilePhotoUpload}>
              <View style={styles.photoUploadContent}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto.uri }} style={styles.profileImage} />
                ) : (
                  <View style={styles.addPhotoContent}>
                    <Ionicons name="camera" size={32} color="#4F46E5" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            {profilePhoto && (
              <TouchableOpacity 
                style={styles.removePhotoButton} 
                onPress={() => setProfilePhoto(null)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.nextButton,
            isFormValid ? styles.nextButtonActive : styles.nextButtonInactive
          ]}
          onPress={handleNext}
          disabled={!isFormValid}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
      
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
    marginBottom: 12,
  },
  labelSubtext: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#10B981',
    marginLeft: 6,
  },
  photoSection: {
    alignItems: 'flex-start',
  },
  photoUploadContainer: {
    width: 160,
    height: 120,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  photoUploadContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  addPhotoContent: {
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#4F46E5',
    marginTop: 4,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  removePhotoText: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#EF4444',
    marginLeft: 4,
  },
  footer: {
    paddingVertical: 40,
  },
  nextButton: {
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonActive: {
    backgroundColor: '#020A66',
  },
  nextButtonInactive: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-SemiBold',
    color: '#fff',
  },
});

export default Step3ProfileSetup;