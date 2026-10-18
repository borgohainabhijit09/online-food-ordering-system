import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useCustomerStore } from './src/store/useCustomerStore';

export default function App() {
  const loadStoredProfile = useCustomerStore((s) => s.loadStoredProfile);
  const loadStoredAddresses = useCustomerStore((s) => s.loadStoredAddresses);

  useEffect(() => {
    loadStoredProfile();
    loadStoredAddresses();
  }, [loadStoredProfile, loadStoredAddresses]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
