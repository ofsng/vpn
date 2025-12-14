#!/bin/bash

# ViralVPN Production Deployment Script
# Bu script production ortamı için hazırlık yapar

echo "🚀 ViralVPN Production Deployment Script Başlatılıyor..."

# Environment variables for production
export NODE_ENV=production
export PORT=3000
export NEXT_PUBLIC_API_URL=https://api.viralvpn.net

echo "📋 Production Environment Variables:"
echo "   - NODE_ENV: $NODE_ENV"
echo "   - API_URL: $NEXT_PUBLIC_API_URL"
echo ""

# Production web build
echo "🌐 Production web build oluşturuluyor..."
npx expo export --platform web --clear

# Production Android build
echo "📱 Production Android build oluşturuluyor..."
eas build --platform android --profile production

# Production iOS build (Apple Developer hesabı gerekli)
echo "🍎 Production iOS build oluşturuluyor..."
echo "⚠️  Not: iOS build için Apple Developer hesabı gerekli"
eas build --platform ios --profile production

echo ""
echo "✅ Production builds tamamlandı!"
echo ""
echo "📋 Production Deployment Bilgileri:"
echo ""
echo "🌐 Web Sitesi:"
echo "   - Domain: https://viralvpn.net"
echo "   - Build: dist/ klasörü"
echo "   - Upload: dist/ klasörünü web server'a yükleyin"
echo ""
echo "📱 Mobil Uygulamalar:"
echo "   - Android AAB: builds/viralvpn-production.aab"
echo "   - iOS IPA: EAS Dashboard'dan indirin"
echo "   - Google Play Store: AAB dosyasını yükleyin"
echo "   - App Store: IPA dosyasını yükleyin"
echo ""
echo "📡 Backend API:"
echo "   - Domain: https://api.viralvpn.net"
echo "   - Port: 3000"
echo "   - Deploy: server/ klasörünü VPS'e yükleyin"
echo ""
echo "🔧 DNS Ayarları:"
echo "   - A Record: viralvpn.net -> Web Server IP"
echo "   - A Record: api.viralvpn.net -> Backend Server IP"
echo "   - CNAME: www.viralvpn.net -> viralvpn.net"
echo ""
echo "📦 Deployment Adımları:"
echo "   1. Backend server'ı VPS'e yükleyin"
echo "   2. Web build'i web server'a yükleyin"
echo "   3. DNS ayarlarını yapın"
echo "   4. SSL sertifikalarını kurun"
echo "   5. Mobil uygulamaları store'lara yükleyin" 