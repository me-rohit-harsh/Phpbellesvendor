import { Stack } from "expo-router";
import useCustomFonts from "../hooks/useFonts";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { GlobalToast, ToastManager } from './components/NotificationToast';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useCustomFonts();
  const [appReady, setAppReady] = useState(false);
  const toastRef = useRef(null);

  useEffect(() => {
    // Initialize toast manager
    if (toastRef.current) {
      ToastManager.setToastRef(toastRef.current);
    }

    // Set a timeout to ensure app doesn't hang if fonts fail to load
    const timeout = setTimeout(() => {
      console.log('RootLayout: Proceeding without waiting for fonts');
      setAppReady(true);
      SplashScreen.hideAsync();
    }, 2000); // 2 second timeout

    if (fontsLoaded) {
      console.log('RootLayout: Fonts loaded successfully');
      clearTimeout(timeout);
      setAppReady(true);
      SplashScreen.hideAsync();
    }

    return () => clearTimeout(timeout);
  }, [fontsLoaded]);

  // Don't render anything until app is ready
  if (!appReady) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalToast ref={toastRef} />
    </>
  );
}
