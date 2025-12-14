-- ViralVPN Minimal Schema for Supabase
-- Bu dosyayı tek seferde çalıştırabilirsiniz

-- Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
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

-- Users Table  
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    license_key TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    total_usage BIGINT DEFAULT 0
);

-- VPN Servers Table
CREATE TABLE IF NOT EXISTS vpn_servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    status TEXT DEFAULT 'online',
    access_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Test Data
INSERT INTO licenses (key, email, status, expiry_date) 
VALUES 
    ('DEMO-1234-5678-9ABC', 'demo@viralvpn.net', 'active', '2025-12-31T23:59:59Z'),
    ('TEST-ABCD-EFGH-IJKL', 'test@viralvpn.net', 'active', '2025-08-31T23:59:59Z')
ON CONFLICT (key) DO NOTHING;

INSERT INTO users (email, name, license_key, status) 
VALUES 
    ('demo@viralvpn.net', 'Demo User', 'DEMO-1234-5678-9ABC', 'active'),
    ('test@viralvpn.net', 'Test User', 'TEST-ABCD-EFGH-IJKL', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vpn_servers (name, country, city, ip, port, status, access_key) 
VALUES 
    ('US East', 'United States', 'New York', 'us-east.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@us-east.example.com:8388/?outline=1'),
    ('Frankfurt', 'Germany', 'Frankfurt', 'de-frankfurt.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@de-frankfurt.example.com:8388/?outline=1'),
    ('Tokyo', 'Japan', 'Tokyo', 'jp-tokyo.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1')
ON CONFLICT DO NOTHING;

-- Enable RLS (Optional - for security)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;  
ALTER TABLE vpn_servers ENABLE ROW LEVEL SECURITY;

-- Create basic policies for public access
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON licenses FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON vpn_servers FOR SELECT USING (true);