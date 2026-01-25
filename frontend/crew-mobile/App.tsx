import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import AppNavigator from './src/navigation/AppNavigator';
import { AssignmentProvider } from './src/context/AssignmentContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Preload images
const preloadImages = async () => {
  const images = [
    require('./assets/csbg.png'),
    require('./assets/logo.png'),
  ];

  const cacheImages = images.map(image => {
    return Asset.fromModule(image).downloadAsync();
  });

  await Promise.all(cacheImages);
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load images
        await preloadImages();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen once the root view has performed layout
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AssignmentProvider>
          <AppNavigator />
        </AssignmentProvider>
      </SafeAreaProvider>
    </View>
  );
}
