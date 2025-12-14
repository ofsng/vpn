import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateLicense } from './license';
import { router } from 'expo-router';

export interface LicenseStatus {
  isValid: boolean;
  isExpired: boolean;
  isDeleted: boolean;
  remainingDays: number;
  shouldLogout: boolean;
}

// Lisans durumunu kontrol et ve gerekirse logout yap
export async function checkLicenseAndLogout(): Promise<LicenseStatus> {
  try {
    const licenseKey = await AsyncStorage.getItem('vpn_license');

    if (!licenseKey) {
      await handleLogout();
      return {
        isValid: false,
        isExpired: false,
        isDeleted: true,
        remainingDays: 0,
        shouldLogout: true,
      };
    }

    const result = await validateLicense(licenseKey);

    // Sunucudan gelen durumlara göre karar ver
    if (result.status === 'expired' || (typeof result.remainingDays === 'number' && result.remainingDays <= 0)) {
      await handleLogout();
      return {
        isValid: false,
        isExpired: true,
        isDeleted: false,
        remainingDays: 0,
        shouldLogout: true,
      };
    }

    if (result.status === 'invalid') {
      await handleLogout();
      return {
        isValid: false,
        isExpired: false,
        isDeleted: true,
        remainingDays: 0,
        shouldLogout: true,
      };
    }

    if (result.status === 'valid') {
      const remaining = result.remainingDays ?? 0;
      await AsyncStorage.setItem('vpn_expiry', remaining.toString());
      return {
        isValid: true,
        isExpired: false,
        isDeleted: false,
        remainingDays: remaining,
        shouldLogout: false,
      };
    }

    // Sunucu erişim hatası: logout etme, tekrar denemeye izin ver
    if (result.status === 'error') {
      return {
        isValid: false,
        isExpired: false,
        isDeleted: false,
        remainingDays: 0,
        shouldLogout: false,
      };
    }

    // Beklenmeyen durumlarda güvenli tarafta kal
    await handleLogout();
    return {
      isValid: false,
      isExpired: false,
      isDeleted: false,
      remainingDays: 0,
      shouldLogout: true,
    };
  } catch (error) {
    console.error('License check error:', error);
    return {
      isValid: false,
      isExpired: false,
      isDeleted: false,
      remainingDays: 0,
      shouldLogout: false,
    };
  }
}

// Logout işlemi
async function handleLogout() {
  try {
    await AsyncStorage.multiRemove([
      'vpn_license',
      'vpn_servers',
      'vpn_expiry',
      'vpn_selected_server',
    ]);

    router.replace('/license');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Otomatik lisans kontrolü (belirli aralıklarla)
export function startLicenseMonitoring(intervalMinutes: number = 5) {
  return setInterval(async () => {
    await checkLicenseAndLogout();
  }, intervalMinutes * 60 * 1000);
}

// Sayfa odaklandığında lisans kontrolü
export async function checkLicenseOnFocus() {
  return await checkLicenseAndLogout();
}
