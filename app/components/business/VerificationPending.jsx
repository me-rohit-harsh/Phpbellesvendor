import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../../lib/api/auth';
import { getVendorStatus } from '../../../lib/api/vendorStatus';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const VerificationPending = ({ vendorData }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState(vendorData?.status || 'under_verification');

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const statusResp = await getVendorStatus();
      const status = statusResp?.status || statusResp?.data?.status;
      if (status) {
        setCurrentStatus(status);
      }
      if (status && status !== 'under_verification') {
        router.replace('/home');
      }
    } catch (error) {
      console.error('Error refreshing vendor status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout? You will need to login again to check your verification status.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.info('🚪 Initiating logout from VerificationPending...');
              setIsLoggingOut(true);
              
              // Use the logout API function
              const result = await logout();
              
              console.info('✅ Logout complete:', result);
              console.info('👉 Redirecting to login screen...');
              
              // Small delay to ensure state is cleared
              setTimeout(() => {
                router.replace('/vendor/register');
              }, 100);
            } catch (error) {
              console.error('❌ Error during logout:', error);
              
              // Logout function now always returns success
              // Still navigate to registration
              console.info('👉 Redirecting to registration screen after error...');
              setTimeout(() => {
                router.replace('/vendor/register');
              }, 100);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    // You can implement contact support functionality here
    // For now, we'll just show an alert or navigate to a support page
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#020A66', '#040E8C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vendor Status</Text>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#020A66"
          />
        }
      >
        <View style={styles.topSection}>
          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark" size={20} color="#00C851" />
            <Text style={styles.statusBadgeText}>Account in Review</Text>
          </View>
          
          <Text style={styles.title}>Welcome to PHPBells!</Text>
          <Text style={styles.subtitle}>
            Your application for <Text style={styles.businessHighlight}>{vendorData?.businessName || 'your business'}</Text> is currently being processed.
          </Text>
        </View>

        <View style={styles.mainCard}>
          <LinearGradient
            colors={['#FFF5F5', '#FFE3E3']}
            style={styles.paymentCard}
          >
            <View style={styles.paymentHeader}>
              <View style={styles.paymentIconWrapper}>
                <Ionicons name="card" size={24} color="#E53E3E" />
              </View>
              <View style={styles.paymentHeaderText}>
                <Text style={styles.paymentTitle}>Payment Required</Text>
                <Text style={styles.paymentSubtitle}>Verification & Security</Text>
              </View>
            </View>
            
            <Text style={styles.paymentDescription}>
              To complete your registration, please process the verification payment sent to your registered email address.
            </Text>

            <View style={styles.alertBox}>
              <Ionicons name="alert-circle" size={20} color="#C53030" />
              <Text style={styles.alertText}>
                Approval is pending until payment is confirmed.
              </Text>
            </View>

          
          </LinearGradient>

          <View style={styles.processSection}>
            <Text style={styles.sectionTitle}>Verification Progress</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressItem}>
                <View style={[styles.progressIcon, styles.progressDone]}>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                </View>
                <View style={styles.progressTextContent}>
                  <Text style={styles.progressTitle}>Registration Submitted</Text>
                  <Text style={styles.progressDesc}>We have received your details</Text>
                </View>
                <View style={styles.progressLine} />
              </View>

              <View style={styles.progressItem}>
                <View style={[styles.progressIcon, styles.progressActive]}>
                  <View style={styles.pulseIndicator} />
                </View>
                <View style={styles.progressTextContent}>
                  <Text style={[styles.progressTitle, { color: '#020A66' }]}>Verification Payment</Text>
                  <Text style={styles.progressDesc}>Waiting for payment confirmation</Text>
                </View>
                <View style={[styles.progressLine, styles.progressLineInactive]} />
              </View>

              <View style={styles.progressItem}>
                <View style={[styles.progressIcon, styles.progressPending]}>
                  <Text style={styles.progressNumber}>3</Text>
                </View>
                <View style={styles.progressTextContent}>
                  <Text style={styles.progressTitle}>Document Review</Text>
                  <Text style={styles.progressDesc}>Our team will verify your documents</Text>
                </View>
                <View style={[styles.progressLine, styles.progressLineInactive]} />
              </View>

              <View style={styles.progressItem}>
                <View style={[styles.progressIcon, styles.progressPending]}>
                  <Text style={styles.progressNumber}>4</Text>
                </View>
                <View style={styles.progressTextContent}>
                  <Text style={styles.progressTitle}>Final Approval</Text>
                  <Text style={styles.progressDesc}>Account activation & dashboard access</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#020A66" />
            <Text style={styles.supportButtonText}>Need Help? Contact Support</Text>
          </TouchableOpacity>
          
          <Text style={styles.footerText}>
            Average review time: 24-48 Business Hours
          </Text>
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
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'MyFont-Bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFF3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  statusBadgeText: {
    fontSize: 14,
    fontFamily: 'MyFont-Bold',
    color: '#00C851',
  },
  title: {
    fontSize: 26,
    fontFamily: 'MyFont-Bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
  },
  businessHighlight: {
    fontFamily: 'MyFont-Bold',
    color: '#020A66',
  },
  mainCard: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  paymentCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#E53E3E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  paymentIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  paymentHeaderText: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#C53030',
  },
  paymentSubtitle: {
    fontSize: 14,
    fontFamily: 'MyFont-Medium',
    color: '#E53E3E',
  },
  paymentDescription: {
    fontSize: 15,
    fontFamily: 'MyFont-Medium',
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  alertText: {
    fontSize: 13,
    fontFamily: 'MyFont-Bold',
    color: '#C53030',
    flex: 1,
  },
  checkEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  checkEmailText: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#C53030',
  },
  processSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'MyFont-Bold',
    color: '#1A202C',
    marginBottom: 24,
  },
  progressContainer: {
    gap: 0,
  },
  progressItem: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 30,
    position: 'relative',
  },
  progressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  progressDone: {
    backgroundColor: '#00C851',
  },
  progressActive: {
    backgroundColor: '#020A66',
    borderWidth: 4,
    borderColor: '#EBF8FF',
  },
  progressPending: {
    backgroundColor: '#EDF2F7',
  },
  progressNumber: {
    fontSize: 14,
    fontFamily: 'MyFont-Bold',
    color: '#718096',
  },
  progressTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  progressTitle: {
    fontSize: 15,
    fontFamily: 'MyFont-Bold',
    color: '#4A5568',
    marginBottom: 2,
  },
  progressDesc: {
    fontSize: 13,
    fontFamily: 'MyFont-Regular',
    color: '#718096',
  },
  progressLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 30,
    backgroundColor: '#00C851',
    zIndex: 1,
  },
  progressLineInactive: {
    backgroundColor: '#EDF2F7',
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  actionButtons: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#020A66',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  supportButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#020A66',
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'MyFont-Medium',
    color: '#A0AEC0',
    textAlign: 'center',
  },
});

export default VerificationPending;
