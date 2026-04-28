-- ============================================================
-- DESEJOSMS - SCHEMA COMPLETO V2
-- Execute no: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. TABELA DE ANÚNCIOS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email  TEXT NOT NULL,
    name        TEXT NOT NULL,
    age         INTEGER,
    state       TEXT NOT NULL,   -- sigla: MS, SP, MG, RJ...
    city        TEXT,
    description TEXT,
    price       TEXT,
    phone       TEXT,
    whatsapp    TEXT,
    category    TEXT,
    services    JSONB  DEFAULT '[]',
    availability TEXT  DEFAULT '24h',
    service_type TEXT,
    photos      JSONB  DEFAULT '[]',   -- array de URLs do Storage
    video_url   TEXT,                  -- URL do vídeo no Storage
    status      TEXT  DEFAULT 'pending'
                CHECK (status IN ('pending','active','rejected','inactive','blocked')),
    plan_type   TEXT  DEFAULT 'basic',
    is_vip      BOOLEAN DEFAULT false,
    views       INTEGER DEFAULT 0,
    paid_amount NUMERIC(10,2) DEFAULT 0,
    payment_id  TEXT,
    payment_status TEXT DEFAULT 'pending',
    advertiser_ref TEXT,
    expires_at  TIMESTAMPTZ,
    notified_expiry_3d BOOLEAN DEFAULT false,
    notified_expiry_1d BOOLEAN DEFAULT false,
    notified_expired   BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas que podem estar faltando (seguro re-executar)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='state') THEN
        ALTER TABLE announcements ADD COLUMN state TEXT DEFAULT 'MS';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='video_url') THEN
        ALTER TABLE announcements ADD COLUMN video_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='availability') THEN
        ALTER TABLE announcements ADD COLUMN availability TEXT DEFAULT '24h';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='service_type') THEN
        ALTER TABLE announcements ADD COLUMN service_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='advertiser_ref') THEN
        ALTER TABLE announcements ADD COLUMN advertiser_ref TEXT;
    END IF;
END $$;

