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
        // If there's an error checking status, redirect to registration
        router.replace("/vendor/register");
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
        router.replace('/vendor/under-verification');
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

  // If vendor is approved, show dashboard
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
