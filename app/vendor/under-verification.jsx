import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getVendorStatus } from '../../lib/api';

const UnderVerification = () => {
  const router = useRouter();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      const response = await getVendorStatus();
      if (response && response.status) {
        setVendorData(response);
        
        // If status changed to verified, redirect to dashboard
        if (response.status === 'verified') {
          router.replace('/vendor/dashboard');
        }
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVendorData();
  };

  const handleLogout = async () => {
    try {
      // Clear all authentication data from AsyncStorage
      await AsyncStorage.multiRemove([
        'auth_token',
        'authToken',
        'isVendorLoggedIn',
        'vendorData'
      ]);
      console.log('All auth data cleared');
      
      // Navigate to vendor registration screen
      router.replace('/vendor/register');
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: still navigate to registration even if clearing fails
      router.replace('/vendor/register');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/blue-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Status Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={80} color="#FF9800" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Application Under Review</Text>
          
          {/* Description */}
          <Text style={styles.description}>
            Thank you for submitting your vendor application. Our team is currently reviewing your information and documents.
          </Text>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Current Status:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Pending Review</Text>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Submitted:</Text>
              <Text style={styles.statusValue}>
                {vendorData?.created_at ? new Date(vendorData.created_at).toLocaleDateString() : 'Recently'}
              </Text>
            </View>
          </View>

          {/* Information Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>
                • Our team will review your application within 2-3 business days{'\n'}
                • You'll receive an email notification once the review is complete{'\n'}
                • If approved, you'll gain access to your vendor dashboard{'\n'}
                • If additional information is needed, we'll contact you
              </Text>
            </View>
          </View>

          {/* Contact Support */}
          <View style={styles.supportContainer}>

          
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="help-circle-outline" size={24} color="#020A66" />
            <Text style={styles.supportText}>Contact Support</Text>
          </TouchableOpacity>

          {/* Refresh Button */}
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Check Status</Text>
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 40,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'MyFont-Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
    fontFamily: 'MyFont-SemiBold',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'MyFont-SemiBold',
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#FF9800',
    fontFamily: 'MyFont-Bold',
  },
  statusValue: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'MyFont-Bold',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
    fontFamily: 'MyFont-SemiBold',
  },
  supportContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#020A66',
  },
  supportText: {
    fontSize: 16,
    color: '#020A66',
    fontFamily: 'MyFont-Bold',
    marginLeft: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020A66',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'MyFont-Bold',
    marginLeft: 8,
  },
});

export default UnderVerification;