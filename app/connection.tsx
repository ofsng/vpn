import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkLicenseAndLogout, checkLicenseOnFocus, startLicenseMonitoring } from '../src/services/licenseChecker';

// VPN API functions
const connectVPN = async (accessKey: string) => {
  // Simulated connection - in real app this would connect to VPN
  console.log('Connecting to VPN with access key:', accessKey);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
  return {
    success: true,
    ip: '192.168.1.' + Math.floor(Math.random() * 254 + 1) // Random IP
  };
};

const disconnectVPN = async () => {
  // Simulated disconnection
  console.log('Disconnecting from VPN');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

type Server = {
  id: string;
  country: string;
  name: string;
  speed: string;
  accessKey: string;
};

export default function ConnectionScreen() {
  const router = useRouter();
  const [server, setServer] = useState<Server | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);
  const [ipAddress, setIpAddress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load selected server
    const loadServer = async () => {
      try {
        // Önce lisans durumunu kontrol et
        console.log('🔍 Connection sayfasında lisans kontrol ediliyor...');
        const licenseStatus = await checkLicenseAndLogout();
        
        if (licenseStatus.shouldLogout) {
          console.log('🚫 Lisans geçersiz, bağlantı sayfası kapatılıyor');
          return; // Logout oldu, işlemi durdur
        }
        
        const serverJson = await AsyncStorage.getItem('vpn_selected_server');
        if (serverJson) {
          setServer(JSON.parse(serverJson));
          handleConnect(JSON.parse(serverJson));
        }
      } catch (error) {
        console.error('Error loading server:', error);
        setError('Sunucu bilgileri yüklenemedi');
      }
    };

    loadServer();
    
    // Periyodik lisans kontrolü başlat (5 dakikada bir)
    const monitoringInterval = startLicenseMonitoring(5);

    // Clean up on unmount
    return () => {
      if (isConnected) {
        handleDisconnect();
      }
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        console.log('📋 Connection sayfasında lisans izleme durduruldu');
      }
    };
  }, []);

  // Sayfa odaklandığında lisans kontrol et
  useFocusEffect(
    React.useCallback(() => {
      const checkOnFocus = async () => {
        await checkLicenseOnFocus();
      };
      checkOnFocus();
      return () => {};
    }, [])
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnected) {
      timer = setInterval(() => {
        setConnectionTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  const handleConnect = async (serverData: Server) => {
    if (!serverData) return;
    
    setConnecting(true);
    setError('');
    
    try {
      const result = await connectVPN(serverData.accessKey);
      if (result.success) {
        setIsConnected(true);
        setIpAddress(result.ip || '192.168.1.XXX');  // Using mock IP if none provided
      } else {
        setError('VPN bağlantısı başarısız');
      }
    } catch (error) {
      console.error('VPN connection error:', error);
      setError('VPN bağlantısı sırasında bir hata oluştu');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectVPN();
      setIsConnected(false);
      setConnectionTime(0);
    } catch (error) {
      console.error('VPN disconnection error:', error);
    }
  };

  const handleBack = () => {
    if (isConnected) {
      handleDisconnect();
    }
    router.back();
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleChangeServer = () => {
    router.push('/servers');
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: '#3B82F6' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VPN Bağlantısı</Text>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Text style={{ fontSize: 24, color: '#1E3A8A' }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIcon,
            { backgroundColor: isConnected ? '#10B981' : connecting ? '#F59E0B' : '#EF4444' }
          ]}>
            <Text style={{ fontSize: 48, color: '#FFFFFF' }}>
              {isConnected ? '🛡️' : connecting ? '⏳' : '📶'}
            </Text>
        </View>
        
          <Text style={[
            styles.statusText,
            { color: isConnected ? '#10B981' : connecting ? '#F59E0B' : '#EF4444' }
          ]}>
            {isConnected ? 'Bağlandı' : connecting ? 'Bağlanıyor...' : 'Bağlantı Kesildi'}
        </Text>
          
          {connecting && (
            <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 16 }} />
          )}
        </View>
        
        {server && (
          <View style={styles.serverInfo}>
            <Text style={styles.serverTitle}>Bağlı Sunucu</Text>
            <View style={styles.serverDetails}>
              <Text style={{ fontSize: 24, marginRight: 8 }}>🌐</Text>
              <View>
                <Text style={styles.serverCountry}>{server.country}</Text>
                <Text style={styles.serverName}>{server.name}</Text>
              </View>
            </View>
          </View>
        )}
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        <View style={styles.infoContainer}>
          {isConnected && (
            <>
              <View style={styles.infoRow}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>📶</Text>
                <Text style={styles.infoLabel}>IP Adresi:</Text>
                <Text style={styles.infoValue}>{ipAddress}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>📊</Text>
                <Text style={styles.infoLabel}>Bağlantı süresi:</Text>
                <Text style={styles.infoValue}>{formatTime(connectionTime)}</Text>
              </View>
            </>
          )}
        </View>
        
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[
              styles.connectButton,
              isConnected ? styles.disconnectButton : styles.connectButton
            ]}
            onPress={isConnected ? handleDisconnect : () => server && handleConnect(server)}
            disabled={connecting}
          >
            <Text style={styles.connectButtonText}>
              {isConnected ? 'Bağlantıyı Kes' : 'Bağlan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.changeServerButton} onPress={handleChangeServer}>
            <Text style={styles.changeServerButtonText}>Sunucu Değiştir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>📊</Text>
            <Text style={styles.statLabel}>Bağlantı Süresi</Text>
            <Text style={styles.statValue}>{formatTime(connectionTime)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>📶</Text>
            <Text style={styles.statLabel}>Veri Transferi</Text>
            <Text style={styles.statValue}>0 MB</Text>
          </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  serverInfo: {
    marginBottom: 32,
  },
  serverTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  serverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverCountry: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  serverName: {
    fontSize: 16,
    color: '#64748B',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A8A',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    textAlign: 'right',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  connectButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    width: '48%',
  },
  disconnectButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 16,
    width: '48%',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  changeServerButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    width: '48%',
  },
  changeServerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: '#64748B',
  },
  settingsButton: {
    padding: 8,
  },
});