import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../src/config/api';
// import { ArrowLeft, ShoppingCart, CheckCircle2 } from '../components/Icons';

export default function PurchaseScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handlePurchase = async (plan: string) => {
    // Form validation
    if (!email.trim()) {
      setError('Lütfen email adresinizi girin');
      return;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Geçerli bir email adresi girin');
      return;
    }
    
    if (!plan) {
      setError('Lütfen bir plan seçin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 Satın alma talebi oluşturuluyor...', { email: email.trim(), plan });
      console.log('🌍 API_URL:', API_URL);
      
      const requestUrl = `${API_URL}/purchase-request`;
      console.log('🔗 Request URL:', requestUrl);
      
      const requestBody = {
        email: email.trim(),
        plan: plan,
        status: 'pending'
      };
      console.log('📦 Request Body:', requestBody);
      
      // Backend'e email ve plan bilgisini gönder
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📨 Response Status:', response.status);
      console.log('📨 Response OK:', response.ok);
      console.log('📨 Response Headers:', response.headers);

      console.log('📨 Response Status:', response.status);
      console.log('📨 Response OK:', response.ok);
      console.log('📨 Response Headers:', response.headers);

      if (!response.ok) {
        console.error('❌ Response not OK, reading as text...');
        const responseText = await response.text();
        console.error('📝 Response Text:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Satın alma talebi oluşturulamadı');
        } catch (parseError) {
          console.error('❌ JSON parse hatası, HTML döndü:', parseError);
          throw new Error('Sunucu hatası: Backend erişilemiyor veya yanlış URL');
        }
      }

      const responseText = await response.text();
      console.log('📝 Response Text:', responseText);
      
      const result = JSON.parse(responseText);
      console.log('✅ Satın alma talebi oluşturuldu:', result);

      // Stripe checkout'a yönlendir
      if (result.stripeUrl) {
        // Production'da Stripe checkout sayfasına yönlendirilecek
        Alert.alert(
          'Ödeme Sayfasına Yönlendiriliyor',
          `Email: ${email}\nPlan: ${plan}\n\nStripe ödeme sayfasına yönlendirileceksiniz.`,
          [
            {
              text: 'Tamam',
              onPress: () => {
                // window.open(result.stripeUrl, '_blank'); // Web için
                Alert.alert('Demo Mod', 'Gerçek ortamda Stripe sayfasına yönlendirileceksiniz.');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '🎉 Başarıyla Kayıt Oluşturuldu!',
          `Tebrikler! Ödemeniz başarıyla tamamlandı.\n\n📧 Email: ${email}\n📋 Plan: ${plan === 'yearly' ? 'Yıllık (365 gün)' : 'Aylık (30 gün)'}\n💰 Ödenen: ${plan === 'yearly' ? '$59.99' : '$9.99'}\n\n✅ Lisansınız başarıyla oluşturuldu ve en kısa zamanda mailinize iletilecektir.\n\n⏰ Genellikle 5-10 dakika içinde email alırsınız.\n\n📧 Sorularınız için: destek@viralvpn.net`,
          [
            { text: 'Harika!', onPress: () => router.back() }
          ]
        );
      }
    } catch (error) {
      console.error('💥 Satın alma hatası:', error);
      setError(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Aylık',
      price: '$9.99',
      duration: 'aylık',
      features: ['Tüm sunuculara erişim', 'Sınırsız bant genişliği', '1 cihaz bağlantısı'],
      popular: false,
    },
    {
      id: 'yearly',
      name: 'Yıllık',
      price: '$59.99',
      duration: 'yıllık',
      features: ['Tüm sunuculara erişim', 'Sınırsız bant genişliği', '5 cihaz bağlantısı', 'Öncelikli destek'],
      popular: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: '#3B82F6' }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lisans Satın Al</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Text style={{ fontSize: 80, color: '#3B82F6' }}>🛡️</Text>
          <Text style={styles.logoText}>viralvpn</Text>
        </View>
        
        <Text style={styles.description}>
          VPN hizmetimizi kullanmaya başlamak için email adresinizi girin ve bir lisans planı seçin
        </Text>
        
        {/* Email Input */}
        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>Email Adresi</Text>
          <TextInput
            style={[styles.emailInput, error && error.includes('email') ? styles.inputError : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(''); // Clear error when user types
            }}
            placeholder="ornek@email.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>
        
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
          <TouchableOpacity 
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
          >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popüler</Text>
            </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planDuration}>{plan.duration}</Text>
            
            <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={{ fontSize: 16, color: '#10B981' }}>✅</Text>
                    <Text style={styles.featureText}>{feature}</Text>
              </View>
                ))}
              </View>
              
              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={{ fontSize: 20, color: '#10B981' }}>✅</Text>
              </View>
              )}
            </TouchableOpacity>
          ))}
            </View>
            
            <TouchableOpacity 
          style={[styles.purchaseButton, { opacity: (selectedPlan && email.trim() && !loading) ? 1 : 0.5 }]}
          onPress={() => handlePurchase(selectedPlan)}
          disabled={!selectedPlan || !email.trim() || loading}
            >
          {loading ? (
            <Text style={styles.purchaseButtonText}>Yükleniyor...</Text>
          ) : (
            <>
              <Text style={{ fontSize: 20, color: '#FFFFFF' }}>💳</Text>
              <Text style={styles.purchaseButtonText}>Satın Al</Text>
            </>
          )}
          </TouchableOpacity>
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
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emailContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  emailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  plansContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPlan: {
    backgroundColor: '#3B82F6',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  planDuration: {
    fontSize: 14,
    color: '#64748B',
  },
  planFeatures: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1E293B',
    marginLeft: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  purchaseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});