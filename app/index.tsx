import React, { useEffect, useState } from 'react';

import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// import { Shield } from '../components/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect } from 'expo-router';
import { checkLicenseOnFocus } from '../src/services/licenseChecker';

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasLicense, setHasLicense] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Added for the new button

  console.log('WelcomeScreen render ediliyor');

  useEffect(() => {
    // Check if user has a stored license
    const checkLicense = async () => {
      try {
        const license = await AsyncStorage.getItem('vpn_license');
        setHasLicense(!!license);
        setLoading(false);
      } catch (error) {
        console.error('Error checking license:', error);
        setLoading(false);
      }
    };

    checkLicense();
  }, []);

  // Re-check when screen gains focus (web + native)
  useFocusEffect(
    React.useCallback(() => {
      const refresh = async () => {
        try {
          // Lisans durumunu kontrol et
          await checkLicenseOnFocus();
          
          // License varlığını yenile
          const license = await AsyncStorage.getItem('vpn_license');
          setHasLicense(!!license);
        } catch (e) {
          console.error('Error refreshing license on focus:', e);
        }
      };
      refresh();
      return () => {};
    }, [])
  );

  const handleContinue = () => {
    router.push('/servers');
  };

  const handleEnterLicense = () => {
    router.push('/license');
  };

  const handlePurchase = () => {
    router.push('/purchase');
  };

  const handleConnect = () => {
    setIsConnected(!isConnected);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🛡️</Text>
          <Text style={styles.logoText}>viralvpn</Text>
        </View>
        
        <Text style={styles.subtitle}>Hızlı, güvenli ve özel VPN hizmeti</Text>
        
        <View style={styles.buttonContainer}>
          {hasLicense && (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleContinue}
            >
              <Text style={styles.buttonTextPrimary}>Mevcut lisansla devam et</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, hasLicense ? styles.secondaryButton : styles.primaryButton]}
            onPress={handleEnterLicense}
          >
            <Text style={hasLicense ? styles.buttonTextSecondary : styles.buttonTextPrimary}>
              Lisans anahtarı gir
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handlePurchase}
          >
            <Text style={styles.buttonTextSecondary}>Lisans satın al</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleConnect}>
            <Text style={styles.buttonText}>
              {isConnected ? 'Bağlantıyı Kes' : 'Bağlan'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  adminButton: {
    backgroundColor: '#4F46E5', // A different color for admin button
  },
});