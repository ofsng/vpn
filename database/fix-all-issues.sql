-- Supabase RLS Politikalarını Düzeltme ve Plan Alanı Ekleme
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır

-- 1. Önce plan alanını ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'licenses' AND column_name = 'plan') THEN
        ALTER TABLE licenses ADD COLUMN plan VARCHAR(20) DEFAULT 'monthly';
        
        -- Plan değerlerini kontrol et
        ALTER TABLE licenses ADD CONSTRAINT check_plan_values 
        CHECK (plan IN ('monthly', 'yearly'));
        
        -- Mevcut kayıtları güncelle
        UPDATE licenses SET plan = 'monthly' WHERE plan IS NULL;
        
        -- Plan alanını NOT NULL yap
        ALTER TABLE licenses ALTER COLUMN plan SET NOT NULL;
        
        RAISE NOTICE 'Plan alanı başarıyla eklendi';
    ELSE
        RAISE NOTICE 'Plan alanı zaten mevcut';
    END IF;
END $$;

-- 2. Mevcut RLS politikalarını kaldır
DROP POLICY IF EXISTS "Enable read access for all users" ON licenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON licenses;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON licenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON licenses;
DROP POLICY IF EXISTS "Allow all operations on licenses" ON licenses;

-- Users tablosu için de mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;

-- VPN Servers tablosu için de mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable read access for all users" ON vpn_servers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON vpn_servers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON vpn_servers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON vpn_servers;
DROP POLICY IF EXISTS "Allow all operations on vpn_servers" ON vpn_servers;

-- 3. Development için liberal politikalar oluştur
-- LICENSES tablosu
CREATE POLICY "Development: Allow all operations on licenses"
ON licenses FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- USERS tablosu  
CREATE POLICY "Development: Allow all operations on users"
ON users FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- VPN_SERVERS tablosu
CREATE POLICY "Development: Allow all operations on vpn_servers"
ON vpn_servers FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- 4. RLS'i aktif tut ama liberal politikalarla
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpn_servers ENABLE ROW LEVEL SECURITY;

-- 5. Anon kullanıcısına tam yetki ver (API key ile erişim için)
GRANT ALL ON licenses TO anon;
GRANT ALL ON users TO anon;
GRANT ALL ON vpn_servers TO anon;

-- 6. Authenticated kullanıcısına da tam yetki ver
GRANT ALL ON licenses TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON vpn_servers TO authenticated;

-- 7. Sequence'lere de yetki ver
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Mevcut lisansları kontrol et ve eksik alanları düzelt
UPDATE licenses 
SET plan = 'monthly' 
WHERE plan IS NULL OR plan = '';

-- 9. Mevcut lisansları status kontrolü
UPDATE licenses 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Test sorgular (sonuçları kontrol et)
SELECT 'Toplam lisans sayısı:' as bilgi, COUNT(*) as deger FROM licenses
UNION ALL
SELECT 'Aktif lisans sayısı:' as bilgi, COUNT(*) as deger FROM licenses WHERE status = 'active'
UNION ALL
SELECT 'Plan alanı olan lisanslar:' as bilgi, COUNT(*) as deger FROM licenses WHERE plan IS NOT NULL
UNION ALL
SELECT 'Politika sayısı:' as bilgi, COUNT(*) as deger FROM pg_policies WHERE tablename IN ('licenses', 'users', 'vpn_servers');

-- Mevcut lisansları göster (debug için)
SELECT id, key, email, plan, status, created_at, expiry_date 
FROM licenses 
ORDER BY created_at DESC 
LIMIT 10;