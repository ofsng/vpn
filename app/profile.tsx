import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, hasSupabase } from '../src/lib/supabase';

interface ProfileData {
  email: string | null;
  status: string;
  expiry_date: string | null;
  license_key: string;
  remainingDays?: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const handleBack = () => router.back();

  useEffect(() => {
    const load = async () => {
      try {
        if (!hasSupabase || !supabase) {
          setError('Supabase ayarlari eksik. EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY tanimlayin.');
          return;
        }

        const licenseKey = await AsyncStorage.getItem('vpn_license');
        if (!licenseKey) {
          setError('Lisans bulunamadi. Lutfen tekrar giris yapin.');
          return;
        }

        const { data, error } = await supabase
          .from('licenses')
          .select('email, status, expiry_date, license_key')
          .eq('license_key', licenseKey)
          .single();

        if (error || !data) {
          setError('Profil verileri alinamada.');
          return;
        }

        let remainingDays: number | undefined;
        if (data.expiry_date) {
          const diff = new Date(data.expiry_date).getTime() - Date.now();
          remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        setProfile({ ...data, remainingDays });
      } catch (e) {
        console.error(e);
        setError('Beklenmeyen bir hata olustu.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: '#3B82F6' }}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 12, color: '#64748B' }}>Yukleniyor...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.center}>
            <Text style={{ color: '#EF4444' }}>{error}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/license')}>
              <Text style={styles.primaryBtnText}>Lisans Ekranina Don</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && profile && (
          <View style={styles.card}>
            <Text style={styles.label}>E-posta</Text>
            <Text style={styles.value}>{profile.email ?? '-'}</Text>

            <Text style={styles.label}>Lisans Anahtari</Text>
            <Text style={styles.value}>{profile.license_key}</Text>

            <Text style={styles.label}>Durum</Text>
            <Text style={styles.value}>{profile.status}</Text>

            <Text style={styles.label}>Bitis Tarihi</Text>
            <Text style={styles.value}>{profile.expiry_date ? new Date(profile.expiry_date).toLocaleString() : '-'}</Text>

            <Text style={styles.label}>Kalan Gun</Text>
            <Text style={styles.value}>{profile.remainingDays ?? '-'}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A8A' },
  content: { flex: 1, padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
  },
  label: { marginTop: 12, fontSize: 12, color: '#64748B' },
  value: { fontSize: 16, color: '#0F172A', fontWeight: '500' },
  primaryBtn: { marginTop: 16, backgroundColor: '#3B82F6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  primaryBtnText: { color: 'white', fontWeight: '600' },
});
