import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const VerificationPending = ({ vendorData }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear all authentication data from AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiRemove([
        'auth_token',
        'authToken',
        'isVendorLoggedIn',
        'vendorData'
      ]);
      console.info('All auth data cleared');
      
      // Navigate to vendor registration screen
      router.replace('/vendor/register');
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: still navigate to registration even if clearing fails
      router.replace('/vendor/register');
    }
  };

  const handleContactSupport = () => {
    // You can implement contact support functionality here
    // For now, we'll just show an alert or navigate to a support page
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="time-outline" size={60} color="#F59E0B" />
          </View>
        </View>

        <Text style={styles.title}>Verification Pending</Text>
        <Text style={styles.subtitle}>Your account is under review</Text>

        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            Thank you for registering with PHPBells! Your vendor account has been submitted for verification.
          </Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={styles.statusTitle}>Account Status</Text>
            </View>
            <Text style={styles.statusValue}>Under Verification</Text>
            <Text style={styles.statusDescription}>
              Our team is reviewing your application and documents. This process typically takes 1-3 business days.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <View style={styles.stepsList}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Document verification</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Business details review</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Account approval & activation</Text>
              </View>
            </View>
          </View>

          {vendorData?.businessName && (
            <View style={styles.businessCard}>
              <Text style={styles.businessLabel}>Business Name</Text>
              <Text style={styles.businessName}>{vendorData.businessName}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="help-circle-outline" size={20} color="#020A66" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: 'MyFont-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#374151',
  },
  statusValue: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#F59E0B',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  stepsList: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#020A66',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'MyFont-Bold',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#374151',
    flex: 1,
  },
  businessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  businessLabel: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
  },
  actionButtons: {
    paddingBottom: 30,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#020A66',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-Medium',
    color: '#020A66',
  },
});

export default VerificationPending;