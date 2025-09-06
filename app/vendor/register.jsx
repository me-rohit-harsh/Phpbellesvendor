import React, { useState } from 'react';
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

const VendorRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const totalSteps = 8;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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