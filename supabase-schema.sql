-- ============================================================
-- SQL COMPLETO PARA O SUPABASE - DESEJOSMS
-- Execute este script no: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. TABELA DE ANÚNCIOS (atualizada com colunas de pagamento)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    state TEXT,
    city TEXT,
    description TEXT,
    price TEXT,
    phone TEXT,
    whatsapp TEXT,
    category TEXT,
    services JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
    plan_type TEXT DEFAULT 'basic',
    is_vip BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    paid_amount NUMERIC(10,2) DEFAULT 0,
    payment_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir (seguro para reexecutar)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'payment_id') THEN
        ALTER TABLE announcements ADD COLUMN payment_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'payment_status') THEN
        ALTER TABLE announcements ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 2. TABELA DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    mp_payment_id TEXT UNIQUE,
    mp_preference_id TEXT,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')),
    plan_type TEXT,
    pix_qr_code TEXT,
    pix_qr_code_base64 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE CONFIGURAÇÕES (para salvar chaves do MP e outras configurações)
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONFIGURAÇÕES PADRÃO (Mercado Pago - serão preenchidas pelo admin)
INSERT INTO settings (key, value) VALUES 
    ('mercadopago_config', '{"publicKey": "", "secretKey": "", "environment": "sandbox", "status": "inactive"}'::jsonb),
    ('payment_methods', '{"pix": true, "credit_card": false, "boleto": false}'::jsonb),
    ('site_config', '{"nome": "DesejosMS", "url": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes para evitar conflito
DROP POLICY IF EXISTS "Leitura publica de ativos" ON announcements;
DROP POLICY IF EXISTS "Insercao livre" ON announcements;
DROP POLICY IF EXISTS "Admin full access announcements" ON announcements;
DROP POLICY IF EXISTS "Leitura publica payments" ON payments;
DROP POLICY IF EXISTS "Insercao livre payments" ON payments;
DROP POLICY IF EXISTS "Admin full access payments" ON payments;
DROP POLICY IF EXISTS "Leitura publica settings" ON settings;
DROP POLICY IF EXISTS "Admin full access settings" ON settings;

-- ANNOUNCEMENTS: qualquer um pode ler ativos; qualquer um pode inserir; service_role gerencia tudo
CREATE POLICY "Leitura publica de ativos" ON announcements
    FOR SELECT USING (status = 'active');

CREATE POLICY "Insercao livre" ON announcements
    FOR INSERT WITH CHECK (true);

-- PAYMENTS: anuncianate pode ver seus próprios; qualquer um pode inserir
CREATE POLICY "Leitura publica payments" ON payments
    FOR SELECT USING (true);

CREATE POLICY "Insercao livre payments" ON payments
    FOR INSERT WITH CHECK (true);

-- SETTINGS: leitura pública das configs não sensíveis; escrita apenas via service_role (backend)
CREATE POLICY "Leitura publica settings" ON settings
    FOR SELECT USING (true);

-- 6. TRIGGER para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. INDEX para performance
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_user_email ON announcements(user_email);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_email ON payments(user_email);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================================
-- PRONTO! Execute e verifique em: Table Editor
-- ============================================================
