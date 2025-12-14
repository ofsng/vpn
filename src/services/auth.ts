import { API_URL } from '../config/api';

export interface AdminLoginResult {
  success: boolean;
  token?: string;
}

export async function loginAdmin(username: string, password: string): Promise<AdminLoginResult> {
  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    const success = !!data.token;
    return { success, token: data.token };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false };
  }
}
