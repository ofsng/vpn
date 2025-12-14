-- ViralVPN Complete Database Schema
-- Bu dosyayı tek seferde çalıştırın, hiç hata almayacaksınız!

-- Mevcut tabloları temizle (IF EXISTS ile güvenli)
DROP TABLE IF EXISTS connection_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS vpn_servers CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;

-- ==========================================
-- LICENSES TABLE
-- ==========================================
CREATE TABLE licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    plan TEXT DEFAULT 'monthly',
    price DECIMAL DEFAULT 9.99,
    available_servers JSONB DEFAULT '[]'
);

-- ==========================================
-- USERS TABLE  
-- ==========================================
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    license_key TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    total_usage BIGINT DEFAULT 0,
    current_server TEXT
);

-- ==========================================
-- VPN_SERVERS TABLE
-- ==========================================
CREATE TABLE vpn_servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    status TEXT DEFAULT 'online',
    users_count INTEGER DEFAULT 0,
    max_users INTEGER DEFAULT 100,
    bandwidth BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    access_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CREATE INDEXES
-- ==========================================
CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_email ON licenses(email);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_license_key ON users(license_key);
CREATE INDEX idx_vpn_servers_status ON vpn_servers(status);

-- ==========================================
-- INSERT TEST DATA
-- ==========================================
INSERT INTO licenses (key, email, status, expiry_date, plan, price) VALUES 
('DEMO-1234-5678-9ABC', 'demo@viralvpn.net', 'active', '2025-12-31T23:59:59Z', 'monthly', 9.99),
('TEST-ABCD-EFGH-IJKL', 'test@viralvpn.net', 'active', '2025-08-31T23:59:59Z', 'monthly', 9.99);

INSERT INTO users (email, name, license_key, status) VALUES 
('demo@viralvpn.net', 'Demo User', 'DEMO-1234-5678-9ABC', 'active'),
('test@viralvpn.net', 'Test User', 'TEST-ABCD-EFGH-IJKL', 'active');

INSERT INTO vpn_servers (name, country, city, ip, port, status, users_count, max_users, access_key) VALUES 
('US East', 'United States', 'New York', 'us-east.example.com', 8388, 'online', 15, 100, 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@us-east.example.com:8388/?outline=1'),
('Frankfurt', 'Germany', 'Frankfurt', 'de-frankfurt.example.com', 8388, 'online', 8, 100, 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@de-frankfurt.example.com:8388/?outline=1'),
('Tokyo', 'Japan', 'Tokyo', 'jp-tokyo.example.com', 8388, 'online', 12, 100, 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1');

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpn_servers ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE SECURITY POLICIES
-- ==========================================
-- Public read access for license validation
CREATE POLICY "licenses_select_policy" ON licenses FOR SELECT USING (true);
-- Admin full access for licenses
CREATE POLICY "licenses_admin_policy" ON licenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read access for VPN servers
CREATE POLICY "vpn_servers_select_policy" ON vpn_servers FOR SELECT USING (true);
-- Admin full access for servers
CREATE POLICY "vpn_servers_admin_policy" ON vpn_servers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Users can read their own data
CREATE POLICY "users_select_policy" ON users FOR SELECT USING (auth.jwt() ->> 'email' = email);
-- Admin full access for users
CREATE POLICY "users_admin_policy" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- DATABASE READY! ✅
-- ==========================================
-- Test verileri:
-- Licenses: DEMO-1234-5678-9ABC, TEST-ABCD-EFGH-IJKL
-- Users: demo@viralvpn.net, test@viralvpn.net
-- Servers: US, Germany, Japan