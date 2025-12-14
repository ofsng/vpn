# ViralVPN cPanel Deployment Kılavuzu

## 🌐 cPanel Hosting ile Deployment

cPanel hosting ile ViralVPN'i kolayca deploy edebilirsin. Hem web sitesi hem de API'yi aynı hosting'de çalıştırabilirsin.

### Gereksinimler
- ✅ cPanel hosting (Node.js desteği olan)
- ✅ Domain: viralvpn.net
- ✅ SSL sertifikası
- ✅ Node.js 18+ desteği

## 📋 cPanel Deployment Adımları

### 1. Web Sitesi Deployment

#### Web Build Oluşturma
```bash
# Web build oluştur
npm run build:web:production

# dist/ klasörü hazır
```

#### cPanel File Manager ile Yükleme
1. **cPanel'e giriş yap**
2. **File Manager** aç
3. **public_html/** klasörüne git
4. **dist/** klasöründeki tüm dosyaları yükle:
   - `index.html`
   - `favicon.ico`
   - `_expo/` klasörü
   - `assets/` klasörü

#### .htaccess Dosyası Oluşturma
```apache
# public_html/.htaccess
RewriteEngine On
RewriteBase /

# API isteklerini Node.js'e yönlendir
RewriteRule ^api/(.*)$ /api/$1 [L]

# SPA routing için
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Cache ayarları
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
    ExpiresByType image/icon "access plus 1 year"
    ExpiresByType text/plain "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType application/x-shockwave-flash "access plus 1 month"
    ExpiresByType image/vnd.microsoft.icon "access plus 1 year"
</IfModule>
```

### 2. API (Backend) Deployment

#### cPanel Node.js App Oluşturma
1. **cPanel > Node.js Apps**
2. **Create Application** tıkla
3. **Ayarları doldur:**
   - **Application name**: `viralvpn-api`
   - **Node.js version**: `18.x`
   - **Application mode**: `Production`
   - **Application URL**: `api.viralvpn.net`
   - **Application root**: `/home/username/viralvpn-api`

#### Backend Dosyalarını Yükleme
```bash
# server/ klasörünü cPanel'e yükle
# File Manager > viralvpn-api klasörü

# Gerekli dosyalar:
- server/index.js
- package.json
- node_modules/ (npm install ile oluştur)
- .env.production
```

#### package.json (cPanel için)
```json
{
  "name": "viralvpn-api",
  "version": "1.0.0",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^11.1.0",
    "stripe": "^18.2.1"
  }
}
```

#### Environment Variables Ayarlama
cPanel > Environment Variables:
```bash
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://api.viralvpn.net
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
JWT_SECRET=your-secure-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Domain Ayarları

#### Subdomain Oluşturma
1. **cPanel > Subdomains**
2. **Create Subdomain:**
   - **Subdomain**: `api`
   - **Domain**: `viralvpn.net`
   - **Document Root**: `/home/username/viralvpn-api`

#### DNS Ayarları
```bash
# A Records
viralvpn.net        -> cPanel hosting IP
api.viralvpn.net    -> cPanel hosting IP

# CNAME Records
www.viralvpn.net    -> viralvpn.net
```

### 4. SSL Sertifikası

#### Let's Encrypt SSL
1. **cPanel > SSL/TLS**
2. **Let's Encrypt SSL**
3. **Issue** tıkla:
   - **Domain**: `viralvpn.net`
   - **Subdomain**: `api.viralvpn.net`

#### SSL Redirect
```apache
# public_html/.htaccess (SSL redirect ekle)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## 🔧 cPanel Konfigürasyonu

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
    apiURL: 'https://api.viralvpn.net/api'
  }
};
```

### Backend CORS Ayarları
```javascript
// server/index.js
app.use(cors({
  origin: [
    'https://viralvpn.net',
    'https://www.viralvpn.net',
    'http://localhost:8080'
  ],
  credentials: true
}));
```

## 📱 Mobil Uygulama Güncelleme

### API URL Güncelleme
```typescript
// src/config/api.ts
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_URL = isDevelopment 
  ? 'http://localhost:3000/api' 
  : 'https://api.viralvpn.net/api';
```

### Yeni Build Alma
```bash
# Android production build
eas build --platform android --profile production

# iOS production build
eas build --platform ios --profile production
```

## 🚀 Hızlı cPanel Deployment

### Otomatik Deployment Script
```bash
#!/bin/bash
# deploy-cpanel.sh

echo "🚀 ViralVPN cPanel Deployment"

# Web build
echo "🌐 Web build oluşturuluyor..."
npm run build:web:production

echo "📁 Dosyalar hazır:"
echo "   - dist/ klasörü -> public_html/"
echo "   - server/ klasörü -> viralvpn-api/"
echo ""
echo "📋 Manuel adımlar:"
echo "   1. cPanel File Manager aç"
echo "   2. dist/ içeriğini public_html/ yükle"
echo "   3. server/ içeriğini viralvpn-api/ yükle"
echo "   4. Node.js app başlat"
echo "   5. SSL sertifikası kur"
```

## 📊 Monitoring

### cPanel Monitoring
- **cPanel > Metrics**: Resource usage
- **cPanel > Error Logs**: Error tracking
- **cPanel > Access Logs**: User analytics
- **cPanel > Node.js Apps**: App status

### Performance Monitoring
```bash
# Node.js app durumu
cPanel > Node.js Apps > viralvpn-api > Status

# Logları görüntüle
cPanel > Node.js Apps > viralvpn-api > Logs
```

## 🔒 Security

### cPanel Security
- **ModSecurity**: WAF koruması
- **SSL/TLS**: HTTPS zorunlu
- **IP Blocker**: Kötü IP'leri engelle
- **File Permissions**: Güvenli dosya izinleri

### Environment Variables
```bash
# Güvenli şifreler kullan
ADMIN_PASSWORD=your-very-strong-password-123
JWT_SECRET=your-super-secure-jwt-secret-key-456
```

## 🚨 Troubleshooting

### Yaygın Sorunlar

#### 1. Node.js App Başlamıyor
```bash
# Logları kontrol et
cPanel > Node.js Apps > Logs

# Environment variables kontrol et
cPanel > Environment Variables

# Port çakışması kontrol et
cPanel > Node.js Apps > Settings
```

#### 2. API Çalışmıyor
```bash
# CORS ayarları kontrol et
# Domain ayarları kontrol et
# SSL sertifikası kontrol et
```

#### 3. Web Sitesi Yüklenmiyor
```bash
# .htaccess dosyası kontrol et
# File permissions kontrol et
# DNS ayarları kontrol et
```

## 💡 cPanel Avantajları

### ✅ Kolay Kullanım
- Görsel arayüz
- Tek tıkla kurulum
- Otomatik yedekleme

### ✅ Maliyet Avantajı
- VPS'e göre daha ucuz
- Tüm servisler dahil
- Email hosting dahil

### ✅ Güvenlik
- ModSecurity WAF
- Otomatik güvenlik güncellemeleri
- SSL sertifikası

### ✅ Destek
- 7/24 teknik destek
- Detaylı dokümantasyon
- Video kılavuzlar

## 🎯 Sonuç

**cPanel hosting mükemmel seçenek** çünkü:
- ✅ Kurulum kolay
- ✅ Maliyet düşük
- ✅ Güvenlik yüksek
- ✅ Destek mevcut
- ✅ Tüm servisler dahil

**Vercel'e alternatif** olarak:
- Daha fazla kontrol
- Email hosting dahil
- PHP desteği
- Daha düşük maliyet

Her iki seçenek de VPS'e göre çok daha pratik! 