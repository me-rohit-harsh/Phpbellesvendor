import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PersistentStorage from '../../../lib/storage/persistentStorage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const Step8Success = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const iconBounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);

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

    // Icon pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

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

    // Show payment notice with delay
    setTimeout(() => {
      setShowPaymentNotice(true);
    }, 800);
  }, []);

  const handleContinue = async () => {
    try {
      // Clear registration progress data since registration is complete
      await PersistentStorage.clearAllTempData();
      
      // Set authentication state
      await AsyncStorage.setItem('isVendorLoggedIn', 'true');
      await AsyncStorage.setItem('vendorData', JSON.stringify({
        registrationComplete: true,
        timestamp: new Date().toISOString()
      }));
      
      console.info('Registration completed successfully, cleared temp data');
      router.replace('/home'); // Navigate to business dashboard
    } catch (error) {
      console.error('Error saving auth state:', error);
      router.replace('/home'); // Navigate anyway
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
      <LinearGradient
        colors={['#FFFFFF', '#F0F4FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                transform: [
                  {
                    scale: iconBounceAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 1.2, 1],
                    }),
                  },
                  { scale: pulseAnim }
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#E8FFF3', '#C6F6D5']}
              style={styles.iconBackground}
            >
              <Ionicons name="checkmark-circle" size={100} color="#00C851" />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>Registration Complete!</Text>
          <Text style={styles.subtitle}>
            Welcome to the PHPBell Family
          </Text>

          {showPaymentNotice && (
            <Animated.View 
              entering={Animated.FadeInDown}
              style={styles.paymentCard}
            >
              <LinearGradient
                colors={['#FFF5F5', '#FFE3E3']}
                style={styles.paymentGradient}
              >
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentIconWrapper}>
                    <Ionicons name="mail-unread" size={24} color="#E53E3E" />
                  </View>
                  <Text style={styles.paymentTitle}>Action Required: Email Verification</Text>
                </View>
                <Text style={styles.paymentText}>
                  To activate your account, please complete the <Text style={styles.boldText}>verification payment</Text> sent to your email.
                </Text>
                <View style={styles.paymentBadge}>
                  <Ionicons name="information-circle" size={16} color="#C53030" />
                  <Text style={styles.paymentBadgeText}>Check your inbox & spam folder</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <View style={[styles.infoIconBox, { backgroundColor: '#EBF8FF' }]}>
                <Ionicons name="time" size={24} color="#3182CE" />
              </View>
              <Text style={styles.infoLabel}>Review Time</Text>
              <Text style={styles.infoValue}>24-48 Hours</Text>
            </View>

            <View style={styles.infoBox}>
              <View style={[styles.infoIconBox, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="notifications" size={24} color="#805AD5" />
              </View>
              <Text style={styles.infoLabel}>Updates</Text>
              <Text style={styles.infoValue}>Email & SMS</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#020A66', '#040E8C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueButtonText}>Go to Dashboard</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportButton} activeOpacity={0.6}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#020A66" />
            <Text style={styles.supportButtonText}>Need help? Contact Support</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  confetti: {
    position: 'absolute',
    zIndex: 99,
  },
  confettiCircle: {
    borderRadius: 50,
  },
  confettiSquare: {
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    zIndex: 10,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C851',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: "MyFont-Bold",
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: "MyFont-Medium",
  },
  paymentCard: {
    width: '100%',
    borderRadius: 20,
    marginBottom: 30,
    overflow: 'hidden',
    shadowColor: '#E53E3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  paymentGradient: {
    padding: 20,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#C53030',
    flex: 1,
  },
  paymentText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 15,
    fontFamily: 'MyFont-Regular',
  },
  boldText: {
    fontFamily: 'MyFont-Bold',
    color: '#1A202C',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  paymentBadgeText: {
    fontSize: 12,
    fontFamily: 'MyFont-Medium',
    color: '#C53030',
    marginLeft: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
    marginBottom: 40,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#718096',
    fontFamily: 'MyFont-Medium',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3748',
    fontFamily: 'MyFont-Bold',
  },
  continueButton: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#020A66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
  },
  supportButtonText: {
    color: '#4A5568',
    fontSize: 15,
    fontFamily: "MyFont-Medium",
    marginLeft: 8,
  },
});

export default Step8Success;