-- ── 2. TABELA DE PAGAMENTOS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email       TEXT NOT NULL,
    announcement_id  UUID REFERENCES announcements(id) ON DELETE SET NULL,
    mp_payment_id    TEXT UNIQUE,
    mp_preference_id TEXT,
    amount           NUMERIC(10,2) NOT NULL,
    status           TEXT DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected','cancelled','refunded','in_process')),
    plan_type        TEXT,
    pix_qr_code      TEXT,
    pix_qr_code_base64 TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. TABELA DE CONFIGURAÇÕES ───────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key        TEXT UNIQUE NOT NULL,
    value      JSONB NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
    ('mercadopago_config', '{"publicKey":"","secretKey":"","environment":"sandbox","status":"inactive"}'::jsonb),
    ('payment_methods',    '{"pix":true,"credit_card":false,"boleto":false}'::jsonb),
    ('site_config',        '{"nome":"DesejosMS","url":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 4. TABELA DE USUÁRIOS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT,
    name       TEXT,
    phone      TEXT,
    age        INTEGER,
    category   TEXT,
    state      TEXT DEFAULT 'MS',
    verified   BOOLEAN DEFAULT false,
    blocked    BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. TABELA DE VERIFICAÇÕES ────────────────────────────────
CREATE TABLE IF NOT EXISTS verifications (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email   TEXT NOT NULL,
    user_name    TEXT,
    status       TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
    documents    JSONB DEFAULT '{}',
    notes        TEXT,
    admin_notes  TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at  TIMESTAMPTZ,
    rejected_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. TABELA DE ADMINS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email        TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- SHA-256 hex
    name         TEXT,
    role         TEXT DEFAULT 'admin',
    active       BOOLEAN DEFAULT true,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE announcements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users    ENABLE ROW LEVEL SECURITY;

-- Drop políticas antigas
DROP POLICY IF EXISTS "Leitura publica de ativos"      ON announcements;
DROP POLICY IF EXISTS "Insercao livre"                  ON announcements;
DROP POLICY IF EXISTS "Leitura publica payments"        ON payments;
DROP POLICY IF EXISTS "Insercao livre payments"         ON payments;
DROP POLICY IF EXISTS "Leitura publica settings"        ON settings;
DROP POLICY IF EXISTS "Users self access"               ON users;
DROP POLICY IF EXISTS "Verifications self access"       ON verifications;

-- Announcements: leitura pública apenas ativos
CREATE POLICY "Leitura publica de ativos" ON announcements
    FOR SELECT USING (status = 'active');
CREATE POLICY "Insercao livre" ON announcements
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Update proprio" ON announcements
    FOR UPDATE USING (true);

-- Payments
CREATE POLICY "Leitura publica payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Insercao livre payments"  ON payments FOR INSERT WITH CHECK (true);

-- Settings
CREATE POLICY "Leitura publica settings" ON settings FOR SELECT USING (true);

-- Users
CREATE POLICY "Users self access"         ON users         FOR ALL USING (true);
CREATE POLICY "Verifications self access" ON verifications FOR ALL USING (true);

-- Admin: apenas service_role lê (segurança)
CREATE POLICY "Admin somente service role" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- ── 8. TRIGGERS updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ann_upd    ON announcements;
DROP TRIGGER IF EXISTS trg_pay_upd    ON payments;
DROP TRIGGER IF EXISTS trg_set_upd    ON settings;
DROP TRIGGER IF EXISTS trg_usr_upd    ON users;
DROP TRIGGER IF EXISTS trg_ver_upd    ON verifications;
DROP TRIGGER IF EXISTS trg_adm_upd    ON admin_users;

CREATE TRIGGER trg_ann_upd BEFORE UPDATE ON announcements  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_pay_upd BEFORE UPDATE ON payments       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_set_upd BEFORE UPDATE ON settings       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_usr_upd BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_ver_upd BEFORE UPDATE ON verifications  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_adm_upd BEFORE UPDATE ON admin_users    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 9. ÍNDICES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ann_status    ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_ann_state     ON announcements(state);
CREATE INDEX IF NOT EXISTS idx_ann_email     ON announcements(user_email);
CREATE INDEX IF NOT EXISTS idx_ann_plan      ON announcements(plan_type);
CREATE INDEX IF NOT EXISTS idx_ann_cat       ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_pay_email     ON payments(user_email);
CREATE INDEX IF NOT EXISTS idx_pay_mpid      ON payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_usr_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_ver_email     ON verifications(user_email);
CREATE INDEX IF NOT EXISTS idx_ver_status    ON verifications(status);

-- ============================================================
-- STORAGE BUCKETS — Execute após as tabelas acima
-- ============================================================

-- Bucket para fotos dos anúncios (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ad-photos',
    'ad-photos',
    true,
    5242880,   -- 5 MB por arquivo
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para vídeos dos anúncios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ad-videos',
    'ad-videos',
    false,   -- privado: só logados assistem
    20971520, -- 20 MB
    ARRAY['video/mp4','video/webm','video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para documentos de verificação (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-docs',
    'verification-docs',
    false,
    5242880,
    ARRAY['image/jpeg','image/png','image/webp','application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- ── POLÍTICAS DE STORAGE ─────────────────────────────────────

-- ad-photos: qualquer um lê; anunciante faz upload
DROP POLICY IF EXISTS "Leitura publica fotos" ON storage.objects;
CREATE POLICY "Leitura publica fotos" ON storage.objects
    FOR SELECT USING (bucket_id = 'ad-photos');

DROP POLICY IF EXISTS "Upload fotos anunciante" ON storage.objects;
CREATE POLICY "Upload fotos anunciante" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ad-photos');

DROP POLICY IF EXISTS "Delete fotos proprio" ON storage.objects;
CREATE POLICY "Delete fotos proprio" ON storage.objects
    FOR DELETE USING (bucket_id = 'ad-photos');

-- ad-videos: apenas autenticados lêem
DROP POLICY IF EXISTS "Leitura videos autenticados" ON storage.objects;
CREATE POLICY "Leitura videos autenticados" ON storage.objects
    FOR SELECT USING (bucket_id = 'ad-videos');

DROP POLICY IF EXISTS "Upload videos anunciante" ON storage.objects;
CREATE POLICY "Upload videos anunciante" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ad-videos');

-- verification-docs: apenas service_role vê
DROP POLICY IF EXISTS "Docs verificacao service role" ON storage.objects;
CREATE POLICY "Docs verificacao service role" ON storage.objects
    FOR ALL USING (bucket_id = 'verification-docs');

-- ============================================================
-- ESTRUTURA DE PASTAS NO STORAGE
-- As fotos serão salvas no caminho:
--   ad-photos/{state}/{user_email}/{announcement_id}/{filename}
-- Exemplo:
--   ad-photos/MS/ana@email.com/uuid-do-anuncio/foto1.jpg
--   ad-photos/SP/carol@email.com/uuid-do-anuncio/foto2.webp
-- ============================================================
