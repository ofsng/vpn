-- ViralVPN Database Cleanup Script
-- Bu script'i önce çalıştırın, mevcut tabloları temizlemek için

-- STEP 1: Drop all existing policies first (IF EXISTS ile güvenli)
DROP POLICY IF EXISTS "Public license read" ON licenses;
DROP POLICY IF EXISTS "Public server read" ON vpn_servers;
DROP POLICY IF EXISTS "Users own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON licenses;
DROP POLICY IF EXISTS "Enable read access for all users" ON vpn_servers;
DROP POLICY IF EXISTS "licenses_select_policy" ON licenses;
DROP POLICY IF EXISTS "vpn_servers_select_policy" ON vpn_servers;
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- STEP 2: Drop all tables (IF EXISTS ile güvenli)
DROP TABLE IF EXISTS connection_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS vpn_servers CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;

-- STEP 3: Drop any remaining indexes (IF EXISTS ile güvenli)
DROP INDEX IF EXISTS idx_licenses_key;
DROP INDEX IF EXISTS idx_licenses_email;
DROP INDEX IF EXISTS idx_licenses_status;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_license_key;
DROP INDEX IF EXISTS idx_vpn_servers_status;
DROP INDEX IF EXISTS idx_connection_logs_user_id;

-- CLEANUP COMPLETE ✅
-- Hiçbir hata almadan tamamlandı!
-- Şimdi schema-fresh.sql dosyasını çalıştırabilirsiniz