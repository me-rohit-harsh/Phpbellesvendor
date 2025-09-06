import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  buttons = [],
  onDismiss,
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer;
    let backHandler;

    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close if enabled
      if (autoClose) {
        timer = setTimeout(() => {
          handleDismiss();
        }, autoCloseDelay);
      }

      // Handle back button on Android
      backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleDismiss();
        return true;
      });
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }

    // Cleanup function
    return () => {
      if (timer) clearTimeout(timer);
      if (backHandler) backHandler.remove();
    };
  }, [visible, autoClose, autoCloseDelay]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#10B981', bgColor: '#ECFDF5' };
      case 'error':
        return { name: 'close-circle', color: '#EF4444', bgColor: '#FEF2F2' };
      case 'warning':
        return { name: 'warning', color: '#F59E0B', bgColor: '#FFFBEB' };
      default:
        return { name: 'information-circle', color: '#3B82F6', bgColor: '#EFF6FF' };
    }
  };

  const iconConfig = getIconConfig();

  const defaultButtons = [
    {
      text: 'OK',
      style: 'default',
      onPress: handleDismiss,
    },
  ];

  const alertButtons = buttons.length > 0 ? buttons : defaultButtons;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleDismiss}
        >
          <Animated.View
            style={[
              styles.alertContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor }]}>
              <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              {title && <Text style={styles.title}>{title}</Text>}
              {message && <Text style={styles.message}>{message}</Text>}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {alertButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    alertButtons.length === 1 && styles.singleButton,
                    index === 0 && alertButtons.length > 1 && styles.firstButton,
                    index === alertButtons.length - 1 && alertButtons.length > 1 && styles.lastButton,
                  ]}
                  onPress={() => {
                    if (button.onPress) {
                      button.onPress();
                    } else {
                      handleDismiss();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                      button.style === 'destructive' && styles.destructiveButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 14,
    fontFamily: 'MyFont-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  button: {
    flex: 1,
    backgroundColor: '#020A66',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  singleButton: {
    flex: 1,
  },
  firstButton: {
    marginRight: 6,
  },
  lastButton: {
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    fontSize: 13,
    fontFamily: 'MyFont-SemiBold',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

export default CustomAlert;

// Helper function to show alerts
export const showCustomAlert = ({
  title,
  message,
  type = 'info',
  buttons = [],
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  // This would typically be managed by a global state or context
  // For now, we'll export the component and let individual screens manage the state
  return {
    title,
    message,
    type,
    buttons,
    autoClose,
    autoCloseDelay,
  };
};