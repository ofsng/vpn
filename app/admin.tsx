import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, Switch } from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getApiUrl, API_ENDPOINTS } from '../src/config/api';

interface License {
  id: string;
  key: string;
  email: string;
  createdAt: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended';
  plan?: 'monthly' | 'yearly';
}

interface User {
  id: string;
  email: string;
  licenseKey: string;
  lastLogin: string;
  totalUsage: number;
  status: 'active' | 'inactive' | 'suspended';
  currentServer?: string;
}

interface Server {
  id: string;
  name: string;
  country: string;
  city: string;
  ip: string;
  port: number;
  status: 'online' | 'offline' | 'maintenance';
  users: number;
  maxUsers: number;
  bandwidth: number;
  isActive: boolean;
}

interface PurchaseRequest {
  id: string;
  email: string;
  plan: 'monthly' | 'yearly';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  price: number;
  created_at: string;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
}

export default function AdminScreen() {
  console.log('🕰️ Admin sayfası yüklendi');
  
  const [activeTab, setActiveTab] = useState<'licenses' | 'users' | 'servers' | 'purchase-requests'>('licenses');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{visible: boolean, id: string, title: string}>({visible: false, id: '', title: ''});
  const [formData, setFormData] = useState({
    email: '',
    plan: 'monthly', // 'monthly' veya 'yearly'
    name: '',
    country: '',
    city: '',
    ip: '',
    port: '',
    licenseKey: '',
    purchaseRequestId: '', // Purchase request ID'si
  });
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    console.log('🎉 Toast gösteriliyor:', { message, type });
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const forceLogout = async () => {
    await AsyncStorage.multiRemove(['admin_logged_in', 'admin_token']);
    router.replace('/admin-login');
  };

  // API bağlantısını test et
  const testConnection = async () => {
    try {
      console.log('🔍 Bağlantı testi başlatılıyor...');
      const response = await fetch(getApiUrl('/health'));
      console.log('🌐 Health check:', { status: response.status, ok: response.ok });
      const data = await response.json();
      console.log('📊 Health data:', data);
      return response.ok;
    } catch (error) {
      console.error('💥 Bağlantı testi hatası:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('admin_token');
        const isLoggedIn = await AsyncStorage.getItem('admin_logged_in');

        if (!token || isLoggedIn !== 'true') {
          await forceLogout();
          return;
        }

        const verifyResponse = await fetch(getApiUrl('/admin/verify'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (!verifyResponse.ok) {
          await forceLogout();
          return;
        }

        setAdminToken(token);
      } catch (error) {
        console.error('Admin auth check error:', error);
        await forceLogout();
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab, adminToken]);

  const loadData = async () => {
    try {
      if (!adminToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const apiUrl = getApiUrl(`/${activeTab}`);
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.status === 401) {
        await forceLogout();
        return;
      }

      const data = await response.json();

      if (activeTab === 'licenses') setLicenses(data);
      else if (activeTab === 'users') setUsers(data);
      else if (activeTab === 'servers') setServers(data);
      else if (activeTab === 'purchase-requests') setPurchaseRequests(data);
    } catch (error) {
      console.error('LoadData hata:', error);
      Alert.alert('Hata', 'Veriler y?klenirken hata olu?tu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (activeTab === 'purchase-requests') {
      // Purchase requests sadece müşterilerden gelir, manuel eklenmez
      showToast('Satın alma talepleri sadece müşterilerden gelir', 'error');
      return;
    }
    
    setEditingItem(null);
    setErrors({});
    setFormData({
      email: '',
      plan: 'monthly',
      name: '',
      country: '',
      city: '',
      ip: '',
      port: '',
      licenseKey: '',
      purchaseRequestId: '',
    });
    setModalVisible(true);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (activeTab === 'licenses') {
      if (!formData.email.trim()) {
        newErrors.email = 'E-posta adresi gerekli';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Geçerli bir e-posta adresi girin';
      }
      
      if (!formData.plan) {
        newErrors.plan = 'Plan seçimi gerekli';
      }
    }
    
    if (activeTab === 'users') {
      if (!formData.email.trim()) {
        newErrors.email = 'E-posta adresi gerekli';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Geçerli bir e-posta adresi girin';
      }
      
      if (!formData.licenseKey.trim()) {
        newErrors.licenseKey = 'Lisans anahtarı gerekli';
      }
    }
    
    if (activeTab === 'servers') {
      if (!formData.name.trim()) {
        newErrors.name = 'Sunucu adı gerekli';
      }
      
      if (!formData.country.trim()) {
        newErrors.country = 'Ülke gerekli';
      }
      
      if (!formData.city.trim()) {
        newErrors.city = 'Şehir gerekli';
      }
      
      if (!formData.ip.trim()) {
        newErrors.ip = 'IP adresi gerekli';
      } else if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(formData.ip)) {
        newErrors.ip = 'Geçerli bir IP adresi girin';
      }
      
      if (!formData.port.trim()) {
        newErrors.port = 'Port gerekli';
      } else if (!/^\d+$/.test(formData.port) || parseInt(formData.port) < 1 || parseInt(formData.port) > 65535) {
        newErrors.port = 'Geçerli bir port (1-65535) girin';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    // Form validation
    if (!validateForm()) {
      return;
    }

    if (!adminToken) {
      await forceLogout();
      return;
    }

    try {
      let saveData = { ...formData };
      
      // License için bitiş tarihi otomatik hesapla
      if (activeTab === 'licenses') {
        const now = new Date();
        const daysToAdd = formData.plan === 'yearly' ? 365 : 30;
        const expiryDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        
        saveData = {
          ...formData,
          expiryDate: expiryDate.toISOString(),
          // Purchase request ID'sini de ekle (eğer varsa)
          purchaseRequestId: formData.purchaseRequestId || undefined
        };
        
        console.log('📅 Otomatik bitiş tarihi hesaplandı:', {
          plan: formData.plan,
          daysToAdd,
          expiryDate: expiryDate.toISOString(),
          purchaseRequestId: formData.purchaseRequestId
        });
      }
      
      const url = getApiUrl(`/${activeTab}`);
      const method = editingItem ? 'PUT' : 'POST';
      const finalUrl = editingItem ? `${url}/${editingItem.id}` : url;
      
      console.log('📦 Saving data:', { method, finalUrl, saveData });
      
      const response = await fetch(finalUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(saveData),
      });

      if (response.status === 401) {
        await forceLogout();
        return;
      }

      if (response.ok) {
        const action = editingItem ? 'güncellendi' : 'oluşturuldu';
        const successMessage = formData.purchaseRequestId ? 
          `${getTabTitle()} başarıyla ${action} ve satın alma talebi tamamlandı` :
          `${getTabTitle()} başarıyla ${action}`;
        
        showToast(successMessage, 'success');
        setModalVisible(false);
        setErrors({});
        
        // Purchase request'den geliyorsa, purchase-requests sekmesindeki veriyi de yenile
        if (formData.purchaseRequestId) {
          // Önce licenses sekmesini yenile
          loadData();
          // Sonra purchase-requests sekmesine geç ve veriyi yenile
          setTimeout(() => {
            setActiveTab('purchase-requests');
          }, 1000);
        } else {
          loadData();
        }
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Kaydedilirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast('Sunucuya ulaşılamadı', 'error');
    }
  };

  const handleDelete = (id: string) => {
    console.log('🚨 handleDelete çağrıldı:', { id, activeTab });
    console.log('🌐 API_URL:', getApiUrl(`/${activeTab}/${id}`));
    
    // Alert yerine custom modal kullan
    setConfirmDelete({
      visible: true,
      id: id,
      title: getTabTitle()
    });
  };

  const executeDelete = async () => {
    const id = confirmDelete.id;
    console.log('🔥 Silme onaylandı, işlem başlıyor...');
    
    // Önce bağlantıyı test et
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('😫 Sunucuya bağlanılamıyor!');
      showToast('Sunucuya bağlanılamıyor', 'error');
      setConfirmDelete({visible: false, id: '', title: ''});
      return;
    }

    if (!adminToken) {
      await forceLogout();
      return;
    }

    try {
      console.log('🗑️ Silme işlemi başlatıldı:', { id, activeTab });
      
      const response = await fetch(getApiUrl(`/${activeTab}/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
      });

      if (response.status === 401) {
        await forceLogout();
        return;
      }

      console.log('🔄 Silme response:', {
        status: response.status,
        ok: response.ok,
        url: response.url
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Silme başarılı:', result);
        showToast(`${confirmDelete.title} başarıyla silindi`, 'success');
        loadData();
      } else {
        const errorData = await response.json();
        console.error('❌ Silme hatası:', errorData);
        showToast(errorData.error || 'Silinirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('💥 Silme işlemi hata:', error);
      showToast('Sunucuya ulaşılamıyor', 'error');
    } finally {
      setConfirmDelete({visible: false, id: '', title: ''});
    }
  };

  const handleLogout = async () => {
    await forceLogout();
  };


  const renderLicenseItem = ({ item }: { item: License }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.key}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>{item.status === 'active' ? 'Aktif' : 'Süresi Dolmuş'}</Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>{item.email}</Text>
      <Text style={styles.itemDate}>Bitiş: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('tr-TR') : 'Tarih belirtilmemiş'}</Text>
      <Text style={styles.itemUsage}>Plan: {item.plan === 'yearly' ? 'Yıllık (365 gün)' : 'Aylık (30 gün)'}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => {
          setEditingItem(item);
          setFormData({ 
            email: item.email || '', 
            plan: item.plan || 'monthly', 
            name: '', 
            country: '', 
            city: '', 
            ip: '', 
            port: '', 
            licenseKey: '',
            purchaseRequestId: ''
          });
          setModalVisible(true);
        }}>
          <Text style={styles.actionButtonText}>Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => {
          console.log('🔴 SİL BUTONUNA TIKLANDI! ID:', item.id);
          handleDelete(item.id);
        }}>
          <Text style={styles.actionButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.email}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10B981' : '#6B7280' }]}>
          <Text style={styles.statusText}>{item.status === 'active' ? 'Aktif' : 'Pasif'}</Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>Lisans: {item.licenseKey || 'Lisans yok'}</Text>
      <Text style={styles.itemDate}>Son Giriş: {item.lastLogin ? new Date(item.lastLogin).toLocaleDateString('tr-TR') : 'Giriş yok'}</Text>
      <Text style={styles.itemUsage}>Kullanım: {item.totalUsage ? (item.totalUsage / (1024 * 1024)).toFixed(2) : '0.00'} MB</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => {
          setEditingItem(item);
          setFormData({ 
            email: item.email, 
            licenseKey: item.licenseKey,
            name: '', 
            country: '', 
            city: '', 
            ip: '', 
            port: '', 
            expiryDate: '',
            purchaseRequestId: ''
          });
          setModalVisible(true);
        }}>
          <Text style={styles.actionButtonText}>Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => {
          console.log('🔴 SİL BUTONUNA TIKLANDI! ID:', item.id);
          handleDelete(item.id);
        }}>
          <Text style={styles.actionButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServerItem = ({ item }: { item: Server }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.name || 'İsimsiz Sunucu'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'online' ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>{item.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}</Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>{item.city || 'Bilinmeyen Şehir'}, {item.country || 'Bilinmeyen Ülke'}</Text>
      <Text style={styles.itemDate}>IP: {item.ip || 'N/A'}:{item.port || 'N/A'}</Text>
      <Text style={styles.itemUsage}>Kullanıcılar: {item.users || 0}/{item.maxUsers || 100}</Text>
      <View style={styles.itemActions}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => {
          setEditingItem(item);
          setFormData({ 
            name: item.name || '', 
            country: item.country || '', 
            city: item.city || '', 
            ip: item.ip || '', 
            port: item.port ? item.port.toString() : '', 
            email: '', 
            expiryDate: '',
            licenseKey: '',
            purchaseRequestId: ''
          });
          setModalVisible(true);
        }}>
          <Text style={styles.actionButtonText}>Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => {
          console.log('🔴 SİL BUTONUNA TIKLANDI! ID:', item.id);
          handleDelete(item.id);
        }}>
          <Text style={styles.actionButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPurchaseRequestItem = ({ item }: { item: PurchaseRequest }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.email}</Text>
        <View style={[styles.statusBadge, { backgroundColor: 
          item.status === 'completed' ? '#10B981' : 
          item.status === 'processing' ? '#F59E0B' :
          item.status === 'failed' || item.status === 'cancelled' ? '#EF4444' : '#6B7280'
        }]}>
          <Text style={styles.statusText}>
            {item.status === 'pending' ? 'Bekliyor' :
             item.status === 'processing' ? 'İşleniyor' :
             item.status === 'completed' ? 'Tamamlandı' :
             item.status === 'failed' ? 'Başarısız' : 'İptal'}
          </Text>
        </View>
      </View>
      <Text style={styles.itemSubtitle}>Plan: {item.plan === 'yearly' ? 'Yıllık' : 'Aylık'} - ${item.price}</Text>
      <Text style={styles.itemDate}>Tarih: {new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
      <Text style={styles.itemUsage}>Durum: {item.admin_notes || 'Admin notu yok'}</Text>
      <View style={styles.itemActions}>
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={() => {
              // Admin bu email için lisans oluşturabilir
              setFormData({
                email: item.email,
                plan: item.plan,
                name: '',
                country: '',
                city: '',
                ip: '',
                port: '',
                licenseKey: '',
                purchaseRequestId: item.id // Purchase request ID'sini ekle
              });
              setActiveTab('licenses');
              setModalVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>Lisans Oluştur</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => {
          console.log('🔴 SİL BUTONUNA TIKLANDI! ID:', item.id);
          handleDelete(item.id);
        }}>
          <Text style={styles.actionButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCurrentData = () => {
    if (activeTab === 'licenses') return licenses;
    if (activeTab === 'users') return users;
    if (activeTab === 'servers') return servers;
    if (activeTab === 'purchase-requests') return purchaseRequests;
    return [];
  };

  const getCurrentRenderer = () => {
    if (activeTab === 'licenses') return renderLicenseItem;
    if (activeTab === 'users') return renderUserItem;
    if (activeTab === 'servers') return renderServerItem;
    if (activeTab === 'purchase-requests') return renderPurchaseRequestItem;
    return renderLicenseItem;
  };

  const getTabTitle = () => {
    if (activeTab === 'licenses') return 'Lisans Yönetimi';
    if (activeTab === 'users') return 'Kullanıcı Yönetimi';
    if (activeTab === 'servers') return 'Sunucu Yönetimi';
    if (activeTab === 'purchase-requests') return 'Satın Alma Talepleri';
    return '';
  };

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'licenses') return renderLicenseItem({ item });
    if (activeTab === 'users') return renderUserItem({ item });
    if (activeTab === 'servers') return renderServerItem({ item });
    if (activeTab === 'purchase-requests') return renderPurchaseRequestItem({ item });
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Çıkış</Text>
          </TouchableOpacity>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backButtonText}>← Geri</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'licenses' && styles.activeTab]} 
          onPress={() => setActiveTab('licenses')}
        >
          <Text style={[styles.tabText, activeTab === 'licenses' && styles.activeTabText]}>Lisanslar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Kullanıcılar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'servers' && styles.activeTab]} 
          onPress={() => setActiveTab('servers')}
        >
          <Text style={[styles.tabText, activeTab === 'servers' && styles.activeTabText]}>Sunucular</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'purchase-requests' && styles.activeTab]} 
          onPress={() => setActiveTab('purchase-requests')}
        >
          <Text style={[styles.tabText, activeTab === 'purchase-requests' && styles.activeTabText]}>Satın Alma</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>{getTabTitle()}</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>+ Yeni</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={getCurrentData()}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Düzenle' : 'Yeni Ekle'}
            </Text>
            
            {activeTab === 'licenses' && (
              <>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="E-posta adresi"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Plan Seçimi:</Text>
                  <View style={styles.planButtons}>
                    <TouchableOpacity 
                      style={[styles.planButton, formData.plan === 'monthly' && styles.planButtonActive]}
                      onPress={() => {
                        setFormData({ ...formData, plan: 'monthly' });
                        if (errors.plan) setErrors({ ...errors, plan: '' });
                      }}
                    >
                      <Text style={[styles.planButtonText, formData.plan === 'monthly' && styles.planButtonTextActive]}>Aylık (30 gün)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.planButton, formData.plan === 'yearly' && styles.planButtonActive]}
                      onPress={() => {
                        setFormData({ ...formData, plan: 'yearly' });
                        if (errors.plan) setErrors({ ...errors, plan: '' });
                      }}
                    >
                      <Text style={[styles.planButtonText, formData.plan === 'yearly' && styles.planButtonTextActive]}>Yıllık (365 gün)</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.plan && <Text style={styles.errorText}>{errors.plan}</Text>}
                </View>
              </>
            )}

            {activeTab === 'servers' && (
              <>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  placeholder="Sunucu adı"
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                
                <TextInput
                  style={[styles.input, errors.country ? styles.inputError : null]}
                  placeholder="Ülke"
                  value={formData.country}
                  onChangeText={(text) => {
                    setFormData({ ...formData, country: text });
                    if (errors.country) setErrors({ ...errors, country: '' });
                  }}
                />
                {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
                
                <TextInput
                  style={[styles.input, errors.city ? styles.inputError : null]}
                  placeholder="Şehir"
                  value={formData.city}
                  onChangeText={(text) => {
                    setFormData({ ...formData, city: text });
                    if (errors.city) setErrors({ ...errors, city: '' });
                  }}
                />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                
                <TextInput
                  style={[styles.input, errors.ip ? styles.inputError : null]}
                  placeholder="IP adresi (192.168.1.1)"
                  value={formData.ip}
                  onChangeText={(text) => {
                    setFormData({ ...formData, ip: text });
                    if (errors.ip) setErrors({ ...errors, ip: '' });
                  }}
                />
                {errors.ip && <Text style={styles.errorText}>{errors.ip}</Text>}
                
                <TextInput
                  style={[styles.input, errors.port ? styles.inputError : null]}
                  placeholder="Port (1-65535)"
                  value={formData.port}
                  onChangeText={(text) => {
                    setFormData({ ...formData, port: text });
                    if (errors.port) setErrors({ ...errors, port: '' });
                  }}
                  keyboardType="numeric"
                />
                {errors.port && <Text style={styles.errorText}>{errors.port}</Text>}
              </>
            )}

            {activeTab === 'users' && (
              <>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="E-posta adresi"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                
                <TextInput
                  style={[styles.input, errors.licenseKey ? styles.inputError : null]}
                  placeholder="Lisans anahtarı"
                  value={formData.licenseKey}
                  onChangeText={(text) => {
                    setFormData({ ...formData, licenseKey: text });
                    if (errors.licenseKey) setErrors({ ...errors, licenseKey: '' });
                  }}
                  autoCapitalize="none"
                />
                {errors.licenseKey && <Text style={styles.errorText}>{errors.licenseKey}</Text>}
              </>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {toast && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
      
      {/* Silme Onay Modalı */}
      {confirmDelete.visible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={confirmDelete.visible}
          onRequestClose={() => setConfirmDelete({visible: false, id: '', title: ''})}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Silme Onayı</Text>
              <Text style={{textAlign: 'center', marginBottom: 20, color: '#6B7280'}}>
                Bu {confirmDelete.title.toLowerCase()} öğesini silmek istediğinizden emin misiniz?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    console.log('🚫 Silme iptal edildi');
                    setConfirmDelete({visible: false, id: '', title: ''});
                  }}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, {backgroundColor: '#EF4444'}]}
                  onPress={() => {
                    console.log('✅ Silme onaylandı, executeDelete çağrılıyor');
                    executeDelete();
                  }}
                >
                  <Text style={styles.saveButtonText}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemUsage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  planButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  planButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  planButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  planButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  planButtonTextActive: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  toast: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 99999,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 
