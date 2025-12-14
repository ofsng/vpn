-- Purchase Requests Tablosu Oluştur
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır

-- Purchase Requests tablosu
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('monthly', 'yearly')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Stripe bilgileri (gelecekte kullanım için)
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    
    -- Notlar ve admin bilgileri
    admin_notes TEXT,
    processed_by VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_purchase_requests_email ON purchase_requests(email);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON purchase_requests(created_at);

-- RLS Politikaları
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Admin okuma/yazma izni
CREATE POLICY "Admin full access to purchase_requests"
ON purchase_requests FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- Kullanıcılar sadece kendi taleplerini görebilir (gelecekte kullanım için)
-- CREATE POLICY "Users can view own purchase requests"
-- ON purchase_requests FOR SELECT
-- TO authenticated
-- USING (auth.jwt() ->> 'email' = email);

-- Genel okuma izni (admin panel için)
GRANT ALL ON purchase_requests TO anon;
GRANT ALL ON purchase_requests TO authenticated;

-- Sequence'e de yetki ver
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test verisi ekle (opsiyonel)
INSERT INTO purchase_requests (email, plan, status, price, admin_notes) VALUES
('test@example.com', 'monthly', 'pending', 9.99, 'Test satın alma talebi'),
('demo@viralvpn.net', 'yearly', 'completed', 59.99, 'Demo tamamlanmış talep')
ON CONFLICT DO NOTHING;

-- Kontrol sorgusu
SELECT COUNT(*) as total_requests, status, plan 
FROM purchase_requests 
GROUP BY status, plan 
ORDER BY status, plan;

-- Tablo oluşturuldu! ✅
-- Admin panelinden purchase_requests endpoint'ini test edebilirsiniz.