import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PersistentStorage from '../../lib/storage/persistentStorage';

const ProgressIndicator = ({ currentStep, totalSteps, showAutoSaveStatus = true }) => {
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [recoveryData, setRecoveryData] = useState(null);

  const percentage = Math.round((currentStep / totalSteps) * 100);

  useEffect(() => {
    checkRecoveryData();
  }, []);

  const checkRecoveryData = async () => {
    try {
      const data = await PersistentStorage.checkRecoverableData();
      setRecoveryData(data);
    } catch (error) {
      console.error('Error checking recovery data:', error);
    }
  };

  const updateAutoSaveStatus = (status, timestamp = null) => {
    setAutoSaveStatus(status);
    if (timestamp) {
      setLastSaveTime(timestamp);
    }
  };

  const formatLastSaveTime = (timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
  };

  const getAutoSaveIcon = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'sync-outline';
      case 'saved':
        return 'checkmark-circle-outline';
      case 'error':
        return 'alert-circle-outline';
      default:
        return 'cloud-outline';
    }
  };

  const getAutoSaveColor = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return '#3B82F6';
      case 'saved':
        return '#10B981';
      case 'error':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getAutoSaveText = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaveTime ? `Saved ${formatLastSaveTime(lastSaveTime)}` : 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return 'Auto-save enabled';
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Registration Progress</Text>
          <Text style={styles.progressText}>
            Step {currentStep} of {totalSteps} ({percentage}%)
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${percentage}%` }
              ]} 
            />
          </View>
        </View>

        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <View
                key={stepNumber}
                style={[
                  styles.stepIndicator,
                  isCompleted && styles.stepCompleted,
                  isCurrent && styles.stepCurrent
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    isCurrent && styles.stepNumberCurrent
                  ]}>
                    {stepNumber}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Auto-save Status */}
      {showAutoSaveStatus && (
        <View style={styles.autoSaveSection}>
          <View style={styles.autoSaveStatus}>
            <Ionicons 
              name={getAutoSaveIcon()} 
              size={16} 
              color={getAutoSaveColor()} 
            />
            <Text style={[styles.autoSaveText, { color: getAutoSaveColor() }]}>
              {getAutoSaveText()}
            </Text>
          </View>
          
          {recoveryData?.canRecover && (
            <TouchableOpacity 
              style={styles.recoveryBadge}
              onPress={() => checkRecoveryData()}
            >
              <Ionicons name="refresh-outline" size={14} color="#F59E0B" />
              <Text style={styles.recoveryText}>Recovery available</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// Expose methods to update auto-save status from parent components
ProgressIndicator.updateAutoSaveStatus = null;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      },
      android: {
        elevation: 2
      }
    })
  },
  progressSection: {
    marginBottom: 12
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280'
  },
  progressBarContainer: {
    marginBottom: 16
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepCompleted: {
    backgroundColor: '#10B981'
  },
  stepCurrent: {
    backgroundColor: '#3B82F6'
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  stepNumberCurrent: {
    color: '#FFFFFF'
  },
  autoSaveSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  autoSaveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  autoSaveText: {
    fontSize: 12,
    fontWeight: '500'
  },
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  recoveryText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#F59E0B'
  }
});

export default ProgressIndicator;