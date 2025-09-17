import { useEffect } from "react";
import { View, Text, Image, StyleSheet, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVendorStatus } from '../../../lib/api';
import PersistentStorage from '../../../lib/storage/persistentStorage';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isVendorLoggedIn');
        const vendorData = await AsyncStorage.getItem('vendorData');
        const authToken = await AsyncStorage.getItem('authToken');
        
        setTimeout(async () => {
          if (isLoggedIn === 'true' && vendorData && authToken) {
            try {
              // Check vendor verification status via API
              const statusResponse = await getVendorStatus();
              
              // Route based on vendor status
              if (statusResponse && statusResponse.status === 'verified') {
                // Vendor is verified, go to dashboard
                router.replace('/(app)/home');
              } else if (statusResponse && statusResponse.status === 'under_verification') {
                // Vendor is registered but under verification, go to verification screen
                router.replace('/(app)/home'); // home will handle showing verification screen
              } else {
                // Vendor needs to register, go to registration
                router.replace('/vendor/register');
              }
            } catch (error) {
              console.error('Error checking vendor status:', error);
              // If API call fails, check if we have vendor data locally
              if (vendorData) {
                // User has local data, go to home (which will handle verification)
                router.replace('/(app)/home');
              } else {
                // No local data, go to registration
                router.replace('/vendor/register');
              }
            }
          } else {
            // User is not logged in, check for incomplete registration data
            try {
              const recoveryData = await PersistentStorage.checkRecoverableData();
              if (recoveryData.canRecover) {
                console.log('Found incomplete registration data, redirecting to registration with recovery');
                // Go to registration page which will handle data recovery
                router.replace('/vendor/register');
              } else {
                // No incomplete data, fresh start
                router.replace('/vendor/register');
              }
            } catch (error) {
              console.error('Error checking for recoverable data:', error);
              // Fallback to registration
              router.replace('/vendor/register');
            }
          }
        }, 2000); // reduced to 2 seconds
      } catch (error) {
        console.error('Error checking auth status:', error);
        setTimeout(async () => {
          try {
            // Even on error, check for incomplete registration data
            const recoveryData = await PersistentStorage.checkRecoverableData();
            if (recoveryData.canRecover) {
              console.log('Found incomplete registration data after error, redirecting to registration with recovery');
            }
            router.replace('/vendor/register');
          } catch (recoveryError) {
            console.error('Error checking for recoverable data after auth error:', recoveryError);
            router.replace('/vendor/register');
          }
        }, 2000);
      }
    };

    checkAuthStatus();
  }, [router]);

  // Add console log to debug
  useEffect(() => {
    console.log('Splash screen mounted');
  }, []);

  return (
    <ImageBackground
      source={require("../../../assets/images/splash.jpg")} // background image
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,1)", "rgba(0,0,0,0.2)"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <Image
            source={require("../../../assets/images/logo.png")} // app logo
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoName}>
            PHP <Text style={styles.logoNameHighlight}>Bell</Text>
          </Text>
          <Text style={styles.tagline}>India's Emerging Food Delivery App</Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  logoName: {
    color: "#fff",
    fontSize: 36,
    textAlign: "center",
    fontFamily: "MyFont-Bold",
    marginBottom: 10,
    textTransform: "uppercase",
    lineHeight: 32,
  },
  logoNameFallback: {
    color: "#fff",
    fontSize: 36,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
    lineHeight: 32,
  },
  logoNameHighlight: {
    color: "#FFD700",
    fontFamily: "MyFont-Bold",
  },
  logoNameHighlightFallback: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  tagline: {
    color: "#fff",
    fontSize: 32,
    textAlign: "center",
    fontFamily: "MyFont-SemiBold",
    lineHeight: 36,
  },
  taglineFallback: {
    color: "#fff",
    fontSize: 32,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 36,
  },
});
