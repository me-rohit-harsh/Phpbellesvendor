import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../CustomAlert';

const Step7Confirmation = ({ onNext, onBack, formData, setFormData }) => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', buttons: [] });
  const handleSubmit = () => {
    setAlertConfig({
      title: 'Confirm Submission',
      message: 'Are you sure you want to submit your application? You won\'t be able to edit the information after submission.',
      type: 'warning',
      buttons: [
        {
          text: 'Cancel',
          onPress: () => setShowAlert(false),
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: () => {
            setShowAlert(false);
            // Here you would typically send the data to your backend
            console.log('Submitting form data:', formData);
            onNext();
          },
        },
      ]
    });
    setShowAlert(true);
  };

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color="#4A5FFF" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
    </View>
  );

  const FileRow = ({ label, file, icon }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color="#4A5FFF" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>
        {file ? file.name || 'File uploaded' : 'Not uploaded'}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirm your Submission</Text>
        <Text style={styles.subtitle}>
          Please review all the information before submitting your application.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <InfoRow 
            label="Full Name" 
            value={formData.fullName} 
            icon="person-outline" 
          />
          <InfoRow 
            label="Phone Number" 
            value={formData.phoneNumber} 
            icon="call-outline" 
          />
          <InfoRow 
            label="Email" 
            value={formData.email} 
            icon="mail-outline" 
          />
          <FileRow 
            label="ID Proof" 
            file={formData.idProof} 
            icon="document-outline" 
          />
          <FileRow 
            label="Profile Photo" 
            file={formData.profilePhoto} 
            icon="camera-outline" 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Details</Text>
          <InfoRow 
            label="Restaurant Name" 
            value={formData.restaurantName} 
            icon="storefront-outline" 
          />
          <InfoRow 
            label="Cuisine Types" 
            value={formData.selectedCuisines?.join(', ')} 
            icon="restaurant-outline" 
          />
          <InfoRow 
            label="Vendor Type" 
            value={formData.vendorType} 
            icon="business-outline" 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Documents</Text>
          <InfoRow 
            label="GST Number" 
            value={formData.gstNumber} 
            icon="receipt-outline" 
          />
          <InfoRow 
            label="FSSAI License" 
            value={formData.fssaiLicense} 
            icon="shield-checkmark-outline" 
          />
          <FileRow 
            label="GST Certificate" 
            file={formData.gstDocument} 
            icon="document-text-outline" 
          />
          <FileRow 
            label="FSSAI Document" 
            file={formData.fssaiDocument} 
            icon="document-text-outline" 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <InfoRow 
            label="Restaurant Address" 
            value={formData.address} 
            icon="location-outline" 
          />
          <InfoRow 
            label="Landmark" 
            value={formData.landmark} 
            icon="flag-outline" 
          />
          <InfoRow 
            label="City" 
            value={formData.city} 
            icon="business-outline" 
          />
          <InfoRow 
            label="State" 
            value={formData.state} 
            icon="map-outline" 
          />
          <InfoRow 
            label="Pincode" 
            value={formData.pincode} 
            icon="pin-outline" 
          />
        </View>

        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#FF6B35" />
          <Text style={styles.noteText}>
            Once submitted, you won't be able to edit this information. 
            Please ensure all details are correct.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
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
  title: {
    fontSize: 24,
    fontFamily: "MyFont-Bold",
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    fontFamily: "MyFont-Medium",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "MyFont-Bold",
    color: '#333',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    fontFamily: "MyFont-SemiBold",
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    fontFamily: "MyFont-SemiBold",
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: "MyFont-SemiBold",
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 14,
    color: '#FF6B35',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    fontFamily: "MyFont-SemiBold",
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
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#020A66',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Step7Confirmation;