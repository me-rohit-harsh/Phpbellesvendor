import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useFCMNotifications from '../../hooks/useFCMNotifications';
import fcmService from '../../lib/notifications/fcmService';
import { ToastManager } from '../components/NotificationToast';

export default function FCMTestScreen() {
  const [fcmToken, setFcmToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appIdentifier, setAppIdentifier] = useState('');

  const {
    getFCMToken,
    showLocalNotification,
    clearAllNotifications,
    registerForNotifications
  } = useFCMNotifications({ autoRegister: false });

  useEffect(() => {
    loadFCMInfo();
  }, []);

  const loadFCMInfo = async () => {
    setLoading(true);
    try {
      const token = await getFCMToken();
      const identifier = fcmService.getAppIdentifier();
      setFcmToken(token);
      setAppIdentifier(identifier);
    } catch (error) {
      console.error('Error loading FCM info:', error);
      ToastManager.error('Failed to load FCM info');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const token = await registerForNotifications();
      if (token) {
        setFcmToken(token);
        ToastManager.success('Successfully registered for notifications!');
      } else {
        ToastManager.warning('Could not register. Check permissions.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      ToastManager.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const testNotifications = [
    {
      type: 'new_order',
      title: 'New Order Received',
      body: 'Order #1234 from John Doe',
      icon: 'cart',
      color: '#10B981'
    },
    {
      type: 'order_update',
      title: 'Order Status Update',
      body: 'Order #1234 is ready for pickup',
      icon: 'checkmark-circle',
      color: '#3B82F6'
    },
    {
      type: 'verification_complete',
      title: 'Verification Complete',
      body: 'Your vendor account has been verified!',
      icon: 'shield-checkmark',
      color: '#8B5CF6'
    },
    {
      type: 'menu_approved',
      title: 'Menu Approved',
      body: 'Your menu has been approved and is now live',
      icon: 'restaurant',
      color: '#F59E0B'
    },
    {
      type: 'alert',
      title: 'Important Alert',
      body: 'Please update your business hours',
      icon: 'warning',
      color: '#EF4444'
    }
  ];

  const handleTestNotification = async (notification) => {
    try {
      await showLocalNotification(
        notification.title,
        notification.body,
        { 
          type: notification.type,
          testData: 'This is a test notification'
        }
      );
      ToastManager.info('Notification sent!');
    } catch (error) {
      console.error('Error sending notification:', error);
      ToastManager.error('Failed to send notification');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      ToastManager.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      ToastManager.error('Failed to clear notifications');
    }
  };

  const copyToClipboard = (text) => {
    // Note: In a real app, you'd use expo-clipboard
    ToastManager.info('Token logged to console');
    console.log('FCM Token:', text);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={48} color="#3B82F6" />
        <Text style={styles.title}>FCM Test Center</Text>
        <Text style={styles.subtitle}>
          Test Firebase Cloud Messaging integration
        </Text>
      </View>

      {/* FCM Token Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : fcmToken ? (
            <>
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenLabel}>Token:</Text>
                <Text style={styles.tokenText} numberOfLines={2}>
                  {fcmToken}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(fcmToken)}
              >
                <Ionicons name="copy-outline" size={20} color="#3B82F6" />
                <Text style={styles.copyButtonText}>Copy Token</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noTokenContainer}>
              <Ionicons name="alert-circle" size={32} color="#F59E0B" />
              <Text style={styles.noTokenText}>No FCM token registered</Text>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
              >
                <Text style={styles.registerButtonText}>Register Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* App Identifier */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>App Identifier:</Text>
          <Text style={styles.cardValue}>{appIdentifier}</Text>
          <Text style={[styles.cardLabel, { marginTop: 8 }]}>Platform:</Text>
          <Text style={styles.cardValue}>{Platform.OS}</Text>
        </View>
      </View>

      {/* Test Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        <Text style={styles.sectionDescription}>
          Tap any notification below to test local notifications
        </Text>

        {testNotifications.map((notification, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.notificationCard, { borderLeftColor: notification.color }]}
            onPress={() => handleTestNotification(notification)}
          >
            <View style={[styles.iconCircle, { backgroundColor: notification.color }]}>
              <Ionicons name={notification.icon} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationBody}>{notification.body}</Text>
              <Text style={styles.notificationType}>Type: {notification.type}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Re-register for Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleClearAll}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Clear All Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={loadFCMInfo}
        >
          <Ionicons name="reload-outline" size={20} color="#3B82F6" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Reload FCM Info
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.instructionsCard}>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Ensure you've granted notification permissions
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Tap any test notification to see it appear
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              Copy the FCM token to test server-side push notifications
            </Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>4</Text>
            <Text style={styles.instructionText}>
              Check console logs for detailed notification data
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          FCM Integration v1.0 • {Platform.OS === 'ios' ? 'iOS' : 'Android'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tokenContainer: {
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  copyButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  noTokenContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noTokenText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 14,
    color: '#111827',
    marginTop: 2,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#6B7280',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
