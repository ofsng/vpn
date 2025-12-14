#!/bin/bash

# ViralVPN cPanel Deployment Script
# Bu script cPanel hosting için hazırlık yapar

echo "🚀 ViralVPN cPanel Deployment Script Başlatılıyor..."

# Environment variables for production
export NODE_ENV=production
export NEXT_PUBLIC_API_URL=https://api.viralvpn.net

echo "📋 Production Environment Variables:"
echo "   - NODE_ENV: $NODE_ENV"
echo "   - API_URL: $NEXT_PUBLIC_API_URL"
echo ""

# Production web build
echo "🌐 Production web build oluşturuluyor..."
npx expo export --platform web --clear

# cPanel için package.json oluştur
echo "📦 cPanel için package.json oluşturuluyor..."
cat > server/package.json << 'EOF'
{
  "name": "viralvpn-api",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
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
EOF

# .htaccess dosyası oluştur
echo "🔧 .htaccess dosyası oluşturuluyor..."
cat > dist/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# API isteklerini Node.js'e yönlendir
RewriteRule ^api/(.*)$ /api/$1 [L]

# SPA routing için
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# SSL redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

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
EOF

echo ""
echo "✅ cPanel deployment hazırlığı tamamlandı!"
echo ""
echo "📋 cPanel Deployment Adımları:"
echo ""
echo "🌐 Web Sitesi:"
echo "   1. cPanel > File Manager aç"
echo "   2. public_html/ klasörüne git"
echo "   3. dist/ klasöründeki tüm dosyaları yükle:"
echo "      - index.html"
echo "      - favicon.ico"
echo "      - _expo/ klasörü"
echo "      - assets/ klasörü"
echo "      - .htaccess dosyası"
echo ""
echo "📡 Backend API:"
echo "   1. cPanel > Node.js Apps > Create Application"
echo "   2. Application name: viralvpn-api"
echo "   3. Node.js version: 18.x"
echo "   4. Application mode: Production"
echo "   5. server/ klasörünü viralvpn-api/ yükle"
echo "   6. Environment variables ayarla"
echo ""
echo "🔧 Domain Ayarları:"
echo "   1. cPanel > Subdomains > Create Subdomain"
echo "   2. Subdomain: api"
echo "   3. Domain: viralvpn.net"
echo "   4. Document Root: /home/username/viralvpn-api"
echo ""
echo "🔒 SSL Sertifikası:"
echo "   1. cPanel > SSL/TLS > Let's Encrypt SSL"
echo "   2. viralvpn.net ve api.viralvpn.net için SSL al"
echo ""
echo "📱 Mobil Uygulamalar:"
echo "   - Android AAB: builds/viralvpn-production-v2.aab"
echo "   - Google Play Store'a yükle"
echo ""
echo "🔗 Erişim URL'leri:"
echo "   - Web Sitesi: https://viralvpn.net"
echo "   - API: https://api.viralvpn.net"
echo "   - Admin Panel: https://api.viralvpn.net/admin" 