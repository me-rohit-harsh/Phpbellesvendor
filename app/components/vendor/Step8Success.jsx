import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const Step8Success = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const iconBounceAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 40 }, () => ({
      translateY: new Animated.Value(-150),
      translateX: new Animated.Value(Math.random() * width),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }))
  ).current;

  useEffect(() => {
    // Animate main content with improved timing
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(iconBounceAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animate confetti with faster, more visible effects
    const confettiAnimations = confettiAnims.map((anim, index) => {
      return Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: height + 150,
          duration: 800 + Math.random() * 600, // Much faster animation
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 360 * (4 + Math.random() * 3), // More rotations
          duration: 800 + Math.random() * 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim.scale, {
          toValue: 1 + Math.random() * 0.5,
          duration: 400 + Math.random() * 300,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(20, confettiAnimations).start(); // Much faster stagger
  }, []);

  const handleContinue = async () => {
    try {
      // Set authentication state
      await AsyncStorage.setItem('isVendorLoggedIn', 'true');
      await AsyncStorage.setItem('vendorData', JSON.stringify({
        registrationComplete: true,
        timestamp: new Date().toISOString()
      }));
      
      router.replace('/(app)/home'); // Navigate to business dashboard
    } catch (error) {
      console.error('Error saving auth state:', error);
      router.replace('/(app)/home'); // Navigate anyway
    }
  };

  const ConfettiPiece = ({ anim, color, shape, size }) => (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          width: size,
          height: size,
          transform: [
            { translateX: anim.translateX },
            { translateY: anim.translateY },
            { scale: anim.scale },
            {
              rotate: anim.rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        shape === 'circle' ? styles.confettiCircle : styles.confettiSquare,
      ]}
    />
  );

  const confettiColors = ['#FF6B35', '#4A5FFF', '#00C851', '#FFD700', '#FF4444', '#9C27B0', '#FF9800', '#E91E63', '#2196F3', '#4CAF50', '#FF5722', '#795548', '#607D8B', '#FFC107'];
  const confettiSizes = [8, 10, 12, 14, 16, 18]; // More variable sizes for better visibility

  return (
    <View style={styles.container}>
      {/* Confetti Animation */}
      {confettiAnims.map((anim, index) => (
        <ConfettiPiece
          key={index}
          anim={anim}
          color={confettiColors[index % confettiColors.length]}
          shape={index % 3 === 0 ? 'circle' : 'square'} // More variety in shapes
          size={confettiSizes[index % confettiSizes.length]}
        />
      ))}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [{
                scale: iconBounceAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1.2, 1],
                }),
              }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={80} color="#00C851" />
        </Animated.View>

        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>
          You are now registered with PHPBell
        </Text>
        <Text style={styles.description}>
          Your application has been submitted successfully. Our team will review your 
          information and get back to you within 24-48 hours.
        </Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={24} color="#4A5FFF" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Review Time</Text>
              <Text style={styles.infoSubtitle}>24-48 hours</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={24} color="#4A5FFF" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Notification</Text>
              <Text style={styles.infoSubtitle}>Via email & SMS</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={24} color="#4A5FFF" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Support</Text>
              <Text style={styles.infoSubtitle}>24/7 available</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="headset-outline" size={20} color="#020A66" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
    // width and height will be set dynamically via props
  },
  confettiCircle: {
    borderRadius: 50, // Make it fully circular regardless of size
  },
  confettiSquare: {
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: "MyFont-SemiBold",
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#020A66',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: "MyFont-SemiBold",
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontFamily: "MyFont-SemiBold",
  },
  infoContainer: {
    width: '100%',
    marginBottom: 40,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 15,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: "MyFont-Bold",
    color: '#333',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: "MyFont-SemiBold",
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#020A66',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: "MyFont-Bold",
    marginRight: 10,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 80,
  },
  supportButtonText: {
    color: '#020A66',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default Step8Success;