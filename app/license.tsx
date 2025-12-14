import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateLicense } from '../src/services/license';

export default function LicenseScreen() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handlePurchase = () => {
    router.push('/purchase');
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!licenseKey.trim()) {
      setError('Lütfen bir lisans anahtarı girin');
      return;
    }
    
    // Format validation
    const licensePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!licensePattern.test(licenseKey.trim())) {
      setError('Lisans anahtarı formatı: XXXX-XXXX-XXXX-XXXX (büyük harf ve rakam)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await validateLicense(licenseKey.trim());
      console.log('validateLicense result:', result);

      if (result.status === 'valid') {
        await AsyncStorage.setItem('vpn_license', licenseKey.trim());
        if (result.servers) {
          await AsyncStorage.setItem('vpn_servers', JSON.stringify(result.servers));
        }
        if (typeof result.remainingDays === 'number') {
          await AsyncStorage.setItem('vpn_expiry', result.remainingDays.toString());
        }
        router.replace('/servers');
      } else if (result.status === 'invalid') {
        setError('Bu lisans anahtarı geçersiz. Lütfen doğru anahtarı girin.');
      } else if (result.status === 'expired') {
        setError('Bu lisansın süresi dolmuş. Yeni bir lisans satın alın.');
      } else {
        setError('Lisans doğrulanamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('License validation error:', error);
      if (error.message && error.message.includes('fetch')) {
        setError('İnternet bağlantınızı kontrol edin ve tekrar deneyin.');
      } else {
        setError('Sunucu ile bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: '#3B82F6' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lisans Anahtarı</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={{ fontSize: 80, color: '#3B82F6' }}>🛡️</Text>
          <Text style={styles.logoText}>viralvpn</Text>
        </View>
        
        <Text style={styles.description}>
          Lisans anahtarınızı girin ve VPN hizmetimize erişim sağlayın
        </Text>
        
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Lisans Anahtarı</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={licenseKey}
            onChangeText={(text) => {
              setLicenseKey(text);
              if (error) setError(''); // Clear error when user types
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <TouchableOpacity
            style={[styles.button, loading ? styles.buttonLoading : (licenseKey.trim() ? null : styles.buttonDisabled)]}
            onPress={handleSubmit}
            disabled={!licenseKey.trim() || loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>Doğrulanıyor...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Lisansı Doğrula</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.purchaseButton}
            onPress={handlePurchase}
          >
            <Text style={styles.purchaseButtonText}>Lisans satın al</Text>
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
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    marginVertical: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  buttonLoading: {
    backgroundColor: '#1E40AF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});