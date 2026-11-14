import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  Stack,
  ThemeProvider,
  DefaultTheme,
  usePathname,
} from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

function FocusManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
    }
  }, [pathname]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <FocusManager />

      <AnimatedSplashOverlay />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#F4F8F1',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="profile" />
      </Stack>
    </ThemeProvider>
  );
}