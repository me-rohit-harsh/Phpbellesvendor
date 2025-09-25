import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../CustomAlert';
import { getVendorTypes, getFoodTypes } from '../../../lib/api/vendor';
import PersistentStorage from '../../../lib/storage/persistentStorage';

const Step4RestaurantDetails = ({ onNext, onBack, formData, setFormData }) => {
  const [restaurantName, setRestaurantName] = useState(formData.restaurantName || '');
  const [selectedCuisines, setSelectedCuisines] = useState(formData.selectedCuisines || []);
  const [vendorType, setVendorType] = useState(formData.vendorType || '');
  const [vendorTypeId, setVendorTypeId] = useState(formData.vendorTypeId || '');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error',
    buttons: []
  });

  // Dynamic data from API
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch vendor types and food types...');
        
        // Fetch vendor types and food types in parallel
        const [vendorTypesData, foodTypesData] = await Promise.all([
          getVendorTypes(),
          getFoodTypes()
        ]);

        console.log('Received vendor types:', vendorTypesData);
        console.log('Received food types:', foodTypesData);

        // Handle vendor types response
        if (vendorTypesData && Array.isArray(vendorTypesData.data)) {
          setVendorTypes([{ id: null, name: 'Select Vendor Type', icon: '' }, ...vendorTypesData.data]);
          console.log('Set vendor types successfully');
        } else if (vendorTypesData && Array.isArray(vendorTypesData)) {
          // If the response is directly an array
          setVendorTypes([{ id: null, name: 'Select Vendor Type', icon: '' }, ...vendorTypesData]);
          console.log('Set vendor types successfully (direct array)');
        } else {
          console.warn('Unexpected vendor types response format:', vendorTypesData);
        }

        // Handle food types response
        if (foodTypesData && Array.isArray(foodTypesData.data)) {
          setCuisineTypes(foodTypesData.data);
          console.log('Set food types successfully');
        } else if (foodTypesData && Array.isArray(foodTypesData)) {
          // If the response is directly an array
          setCuisineTypes(foodTypesData);
          console.log('Set food types successfully (direct array)');
        } else {
          console.warn('Unexpected food types response format:', foodTypesData);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });
        
        showValidationError('Network Error', 'Failed to load vendor and food types. Using offline data.');
        
        // Fallback to hardcoded data
        console.log('Using fallback data for cuisine types and vendor types');
        setCuisineTypes([
          { id: 1, name: 'North Indian', icon: '🍛' },
          { id: 2, name: 'South Indian', icon: '🍲' },
          { id: 3, name: 'Chinese', icon: '🥢' },
          { id: 4, name: 'Italian', icon: '🍕' },
          { id: 6, name: 'Mexican', icon: '🌮' },
          { id: 8, name: 'Others', icon: '🍽️' }
        ]);
        
        setVendorTypes([
          { id: null, name: 'Select Vendor Type', icon: '' },
          { id: 1, name: 'Restaurant', icon: '🍽️' },
          { id: 4, name: 'Cloud Kitchen', icon: '👨‍🍳' },
          { id: 5, name: 'Food Truck', icon: '🚚' },
          { id: 2, name: 'Cafe', icon: '☕' },
          { id: 3, name: 'Bakery', icon: '🍞' }
        ]);
      } finally {
        setLoading(false);
        console.log('Finished loading vendor and food types');
      }
    };

    fetchData();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      const currentData = {
        ...formData,
        restaurantName,
        selectedCuisines,
        vendorType,
        vendorTypeId
      };
      
      PersistentStorage.saveRegistrationData({
        formData: currentData,
        currentStep: 4,
        totalSteps: 8
      });
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(autoSave);
  }, [formData, restaurantName, selectedCuisines, vendorType, vendorTypeId]);

  const validateRestaurantName = (text) => {
    // Allow letters, numbers, spaces, and common business name characters
    const nameRegex = /^[a-zA-Z0-9\s.&'-]*$/;
    return nameRegex.test(text);
  };

  const handleRestaurantNameChange = (text) => {
    if (validateRestaurantName(text)) {
      setRestaurantName(text);
    }
  };

  const toggleCuisine = (cuisine) => {
    const cuisineId = cuisine.id;
    if (selectedCuisines.includes(cuisineId)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisineId));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisineId]);
    }
  };

  const showValidationError = (title, message) => {
    setAlertConfig({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const handleNext = () => {
    if (!restaurantName.trim()) {
      showValidationError('Error', 'Please enter restaurant name');
      return;
    }
    if (restaurantName.trim().length < 2) {
      showValidationError('Error', 'Restaurant name must be at least 2 characters long');
      return;
    }
    if (selectedCuisines.length === 0) {
      showValidationError('Error', 'Please select at least one cuisine type');
      return;
    }
    if (!vendorType || vendorType === 'Select Vendor Type') {
      showValidationError('Error', 'Please select vendor type');
      return;
    }

    setFormData({
      ...formData,
      restaurantName,
      cuisineTypes: selectedCuisines,
      vendorType,
      vendorTypeId
    });
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.label}>Restaurant/Outlet Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Your Restaurant Name"
          value={restaurantName}
          onChangeText={handleRestaurantNameChange}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Type of Foods/Cuisine you Sell</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#020A66" />
            <Text style={styles.loadingText}>Loading cuisine types...</Text>
          </View>
        ) : (
          <View style={styles.cuisineContainer}>
            {cuisineTypes.map((cuisine) => (
              <TouchableOpacity
                key={cuisine.id}
                style={[
                  styles.cuisineButton,
                  selectedCuisines.includes(cuisine.id) && styles.selectedCuisine
                ]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text style={[
                  styles.cuisineText,
                  selectedCuisines.includes(cuisine.id) && styles.selectedCuisineText
                ]}>
                  {cuisine.icon} {cuisine.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Type of Vendor</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowVendorDropdown(!showVendorDropdown)}
        >
          <Text style={[
            styles.dropdownText,
            !vendorType || vendorType === 'Select Vendor Type' ? styles.placeholderText : styles.selectedText
          ]}>
            {vendorType || 'Select Vendor Type'}
          </Text>
          <Ionicons 
            name={showVendorDropdown ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {showVendorDropdown && !loading && (
            <View style={styles.dropdownContainer}>
              <ScrollView 
                style={styles.dropdownList}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.dropdownContent}
              >
                {vendorTypes.slice(1).map((type, index) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.dropdownItem,
                      index === vendorTypes.slice(1).length - 1 && styles.lastDropdownItem
                    ]}
                    onPress={() => {
                      setVendorType(type.name);
                      setVendorTypeId(type.id);
                      setShowVendorDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownItemText}>{type.icon} {type.name}</Text>
                    {vendorType === type.name && (
                      <Ionicons name="checkmark" size={20} color="#020A66" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: "MyFont-Bold",
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
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  cuisineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginRight: 10,
    marginBottom: 10,
    fontFamily: "MyFont-SemiBold",
  },
  selectedCuisine: {
    backgroundColor: '#020A66',
    borderColor: '#020A66',
  },
  cuisineText: {
    fontSize: 13,
    color: '#666',
    fontFamily: "MyFont-SemiBold",
  },
  selectedCuisineText: {
    color: '#fff',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: "MyFont-SemiBold",
  },
  placeholderText: {
    color: '#999',
    fontFamily: "MyFont-SemiBold",
  },
  selectedText: {
    color: '#333',
    fontFamily: "MyFont-SemiBold",
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  dropdownList: {
    maxHeight: 200,
    flexGrow: 0,
  },
  dropdownContent: {
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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
  nextButton: {
    flex: 1,
    backgroundColor: '#020A66',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});

export default Step4RestaurantDetails;