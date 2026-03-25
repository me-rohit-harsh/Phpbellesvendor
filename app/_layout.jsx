import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import useCustomFonts from "../hooks/useFonts";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { GlobalToast, ToastManager } from './components/NotificationToast';
import PermissionHandler from './components/PermissionHandler';
import AppErrorBoundary from './components/AppErrorBoundary';
import { useFCMNotifications } from '../hooks/useFCMNotifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useCustomFonts();
  const [appReady, setAppReady] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const toastRef = useRef(null);

  // Initialize FCM notifications
  useFCMNotifications({
    autoRegister: true,
    onNotificationReceived: (notification) => {
      console.info('🔔 Global notification handler:', notification);
    },
    onNotificationTapped: (response) => {
      console.info('🔔 Global notification tap handler:', response);
    }
  });

  // Initialize toast manager
  useEffect(() => {
    if (appReady && toastRef.current) {
      ToastManager.setToastRef(toastRef.current);
    }
  }, [appReady]);

  useEffect(() => {
    // Set a timeout to ensure app doesn't hang if fonts fail to load
    const timeout = setTimeout(() => {
      if (!appReady) {
        console.info('RootLayout: Proceeding without waiting for fonts');
        setAppReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 3000); // 3 second timeout

    if (fontsLoaded && !appReady) {
      console.info('RootLayout: Fonts loaded successfully');
      clearTimeout(timeout);
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }

    return () => clearTimeout(timeout);
  }, [fontsLoaded, appReady]);

  const handlePermissionsGranted = () => {
    setPermissionsGranted(true);
  };

  // Keep the splash screen visible until app is ready
  if (!appReady) {
    return null;
  }

  // Show permission handler before main app
  if (!permissionsGranted) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <AppErrorBoundary>
          <PermissionHandler onPermissionsGranted={handlePermissionsGranted}>
            <Stack screenOptions={{ headerShown: false }} />
          </PermissionHandler>
          <GlobalToast ref={toastRef} />
        </AppErrorBoundary>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <AppErrorBoundary>
        <Stack screenOptions={{ headerShown: false }} />
        <GlobalToast ref={toastRef} />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
