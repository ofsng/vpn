# ViralVPN Build Bilgileri

## Build Durumu

✅ **Android Preview Build (APK)** - Tamamlandı
- Dosya: `builds/viralvpn-preview.apk` (60MB)
- Build ID: `31d9f49f-c4a5-4d80-bd36-171ef97721d7`
- Version: 1.0.0
- Platform: Android
- Distribution: Internal
- Durum: Test için hazır

✅ **Android Production Build (AAB)** - Tamamlandı
- Dosya: `builds/viralvpn-production.aab` (27MB)
- Build ID: `aefe5e1c-beed-439b-9374-a063c0bfb8fd`
- Version: 1.0.1
- Platform: Android
- Distribution: Store (Google Play Store için)
- Durum: Yayın için hazır

✅ **Web Build** - Tamamlandı
- Klasör: `dist/`
- Dosyalar: HTML, CSS, JS, Assets
- Platform: Web
- Durum: Web sitesi olarak kullanıma hazır

## Production Domain Bilgileri

### Domain Yapısı
- **Ana Domain**: viralvpn.net
- **API Domain**: api.viralvpn.net
- **Admin Panel**: https://api.viralvpn.net/admin

### Environment Configuration
- **Development**: http://localhost:3000
- **Production**: https://api.viralvpn.net

## Backend Entegrasyonu

### Merkezi API Konfigürasyonu
- Dosya: `src/config/api.ts`
- Development: `http://localhost:3000`
- Production: `https://api.viralvpn.net`
- Tüm frontend'ler aynı backend'i kullanır

### Backend Server
- Port: 3000
- API Endpoints: `/api/*`
- Admin Panel: `/admin`
- CORS: Tüm origin'lere açık

## Build Komutları

### Mobil Uygulama
```bash
# Android Preview (APK)
eas build --platform android --profile preview

# Android Production (AAB)
eas build --platform android --profile production

# iOS (Apple Developer hesabı gerekli)
eas build --platform ios --profile preview
```

### Web Sitesi
```bash
# Web build
npx expo export --platform web

# Web build (production)
npx expo export --platform web --clear
```

### Production Deployment
```bash
# Production build'leri oluştur
./deploy-production.sh

# Local development
./deploy.sh
```

## Çalıştırma

### Geliştirme Modu
```bash
# Backend server
npm run server

# Web development
npm run web

# Android development
npm run android
```

### Production Modu
```bash
# Deployment script (hem backend hem web)
./deploy.sh

# Production deployment
./deploy-production.sh
```

## EAS Proje Bilgileri

- **Proje ID**: `931dc4ca-11b5-4436-8300-c5b6548d3f74`
- **Proje URL**: https://expo.dev/accounts/ofsng/projects/secure-vpn-app
- **Owner**: @ofsng

## Build Konfigürasyonu

### Android
- Package: `com.viralvpn.app`
- Version Code: 2
- Build Type: APK (Preview) / AAB (Production)
- Permissions: Internet, Network State, WiFi State

### iOS
- Bundle Identifier: `com.viralvpn.app`
- Build Number: 2
- Platform: iOS (Apple Developer hesabı gerekli)

### Web
- Framework: React Native Web + Expo Router
- Build Output: Static files (HTML, CSS, JS)
- Server: Any static file server

## Production Deployment

### DNS Ayarları
```
viralvpn.net        -> Web Server IP
api.viralvpn.net    -> Backend Server IP
www.viralvpn.net    -> viralvpn.net (CNAME)
```

### SSL Sertifikaları
- Let's Encrypt ile ücretsiz SSL
- Otomatik yenileme
- HTTPS zorunlu

### Server Gereksinimleri
- **Backend**: Node.js 18+, PM2, Nginx
- **Web**: Nginx, Static file hosting
- **SSL**: Let's Encrypt

## Dosya Yapısı

```
project/
├── builds/                 # Mobil build dosyaları
│   ├── viralvpn-preview.apk
│   └── viralvpn-production.aab
├── dist/                   # Web build dosyaları
│   ├── index.html
│   ├── _expo/
│   └── assets/
├── server/                 # Backend server
│   └── index.js
├── src/config/api.ts       # Merkezi API konfigürasyonu
├── deploy.sh              # Local deployment script
├── deploy-production.sh   # Production deployment script
├── env.production.example # Production environment örneği
└── DEPLOYMENT.md          # Deployment kılavuzu
```

## Sonraki Adımlar

1. **VPS Kurulumu**: Backend server için VPS al
2. **Domain Ayarları**: DNS kayıtlarını yapılandır
3. **SSL Sertifikaları**: Let's Encrypt ile SSL kur
4. **Backend Deployment**: server/ klasörünü VPS'e yükle
5. **Web Deployment**: dist/ klasörünü web server'a yükle
6. **Store Yükleme**: Mobil uygulamaları store'lara yükle

## Notlar

- Preview build'ler test için kullanılır
- Production build'ler store'a yüklenir
- iOS build için Apple Developer hesabı gereklidir
- Web build statik dosyalar olarak dağıtılır
- Tüm platformlar aynı backend API'yi kullanır
- Production'da HTTPS zorunlu
- Environment variables production'da güvenli şekilde saklanmalı 