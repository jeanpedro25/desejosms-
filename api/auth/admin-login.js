const crypto = require('crypto');

// ============================================================
// Credenciais do admin via variáveis de ambiente (Vercel)
// ADMIN_EMAIL         → email do administrador
// ADMIN_PASSWORD_HASH → SHA-256 da senha (gerado localmente)
// ============================================================
const ADMIN_EMAIL         = (process.env.ADMIN_EMAIL         || '').trim().toLowerCase();
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH || '').trim().toLowerCase();

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    // Verificar se as credenciais de admin estão configuradas
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
        console.error('[AdminLogin] ADMIN_EMAIL ou ADMIN_PASSWORD_HASH não configurados nas variáveis de ambiente!');
        return res.status(500).json({ error: 'Servidor não configurado. Contate o administrador.' });
    }

    try {
        const { email, passwordHash } = req.body;

        if (!email || !passwordHash) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        // Sanitizar
        const cleanEmail    = String(email).trim().toLowerCase().substring(0, 254);
        const cleanHash     = String(passwordHash).trim().toLowerCase();

        // Validar formato do hash (SHA-256 = 64 chars hex)
        if (!/^[a-f0-9]{64}$/.test(cleanHash)) {
            return res.status(400).json({ error: 'Formato de credencial inválido.' });
        }

        // Comparação de email (case-insensitive)
        if (cleanEmail !== ADMIN_EMAIL) {
            // Delay para evitar timing attack
            await new Promise(r => setTimeout(r, 300));
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        // Comparação de hash em tempo constante (evita timing attacks)
        const expectedBuf = Buffer.from(ADMIN_PASSWORD_HASH, 'hex');
        const receivedBuf = Buffer.from(cleanHash, 'hex');

        const hashMatch = expectedBuf.length === receivedBuf.length &&
                          crypto.timingSafeEqual(expectedBuf, receivedBuf);

        if (!hashMatch) {
            await new Promise(r => setTimeout(r, 300));
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        // ✅ Login bem-sucedido
        console.log(`[AdminLogin] ✅ Login admin: ${cleanEmail}`);

        return res.status(200).json({
            success: true,
            admin: {
                email: ADMIN_EMAIL,
                name:  'Administrador',
                role:  'admin'
            }
        });

    } catch (err) {
        console.error('[AdminLogin] Erro interno:', err.message);
        return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
    }
};
