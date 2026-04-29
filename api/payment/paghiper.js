// Vercel Serverless Function: Criar cobrança PIX via PagHiper
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
        const { planType, userEmail, amount } = req.body;

        if (!planType || !userEmail || !amount) {
            return res.status(400).json({ error: 'Dados obrigatórios: planType, userEmail, amount' });
        }

        // 1. Buscar chaves da PagHiper salvas no Supabase pelo admin
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'paghiper_config')
            .single();

        let apiKey = '';
        let token = '';

        if (settingsError || !settings) {
            // Se não encontrar, usar os dados padrão fornecidos pelo usuário na imagem
            apiKey = 'apk_47188468-RwGYWdlkBrjmSGbtgCyWutfguAPPAZui';
            token = 'POFNOQXEV7JCEF5WN17PNKCO1HOOAPWQW7Z1233SA85';
            
            // Salvar automaticamente para persistir no Supabase
            try {
                await supabase.from('settings').upsert({
                    key: 'paghiper_config',
                    value: {
                        publicKey: apiKey,
                        secretKey: token,
                        environment: 'production',
                        status: 'active',
                        updatedAt: new Date().toISOString()
                    },
                    updated_by: 'system',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
            } catch (e) {
                console.error('Falha ao gravar fallback PagHiper:', e);
            }
        } else {
            apiKey = settings.value.publicKey;
            token = settings.value.secretKey;
        }

        if (!apiKey || !token) {
            return res.status(503).json({
                error: 'Credenciais da PagHiper incompletas ou não configuradas no Admin.'
            });
        }

        // Converter valor para centavos (ex: 149.90 -> 14990)
        const priceCents = Math.round(parseFloat(amount) * 100);

        // 2. Criar cobrança PIX na PagHiper
        const pagHiperResponse = await fetch('https://pix.paghiper.com/invoice/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                apiKey: apiKey,
                token: token,
                order_id: `DESEJO-${Date.now()}`,
                payer_email: userEmail,
                payer_name: userEmail.split('@')[0] || 'Cliente DesejosMS',
                payer_cpf_cnpj: '00000000000', // CPF genérico caso não fornecido
                notification_url: `${process.env.SITE_URL || 'http://localhost:3000'}/api/webhook/paghiper`,
                fixed_description: true,
                days_due_date: 1,
                items: [
                    {
                        description: `Plano ${planType.toUpperCase()} - DesejosMS`,
                        quantity: 1,
                        price_cents: priceCents
                    }
                ]
            })
        });

        const pagHiperData = await pagHiperResponse.json();

        if (!pagHiperResponse.ok || pagHiperData.pix_create_request?.result !== 'success') {
            console.error('PagHiper error:', pagHiperData);
            return res.status(pagHiperResponse.status || 400).json({
                error: pagHiperData.pix_create_request?.response_message || 'Erro ao gerar o PIX na PagHiper.',
                paghiper_error: pagHiperData
            });
        }

        const transaction = pagHiperData.pix_create_request;

        // 3. Salvar pagamento no Supabase
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                user_email: userEmail,
                mp_payment_id: String(transaction.transaction_id),
                amount: parseFloat(amount),
                status: 'pending',
                plan_type: planType,
                pix_qr_code: transaction.pix_code?.qrcode_email, // Link ou código pix
                pix_qr_code_base64: transaction.pix_code?.qrcode_base64
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Erro ao salvar pagamento PagHiper no Supabase:', paymentError);
        }

        // 4. Retornar QR Code para o frontend
        return res.status(200).json({
            success: true,
            payment_id: String(transaction.transaction_id),
            qr_code: transaction.pix_code?.qrcode_email || transaction.pix_code?.emv,
            qr_code_base64: transaction.pix_code?.qrcode_base64,
            expires_at: transaction.due_date,
            status: 'pending',
            supabase_payment_id: payment?.id || null
        });

    } catch (error) {
        console.error('PagHiper API error:', error);
        return res.status(500).json({ error: 'Erro interno no servidor.', details: error.message });
    }
};
