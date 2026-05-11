const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Usar service_role key no servidor (nunca exposta ao cliente)
const SUPABASE_URL      = process.env.SUPABASE_URL      || 'https://rhsserqlbyyjgglcrwva.supabase.co';
const SUPABASE_SERV_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    // Verificar se service_role key está configurada
    if (!SUPABASE_SERV_KEY || SUPABASE_SERV_KEY === 'COLOQUE_SUA_SERVICE_ROLE_KEY_AQUI') {
        console.error('[AdminLogin] SUPABASE_SERVICE_ROLE_KEY não configurada!');
        return res.status(500).json({ error: 'Servidor não configurado. Contate o administrador.' });
    }

    try {
        const { email, passwordHash } = req.body;

        if (!email || !passwordHash) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        // Sanitizar email
        const cleanEmail = String(email).trim().toLowerCase().substring(0, 254);

        // Validar formato do hash (deve ser SHA-256 hex de 64 chars)
        if (!/^[a-f0-9]{64}$/.test(passwordHash)) {
            return res.status(400).json({ error: 'Formato de credencial inválido.' });
        }

        // Criar cliente Supabase com service_role (acesso total, seguro pois está no servidor)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERV_KEY, {
            auth: { persistSession: false }
        });

        // Consultar admin_users usando service_role (supera o RLS)
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, password_hash, name, role, active')
            .eq('email', cleanEmail)
            .single();

        // Sempre retornar a mesma mensagem de erro (evita enumerar emails)
        const ERRO_GENERICO = 'Email ou senha incorretos.';

        if (error || !data) {
            console.warn(`[AdminLogin] Tentativa falhou para: ${cleanEmail}`);
            return res.status(401).json({ error: ERRO_GENERICO });
        }

        // Verificar se admin está ativo
        if (!data.active) {
            console.warn(`[AdminLogin] Admin inativo: ${cleanEmail}`);
            return res.status(401).json({ error: ERRO_GENERICO });
        }

        // Comparar hash (comparação de tempo constante para evitar timing attacks)
        const expectedHash = Buffer.from(data.password_hash, 'hex');
        const receivedHash = Buffer.from(passwordHash, 'hex');

        if (expectedHash.length !== receivedHash.length ||
            !crypto.timingSafeEqual(expectedHash, receivedHash)) {
            console.warn(`[AdminLogin] Senha incorreta para: ${cleanEmail}`);
            return res.status(401).json({ error: ERRO_GENERICO });
        }

        // Login bem-sucedido — registrar timestamp
        await supabase
            .from('admin_users')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', data.id);

        console.log(`[AdminLogin] ✅ Login bem-sucedido: ${cleanEmail}`);

        return res.status(200).json({
            success: true,
            admin: {
                email: data.email,
                name:  data.name || 'Administrador',
                role:  data.role
            }
        });

    } catch (err) {
        console.error('[AdminLogin] Erro interno:', err.message);
        return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
    }
};
