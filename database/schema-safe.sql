-- ViralVPN Database Schema for Supabase (Step by Step)
-- Bu dosyayı adım adım çalıştırın, her bölümü ayrı ayrı

-- STEP 1: Clean up (if needed)
-- DROP TABLE IF EXISTS connection_logs CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS vpn_servers CASCADE;
-- DROP TABLE IF EXISTS licenses CASCADE;

-- STEP 2: Create Licenses Table FIRST
CREATE TABLE licenses (
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

-- STEP 3: Create Users Table (without foreign key first)
CREATE TABLE users (
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

-- STEP 4: Create VPN Servers Table
CREATE TABLE vpn_servers (
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

-- STEP 5: Create Connection Logs Table
CREATE TABLE connection_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    server_id UUID,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    bytes_transferred BIGINT DEFAULT 0
);

-- STEP 6: Add Indexes
CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_email ON licenses(email);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_license_key ON users(license_key);
CREATE INDEX idx_vpn_servers_status ON vpn_servers(status);
CREATE INDEX idx_connection_logs_user_id ON connection_logs(user_id);

-- STEP 7: Insert Sample Data
INSERT INTO licenses (key, email, status, expiry_date, plan, price) VALUES 
('DEMO-1234-5678-9ABC', 'demo@viralvpn.net', 'active', '2025-12-31T23:59:59.000Z', 'monthly', 9.99),
('TEST-ABCD-EFGH-IJKL', 'test@viralvpn.net', 'active', '2025-08-31T23:59:59.000Z', 'monthly', 9.99);

INSERT INTO users (email, name, license_key, status) VALUES 
('demo@viralvpn.net', 'Demo User', 'DEMO-1234-5678-9ABC', 'active'),
('test@viralvpn.net', 'Test User', 'TEST-ABCD-EFGH-IJKL', 'active');

INSERT INTO vpn_servers (name, country, city, ip, port, status, access_key) VALUES 
('US East', 'United States', 'New York', 'us-east.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@us-east.example.com:8388/?outline=1'),
('Frankfurt', 'Germany', 'Frankfurt', 'de-frankfurt.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@de-frankfurt.example.com:8388/?outline=1'),
('Tokyo', 'Japan', 'Tokyo', 'jp-tokyo.example.com', 8388, 'online', 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1');

-- STEP 8: Enable Row Level Security
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpn_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_logs ENABLE ROW LEVEL SECURITY;

-- STEP 9: Create RLS Policies
CREATE POLICY "Public license read" ON licenses FOR SELECT USING (true);
CREATE POLICY "Public server read" ON vpn_servers FOR SELECT USING (true);
CREATE POLICY "Users own data" ON users FOR ALL USING (auth.jwt() ->> 'email' = email);

-- STEP 10: Add Foreign Key Constraints (LAST STEP - Optional)
-- Uncomment if you want strict referential integrity
-- ALTER TABLE users ADD CONSTRAINT fk_users_license_key FOREIGN KEY (license_key) REFERENCES licenses(key) ON DELETE SET NULL;
-- ALTER TABLE connection_logs ADD CONSTRAINT fk_connection_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE connection_logs ADD CONSTRAINT fk_connection_logs_server_id FOREIGN KEY (server_id) REFERENCES vpn_servers(id) ON DELETE CASCADE;