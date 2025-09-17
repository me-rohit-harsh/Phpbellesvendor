import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform
} from 'react-native';
import PersistentStorage from '../../lib/storage/persistentStorage';

const DataRecovery = ({ onRecover, onDiscard, visible, onClose }) => {
  const [recoveryData, setRecoveryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      checkRecoverableData();
    }
  }, [visible]);

  const checkRecoverableData = async () => {
    try {
      setLoading(true);
      const data = await PersistentStorage.checkRecoverableData();
      setRecoveryData(data);
    } catch (error) {
      console.error('Error checking recoverable data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    try {
      const registrationData = await PersistentStorage.getRegistrationData();
      onRecover?.(registrationData);
      onClose?.();
    } catch (error) {
      console.error('Error recovering data:', error);
      Alert.alert('Error', 'Failed to recover data. Please try again.');
    }
  };

  const handleDiscard = async () => {
    Alert.alert(
      'Discard Saved Data',
      'Are you sure you want to discard all saved progress? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              await PersistentStorage.clearAllTempData();
              onDiscard?.();
              onClose?.();
            } catch (error) {
              console.error('Error discarding data:', error);
              Alert.alert('Error', 'Failed to discard data. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (!visible || loading) {
    return null;
  }

  if (!recoveryData?.canRecover) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Recover Your Progress</Text>
            <Text style={styles.subtitle}>
              We found some unsaved progress from your previous session
            </Text>
          </View>

          <View style={styles.content}>
            {recoveryData.hasRegistrationData && (
              <View style={styles.dataItem}>
                <Text style={styles.dataTitle}>Registration Progress</Text>
                <Text style={styles.dataDescription}>
                  Step {recoveryData.registrationProgress?.currentStep} of {recoveryData.registrationProgress?.totalSteps}
                  {' '}({recoveryData.registrationProgress?.percentage}% complete)
                </Text>
              </View>
            )}

            {recoveryData.formDrafts?.length > 0 && (
              <View style={styles.dataItem}>
                <Text style={styles.dataTitle}>Form Drafts</Text>
                <Text style={styles.dataDescription}>
                  {recoveryData.formDrafts.length} unsaved form{recoveryData.formDrafts.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {recoveryData.lastActivity && (
              <View style={styles.dataItem}>
                <Text style={styles.dataTitle}>Last Activity</Text>
                <Text style={styles.dataDescription}>
                  {recoveryData.lastActivity}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.discardButton]}
              onPress={handleDiscard}
            >
              <Text style={styles.discardButtonText}>Start Fresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.recoverButton]}
              onPress={handleRecover}
            >
              <Text style={styles.recoverButtonText}>Recover Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12
      },
      android: {
        elevation: 8
      }
    })
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20
  },
  content: {
    marginBottom: 24
  },
  dataItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4
  },
  dataDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  discardButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d'
  },
  recoverButton: {
    backgroundColor: '#007bff'
  },
  recoverButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});

export default DataRecovery;