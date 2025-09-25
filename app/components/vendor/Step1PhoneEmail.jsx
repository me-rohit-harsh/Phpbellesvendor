import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../CustomAlert';
import { requestOTP, APIError, isValidationError, formatValidationErrors, getVendorStatus } from '../../../lib/api';
import PersistentStorage from '../../../lib/storage/persistentStorage';

const Step1PhoneEmail = ({ formData, setFormData, onNext }) => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState(formData.phoneNumber || '');
  const [email, setEmail] = useState(formData.email || '');
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [isLoginMode, setIsLoginMode] = useState(false);

  // Helper functions for alerts
  const showErrorAlert = (message) => {
    setAlertConfig({
      title: 'Error',
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const showSuccessAlert = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const validatePhoneNumber = (text) => {
    // Only allow digits and limit to 10 characters
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length <= 10) {
      return cleanText;
    }
    return text.slice(0, -1);
  };

  const validateEmail = (text) => {
    // Basic email validation - allow common email characters
    const emailRegex = /^[a-zA-Z0-9@._-]*$/;
    return emailRegex.test(text);
  };

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      const currentData = {
        ...formData,
        phoneNumber,
        email
      };
      
      PersistentStorage.saveRegistrationData({
        formData: currentData,
        currentStep: 1,
        totalSteps: 8
      });
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(autoSave);
  }, [formData, phoneNumber, email]);

  const handlePhoneChange = (text) => {
    const validatedText = validatePhoneNumber(text);
    setPhoneNumber(validatedText);
  };

  const handleEmailChange = (text) => {
    if (validateEmail(text)) {
      setEmail(text);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      showErrorAlert('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!email || !isValidEmail(email)) {
      showErrorAlert('Please enter a valid email address');
      return;
    }
    
    try {
      // Show loading state
      setAlertConfig({
        title: 'Checking Account',
        message: 'Please wait while we verify your details...',
        type: 'info',
        buttons: []
      });
      setShowAlert(true);
      
      // First, try to request OTP (this will work for both new and existing users)
      const response = await requestOTP({
        phone: phoneNumber,
        email: email,
        role_id: "3"
      });
      
      // Store the phone and email temporarily
      await AsyncStorage.setItem('tempPhone', phoneNumber);
      await AsyncStorage.setItem('tempEmail', email);
      
      setFormData({
        ...formData,
        phoneNumber,
        email,
        isAuthorizedBusiness: true,
        isLoginMode: isLoginMode
      });
      
      setAlertConfig({
        title: 'OTP Sent',
        message: 'OTP has been sent to your phone number and email address.',
        type: 'success',
        autoClose: true,
        autoCloseDelay: 2000,
        buttons: []
      });
      setShowAlert(false);
      
      // Navigate to OTP screen
      setTimeout(() => {
        setShowAlert(false);
        onNext();
      }, 2000);
      
    } catch (error) {
      console.error('OTP request error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error instanceof APIError) {
        if (isValidationError(error)) {
          const validationErrors = formatValidationErrors(error.data);
          errorMessage = Object.values(validationErrors).join('\n');
        } else {
          errorMessage = error.message;
        }
      }
      
      showErrorAlert(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/blue-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Grow your food business</Text>
          <Text style={styles.subtitle}>with PHP Bell</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter Phone Number"
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your e-mail"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.sendButton,
              phoneNumber.length >= 10 ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendOTP}
            disabled={phoneNumber.length < 10}
          >
            <Text style={styles.sendButtonText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 80,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 24,
    fontFamily: 'MyFont-SemiBold',
    color: '#020A66',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: 'MyFont-SemiBold',
    color: '#020A66',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'MyFont-SemiBold',
    color: '#020A66',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#F9FAFB',
  },
  countryCode: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#374151',
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
  sendButton: {
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  sendButtonActive: {
    backgroundColor: '#020A66',
  },
  sendButtonInactive: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-SemiBold',
    color: '#fff',
  },
});

export default Step1PhoneEmail;