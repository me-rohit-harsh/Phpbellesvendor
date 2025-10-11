import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import ProgressBar from '../components/ProgressBar';
import Step1PhoneEmail from '../components/vendor/Step1PhoneEmail';
import Step2OTPVerification from '../components/vendor/Step2OTPVerification';
import Step3ProfileSetup from '../components/vendor/Step3ProfileSetup';
import Step4RestaurantDetails from '../components/vendor/Step4RestaurantDetails';
import Step5GSTFSSAIDetails from '../components/vendor/Step5GSTFSSAIDetails';
import Step6LocationDetails from '../components/vendor/Step6LocationDetails';
import Step7Confirmation from '../components/vendor/Step7Confirmation';
import Step8Success from '../components/vendor/Step8Success';
import PersistentStorage from '../../lib/storage/persistentStorage';
import { ToastManager } from '../components/NotificationToast';

const VendorRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [recoveryData, setRecoveryData] = useState(null);

  const totalSteps = 8;

  useEffect(() => {
    checkForRecoverableData();
  }, []);

  const checkForRecoverableData = async () => {
    try {
      const data = await PersistentStorage.checkRecoverableData();
      if (data.canRecover) {
        setRecoveryData(data);
        
        // Show a more prominent notification with both restore and dismiss options
        ToastManager.show(
          'Previous registration data found. Would you like to restore it?',
          'warning',
          15000, // Show for 15 seconds to give user time to see it
          'Restore',
          () => handleDataRecovery(true)
        );
        
        // Also show a second notification with dismiss option
        setTimeout(() => {
          if (recoveryData) { // Only show if data hasn't been recovered yet
            ToastManager.show(
              'Tap here to start fresh (this will clear saved data)',
              'info',
              10000,
              'Start Fresh',
              () => handleDataRecovery(false)
            );
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking recoverable data:', error);
    }
  };

  const handleDataRecovery = async (shouldRecover) => {
    try {
      if (shouldRecover && recoveryData) {
        // Recover registration data
        const registrationData = await PersistentStorage.getRegistrationData();
        if (registrationData) {
          setFormData(registrationData.formData || {});
          setCurrentStep(registrationData.currentStep || 1);
          console.info('Restored to step:', registrationData.currentStep);
        }
        
        ToastManager.success('Previous data restored successfully');
        console.info('Data recovered successfully');
      } else {
        // Clear all saved data if user chooses not to recover
        await PersistentStorage.clearAllTempData();
        console.info('Saved data cleared');
      }
    } catch (error) {
      console.error('Error handling data recovery:', error);
      ToastManager.error('Failed to restore data');
    } finally {
      setRecoveryData(null);
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Save progress
      try {
        await PersistentStorage.saveData('progress', {
          currentStep: newStep,
          totalSteps,
          lastUpdated: Date.now()
        });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const handleBack = async () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      
      // Save progress
      try {
        await PersistentStorage.saveData('progress', {
          currentStep: newStep,
          totalSteps,
          lastUpdated: Date.now()
        });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PhoneEmail
            onNext={handleNext}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 2:
        return (
          <Step2OTPVerification
            onNext={handleNext}
            onBack={handleBack}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 3:
        return (
          <Step3ProfileSetup
            onNext={handleNext}
            onBack={handleBack}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 4:
        return (
          <Step4RestaurantDetails
            onNext={handleNext}
            onBack={handleBack}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 5:
        return (
          <Step5GSTFSSAIDetails
            onNext={handleNext}
            onBack={handleBack}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 6:
        return (
          <Step6LocationDetails
            onNext={handleNext}
            onBack={handleBack}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 7:
        return (
          <Step7Confirmation
            onNext={handleNext}
            onBack={handleBack}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 8:
        return <Step8Success />;
      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        <View style={styles.content}>
          {renderStep()}
        </View>
        

      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24, // Consistent padding
  },
});

export default VendorRegister;