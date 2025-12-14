# ViralVPN Vercel Deployment Kılavuzu

## 🚀 Vercel ile Deployment (Önerilen)

Vercel, React Native Web uygulamaları için mükemmel bir platform. Hem web sitesi hem de API'yi aynı yerde host edebilirsin.

### Avantajları
- ✅ Ücretsiz plan mevcut
- ✅ Otomatik SSL sertifikası
- ✅ Global CDN
- ✅ Otomatik deployment
- ✅ Serverless API desteği
- ✅ Custom domain desteği

## 📋 Vercel Deployment Adımları

### 1. Vercel CLI Kurulumu
```bash
# Vercel CLI kurulumu
npm install -g vercel

# Vercel'e giriş yap
vercel login
```

### 2. Proje Hazırlığı
```bash
# Web build oluştur
npm run build:vercel

# Vercel'e deploy et
vercel --prod
```

### 3. Environment Variables Ayarlama
Vercel Dashboard'da environment variables ayarla:

```bash
# Vercel Dashboard > Settings > Environment Variables
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
JWT_SECRET=your-secure-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Custom Domain Ayarlama
```bash
# Vercel Dashboard > Settings > Domains
# viralvpn.net ve api.viralvpn.net ekle

# DNS ayarları:
# A Record: viralvpn.net -> Vercel IP
# CNAME: www.viralvpn.net -> viralvpn.net
```

## 🔧 Vercel Konfigürasyonu

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

### API Konfigürasyonu Güncelleme
```typescript
// src/config/api.ts
export const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000',
    apiURL: 'http://localhost:3000/api'
  },
  production: {
    baseURL: 'https://viralvpn.net',
    apiURL: 'https://viralvpn.net/api'
  }
};
```

## 📱 Mobil Uygulama Güncelleme

### API URL Güncelleme
Mobil uygulamalarda API URL'yi Vercel domain'ine güncelle:

```typescript
// src/config/api.ts
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_URL = isDevelopment 
  ? 'http://localhost:3000/api' 
  : 'https://viralvpn.net/api';
```

### Yeni Build Alma
```bash
# Android production build
eas build --platform android --profile production

# iOS production build
eas build --platform ios --profile production
```

## 🌐 cPanel Hosting ile Deployment

### cPanel Avantajları
- ✅ Kolay kullanım
- ✅ PHP desteği
- ✅ MySQL veritabanı
- ✅ Email hosting
- ✅ SSL sertifikası

### cPanel Deployment Adımları

#### 1. Web Sitesi Deployment
```bash
# Web build oluştur
npm run build:web:production

# dist/ klasörünü cPanel File Manager'a yükle
# public_html/ klasörüne dist/ içeriğini kopyala
```

#### 2. API için Node.js Hosting
cPanel'de Node.js uygulaması oluştur:

```bash
# cPanel > Node.js Apps > Create Application
# Application name: viralvpn-api
# Node.js version: 18.x
# Application mode: Production
# Application URL: api.viralvpn.net
```

#### 3. Backend Dosyalarını Yükleme
```bash
# server/ klasörünü cPanel'e yükle
# package.json ve node_modules gerekli

# Environment variables ayarla
# cPanel > Environment Variables
```

#### 4. Domain Ayarları
```bash
# cPanel > Domains > Add Domain
# viralvpn.net -> public_html/
# api.viralvpn.net -> Node.js app
```

## 🔄 Deployment Karşılaştırması

| Özellik | Vercel | cPanel | VPS |
|---------|--------|--------|-----|
| Kurulum Kolaylığı | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Maliyet | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Performans | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Özelleştirme | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| SSL | Otomatik | Manuel | Manuel |
| CDN | Global | Yok | Manuel |

## 🚀 Hızlı Vercel Deployment

### Tek Komutla Deployment
```bash
# Tüm projeyi Vercel'e deploy et
npm run deploy:vercel
```

### Manuel Deployment
```bash
# 1. Web build oluştur
npm run build:vercel

# 2. Vercel'e deploy et
vercel --prod

# 3. Custom domain ekle
vercel domains add viralvpn.net
```

## 📊 Monitoring

### Vercel Analytics
- Vercel Dashboard > Analytics
- Real-time performance monitoring
- Error tracking
- User analytics

### cPanel Monitoring
- cPanel > Metrics
- Resource usage
- Error logs
- Access logs

## 🔒 Security

### Vercel Security
- Otomatik DDoS koruması
- SSL sertifikası
- Environment variables encryption
- Serverless güvenlik

### cPanel Security
- ModSecurity
- SSL sertifikası
- IP blocking
- File permissions

## 💡 Öneriler

### Vercel için
1. **Başlangıç**: Vercel ile başla (kolay ve hızlı)
2. **Domain**: Custom domain ekle
3. **SSL**: Otomatik SSL aktif
4. **Monitoring**: Vercel Analytics kullan

### cPanel için
1. **Hosting**: Node.js destekli hosting seç
2. **SSL**: Let's Encrypt SSL kur
3. **Database**: MySQL kullan
4. **Backup**: Düzenli backup al

## 🎯 Sonuç

**Vercel önerilen seçenek** çünkü:
- Kurulum çok kolay
- Ücretsiz plan yeterli
- Otomatik SSL ve CDN
- Serverless API desteği
- Global performans

**cPanel alternatif** olarak:
- Daha fazla kontrol
- PHP desteği gerekirse
- Email hosting dahil
- Daha düşük maliyet

Her iki seçenek de VPS'e göre çok daha kolay ve hızlı! 