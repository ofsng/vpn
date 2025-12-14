#!/bin/bash

# ViralVPN Deployment Script
# Bu script hem mobil uygulama hem de web sitesi için backend'i aynı anda çalıştırır

echo "🚀 ViralVPN Deployment Script Başlatılıyor..."

# Environment variables
export PORT=3000
export NODE_ENV=production

# Backend server'ı başlat
echo "📡 Backend server başlatılıyor (Port: 3000)..."
node server/index.js &
BACKEND_PID=$!

# Backend'in başlamasını bekle
sleep 3

# Web build'i oluştur
echo "🌐 Web build oluşturuluyor..."
npx expo export --platform web --clear

# Web server'ı başlat (dist klasörü için)
echo "🌐 Web server başlatılıyor (Port: 8080)..."
cd dist && python3 -m http.server 8080 &
WEB_PID=$!

echo "✅ Deployment tamamlandı!"
echo ""
echo "📱 Mobil Uygulama:"
echo "   - Android APK: builds/viralvpn-preview.apk"
echo "   - Android AAB: builds/viralvpn-production.aab"
echo ""
echo "🌐 Web Sitesi:"
echo "   - URL: http://localhost:8080"
echo "   - Build: dist/ klasörü"
echo ""
echo "📡 Backend API:"
echo "   - URL: http://localhost:3000"
echo "   - Admin Panel: http://localhost:3000/admin"
echo ""
echo "🛑 Durdurmak için: Ctrl+C"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Servisler durduruluyor..."
    kill $BACKEND_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    exit 0
}

# Signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait 