import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dashboard from "../components/business/Dashboard";

export default function Home() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState({
    businessName: "Your Business",
    phoneNumber: "8176990986",
    isVerified: true,
  });

  useEffect(() => {
    // Load business data from AsyncStorage
    const loadBusinessData = async () => {
      try {
        const vendorData = await AsyncStorage.getItem('vendorData');
        if (vendorData) {
          const parsedData = JSON.parse(vendorData);
          setBusinessData({
            businessName: parsedData.restaurantName || "Your Business",
            phoneNumber: parsedData.phoneNumber || "8176990986",
            isVerified: true,
          });
        }
      } catch (error) {
        console.error('Error loading business data:', error);
      }
    };

    loadBusinessData();

    // Check if user is verified, if not redirect to registration
    if (!businessData.isVerified) {
      router.replace("/vendor/register");
    }
  }, []);

  if (!businessData.isVerified) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Redirecting...</Text>
      </View>
    );
  }

  return <Dashboard businessData={businessData} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 22,
    color: "#333",
    fontFamily: "MyFont-Bold",
  },
});
