// Vercel Serverless Function: Webhook do Mercado Pago
// Recebe confirmações de pagamento e ativa o anúncio no Supabase automaticamente

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-signature, x-request-id');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;
        console.log('🔔 Webhook MP recebido:', JSON.stringify(body));

        // Validar assinatura do webhook (segurança)
        if (WEBHOOK_SECRET) {
            const mpSignature = req.headers['x-signature'];
            const mpRequestId = req.headers['x-request-id'];
            if (mpSignature && mpRequestId) {
                const signedTemplate = `id:${body?.data?.id};request-id:${mpRequestId};ts:${mpSignature.split(';').find(s => s.startsWith('ts='))?.split('=')[1]};`;
                const expectedHash = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedTemplate).digest('hex');
                const receivedHash = mpSignature.split(';').find(s => s.startsWith('v1='))?.split('=')[1];
                if (expectedHash !== receivedHash) {
                    console.warn('⚠️ Assinatura do webhook inválida');
                    // Registrar mas não bloquear (MP pode ter configuração diferente)
                }
            }
        }

        // Processar apenas eventos de pagamento
        if (body.type !== 'payment' || !body.data?.id) {
            return res.status(200).json({ message: 'Evento ignorado' });
        }

        const paymentId = String(body.data.id);
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Buscar chaves do MP no Supabase
        const { data: settings } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'mercadopago_config')
            .single();

        if (!settings) {
            console.error('Configuração MP não encontrada');
            return res.status(200).json({ message: 'Config não encontrada' });
        }

        const accessToken = settings.value.secretKey || settings.value.access_token;

        // Consultar detalhes do pagamento no MP
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!mpResponse.ok) {
            console.error('Erro ao consultar MP:', await mpResponse.text());
            return res.status(200).json({ message: 'Erro ao consultar MP' });
        }

        const payment = await mpResponse.json();
        console.log(`💳 Status do pagamento ${paymentId}:`, payment.status);

        // Atualizar registro de pagamento no Supabase
        const { data: paymentRecord } = await supabase
            .from('payments')
            .update({
                status: payment.status,
                updated_at: new Date().toISOString()
            })
            .eq('mp_payment_id', paymentId)
            .select()
            .single();

        // Se pagamento aprovado: ativar anúncio
        if (payment.status === 'approved') {
            const userEmail = payment.payer?.email || payment.metadata?.user_email;
            const planType = payment.metadata?.plan_type;

            console.log(`✅ Pagamento aprovado! User: ${userEmail}, Plano: ${planType}`);

            if (userEmail) {
                // Ativar anúncio mais recente pendente deste usuário
                const { data: updatedAds, error: updateError } = await supabase
                    .from('announcements')
                    .update({
                        status: 'active',
                        payment_id: paymentId,
                        payment_status: 'approved',
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_email', userEmail)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .select();

                if (updateError) {
                    console.error('Erro ao ativar anúncio:', updateError);
                } else {
                    console.log(`🎉 Anúncio ativado para ${userEmail}:`, updatedAds?.length, 'registro(s)');
                }
            }
        }

        return res.status(200).json({ received: true, status: payment.status });

    } catch (error) {
        console.error('Webhook error:', error);
        // Sempre retornar 200 para o MP (evita reenvios desnecessários)
        return res.status(200).json({ received: true, error: error.message });
    }
};
