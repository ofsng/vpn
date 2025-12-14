-- Plan alanını licenses tablosuna ekleme
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştır

-- 1. Plan sütunu ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'licenses' AND column_name = 'plan') THEN
        ALTER TABLE licenses ADD COLUMN plan VARCHAR(20) DEFAULT 'monthly';
    END IF;
END $$;

-- 2. Plan değerlerini kontrol et (sadece monthly ve yearly kabul et)
ALTER TABLE licenses ADD CONSTRAINT check_plan_values 
CHECK (plan IN ('monthly', 'yearly'));

-- 3. Mevcut kayıtlarda plan alanını güncelle (eğer null ise)
UPDATE licenses SET plan = 'monthly' WHERE plan IS NULL;

-- 4. Plan alanını NOT NULL yap
ALTER TABLE licenses ALTER COLUMN plan SET NOT NULL;

-- Kontrol sorgusu
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'licenses' 
ORDER BY ordinal_position;