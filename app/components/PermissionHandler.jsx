import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
// import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

const PermissionHandler = ({ onPermissionsGranted, children }) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'pending',
    mediaLibrary: 'pending',
    location: 'pending',
    audio: 'pending'
  });

  const permissions = [
    {
      key: 'camera',
      name: 'Camera',
      description: 'Take photos for your profile and menu items',
      icon: 'camera-outline',
      request: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === 'granted';
      }
    },
    {
      key: 'mediaLibrary',
      name: 'Photo Library',
      description: 'Select photos from your gallery',
      icon: 'images-outline',
      request: async () => {
        // Android uses system photo/document pickers which do not require persistent media permissions
        if (Platform.OS === 'android') {
          return true;
        }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
      }
    },
    {
      key: 'location',
      name: 'Location',
      description: 'Show your restaurant location to customers',
      icon: 'location-outline',
      request: async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
      }
    },
    {
      key: 'audio',
      name: 'Microphone',
      description: 'Record audio for customer support',
      icon: 'mic-outline',
      request: async () => {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
      }
    }
  ];

  useEffect(() => {
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    try {
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      // Skip media library permission checks on Android; not required when using system pickers
      const mediaLibraryStatus = Platform.OS === 'android'
        ? { status: 'granted' }
        : await ImagePicker.getMediaLibraryPermissionsAsync();
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const audioStatus = await Audio.getPermissionsAsync();

      const allGranted = 
        cameraStatus.status === 'granted' &&
        mediaLibraryStatus.status === 'granted' &&
        locationStatus.status === 'granted' &&
        audioStatus.status === 'granted';

      setPermissionStatus({
        camera: cameraStatus.status === 'granted' ? 'granted' : 'pending',
        mediaLibrary: mediaLibraryStatus.status === 'granted' ? 'granted' : 'pending',
        location: locationStatus.status === 'granted' ? 'granted' : 'pending',
        audio: audioStatus.status === 'granted' ? 'granted' : 'pending'
      });

      if (allGranted) {
        setPermissionsGranted(true);
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestAllPermissions = async () => {
    setIsRequesting(true);
    const newStatus = { ...permissionStatus };
    let allGranted = true;

    try {
      for (const permission of permissions) {
        if (permissionStatus[permission.key] !== 'granted') {
          const granted = await permission.request();
          newStatus[permission.key] = granted ? 'granted' : 'denied';
          if (!granted) {
            allGranted = false;
          }
        }
      }

      setPermissionStatus(newStatus);

      if (allGranted) {
        setPermissionsGranted(true);
        onPermissionsGranted();
      } else {
        Alert.alert(
          'Permissions Required',
          'Some permissions were denied. The app may not function properly. You can grant permissions later in your device settings.',
          [
            {
              text: 'Continue Anyway',
              onPress: () => {
                setPermissionsGranted(true);
                onPermissionsGranted();
              }
            },
            {
              text: 'Try Again',
              onPress: requestAllPermissions
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Error',
        'Failed to request permissions. Please try again.',
        [
          {
            text: 'Retry',
            onPress: requestAllPermissions
          },
          {
            text: 'Continue',
            onPress: () => {
              setPermissionsGranted(true);
              onPermissionsGranted();
            }
          }
        ]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'granted':
        return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
      case 'denied':
        return <Ionicons name="close-circle" size={20} color="#EF4444" />;
      default:
        return <Ionicons name="time-outline" size={20} color="#6B7280" />;
    }
  };

  if (permissionsGranted) {
    return children;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark-outline" size={60} color="#020A66" />
          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            PHPBells needs access to these features to provide the best experience
          </Text>
        </View>

        <View style={styles.permissionsList}>
          {permissions.map((permission) => (
            <View key={permission.key} style={styles.permissionItem}>
              <View style={styles.permissionIcon}>
                <Ionicons name={permission.icon} size={24} color="#020A66" />
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionName}>{permission.name}</Text>
                <Text style={styles.permissionDescription}>{permission.description}</Text>
              </View>
              <View style={styles.permissionStatus}>
                {getStatusIcon(permissionStatus[permission.key])}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            These permissions help us provide features like photo uploads, location services, and customer support.
          </Text>
          
          <TouchableOpacity
            style={[styles.button, isRequesting && styles.buttonDisabled]}
            onPress={requestAllPermissions}
            disabled={isRequesting}
          >
            <Text style={styles.buttonText}>
              {isRequesting ? 'Requesting Permissions...' : 'Grant Permissions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              setPermissionsGranted(true);
              onPermissionsGranted();
            }}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionsList: {
    flex: 1,
    marginBottom: 32,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionContent: {
    flex: 1,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  permissionStatus: {
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#020A66',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PermissionHandler;