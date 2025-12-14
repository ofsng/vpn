-- Supabase RLS Politikalarını Düzeltme
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır

-- 1. Mevcut RLS politikalarını kaldır
DROP POLICY IF EXISTS "Enable read access for all users" ON licenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON licenses;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON licenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON licenses;

-- 2. Users tablosu için de mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON users;

-- 3. VPN Servers tablosu için de mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable read access for all users" ON vpn_servers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON vpn_servers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON vpn_servers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON vpn_servers;

-- 4. Tüm tablolar için yeni liberal politikalar oluştur (development için)
-- LICENSES tablosu
CREATE POLICY "Allow all operations on licenses"
ON licenses FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- USERS tablosu  
CREATE POLICY "Allow all operations on users"
ON users FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- VPN_SERVERS tablosu
CREATE POLICY "Allow all operations on vpn_servers"
ON vpn_servers FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- 5. RLS'i aktif bırak ama liberal politikalarla
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpn_servers ENABLE ROW LEVEL SECURITY;

-- 6. Anon kullanıcısına tam yetki ver (API key ile erişim için)
GRANT ALL ON licenses TO anon;
GRANT ALL ON users TO anon;
GRANT ALL ON vpn_servers TO anon;

-- 7. Authenticated kullanıcısına da tam yetki ver
GRANT ALL ON licenses TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON vpn_servers TO authenticated;

-- 8. Sequence'lere de yetki ver
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Kontrol sorguları (Bu sorguları çalıştırarak politikaları kontrol edebilirsin)
-- SELECT * FROM pg_policies WHERE tablename IN ('licenses', 'users', 'vpn_servers');
-- SELECT * FROM information_schema.table_privileges WHERE table_name IN ('licenses', 'users', 'vpn_servers');