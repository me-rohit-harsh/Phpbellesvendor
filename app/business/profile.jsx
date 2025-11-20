import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCompleteProfile, updateCompleteProfile, getFoodTypes, getVendorTypes } from '../../lib/api/vendor';
import { logout } from '../../lib/api/auth';
import { showImagePickerOptions } from '../../lib/utils/permissions';
import * as Location from 'expo-location';


const ProfileManagement = () => {
  const router = useRouter();
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    buttons: []
  });
  
  
  const [profileData, setProfileData] = useState({
    restaurant_name: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    house_number: '',
    floor: '',
    landmark: '',
    additional_instructions: '',
    latitude: null,
    longitude: null,
    description: '',
    vendor_type_id: null,
    vendor_type: '',
    food_types: [],
    open_time: '09:00',
    close_time: '22:00',
    profile_photo: null,
    banner_image: null,
    has_delivery: false,
    has_pickup: false,
  });

  const [vendorTypes, setVendorTypes] = useState([]);
  const [foodTypes, setFoodTypes] = useState([]);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState([]);
  const [showVendorTypeModal, setShowVendorTypeModal] = useState(false);
  const [showFoodTypeModal, setShowFoodTypeModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');

  // Fetch profile data and types on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // Fetch vendor types, food types, and profile data in parallel
      const [vendorTypesRes, foodTypesRes, profileRes] = await Promise.all([
        getVendorTypes(),
        getFoodTypes(),
        getCompleteProfile(),
      ]);

      if (vendorTypesRes?.data) {
        setVendorTypes(vendorTypesRes.data);
      }
      if (foodTypesRes?.data) {
        setFoodTypes(foodTypesRes.data);
      }

      if (profileRes?.data?.data) {
        const profile = profileRes.data.data;
        const foodTypeIds = profile.food_types?.map(ft => ft.id) || [];
        setSelectedFoodTypes(foodTypeIds);
        setProfileData(prev => ({
          ...prev,
          restaurant_name: profile.restaurant_name || '',
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          house_number: profile.house_number || '',
          floor: profile.floor || '',
          landmark: profile.landmark || '',
          additional_instructions: profile.additional_instructions || '',
          latitude: profile.latitude || null,
          longitude: profile.longitude || null,
          description: profile.description || '',
          vendor_type_id: profile.vendor_type_id || null,
          vendor_type: profile.vendor_type || '',
          open_time: profile.open_time || '09:00',
          close_time: profile.close_time || '22:00',
          profile_photo: profile.profile_photo || null,
          banner_image: profile.banner_image || null,
          has_delivery: profile.has_delivery !== false,
          has_pickup: profile.has_pickup !== false,
        }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Failed to load profile data. Please try again.',
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await getCompleteProfile();
      
      if (response.data && response.data.success) {
        const profileInfo = response.data.data;
        const foodTypeIds = profileInfo.food_types?.map(ft => ft.id) || [];
        setSelectedFoodTypes(foodTypeIds);
        setProfileData(prev => ({
          ...prev,
          restaurant_name: profileInfo.restaurant_name || '',
          name: profileInfo.name || '',
          email: profileInfo.email || '',
          phone: profileInfo.phone || '',
          address: profileInfo.address || '',
          house_number: profileInfo.house_number || '',
          floor: profileInfo.floor || '',
          landmark: profileInfo.landmark || '',
          additional_instructions: profileInfo.additional_instructions || '',
          latitude: profileInfo.latitude || null,
          longitude: profileInfo.longitude || null,
          description: profileInfo.description || '',
          vendor_type_id: profileInfo.vendor_type_id,
          vendor_type: profileInfo.vendor_type || '',
          open_time: profileInfo.open_time || '09:00',
          close_time: profileInfo.close_time || '22:00',
          profile_photo: profileInfo.profile_photo,
          banner_image: profileInfo.banner_image,
          has_delivery: profileInfo.has_delivery || false,
          has_pickup: profileInfo.has_pickup || false,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Failed to load profile data. Please try again.',
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showSuccessMessage = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const handleSave = async () => {
    try {
      if (!profileData.restaurant_name.trim()) {
        showErrorAlert('Validation Error', 'Restaurant name is required.');
        return;
      }
      if (!profileData.name.trim()) {
        showErrorAlert('Validation Error', 'Owner name is required.');
        return;
      }
      if (!profileData.vendor_type_id) {
        showErrorAlert('Validation Error', 'Please select a vendor type.');
        return;
      }
      if (selectedFoodTypes.length === 0) {
        showErrorAlert('Validation Error', 'Please select at least one food type.');
        return;
      }

      setIsSaving(true);
      
      const profileUpdateData = {
        restaurant_name: profileData.restaurant_name,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        house_number: profileData.house_number,
        floor: profileData.floor,
        landmark: profileData.landmark,
        additional_instructions: profileData.additional_instructions,
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        description: profileData.description,
        vendor_type_id: profileData.vendor_type_id,
        food_types: selectedFoodTypes,
        open_time: profileData.open_time,
        close_time: profileData.close_time,
        has_delivery: profileData.has_delivery,
        has_pickup: profileData.has_pickup,
      };

      const response = await updateCompleteProfile(profileUpdateData);
      
      if (response.data && response.data.success) {
        showSuccessMessage('Success', 'Profile updated successfully!');
        setIsEditing(false);
      } else {
        throw new Error(response.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorAlert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const showErrorAlert = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const pickImage = (type) => {
    showImagePickerOptions(
      (imageFile) => {
        setProfileData(prev => ({
          ...prev,
          [type === 'profile' ? 'profile_photo' : 'banner_image']: imageFile.uri
        }));
      },
      {
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      }
    );
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showErrorAlert('Permission Denied', 'Location permission is required to get current location.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressResponse && addressResponse.length > 0) {
        const addr = addressResponse[0];
        const formatted = [addr.name, addr.street, addr.city, addr.region].filter(Boolean).join(', ');
        setProfileData(prev => ({ ...prev, address: formatted, latitude, longitude }));
        if (addr.city) setCity(addr.city);
        if (addr.region) setStateName(addr.region);
        if (addr.postalCode) setPincode(addr.postalCode);
        showSuccessMessage('Location Set', 'Your location has been updated from current position.');
      }
    } catch (e) {
      console.error('Error getting location:', e);
      showErrorAlert('Error', 'Unable to get current location.');
    }
  };

  const ProfileSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={isEditing}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const SwitchField = ({ label, value, onValueChange }) => (
    <View style={styles.switchGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={!isEditing}
        trackColor={{ false: '#E5E7EB', true: '#020A66' }}
        thumbColor={value ? '#FFFFFF' : '#9CA3AF'}
      />
    </View>
  );

  const SelectField = ({ label, value, placeholder, onPress, editable = true }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectInput, !editable && styles.disabledInput]}
        onPress={onPress}
        disabled={!editable}
      >
        <Text style={[styles.selectInputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#020A66" />
      </TouchableOpacity>
    </View>
  );

  const MultiSelectField = ({ label, selectedIds, items, onPress, editable = true }) => {
    const selectedNames = items
      .filter(item => selectedIds.includes(item.id))
      .map(item => item.name)
      .join(', ');

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.input, styles.selectInput, !editable && styles.disabledInput]}
          onPress={onPress}
          disabled={!editable}
        >
          <Text style={[styles.selectInputText, !selectedNames && styles.placeholderText]}>
            {selectedNames || 'Select food types'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#020A66" />
        </TouchableOpacity>
      </View>
    );
  };

  const TimeField = ({ label, value, onChangeText, editable = true }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.disabledInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder="HH:MM"
        editable={editable}
        keyboardType="numeric"
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading/Saving Overlay */}
      {(isLoading || isSaving) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#020A66" />
          <Text style={styles.loadingText}>
            {isSaving ? 'Saving profile...' : 'Loading profile...'}
          </Text>
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#020A66" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <Ionicons 
            name={isEditing ? 'checkmark' : 'pencil'} 
            size={20} 
            color={isEditing ? '#10B981' : '#020A66'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <TouchableOpacity 
            style={styles.coverImageWrapper}
            onPress={() => isEditing && pickImage('cover')}
            disabled={!isEditing}
          >
            {profileData.coverImage ? (
              <Image source={{ uri: profileData.coverImage }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                <Text style={styles.coverImageText}>Cover Photo</Text>
              </View>
            )}
            {isEditing && (
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity 
            style={styles.profileImageWrapper}
            onPress={() => isEditing && pickImage('profile')}
            disabled={!isEditing}
          >
            {profileData.profileImage ? (
              <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="restaurant" size={30} color="#9CA3AF" />
              </View>
            )}
            {isEditing && (
              <View style={styles.profileImageOverlay}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Business Information */}
        <ProfileSection title="Business Information">
          <InputField
            label="Restaurant Name"
            value={profileData.restaurant_name}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, restaurant_name: text }))}
            placeholder="Enter restaurant name"
          />
          <InputField
            label="Owner Name"
            value={profileData.name}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
            placeholder="Enter owner name"
          />
          <InputField
            label="Email"
            value={profileData.email}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
            placeholder="Enter email address"
            keyboardType="email-address"
          />
          <InputField
            label="Phone"
            value={profileData.phone}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
          <InputField
            label="Address"
            value={profileData.address}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, address: text }))}
            placeholder="Enter business address"
            multiline
          />
          <InputField
            label="Description"
            value={profileData.description}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your business"
            multiline
          />
        </ProfileSection>

        {/* Address Details */}
        <ProfileSection title="Address Details">
          <InputField
            label="Full Address"
            value={profileData.address}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, address: text }))}
            placeholder="Enter complete business address"
            multiline
          />
          <InputField
            label="House / Building Number"
            value={profileData.house_number}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, house_number: text }))}
            placeholder="e.g., 123, Building A"
          />
          <InputField
            label="Floor / Unit"
            value={profileData.floor}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, floor: text }))}
            placeholder="e.g., Ground Floor, Unit 5"
          />
          <InputField
            label="Landmark (Optional)"
            value={profileData.landmark}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, landmark: text }))}
            placeholder="e.g., Near City Center, Opposite Park"
          />
          <InputField
            label="Additional Instructions (Optional)"
            value={profileData.additional_instructions}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, additional_instructions: text }))}
            placeholder="e.g., Use side entrance, Ring bell twice"
            multiline
          />
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <InputField
                label="Pincode"
                value={pincode}
                onChangeText={setPincode}
                placeholder="000000"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.timeField}>
              <InputField
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="Enter city"
              />
            </View>
          </View>
          <InputField
            label="State"
            value={stateName}
            onChangeText={setStateName}
            placeholder="Enter state"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={getCurrentLocation}>
            <Ionicons name="locate" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Use Current Location</Text>
          </TouchableOpacity>
        </ProfileSection>

        {/* Business Type */}
        <ProfileSection title="Restaurant Type">
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vendor Type (Select One)*</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectInput, !isEditing && styles.disabledInput]}
              disabled={!isEditing}
              onPress={() => isEditing && setShowVendorTypeModal(true)}
            >
              <Text style={[styles.selectInputText, !profileData.vendor_type && styles.placeholderText]}>
                {profileData.vendor_type || 'Select vendor type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#020A66" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Food Types (Select Multiple)*</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectInput, { minHeight: 50 }, !isEditing && styles.disabledInput]}
              disabled={!isEditing}
              onPress={() => isEditing && setShowFoodTypeModal(true)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectInputText, selectedFoodTypes.length === 0 && styles.placeholderText, { marginBottom: 4 }]}>
                  {selectedFoodTypes.length > 0 ? `${selectedFoodTypes.length} selected` : 'Select food types'}
                </Text>
                {selectedFoodTypes.length > 0 && (
                  <View style={styles.selectedFoodTypes}>
                    {foodTypes
                      .filter(ft => selectedFoodTypes.includes(ft.id))
                      .map(ft => (
                        <View key={ft.id} style={styles.foodTypeTag}>
                          <Text style={styles.foodTypeTagText}>{ft.name}</Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#020A66" />
            </TouchableOpacity>
          </View>
        </ProfileSection>

        {/* Operating Hours */}
        <ProfileSection title="Operating Hours">
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <InputField
                label="Opening Time"
                value={profileData.open_time}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, open_time: text }))}
                placeholder="09:00"
              />
            </View>
            <View style={styles.timeField}>
              <InputField
                label="Closing Time"
                value={profileData.close_time}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, close_time: text }))}
                placeholder="22:00"
              />
            </View>
          </View>
        </ProfileSection>

        {/* Service Options */}
        <ProfileSection title="Service Options">
          <SwitchField
            label="Home Delivery"
            value={profileData.has_delivery}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, has_delivery: value }))}
          />
          <SwitchField
            label="Pickup Service"
            value={profileData.has_pickup}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, has_pickup: value }))}
          />
        </ProfileSection>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/vendor/wallet')}
          >
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Wallet & Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={() => {
              setAlertConfig({
                title: 'Confirm Logout',
                message: 'Are you sure you want to logout? You will need to login again to access your dashboard.',
                type: 'warning',
                buttons: [
                  { text: 'Cancel', onPress: () => setShowAlert(false) },
                  {
                    text: 'Logout',
                    onPress: async () => {
                      try {
                        console.info('🚪 Initiating logout...');
                        setShowAlert(false);
                        setIsLoading(true);
                        
                        // Use the logout API function
                        const result = await logout();
                        
                        console.info('✅ Logout complete:', result);
                        console.info('👉 Redirecting to registration screen...');
                        
                        // Small delay to ensure state is cleared
                        setTimeout(() => {
                          router.replace('/vendor/register');
                        }, 100);
                      } catch (error) {
                        console.error('❌ Error during logout:', error);
                        
                        // Logout function now always returns success
                        // Still navigate to registration even if there's an error
                        console.info('👉 Redirecting to registration screen after error...');
                        setTimeout(() => {
                          router.replace('/vendor/register');
                        }, 100);
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }
                ]
              });
              setShowAlert(true);
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.dangerButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Vendor Type Selection Modal */}
      <Modal
        visible={showVendorTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVendorTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vendor Type</Text>
              <TouchableOpacity onPress={() => setShowVendorTypeModal(false)}>
                <Ionicons name="close" size={24} color="#020A66" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={vendorTypes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    profileData.vendor_type_id === item.id && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setProfileData(prev => ({
                      ...prev,
                      vendor_type_id: item.id,
                      vendor_type: item.name
                    }));
                    setShowVendorTypeModal(false);
                  }}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionText}>{item.name}</Text>
                    {profileData.vendor_type_id === item.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#020A66" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Food Types Selection Modal */}
      <Modal
        visible={showFoodTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFoodTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Food Types</Text>
              <TouchableOpacity onPress={() => setShowFoodTypeModal(false)}>
                <Ionicons name="close" size={24} color="#020A66" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={foodTypes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedFoodTypes.includes(item.id) && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedFoodTypes(prev => {
                      if (prev.includes(item.id)) {
                        return prev.filter(id => id !== item.id);
                      } else {
                        return [...prev, item.id];
                      }
                    });
                  }}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionText}>{item.name}</Text>
                    {selectedFoodTypes.includes(item.id) && (
                      <Ionicons name="checkmark-circle" size={24} color="#020A66" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 30, 
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
  },
  editButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  coverImageContainer: {
    height: 200,
    backgroundColor: '#FFFFFF',
  },
  coverImageWrapper: {
    flex: 1,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  coverImageText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'MyFont-Medium',
    marginTop: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  timeField: {
    flex: 1,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#FFFFFF',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#EF4444',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#020A66',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 12,
  },
  selectInputText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
  },
  modalOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionSelected: {
    backgroundColor: '#F0F3FF',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#1F2937',
    flex: 1,
  },
  selectedFoodTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foodTypeTag: {
    backgroundColor: '#020A66',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  foodTypeTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'MyFont-Medium',
  },
});

export default ProfileManagement;