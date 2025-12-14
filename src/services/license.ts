import { API_URL } from '../config/api';

export interface LicenseValidationResult {
  status: 'valid' | 'invalid' | 'expired' | 'error';
  remainingDays?: number;
  servers?: any[];
}

export async function validateLicense(key: string): Promise<LicenseValidationResult> {
  try {
    const response = await fetch(`${API_URL}/validate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey: key }),
    });

    const data = await response.json();
    
    return {
      status: data.status === 'expired' ? 'expired' : (data.status || 'invalid'),
      remainingDays: data.remainingDays,
      servers: data.servers,
    };
  } catch (error) {
    console.error('License validation error:', error);
    return { status: 'error' };
  }
}
