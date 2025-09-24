import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dashboard from "../components/business/Dashboard";
import VerificationPending from "../components/business/VerificationPending";
import { getVendorStatus } from "../../lib/api";

export default function Home() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState({
    businessName: "Your Business",
    phoneNumber: "8176990986",
    isVerified: true,
  });
  const [vendorStatus, setVendorStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // First check if we still have valid authentication data
        const isLoggedIn = await AsyncStorage.getItem('isVendorLoggedIn');
        const authToken = await AsyncStorage.getItem('auth_token') || await AsyncStorage.getItem('authToken');
        
        // If no authentication data, redirect to registration
        if (!isLoggedIn || !authToken) {
          console.log('No valid authentication data found, redirecting to registration');
          router.replace("/vendor/register");
          return;
        }
        
        // Load business data from AsyncStorage
        const vendorData = await AsyncStorage.getItem('vendorData');
        if (vendorData) {
          const parsedData = JSON.parse(vendorData);
          setBusinessData({
            businessName: parsedData.restaurantName || "Your Business",
            phoneNumber: parsedData.phoneNumber || "8176990986",
            isVerified: true,
          });
        }

        // Check vendor approval status
        const statusResponse = await getVendorStatus();
        setVendorStatus(statusResponse);
        
      } catch (error) {
        console.error('Error initializing app:', error);
        
        // Check if this is a 401 error (token expired)
        if (error.response?.status === 401 || error.message?.includes('401')) {
          console.log('Authentication error detected, redirecting to registration');
          router.replace("/vendor/register");
        } else {
          // For other errors, still redirect to registration as fallback
          router.replace("/vendor/register");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle navigation based on vendor status
  useEffect(() => {
    if (!isLoading && vendorStatus) {
      if (vendorStatus.status === 'under_verification' || vendorStatus.status === 'no_vendor') {
        // Show verification pending component instead of routing
        // This will be handled in the render logic below
      }
    }
  }, [vendorStatus, isLoading, router]);

  // Show loading screen while checking status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Checking verification status...</Text>
      </View>
    );
  }

  // Show appropriate component based on vendor status
  if (vendorStatus) {
    console.log('Vendor status received:', vendorStatus.status);
    
    if (vendorStatus.status === 'verified') {
      // Vendor is verified, show dashboard
      return <Dashboard businessData={businessData} />;
    } else if (vendorStatus.status === 'under_verification') {
      // Vendor is under verification, show verification pending
      return <VerificationPending vendorData={vendorStatus} />;
    } else if (vendorStatus.status === 'no_vendor') {
      // No vendor found, redirect to registration
      router.replace("/vendor/register");
      return null;
    } else {
      // Unknown status, redirect to registration as fallback
      console.log('Unknown vendor status:', vendorStatus.status);
      router.replace("/vendor/register");
      return null;
    }
  }

  // If no vendor status yet, show loading or fallback to dashboard
  return <Dashboard businessData={businessData} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontFamily: "MyFont-Regular",
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 22,
    color: "#333",
    fontFamily: "MyFont-Bold",
  },
});
