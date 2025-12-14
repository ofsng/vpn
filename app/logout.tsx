import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        console.log('LogoutScreen: starting logout flow');
        await AsyncStorage.multiRemove([
          'vpn_license',
          'vpn_servers',
          'vpn_expiry',
          'vpn_selected_server',
          'vpn_auto_connect',
          'vpn_kill_switch',
        ]);
        try { await AsyncStorage.clear(); } catch {}

        if (Platform.OS === 'web') {
          try {
            window.localStorage?.clear?.();
            window.sessionStorage?.clear?.();
          } catch {}
          try { router.replace('/'); } catch {}
          const target = (window.location?.origin || '') + '/';
          setTimeout(() => { window.location.replace(target); }, 20);
        } else {
          router.replace('/');
        }
      } catch (e) {
        console.error('LogoutScreen error:', e);
        try { router.replace('/'); } catch {}
      }
    };

    run();
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={{ marginTop: 12, color: '#64748B' }}>Çıkış yapılıyor…</Text>
    </View>
  );
}
