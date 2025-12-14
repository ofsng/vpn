import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, Alert, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [autoConnect, setAutoConnect] = useState(false);
  const [killSwitch, setKillSwitch] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const license = await AsyncStorage.getItem('vpn_license');
        const expiry = await AsyncStorage.getItem('vpn_expiry');
        const savedAutoConnect = await AsyncStorage.getItem('vpn_auto_connect');
        const savedKillSwitch = await AsyncStorage.getItem('vpn_kill_switch');
        
        if (license) {
          setLicenseKey(license);
        }
        
        if (expiry) {
          setExpiryDays(expiry);
        }
        
        if (savedAutoConnect) {
          setAutoConnect(savedAutoConnect === 'true');
        }
        
        if (savedKillSwitch) {
          setKillSwitch(savedKillSwitch === 'true');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleToggleAutoConnect = async (value: boolean) => {
    setAutoConnect(value);
    await AsyncStorage.setItem('vpn_auto_connect', value.toString());
  };

  const handleToggleKillSwitch = async (value: boolean) => {
    setKillSwitch(value);
    await AsyncStorage.setItem('vpn_kill_switch', value.toString());
  };

  const performLogout = async () => {
    try {
      // Clear all VPN-related data
      await AsyncStorage.multiRemove([
        'vpn_license',
        'vpn_servers',
        'vpn_expiry',
        'vpn_selected_server',
      ]);
      // Extra safety: clear any remaining keys
      try { await AsyncStorage.clear(); } catch {}

      // Navigate to home screen (web fallback)
      console.log('Logout: cleared storage, navigating to /');
      if (Platform.OS === 'web') {
        // Force full reload on web to avoid stale state
        try {
          // Extra: clear browser storages too
          window.localStorage?.clear?.();
          window.sessionStorage?.clear?.();
        } catch {}
        // Do both: router replace and hard reload shortly after
        try { router.replace('/'); } catch {}
        const target = (window.location?.origin || '') + '/';
        setTimeout(() => { window.location.replace(target); }, 50);
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Hata', 'Çıkış yapılamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Çıkış yapmak istediğinizden emin misiniz? Bu işlem lisans bilgilerinizi silecektir.');
      if (ok) {
        try { router.replace('/logout'); } catch { window.location.assign('/logout'); }
      }
      return;
    }

    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz? Bu işlem lisans bilgilerinizi silecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: performLogout },
      ]
    );
  };

  const handleLicense = () => {
    router.push('/license');
  };

  const handleSubscription = () => {
    router.push('/purchase');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const settingsItems = [
    {
      id: 'license',
      title: 'Lisans Yönetimi',
      subtitle: 'Lisans anahtarınızı görüntüleyin veya değiştirin',
      icon: '🔐',
      onPress: handleLicense,
    },
    {
      id: 'subscription',
      title: 'Abonelik',
      subtitle: 'Abonelik planınızı yönetin',
      icon: '🛡️',
      onPress: handleSubscription,
    },
    {
      id: 'profile',
      title: 'Profil',
      subtitle: 'Hesap bilgilerinizi yönetin',
      icon: '👤',
      onPress: handleProfile,
    },
    {
      id: 'logout',
      title: 'Çıkış Yap',
      subtitle: 'Hesabınızdan çıkış yapın',
      icon: '🚪',
      onPress: handleLogout,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: '#3B82F6' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.settingItem,
              item.destructive && styles.destructiveItem,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.settingIcon}>
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={[
                styles.settingTitle,
                item.destructive && styles.destructiveText,
              ]}>
                {item.title}
              </Text>
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  destructiveItem: {
    backgroundColor: '#FEE2E2',
  },
  destructiveText: {
    color: '#EF4444',
  },
});