import { useEffect } from "react";
import { View, Text, Image, StyleSheet, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('isVendorLoggedIn');
        const vendorData = await AsyncStorage.getItem('vendorData');
        
        setTimeout(() => {
          if (isLoggedIn === 'true' && vendorData) {
            // User is logged in, go to business dashboard
            router.replace('/(app)/home');
          } else {
            // User is not logged in, go to vendor registration
            router.replace('/vendor/register');
          }
        }, 3000); // show splash for 3 seconds
      } catch (error) {
        console.error('Error checking auth status:', error);
        setTimeout(() => {
          router.replace('/vendor/register');
        }, 3000);
      }
    };

    checkAuthStatus();
  }, [router]);

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
          <Text style={styles.tagline}>India’s Emerging Food Delivery App</Text>
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
  logoNameHighlight: {
    color: "#FFD700",
    fontFamily: "MyFont-Bold",
  },
  tagline: {
    color: "#fff",
    fontSize: 32,
    textAlign: "center",
    fontFamily: "MyFont-SemiBold",
    lineHeight: 36,
  },
});
