import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const NotificationToast = ({ 
  visible, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  duration = 3000,
  onHide,
  actionText,
  onActionPress
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          background: '#10B981',
          text: '#FFFFFF',
          icon: '#FFFFFF'
        };
      case 'error':
        return {
          background: '#EF4444',
          text: '#FFFFFF',
          icon: '#FFFFFF'
        };
      case 'warning':
        return {
          background: '#F59E0B',
          text: '#FFFFFF',
          icon: '#FFFFFF'
        };
      case 'info':
      default:
        return {
          background: '#3B82F6',
          text: '#FFFFFF',
          icon: '#FFFFFF'
        };
    }
  };

  if (!visible) {
    return null;
  }

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: colors.background
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name={getIconName()} 
          size={20} 
          color={colors.icon} 
          style={styles.icon}
        />
        
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {message}
        </Text>

        {actionText && onActionPress && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onActionPress}
          >
            <Text style={[styles.actionText, { color: colors.text }]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.closeButton}
          onPress={hideToast}
        >
          <Ionicons name="close" size={18} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Toast Manager for global notifications
class ToastManager {
  static toastRef = null;

  static setToastRef(ref) {
    this.toastRef = ref;
  }

  static show(message, type = 'info', duration = 3000, actionText = null, onActionPress = null) {
    if (this.toastRef) {
      this.toastRef.show(message, type, duration, actionText, onActionPress);
    }
  }

  static hide() {
    if (this.toastRef) {
      this.toastRef.hide();
    }
  }

  // Convenience methods
  static success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  static error(message, duration = 4000) {
    this.show(message, 'error', duration);
  }

  static warning(message, duration = 3500) {
    this.show(message, 'warning', duration);
  }

  static info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }
}

// Global Toast Component
const GlobalToast = React.forwardRef((props, ref) => {
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
    actionText: null,
    onActionPress: null
  });

  React.useImperativeHandle(ref, () => ({
    show: (message, type, duration, actionText, onActionPress) => {
      setToastConfig({
        visible: true,
        message,
        type,
        duration,
        actionText,
        onActionPress
      });
    },
    hide: () => {
      setToastConfig(prev => ({ ...prev, visible: false }));
    }
  }));

  const handleHide = () => {
    setToastConfig(prev => ({ ...prev, visible: false }));
  };

  return (
    <NotificationToast
      visible={toastConfig.visible}
      message={toastConfig.message}
      type={toastConfig.type}
      duration={toastConfig.duration}
      onHide={handleHide}
      actionText={toastConfig.actionText}
      onActionPress={toastConfig.onActionPress}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    borderRadius: 12,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: {
        elevation: 8
      }
    })
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56
  },
  icon: {
    marginRight: 12
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600'
  },
  closeButton: {
    marginLeft: 8,
    padding: 4
  }
});

export default NotificationToast;
export { ToastManager, GlobalToast };