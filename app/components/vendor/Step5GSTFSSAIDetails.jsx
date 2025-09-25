import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import CustomAlert from '../CustomAlert';
import { safeDocumentPicker } from '../../../lib/utils/permissions';
import PersistentStorage from '../../../lib/storage/persistentStorage';

const Step5GSTFSSAIDetails = ({ onNext, onBack, formData, setFormData }) => {
  const [gstNumber, setGstNumber] = useState(formData.gstNumber || '');
  const [fssaiLicense, setFssaiLicense] = useState(formData.fssaiLicense || '');
  const [gstDocument, setGstDocument] = useState(formData.gstDocument || null);
  const [fssaiDocument, setFssaiDocument] = useState(formData.fssaiDocument || null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      const currentData = {
        ...formData,
        gstNumber,
        fssaiLicense,
        gstDocument,
        fssaiDocument
      };
      
      PersistentStorage.saveRegistrationData({
        formData: currentData,
        currentStep: 5,
        totalSteps: 8
      });
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(autoSave);
  }, [formData, gstNumber, fssaiLicense, gstDocument, fssaiDocument]);

  // Helper function for alerts
  const showErrorAlert = (message) => {
    setAlertConfig({
      title: 'Error',
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const validateGSTNumber = (text) => {
    // GST format: 2 digits + 10 alphanumeric + 1 letter + 1 digit + 1 letter + 1 alphanumeric
    const gstRegex = /^[0-9]{2}[A-Z0-9]{10}[A-Z][0-9][A-Z][0-9A-Z]$/;
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanText.length <= 15) {
      return cleanText;
    }
    return text.slice(0, -1);
  };

  const validateFSSAINumber = (text) => {
    // FSSAI is 14 digits
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length <= 14) {
      return cleanText;
    }
    return text.slice(0, -1);
  };

  const validateGST = (text) => {
    // GST format: 15 characters alphanumeric (2 state code + 10 PAN + 1 entity + 1 Z + 1 checksum)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstRegex.test(text);
  };

  const handleGSTChange = (text) => {
    const validatedText = validateGSTNumber(text);
    setGstNumber(validatedText);
  };

  const validateFSSAI = (text) => {
    // FSSAI format: exactly 14 digits
    const fssaiRegex = /^[0-9]{14}$/;
    return fssaiRegex.test(text);
  };

  const handleFSSAIChange = (text) => {
    const validatedText = validateFSSAINumber(text);
    setFssaiLicense(validatedText);
  };

  const pickGSTDocument = () => {
    safeDocumentPicker(
      (file) => {
        if (file.size > 5 * 1024 * 1024) {
          showErrorAlert('File size should be less than 5MB');
          return;
        }
        setGstDocument(file);
      },
      {
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      },
      (error) => {
        showErrorAlert('Failed to pick document');
      }
    );
  };

  const pickFSSAIDocument = () => {
    safeDocumentPicker(
      (file) => {
        if (file.size > 5 * 1024 * 1024) {
          showErrorAlert('File size should be less than 5MB');
          return;
        }
        setFssaiDocument(file);
      },
      {
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      },
      (error) => {
        showErrorAlert('Failed to pick document');
      }
    );
  };

  const isValidGST = (gst) => {
    // Simple validation: 15 characters, alphanumeric
    return gst.length === 15 && /^[A-Z0-9]+$/.test(gst);
  };

  const isValidFSSAI = (fssai) => {
    return fssai.length === 14 && /^[0-9]+$/.test(fssai);
  };

  const handleNext = () => {
    if (!gstNumber.trim()) {
      showErrorAlert('Please enter GST Number');
      return;
    }
    if (!isValidGST(gstNumber)) {
      showErrorAlert('Please enter a valid GST Number (15 characters)');
      return;
    }
    // GST validation is less strict - just check length
     // if (!validateGST(gstNumber)) {
     //   showErrorAlert('Please enter a valid GST number format');
     //   return;
     // }
    if (!fssaiLicense.trim()) {
      showErrorAlert('Please enter FSSAI License Number');
      return;
    }
    if (!isValidFSSAI(fssaiLicense)) {
      showErrorAlert('Please enter a valid FSSAI License Number (14 digits)');
      return;
    }
    // Removed duplicate FSSAI validation
    // Temporarily made optional for testing
    // if (!gstDocument) {
    //   showErrorAlert('Please upload GST Certificate');
    //   return;
    // }
    // Temporarily made optional for testing
    // if (!fssaiDocument) {
    //   showErrorAlert('Please upload FSSAI License');
    //   return;
    // }

    setFormData({
      ...formData,
      gstNumber,
      fssaiLicense,
      gstDocument,
      fssaiDocument
    });
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.label}>GST Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter GST Number"
          value={gstNumber}
          onChangeText={handleGSTChange}
          placeholderTextColor="#999"
          autoCapitalize="characters"
          maxLength={15}
        />
        <Text style={styles.helperText}>Format: 22AAAAA0000A1Z5</Text>

        <Text style={styles.label}>GST Certificate</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickGSTDocument}>
          <View style={styles.uploadContent}>
            {gstDocument ? (
              <View style={styles.uploadedStatus}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.uploadedText}>GST Certificate uploaded</Text>
                <Text style={styles.uploadedFileName}>{gstDocument.name}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#4A5FFF" />
                <Text style={styles.uploadText}>Choose file to upload</Text>
                <Text style={styles.uploadSubtext}>Only PDF, PNG, JPG allowed</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>FSSAI License</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter FSSAI License Number"
          value={fssaiLicense}
          onChangeText={handleFSSAIChange}
          placeholderTextColor="#999"
          keyboardType="numeric"
          maxLength={14}
        />
        <Text style={styles.helperText}>14-digit FSSAI License Number</Text>

        <Text style={styles.label}>Shop License/Municipal Permit</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickFSSAIDocument}>
          <View style={styles.uploadContent}>
            {fssaiDocument ? (
              <View style={styles.uploadedStatus}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.uploadedText}>Shop License uploaded</Text>
                <Text style={styles.uploadedFileName}>{fssaiDocument.name}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#4A5FFF" />
                <Text style={styles.uploadText}>Choose file to upload</Text>
                <Text style={styles.uploadSubtext}>Only PDF, PNG, JPG allowed</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert */}
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
  label: {
    fontSize: 16,
    fontFamily: "MyFont-SemiBold",
    color: '#333',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: "MyFont-Normal",
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  uploadedStatus: {
    alignItems: 'center',
  },
  uploadedText: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadedFileName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  backButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#020A66',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#020A66',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: "MyFont-SemiBold",
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#020A66',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    fontFamily: "MyFont-SemiBold",
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Step5GSTFSSAIDetails;