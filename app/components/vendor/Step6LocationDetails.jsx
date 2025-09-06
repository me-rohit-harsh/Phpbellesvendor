import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import CustomAlert from '../CustomAlert';

const Step6LocationDetails = ({ onNext, onBack, formData, setFormData }) => {
  const [address, setAddress] = useState(formData.address || '');
  const [landmark, setLandmark] = useState(formData.landmark || '');
  const [pincode, setPincode] = useState(formData.pincode || '');
  const [city, setCity] = useState(formData.city || '');
  const [state, setState] = useState(formData.state || '');
  const [selectedLocation, setSelectedLocation] = useState(formData.selectedLocation || null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  const validateAddress = (text) => {
    // Allow letters, numbers, spaces, and common address characters
    const addressRegex = /^[a-zA-Z0-9\s.,#\/-]*$/;
    return addressRegex.test(text);
  };

  const validateCityState = (text) => {
    // Only allow letters and spaces for city/state names
    const nameRegex = /^[a-zA-Z\s]*$/;
    return nameRegex.test(text);
  };

  const validatePincode = (text) => {
    // Indian pincode: exactly 6 digits
    const pincodeRegex = /^[0-9]{6}$/;
    return pincodeRegex.test(text);
  };

  const validatePincodeInput = (text) => {
    // Only allow 6 digits for Indian pincode
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length <= 6) {
      return cleanText;
    }
    return text.slice(0, -1);
  };

  const handleAddressChange = (text) => {
    if (validateAddress(text)) {
      setAddress(text);
    }
  };

  const handleLandmarkChange = (text) => {
    if (validateAddress(text)) {
      setLandmark(text);
    }
  };

  const handleCityChange = (text) => {
    if (validateCityState(text)) {
      setCity(text);
    }
  };

  const handleStateChange = (text) => {
    if (validateCityState(text)) {
      setState(text);
    }
  };

  const handlePincodeChange = (text) => {
    const validatedText = validatePincodeInput(text);
    setPincode(validatedText);
    fetchAddressFromPincode(validatedText);
  };

  const formatAddress = (addr) => {
    // Create a properly formatted address with proper structure
    const addressParts = [];
    
    // Building/House number and street
    if (addr.streetNumber) {
      addressParts.push(addr.streetNumber);
    }
    if (addr.street) {
      addressParts.push(addr.street);
    }
    
    // Area/Locality
    if (addr.district && addr.district !== addr.city) {
      addressParts.push(addr.district);
    } else if (addr.subregion && addr.subregion !== addr.city) {
      addressParts.push(addr.subregion);
    }
    
    // City
    if (addr.city) {
      addressParts.push(addr.city);
    }
    
    // State
    if (addr.region) {
      addressParts.push(addr.region);
    }
    
    // Create formatted address
    const formattedAddress = addressParts.filter(part => part && part.trim()).join(', ');
    
    // If we still get a short address, try alternative fields
    if (formattedAddress.length < 10) {
      const fallbackParts = [];
      if (addr.name) fallbackParts.push(addr.name);
      if (addr.formattedAddress) return addr.formattedAddress;
      return fallbackParts.join(', ') || `${addr.city || 'Unknown'}, ${addr.region || 'Unknown'}`;
    }
    
    return formattedAddress;
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig({
          title: 'Permission Denied',
          message: 'Location permission is required to get your current location.',
          type: 'error',
          buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
        });
        setShowAlert(true);
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        const formattedAddress = formatAddress(addr);
        
        setSelectedLocation({
          latitude,
          longitude,
          address: formattedAddress,
        });
        
        if (addr.city) setCity(addr.city);
        if (addr.region) setState(addr.region);
        if (addr.postalCode) setPincode(addr.postalCode);
        if (formattedAddress) setAddress(formattedAddress);
        
        setAlertConfig({
          title: 'Location Set Successfully',
          message: `Your location has been set to: ${formattedAddress}`,
          type: 'success',
          buttons: [
            { text: 'OK', onPress: () => setShowAlert(false) },
            { 
              text: 'View on Map', 
              onPress: () => {
                setShowAlert(false);
                setShowMapModal(true);
              }
            }
          ]
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.log('Error getting location:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Unable to get your current location. Please try again.',
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    }
    setIsGettingLocation(false);
  };

  const openInOlaMaps = async (latitude, longitude, address = '') => {
    try {
      const olaMapUrl = `https://maps.olakrutrim.com/?q=${latitude},${longitude}`;
      const canOpen = await Linking.canOpenURL(olaMapUrl);
      
      if (canOpen) {
        await Linking.openURL(olaMapUrl);
      } else {
        // Fallback to Google Maps if OLA Maps is not available
        const googleMapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        await Linking.openURL(googleMapUrl);
      }
    } catch (error) {
      console.log('Error opening map:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Unable to open map application.',
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
      });
      setShowAlert(true);
    }
  };

  const selectLocationManually = () => {
    setAlertConfig({
      title: 'Manual Location Entry',
      message: 'This feature will be available in the next update. Please use "Get Current Location" for now.',
      type: 'info',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const fetchAddressFromPincode = async (pincode) => {
     if (pincode.length === 6) {
       try {
         // Using a free API for pincode lookup
         const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
         const data = await response.json();
         
         if (data[0].Status === 'Success' && data[0].PostOffice.length > 0) {
           const postOffice = data[0].PostOffice[0];
           setCity(postOffice.District);
           setState(postOffice.State);
         }
       } catch (error) {
         console.log('Error fetching address:', error);
       }
     }
   };

  const showValidationError = (message) => {
    setAlertConfig({
      title: 'Validation Error',
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress: () => setShowAlert(false) }]
    });
    setShowAlert(true);
  };

  const handleNext = () => {
    if (!address.trim()) {
      showValidationError('Please enter restaurant address');
      return;
    }
    if (address.trim().length < 10) {
      showValidationError('Address must be at least 10 characters long');
      return;
    }
    if (!pincode.trim()) {
      showValidationError('Please enter pincode');
      return;
    }
    if (pincode.length !== 6) {
      showValidationError('Please enter a valid 6-digit pincode');
      return;
    }
    if (!validatePincode(pincode)) {
      showValidationError('Please enter a valid pincode');
      return;
    }
    if (!city.trim()) {
      showValidationError('Please enter city');
      return;
    }
    if (city.trim().length < 2) {
      showValidationError('City name must be at least 2 characters long');
      return;
    }
    if (!state.trim()) {
      showValidationError('Please enter state');
      return;
    }
    if (state.trim().length < 2) {
      showValidationError('State name must be at least 2 characters long');
      return;
    }
    if (!selectedLocation) {
      showValidationError('Please select your restaurant location on map');
      return;
    }

    setFormData({
      ...formData,
      address,
      landmark,
      pincode,
      city,
      state,
      selectedLocation
    });
    onNext();
  };

  return (
    <>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.label}>Restaurant Address</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Enter complete address"
          value={address}
          onChangeText={handleAddressChange}
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Landmark (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Near landmark"
          value={landmark}
          onChangeText={handleLandmarkChange}
          placeholderTextColor="#999"
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              value={pincode}
              onChangeText={handlePincodeChange}
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              value={city}
              onChangeText={handleCityChange}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <Text style={styles.label}>State</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter state"
          value={state}
          onChangeText={handleStateChange}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Select your restaurant location</Text>
        
        <TouchableOpacity 
          style={styles.currentLocationButton} 
          onPress={getCurrentLocation}
          disabled={isGettingLocation}
        >
          <Ionicons name="locate" size={20} color="#020A66" />
          <Text style={styles.currentLocationText}>
            {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapButton} onPress={selectLocationManually}>
          <View style={styles.mapContent}>
            <Ionicons name="location-outline" size={24} color="#020A66" />
            <Text style={styles.mapText}>
              Enter Coordinates Manually
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {selectedLocation && (
          <View style={styles.selectedLocationContainer}>
            <View style={styles.locationHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.selectedLocationText}>Location Selected</Text>
            </View>
            <Text style={styles.selectedLocationAddress}>
              {selectedLocation.address}
            </Text>
            <View style={styles.locationActions}>
              <TouchableOpacity 
                style={styles.viewMapButton}
                onPress={() => openInOlaMaps(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.address)}
              >
                <Ionicons name="map" size={16} color="#4A5FFF" />
                <Text style={styles.viewMapText}>View on OLA Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.changeLocationButton}
                onPress={() => setSelectedLocation(null)}
              >
                <Ionicons name="refresh" size={16} color="#666" />
                <Text style={styles.changeLocationText}>Change</Text>
              </TouchableOpacity>
            </View>
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
    </ScrollView>

    {/* Map Modal */}
    <Modal
      visible={showMapModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Restaurant Location</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowMapModal(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {selectedLocation && (
          <WebView
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                    #map { height: 100vh; width: 100%; }
                    .loading { 
                      position: absolute; 
                      top: 50%; 
                      left: 50%; 
                      transform: translate(-50%, -50%);
                      text-align: center;
                      z-index: 1000;
                    }
                    .info-window {
                      padding: 10px;
                      max-width: 200px;
                    }
                  </style>
                </head>
                <body>
                  <div class="loading" id="loading">Loading map...</div>
                  <div id="map"></div>
                  <script>
                    function initMap() {
                      document.getElementById('loading').style.display = 'none';
                      const location = { lat: ${selectedLocation.latitude}, lng: ${selectedLocation.longitude} };
                      const map = new google.maps.Map(document.getElementById("map"), {
                        zoom: 16,
                        center: location,
                        mapTypeControl: true,
                        streetViewControl: true,
                        fullscreenControl: true,
                        zoomControl: true
                      });
                      
                      const marker = new google.maps.Marker({
                        position: location,
                        map: map,
                        title: "Restaurant Location",
                        animation: google.maps.Animation.DROP
                      });
                      
                      const infoWindow = new google.maps.InfoWindow({
                        content: \`
                          <div class="info-window">
                            <h3>Restaurant Location</h3>
                            <p>${selectedLocation.address || 'Selected Location'}</p>
                            <p><strong>Coordinates:</strong><br/>
                            Lat: ${selectedLocation.latitude.toFixed(6)}<br/>
                            Lng: ${selectedLocation.longitude.toFixed(6)}</p>
                          </div>
                        \`
                      });
                      
                      marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                      });
                      
                      // Auto-open info window
                      setTimeout(() => {
                        infoWindow.open(map, marker);
                      }, 1000);
                    }
                    
                    function handleError() {
                      document.getElementById('loading').innerHTML = 
                        '<div style="color: #ff4444; text-align: center;">\n' +
                        '<h3>Map Loading Error</h3>\n' +
                        '<p>Unable to load Google Maps.<br/>Please check your internet connection.</p>\n' +
                        '</div>';
                    }
                  </script>
                  <script async defer
                    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBvOkBwgGlbUiuS-oKrPrAhTI4ZGHHA9TI&callback=initMap"
                    onerror="handleError()">
                  </script>
                </body>
                </html>
              `
            }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <Text>Loading Google Maps...</Text>
              </View>
            )}
          />
        )}
        
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.openExternalButton}
            onPress={() => {
              setShowMapModal(false);
              if (selectedLocation) {
                openInOlaMaps(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.address);
              }
            }}
          >
            <Ionicons name="open-outline" size={20} color="#4A5FFF" />
            <Text style={styles.openExternalText}>Open in Maps App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Custom Alert */}
    <CustomAlert
      visible={showAlert}
      title={alertConfig.title}
      message={alertConfig.message}
      type={alertConfig.type}
      buttons={alertConfig.buttons}
      onClose={() => setShowAlert(false)}
    />
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
  },
  label: {
    fontSize: 16,
    fontFamily: "MyFont-SemiBold",
    color: '#333',
    marginBottom: 4,
    marginTop: 16,
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
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FAFAFA',
  },
  mapContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 15,
  },
  currentLocationText: {
    fontSize: 16,
    color: '#020A66',
    marginLeft: 8,
    fontWeight: '500',
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
  selectedLocationContainer: {
    backgroundColor: '#F0F8F0',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLocationText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A5FFF',
  },
  viewMapText: {
    fontSize: 12,
    color: '#4A5FFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeLocationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  webView: {
    flex: 1,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  openExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A5FFF',
  },
  openExternalText: {
    fontSize: 16,
    color: '#4A5FFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1000,
  },
});

export default Step6LocationDetails;