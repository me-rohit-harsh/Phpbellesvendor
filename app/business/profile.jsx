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
} from 'react-native';
import CustomAlert from '../components/CustomAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCompleteProfile, updateCompleteProfile } from '../../lib/api/vendor';
import { logout } from '../../lib/api/auth';
import { showImagePickerOptions } from '../../lib/utils/permissions';


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
    businessName: 'Gourmet Kitchen',
    ownerName: 'John Doe',
    email: 'john@gourmetkitchen.com',
    phone: '8176990986',
    address: '123 Food Street, Culinary District',
    description: 'Authentic Indian cuisine with modern twist. Fresh ingredients, traditional recipes.',
    cuisineType: 'Indian',
    openTime: '09:00',
    closeTime: '22:00',
    deliveryRadius: '5',
    minimumOrder: '200',
    deliveryFee: '30',
    profileImage: null,
    coverImage: null,
    // Basic Service Options
    isVegetarian: false,
    hasDelivery: true,
    hasTakeaway: true,
    acceptsOnlinePayment: true,
    // Additional Service Options
    hasDineIn: true,
    hasOutdoorSeating: false,
    hasParking: true,
    hasWiFi: true,
    hasAirConditioning: true,
    hasLiveMusic: false,
    hasKidsArea: false,
    hasPetFriendly: false,
    hasWheelchairAccess: true,
    hasValet: false,
    hasBuffet: false,
    hasBarService: false,
    hasCateringService: true,
    hasPrivateDining: false,
    acceptsCash: true,
    acceptsCards: true,
    acceptsUPI: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await getCompleteProfile();
      
      if (response.data && response.data.success) {
        const profileInfo = response.data.data;
        
        // Map API response to local state structure
        setProfileData(prev => ({
          ...prev,
          businessName: profileInfo.restaurant_name || prev.businessName,
          ownerName: profileInfo.name || prev.ownerName,
          email: profileInfo.email || prev.email,
          phone: profileInfo.phone || prev.phone,
          address: profileInfo.address || prev.address,
          description: profileInfo.description || prev.description,
          cuisineType: profileInfo.cuisine_type || prev.cuisineType,
          openTime: profileInfo.open_time || prev.openTime,
          closeTime: profileInfo.close_time || prev.closeTime,
          deliveryRadius: profileInfo.delivery_radius || prev.deliveryRadius,
          minimumOrder: profileInfo.minimum_order || prev.minimumOrder,
          deliveryFee: profileInfo.delivery_fee || prev.deliveryFee,
          profileImage: profileInfo.profile_photo || prev.profileImage,
          coverImage: profileInfo.banner_image || prev.coverImage,
          // Service options
          isVegetarian: profileInfo.is_vegetarian || prev.isVegetarian,
          hasDelivery: profileInfo.has_delivery || prev.hasDelivery,
          hasTakeaway: profileInfo.has_takeaway || prev.hasTakeaway,
          acceptsOnlinePayment: profileInfo.accepts_online_payment || prev.acceptsOnlinePayment,
          hasDineIn: profileInfo.has_dine_in || prev.hasDineIn,
          hasOutdoorSeating: profileInfo.has_outdoor_seating || prev.hasOutdoorSeating,
          hasParking: profileInfo.has_parking || prev.hasParking,
          hasWiFi: profileInfo.has_wifi || prev.hasWiFi,
          hasAirConditioning: profileInfo.has_air_conditioning || prev.hasAirConditioning,
          hasLiveMusic: profileInfo.has_live_music || prev.hasLiveMusic,
          hasKidsArea: profileInfo.has_kids_area || prev.hasKidsArea,
          hasPetFriendly: profileInfo.has_pet_friendly || prev.hasPetFriendly,
          hasWheelchairAccess: profileInfo.has_wheelchair_access || prev.hasWheelchairAccess,
          hasValet: profileInfo.has_valet || prev.hasValet,
          hasBuffet: profileInfo.has_buffet || prev.hasBuffet,
          hasBarService: profileInfo.has_bar_service || prev.hasBarService,
          hasCateringService: profileInfo.has_catering_service || prev.hasCateringService,
          hasPrivateDining: profileInfo.has_private_dining || prev.hasPrivateDining,
          acceptsCash: profileInfo.accepts_cash || prev.acceptsCash,
          acceptsCards: profileInfo.accepts_cards || prev.acceptsCards,
          acceptsUPI: profileInfo.accepts_upi || prev.acceptsUPI,
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
      setIsLoading(true);
      
      // Map local state to API format
      const profileUpdateData = {
        restaurant_name: profileData.businessName,
        name: profileData.ownerName,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        description: profileData.description,
        cuisine_type: profileData.cuisineType,
        open_time: profileData.openTime,
        close_time: profileData.closeTime,
        delivery_radius: profileData.deliveryRadius,
        minimum_order: profileData.minimumOrder,
        delivery_fee: profileData.deliveryFee,
        profile_photo: profileData.profileImage,
        banner_image: profileData.coverImage,
        // Service options
        is_vegetarian: profileData.isVegetarian,
        has_delivery: profileData.hasDelivery,
        has_takeaway: profileData.hasTakeaway,
        accepts_online_payment: profileData.acceptsOnlinePayment,
        has_dine_in: profileData.hasDineIn,
        has_outdoor_seating: profileData.hasOutdoorSeating,
        has_parking: profileData.hasParking,
        has_wifi: profileData.hasWiFi,
        has_air_conditioning: profileData.hasAirConditioning,
        has_live_music: profileData.hasLiveMusic,
        has_kids_area: profileData.hasKidsArea,
        has_pet_friendly: profileData.hasPetFriendly,
        has_wheelchair_access: profileData.hasWheelchairAccess,
        has_valet: profileData.hasValet,
        has_buffet: profileData.hasBuffet,
        has_bar_service: profileData.hasBarService,
        has_catering_service: profileData.hasCateringService,
        has_private_dining: profileData.hasPrivateDining,
        accepts_cash: profileData.acceptsCash,
        accepts_cards: profileData.acceptsCards,
        accepts_upi: profileData.acceptsUPI,
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
      setAlertConfig({
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = (type) => {
    showImagePickerOptions(
      (imageFile) => {
        setProfileData(prev => ({
          ...prev,
          [type === 'profile' ? 'profileImage' : 'coverImage']: imageFile.uri
        }));
      },
      {
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      }
    );
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#020A66" />
          <Text style={styles.loadingText}>
            {isEditing ? 'Saving profile...' : 'Loading profile...'}
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

        {/* Basic Information */}
        <ProfileSection title="Basic Information">
          <InputField
            label="Business Name"
            value={profileData.businessName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, businessName: text }))}
            placeholder="Enter business name"
          />
          <InputField
            label="Owner Name"
            value={profileData.ownerName}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, ownerName: text }))}
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
          <InputField
            label="Cuisine Type"
            value={profileData.cuisineType}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, cuisineType: text }))}
            placeholder="e.g., Indian, Chinese, Italian"
          />
        </ProfileSection>

        {/* Operating Hours */}
        <ProfileSection title="Operating Hours">
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <InputField
                label="Opening Time"
                value={profileData.openTime}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, openTime: text }))}
                placeholder="09:00"
              />
            </View>
            <View style={styles.timeField}>
              <InputField
                label="Closing Time"
                value={profileData.closeTime}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, closeTime: text }))}
                placeholder="22:00"
              />
            </View>
          </View>
        </ProfileSection>

        {/* Delivery Settings */}
        <ProfileSection title="Delivery Settings">
          <InputField
            label="Delivery Radius (km)"
            value={profileData.deliveryRadius}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, deliveryRadius: text }))}
            placeholder="5"
            keyboardType="numeric"
          />
          <InputField
            label="Minimum Order (₹)"
            value={profileData.minimumOrder}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, minimumOrder: text }))}
            placeholder="200"
            keyboardType="numeric"
          />
          <InputField
            label="Delivery Fee (₹)"
            value={profileData.deliveryFee}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, deliveryFee: text }))}
            placeholder="30"
            keyboardType="numeric"
          />
        </ProfileSection>

        {/* Service Options */}
        <ProfileSection title="Service Options">
          <Text style={[styles.inputLabel, { fontSize: 16, marginBottom: 12, color: '#020A66' }]}>Dining Options</Text>
          <SwitchField
            label="Vegetarian Only"
            value={profileData.isVegetarian}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, isVegetarian: value }))}
          />
          <SwitchField
            label="Dine-In"
            value={profileData.hasDineIn}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasDineIn: value }))}
          />
          <SwitchField
            label="Home Delivery"
            value={profileData.hasDelivery}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasDelivery: value }))}
          />
          <SwitchField
            label="Takeaway"
            value={profileData.hasTakeaway}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasTakeaway: value }))}
          />
          <SwitchField
            label="Buffet Service"
            value={profileData.hasBuffet}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasBuffet: value }))}
          />
          <SwitchField
            label="Catering Service"
            value={profileData.hasCateringService}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasCateringService: value }))}
          />
          <SwitchField
            label="Private Dining"
            value={profileData.hasPrivateDining}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasPrivateDining: value }))}
          />
        </ProfileSection>

        {/* Facilities & Amenities */}
        <ProfileSection title="Facilities & Amenities">
          <SwitchField
            label="Outdoor Seating"
            value={profileData.hasOutdoorSeating}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasOutdoorSeating: value }))}
          />
          <SwitchField
            label="Parking Available"
            value={profileData.hasParking}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasParking: value }))}
          />
          <SwitchField
            label="Free WiFi"
            value={profileData.hasWiFi}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasWiFi: value }))}
          />
          <SwitchField
            label="Air Conditioning"
            value={profileData.hasAirConditioning}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasAirConditioning: value }))}
          />
          <SwitchField
            label="Live Music"
            value={profileData.hasLiveMusic}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasLiveMusic: value }))}
          />
          <SwitchField
            label="Kids Play Area"
            value={profileData.hasKidsArea}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasKidsArea: value }))}
          />
          <SwitchField
            label="Pet Friendly"
            value={profileData.hasPetFriendly}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasPetFriendly: value }))}
          />
          <SwitchField
            label="Wheelchair Accessible"
            value={profileData.hasWheelchairAccess}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasWheelchairAccess: value }))}
          />
          <SwitchField
            label="Valet Parking"
            value={profileData.hasValet}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasValet: value }))}
          />
          <SwitchField
            label="Bar Service"
            value={profileData.hasBarService}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, hasBarService: value }))}
          />
        </ProfileSection>

        {/* Payment Options */}
        <ProfileSection title="Payment Options">
          <SwitchField
            label="Cash Payments"
            value={profileData.acceptsCash}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, acceptsCash: value }))}
          />
          <SwitchField
            label="Card Payments"
            value={profileData.acceptsCards}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, acceptsCards: value }))}
          />
          <SwitchField
            label="UPI Payments"
            value={profileData.acceptsUPI}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, acceptsUPI: value }))}
          />
          <SwitchField
            label="Online Payment"
            value={profileData.acceptsOnlinePayment}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, acceptsOnlinePayment: value }))}
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
});

export default ProfileManagement;