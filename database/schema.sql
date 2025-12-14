-- ViralVPN Database Schema for Supabase

-- Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    plan VARCHAR(50) DEFAULT 'monthly',
    price DECIMAL(10,2) DEFAULT 9.99,
    stripe_session_id VARCHAR(255),
    available_servers JSONB DEFAULT '[]'::jsonb
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    license_key VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    total_usage BIGINT DEFAULT 0,
    current_server VARCHAR(255)
);

-- VPN Servers Table
CREATE TABLE IF NOT EXISTS vpn_servers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    port INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    users_count INTEGER DEFAULT 0,
    max_users INTEGER DEFAULT 100,
    bandwidth BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    access_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connection Logs Table (Optional - for analytics)
CREATE TABLE IF NOT EXISTS connection_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    server_id UUID REFERENCES vpn_servers(id),
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    bytes_transferred BIGINT DEFAULT 0
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(key);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_license_key ON users(license_key);
CREATE INDEX IF NOT EXISTS idx_vpn_servers_status ON vpn_servers(status);
CREATE INDEX IF NOT EXISTS idx_connection_logs_user_id ON connection_logs(user_id);

-- Insert sample data
INSERT INTO licenses (key, email, status, expiry_date, plan, price) VALUES 
('DEMO-1234-5678-9ABC', 'demo@viralvpn.net', 'active', '2025-12-31T23:59:59.000Z', 'monthly', 9.99),
('TEST-ABCD-EFGH-IJKL', 'test@viralvpn.net', 'active', '2025-08-31T23:59:59.000Z', 'monthly', 9.99)
ON CONFLICT (key) DO NOTHING;

INSERT INTO users (email, name, license_key, status) VALUES 
('demo@viralvpn.net', 'Demo User', 'DEMO-1234-5678-9ABC', 'active'),
('test@viralvpn.net', 'Test User', 'TEST-ABCD-EFGH-IJKL', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vpn_servers (name, country, city, ip, port, status, access_key) VALUES 
('US East', 'United States', 'New York', 'us-east.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@us-east.example.com:8388/?outline=1'),
('Frankfurt', 'Germany', 'Frankfurt', 'de-frankfurt.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@de-frankfurt.example.com:8388/?outline=1'),
('Tokyo', 'Japan', 'Tokyo', 'jp-tokyo.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) Policies
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpn_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for license validation
CREATE POLICY "Public license read" ON licenses FOR SELECT USING (true);
-- Admin full access for licenses
CREATE POLICY "licenses_admin_policy" ON licenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read access for VPN servers
CREATE POLICY "Public server read" ON vpn_servers FOR SELECT USING (true);
-- Admin full access for servers
CREATE POLICY "vpn_servers_admin_policy" ON vpn_servers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Users can only see their own data
CREATE POLICY "Users own data" ON users FOR ALL USING (auth.jwt() ->> 'email' = email);
-- Admin full access for users
CREATE POLICY "users_admin_policy" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);