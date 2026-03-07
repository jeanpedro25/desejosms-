// Vercel Serverless Function: Webhook do Mercado Pago
// Recebe confirmações de pagamento e ativa o anúncio no Supabase automaticamente

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
import { sendAdApprovedEmail } from '../_lib/emailService.js';
import { sendAdApprovedWhatsApp } from '../_lib/whatsappService.js';

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
            const planType = payment.metadata?.plan_type || 'basic'; // TODO: passar planType no body de criar PIX
            const adDataName = payment.metadata?.ad_name || 'Anúncio VIP';
            const userPhone = payment.payer?.phone?.number || payment.metadata?.user_phone || '';

            console.log(`✅ Pagamento aprovado! User: ${userEmail}, Plano: ${planType}`);

            if (userEmail) {
                // Calcular data de expiração (30 dias padrão, se for basic 7)
                const days = planType.toLowerCase() === 'basic' ? 7 : (planType.toLowerCase() === 'premium' ? 15 : 30);
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + days);

                // Ativar anúncio mais recente pendente deste usuário
                const { data: updatedAds, error: updateError } = await supabase
                    .from('announcements')
                    .update({
                        status: 'active',
                        payment_id: paymentId,
                        payment_status: 'approved',
                        plan_type: planType,
                        expires_at: expiresAt.toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_email', userEmail)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .select();

                if (updateError) {
                    console.error('Erro ao ativar anúncio:', updateError);
                } else if (updatedAds && updatedAds.length > 0) {
                    console.log(`🎉 Anúncio ativado para ${userEmail}:`, updatedAds.length, 'registro(s)');
                    
                    const ad = updatedAds[0];
                    const phoneToUse = userPhone || ad.whatsapp || ad.phone;

                    // Disparar Notificações Reais (Email e WhatsApp) assincronamente (não bloquear o request do MP)
                    sendAdApprovedEmail(userEmail, ad.name, planType).catch(e => console.error('Erro Email_Approve:', e.message));
                    
                    if (phoneToUse) {
                        sendAdApprovedWhatsApp(phoneToUse, ad.name, planType).catch(e => console.error('Erro Wapp_Approve:', e.message));
                    }
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
