# VPN Database Setup Guide

## Supabase Database Kurulumu

### 1. Supabase Projesi Oluşturma

1. [Supabase.com](https://supabase.com) adresine gidin
2. Yeni proje oluşturun
3. Proje ayarlarından aşağıdaki bilgileri alın:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **API Key (anon key)**: `eyJhbGc...`

### 2. Environment Variables Ayarlama

`.env.local` dosyasını düzenleyin:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Alternative names for compatibility
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Database Schema Kurulumu

1. Supabase Dashboard'a gidin
2. **SQL Editor** sekmesine tıklayın
3. `database/schema.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'da çalıştırın

### 4. Tablo Yapısı

Oluşturulan tablolar:

#### `licenses` tablosu:
- `id` (UUID, Primary Key)
- `key` (VARCHAR, Unique) - Lisans anahtarı
- `email` (VARCHAR) - Kullanıcı email'i
- `status` (VARCHAR) - active, expired, suspended
- `created_at` (TIMESTAMP)
- `expiry_date` (TIMESTAMP)
- `plan` (VARCHAR) - monthly, yearly
- `price` (DECIMAL)
- `available_servers` (JSONB)

#### `users` tablosu:
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `name` (VARCHAR)
- `license_key` (VARCHAR, Foreign Key)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `last_login` (TIMESTAMP)
- `total_usage` (BIGINT)

#### `vpn_servers` tablosu:
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `country` (VARCHAR)
- `city` (VARCHAR)
- `ip` (VARCHAR)
- `port` (INTEGER)
- `status` (VARCHAR)
- `access_key` (TEXT)

### 5. Test Verileri

Schema kurulumu ile birlikte test verileri otomatik olarak eklenir:

**Test Lisansları:**
- `DEMO-1234-5678-9ABC` (demo@viralvpn.net)
- `TEST-ABCD-EFGH-IJKL` (test@viralvpn.net)

**Test Sunucuları:**
- US East (New York)
- Frankfurt (Germany)
- Tokyo (Japan)

### 6. Bağlantı Testi

Server'ı başlatın ve health check endpoint'ini test edin:

```bash
# Backend server'ı başlat
npm run server

# Health check
curl http://localhost:3000/api/health
```

Başarılı bağlantı için şu yanıtı almalısınız:

```json
{
  "status": "ok",
  "message": "ViralVPN API is running",
  "timestamp": "2024-...",
  "database": {
    "status": "connected",
    "type": "Supabase",
    "licenses": 2,
    "users": 2
  }
}
```

### 7. Row Level Security (RLS)

Güvenlik için RLS politikaları otomatik olarak uygulanır:
- Public read access for licenses (validation için)
- Public read access for VPN servers
- Users can only access their own data

### 8. Troubleshooting

#### Bağlantı Problemi:
```bash
⚠️ Supabase credentials not found, using in-memory data
```
- `.env.local` dosyasındaki credentials'ları kontrol edin
- Environment variables'ların doğru isimde olduğundan emin olun

#### SQL Hatası:
- Supabase Dashboard'da SQL Editor'dan schema'yı tekrar çalıştırın
- Tablo isimlerinin küçük harf olduğundan emin olun

#### Permission Hatası:
- RLS policies'ların doğru kurulduğunu kontrol edin
- Anon key'in public access'e sahip olduğundan emin olun

### 9. Production Deployment

Production için:
1. Supabase production projesi oluşturun
2. Production environment variables'ları güncelleyin
3. Database backup'larını düzenli olarak alın
4. Connection pooling'i aktif edin
5. Performance monitoring kurun

### 10. Migration Script

Mevcut JSON verilerini Supabase'e taşımak için:

```bash
# Migration script çalıştır (gelecekte eklenecek)
node scripts/migrate-to-supabase.js
```