// Vercel Serverless Function: Criar cobrança PIX via Mercado Pago
// As credenciais são lidas do Supabase (configuradas no painel admin)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { planType, userEmail, amount, adData } = req.body;

        if (!planType || !userEmail || !amount) {
            return res.status(400).json({ error: 'Dados obrigatórios: planType, userEmail, amount' });
        }

        // 1. Buscar chaves do MP salvas no Supabase pelo admin
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'mercadopago_config')
            .single();

        if (settingsError || !settings) {
            return res.status(503).json({
                error: 'Gateway de pagamento não configurado. Configure no painel admin → Config. Pagamentos.'
            });
        }

        const mpConfig = settings.value;
        const accessToken = mpConfig.secretKey || mpConfig.access_token;
        const isProduction = mpConfig.environment === 'production';

        if (!accessToken || accessToken.includes('test') && isProduction) {
            return res.status(503).json({
                error: 'Credenciais do Mercado Pago inválidas ou em modo sandbox.'
            });
        }

        // 2. Criar cobrança PIX no Mercado Pago
        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-Idempotency-Key': `${userEmail}-${Date.now()}`
            },
            body: JSON.stringify({
                transaction_amount: parseFloat(amount),
                description: `DesejosMS - Plano ${planType.toUpperCase()}`,
                payment_method_id: 'pix',
                payer: {
                    email: userEmail
                },
                metadata: {
                    plan_type: planType,
                    user_email: userEmail,
                    ad_data: adData ? JSON.stringify(adData).substring(0, 200) : ''
                },
                notification_url: `${process.env.SITE_URL}/api/webhook/mercadopago`
            })
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('MP error:', mpData);
            return res.status(mpResponse.status).json({
                error: mpData.message || 'Erro ao criar cobrança PIX no Mercado Pago',
                mp_error: mpData
            });
        }

        // 3. Salvar pagamento no Supabase
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                user_email: userEmail,
                mp_payment_id: String(mpData.id),
                amount: parseFloat(amount),
                status: 'pending',
                plan_type: planType,
                pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
                pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Supabase error saving payment:', paymentError);
        }

        // 4. Retornar QR Code para o frontend
        return res.status(200).json({
            success: true,
            payment_id: String(mpData.id),
            qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
            expires_at: mpData.date_of_expiration,
            status: mpData.status,
            supabase_payment_id: payment?.id || null
        });

    } catch (error) {
        console.error('PIX API error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
};
