import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import CustomAlert from '../CustomAlert';
import { verifyOTP, requestOTP, APIError, isValidationError, formatValidationErrors, getVendorStatus } from '../../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Step2OTPVerification = ({ formData, setFormData, onNext, onBack }) => {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(10);
  const [canResend, setCanResend] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle', 'verifying', 'success', 'error'
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const inputRefs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Note: Clipboard auto-fill removed due to Expo Go compatibility issues

  const validateOTP = (text) => {
    // Only allow digits and limit to 1 character
    const cleanText = text.replace(/[^0-9]/g, '');
    return cleanText.slice(0, 1);
  };

  const handleOtpChange = (value, index) => {
    const validatedValue = validateOTP(value);
    const newOtp = [...otp];
    newOtp[index] = validatedValue;
    setOtp(newOtp);

    // Auto focus next input
    if (validatedValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all 6 digits are entered
    if (validatedValue && index === 5) {
      const completeOtp = newOtp.join('');
      if (completeOtp.length === 6) {
        setTimeout(() => verifyOtp(completeOtp), 100);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newOtp = [...otp];
      if (newOtp[index]) {
        // Clear current field
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous field and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const verifyOtp = async (otpToVerify = null) => {
    const enteredOtp = otpToVerify || otp.join('');
    
    if (enteredOtp.length !== 6) {
      setAlertConfig({
        title: 'Incomplete OTP',
        message: 'Please enter all 6 digits of the OTP.',
        type: 'warning',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
      return;
    }
    
    setVerificationStatus('verifying');
    
    try {
      console.log('Verifying OTP:', enteredOtp);
      
      // Call API to verify OTP
      const response = await verifyOTP({
        phone: formData.phoneNumber,
        email: formData.email,
        otp: enteredOtp
      });
      
      console.log('OTP verification response:', response);
      
      // Check if the response indicates success
      if (response.success === false || response.error) {
        // API returned an error response
        throw new Error(response.message || response.error || 'Invalid OTP');
      }
      
      // Check if we have a valid token
      if (!response.token) {
        throw new Error('Invalid OTP. No authentication token received.');
      }
      
      // Store the token
      await AsyncStorage.setItem('auth_token', response.token);
      
      // Update form data with token
      setFormData({
        ...formData,
        authToken: response.token,
        otp: enteredOtp,
        isVerified: true
      });
      
      console.log('OTP verified successfully, checking vendor status...');
      
      // Check vendor status after successful verification
      try {
        const vendorStatusResponse = await getVendorStatus();
        
        if (vendorStatusResponse && vendorStatusResponse.status) {
          const { status, message } = vendorStatusResponse;
          
          // Route based on vendor status
          if (status === 'verified') {
            // User is verified, go to dashboard
            setAlertConfig({
              title: 'Welcome Back!',
              message: message || 'Redirecting to dashboard...',
              type: 'success',
              autoClose: true,
              autoCloseDelay: 1500,
              buttons: []
            });
            setShowAlert(true);
            
            setTimeout(() => {
              setShowAlert(false);
              router.replace('/vendor/dashboard');
            }, 1500);
            return;
          } else if (status === 'under_verification') {
            // User is under verification
            setAlertConfig({
              title: 'Account Under Review',
              message: message || 'Your application is being reviewed. Please wait for approval.',
              type: 'info',
              autoClose: true,
              autoCloseDelay: 2000,
              buttons: []
            });
            setShowAlert(true);
            
            setTimeout(() => {
              setShowAlert(false);
              router.replace('/vendor/under-verification');
            }, 2000);
            return;
          } else if (status === 'no_vendor') {
            // User needs to register as vendor, continue with registration flow
            console.log('User needs to register as vendor, continuing with registration flow');
          }
        }
      } catch (statusError) {
        console.log('Could not fetch vendor status, continuing with registration flow');
      }
      
      setVerificationStatus('success');
      setAlertConfig({
        title: 'Success!',
        message: 'OTP verified successfully!',
        type: 'success',
        autoClose: true,
        autoCloseDelay: 1500,
        buttons: []
      });
      setShowAlert(true);
      
      setTimeout(() => {
        setShowAlert(false);
        onNext();
      }, 1500);
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setVerificationStatus('error');
      
      // Shake animation for wrong OTP
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
      
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error instanceof APIError) {
        if (isValidationError(error)) {
          const validationErrors = formatValidationErrors(error.data);
          errorMessage = Object.values(validationErrors).join('\n');
        } else {
          errorMessage = error.message;
        }
      }
      
      setAlertConfig({
        title: 'Invalid OTP',
        message: errorMessage,
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => {
          setShowAlert(false);
          setVerificationStatus('idle');
          // Clear OTP inputs
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }}]
      });
      setShowAlert(true);
    }
  };

  const handleResendOTP = async () => {
    if (canResend) {
      try {
        // Show loading state
        setAlertConfig({
          title: 'Resending OTP',
          message: 'Please wait while we resend the OTP...',
          type: 'info',
          buttons: []
        });
        setShowAlert(true);
        
        // Call API to request new OTP
        const response = await requestOTP({
          phone: formData.phoneNumber,
          email: formData.email,
          role_id: "3"
        });
        
        // Reset timer
        setTimer(60);
        setCanResend(false);
        
        // Clear current OTP inputs
        setOtp(['', '', '', '', '', '']);
        setVerificationStatus('idle');
        inputRefs.current[0]?.focus();
        
        setAlertConfig({
          title: 'OTP Resent',
          message: 'A new OTP has been sent to your phone number and email address.',
          type: 'success',
          autoClose: true,
          autoCloseDelay: 2000,
          buttons: []
        });
        setShowAlert(true);
        
      } catch (error) {
        console.error('Resend OTP error:', error);
        
        let errorMessage = 'Failed to resend OTP. Please try again.';
        
        if (error instanceof APIError) {
          if (isValidationError(error)) {
            const validationErrors = formatValidationErrors(error.data);
            errorMessage = Object.values(validationErrors).join('\n');
          } else {
            errorMessage = error.message;
          }
        }
        
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error',
          buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
        });
        setShowAlert(true);
      }
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/blue-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* OTP Content */}
      <View style={styles.content}>
        <Text style={styles.title}>We have sent an OTP on</Text>
        <Text style={styles.phoneNumber}>{formData.phoneNumber}</Text>

        {/* OTP Input Boxes */}
        <Animated.View 
          style={[styles.otpContainer, { transform: [{ translateX: shakeAnim }] }]}
        >
          {otp.map((digit, index) => {
            let inputStyle = [styles.otpInput];
            
            if (digit) {
              inputStyle.push(styles.otpInputFilled);
            } else {
              inputStyle.push(styles.otpInputEmpty);
            }
            
            if (verificationStatus === 'success') {
              inputStyle.push(styles.otpInputSuccess);
            } else if (verificationStatus === 'error') {
              inputStyle.push(styles.otpInputError);
            } else if (verificationStatus === 'verifying') {
              inputStyle.push(styles.otpInputVerifying);
            }
            
            return (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={inputStyle}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                editable={verificationStatus !== 'verifying'}
              />
            );
          })}
        </Animated.View>

        {/* Resend Timer */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            Didn't get one? We can{' '}
            <Text 
              style={[
                styles.resendLink,
                canResend ? styles.resendLinkActive : styles.resendLinkInactive
              ]}
              onPress={handleResendOTP}
            >
              resend it in {timer} secs
            </Text>
          </Text>
        </View>
      </View>

      {verificationStatus === 'verifying' && (
        <View style={styles.verifyingContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
          <Text style={styles.verifyingText}>Verifying OTP...</Text>
        </View>
      )}
      
      {/* Verify Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.verifyButton,
            isOtpComplete ? styles.verifyButtonActive : styles.verifyButtonInactive,
            verificationStatus === 'verifying' && styles.verifyButtonDisabled
          ]}
          onPress={() => verifyOtp()}
          disabled={!isOtpComplete || verificationStatus === 'verifying'}
        >
          <Text style={styles.verifyButtonText}>Verify Manually</Text>
        </TouchableOpacity>
      </View>
      
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        autoClose={alertConfig.autoClose}
        autoCloseDelay={alertConfig.autoCloseDelay}
        onDismiss={() => setShowAlert(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 0,
  },
  logo: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 20,
    fontFamily: 'MyFont-Bold',
    color: '#020A66',
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 18,
    fontFamily: 'MyFont-SemiBold',
    marginHorizontal: 4,
  },
  otpInputEmpty: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    color: '#374151',
  },
  otpInputFilled: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
  },
  otpInputSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    color: '#10B981',
  },
  otpInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
  },
  otpInputVerifying: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
    color: '#3B82F6',
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyingText: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#3B82F6',
    marginLeft: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  resendLink: {
    fontFamily: 'MyFont-Medium',
  },
  resendLinkActive: {
    color: '#4F46E5',
  },
  resendLinkInactive: {
    color: '#9CA3AF',
  },
  footer: {
    paddingBottom: 40,
  },
  verifyButton: {
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  verifyButtonActive: {
    backgroundColor: '#020A66',
  },
  verifyButtonInactive: {
    backgroundColor: '#9CA3AF',
  },
  verifyButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-SemiBold',
    color: '#fff',
  },
});

export default Step2OTPVerification;