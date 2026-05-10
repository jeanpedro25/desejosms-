const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rhsserqlbyyjgglcrwva.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v83uLp_HYDgO9PXmjFl8eQ_kSzRGLNI';
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'COLOQUE_SUA_SERVICE_ROLE_KEY_AQUI') 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { planType, userEmail, adId } = req.body;

        if (!planType || !userEmail) {
            return res.status(400).json({ error: 'Dados obrigatórios: planType e userEmail' });
        }

        // 1. Buscar credenciais LivePix do Supabase
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: settings } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'livepix_config')
            .single();

        if (!settings?.value?.publicKey || !settings?.value?.secretKey) {
            return res.status(503).json({ error: 'Credenciais LivePix não configuradas no painel administrativo.' });
        }

        const clientId = settings.value.publicKey;
        const clientSecret = settings.value.secretKey;

        // 2. Obter Token OAuth2
        const token = await getLivePixToken(clientId, clientSecret);
        if (!token) {
            throw new Error('Falha na autenticação com LivePix (OAuth2)');
        }

        // 3. Mapeamento de preços (para teste do usuário: 1.00, 1.25, 1.50)
        const pricing = {
            'basic':    100, // R$ 1,00
            'top':      125, // R$ 1,25
            'supervip': 150  // R$ 1,50
        };

        const amount = pricing[planType.toLowerCase()] || 100;
        const planName = planType.toUpperCase();
        const origin = req.headers.origin || 'https://desejosms.com.br';

        // 4. Criar Pagamento na LivePix
        const paymentData = await createLivePixPayment(token, {
            amount: amount,
            currency: 'BRL',
            reference: `ad_${adId || Date.now()}_${Date.now()}`,
            redirectUrl: `${origin}/painel-anunciante.html?status=success`
        });

        if (!paymentData || !paymentData.data || !paymentData.data.redirectUrl) {
            throw new Error('Falha ao gerar link de pagamento na LivePix');
        }

        // 5. Salvar rascunho do pagamento no banco para conciliação via webhook
        await supabase.from('payments').insert({
            user_email: userEmail,
            ad_id: adId,
            plan_type: planType,
            amount: (amount / 100).toFixed(2),
            gateway: 'livepix',
            external_id: paymentData.data.reference,
            status: 'pending',
            created_at: new Date().toISOString()
        });

        console.log(`[LivePix] Checkout gerado para ${userEmail} - ${planName} (R$ ${amount/100})`);

        return res.status(200).json({
            success: true,
            checkout_url: paymentData.data.redirectUrl,
            reference: paymentData.data.reference,
            product_name: `Plano ${planName}`,
            price: amount / 100
        });

    } catch (error) {
        console.error('[LivePix API] Erro:', error);
        return res.status(500).json({ error: 'Erro ao processar pagamento LivePix.', details: error.message });
    }
};

/**
 * Obtém o token de acesso via OAuth2
 */
async function getLivePixToken(clientId, clientSecret) {
    return new Promise((resolve, reject) => {
        const data = 'grant_type=client_credentials&scope=payments:write payments:read webhooks';
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const options = {
            hostname: 'oauth.livepix.gg',
            path: '/oauth2/token',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed.access_token);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/**
 * Cria a solicitação de pagamento na LivePix
 */
async function createLivePixPayment(token, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);

        const options = {
            hostname: 'api.livepix.gg',
            path: '/v2/payments',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}
