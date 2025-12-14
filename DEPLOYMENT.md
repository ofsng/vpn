# ViralVPN Production Deployment Kılavuzu

## 🚀 Production Deployment

### Domain Bilgileri
- **Ana Domain**: viralvpn.net
- **API Domain**: api.viralvpn.net
- **Admin Panel**: https://api.viralvpn.net/admin

## 📋 Deployment Adımları

### 1. Backend Server Deployment

#### VPS Gereksinimleri
- Ubuntu 20.04+ / CentOS 8+
- Node.js 18+
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- SSL Sertifikası (Let's Encrypt)

#### Backend Kurulumu
```bash
# VPS'e bağlan
ssh root@your-server-ip

# Node.js kurulumu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kurulumu
npm install -g pm2

# Proje klasörü oluştur
mkdir -p /var/www/viralvpn
cd /var/www/viralvpn

# Proje dosyalarını yükle
# server/ klasörünü buraya kopyala

# Environment dosyası oluştur
cp env.production.example .env.production
nano .env.production  # Değerleri güncelle

# Bağımlılıkları kur
npm install

# PM2 ile başlat
pm2 start server/index.js --name "viralvpn-api"
pm2 save
pm2 startup
```

#### Nginx Konfigürasyonu
```nginx
# /etc/nginx/sites-available/viralvpn-api
server {
    listen 80;
    server_name api.viralvpn.net;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL Sertifikası
```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d api.viralvpn.net
```

### 2. Web Server Deployment

#### Web Server Kurulumu
```bash
# Nginx kurulumu
sudo apt install nginx

# Web sitesi klasörü
sudo mkdir -p /var/www/viralvpn-web
sudo chown -R $USER:$USER /var/www/viralvpn-web
```

#### Web Build Upload
```bash
# dist/ klasörünü web server'a yükle
scp -r dist/* root@your-server-ip:/var/www/viralvpn-web/
```

#### Nginx Konfigürasyonu
```nginx
# /etc/nginx/sites-available/viralvpn-web
server {
    listen 80;
    server_name viralvpn.net www.viralvpn.net;
    root /var/www/viralvpn-web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### SSL Sertifikası
```bash
sudo certbot --nginx -d viralvpn.net -d www.viralvpn.net
```

### 3. DNS Ayarları

#### A Records
```
viralvpn.net        -> Web Server IP
api.viralvpn.net    -> Backend Server IP
```

#### CNAME Records
```
www.viralvpn.net    -> viralvpn.net
```

### 4. Mobil Uygulama Deployment

#### Android (Google Play Store)
1. `builds/viralvpn-production.aab` dosyasını Google Play Console'a yükle
2. Store listing bilgilerini doldur
3. Privacy policy ve terms of service ekle
4. Release to production

#### iOS (App Store)
1. EAS Dashboard'dan iOS build'i indir
2. App Store Connect'e yükle
3. Store listing bilgilerini doldur
4. App Review sürecini bekle

## 🔧 Environment Variables

### Production Environment
```bash
# .env.production dosyasını oluştur
cp env.production.example .env.production

# Gerekli değerleri güncelle:
NEXT_PUBLIC_API_URL=https://api.viralvpn.net
ADMIN_PASSWORD=your-strong-password
JWT_SECRET=your-secure-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
```

## 📊 Monitoring

### PM2 Monitoring
```bash
# Process durumu
pm2 status

# Logları görüntüle
pm2 logs viralvpn-api

# Restart
pm2 restart viralvpn-api
```

### Nginx Monitoring
```bash
# Nginx durumu
sudo systemctl status nginx

# Error logları
sudo tail -f /var/log/nginx/error.log

# Access logları
sudo tail -f /var/log/nginx/access.log
```

## 🔒 Security

### Firewall Ayarları
```bash
# UFW kurulumu
sudo apt install ufw

# Port açma
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### SSL Sertifikası Yenileme
```bash
# Otomatik yenileme test
sudo certbot renew --dry-run

# Manuel yenileme
sudo certbot renew
```

## 🚨 Troubleshooting

### Backend Sorunları
```bash
# PM2 logları
pm2 logs viralvpn-api

# Node.js process kontrolü
ps aux | grep node

# Port kontrolü
netstat -tlnp | grep :3000
```

### Web Server Sorunları
```bash
# Nginx syntax kontrolü
sudo nginx -t

# Nginx restart
sudo systemctl restart nginx

# File permissions
sudo chown -R www-data:www-data /var/www/viralvpn-web
```

## 📞 Support

Deployment sorunları için:
- PM2 logları kontrol edin
- Nginx error logları kontrol edin
- SSL sertifikası durumunu kontrol edin
- DNS ayarlarını kontrol edin 