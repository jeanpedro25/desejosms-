// Vercel Serverless Function: Webhook do Mercado Pago
// Recebe confirmações de pagamento e ativa o anúncio no Supabase automaticamente

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// ---- Importação dos serviços via require (CommonJS compatível com Vercel) ----
let emailService, whatsappService;
try {
    emailService = require('../_lib/emailService');
    whatsappService = require('../_lib/whatsappService');
} catch (e) {
    console.warn('[Webhook] Serviços de notificação não disponíveis:', e.message);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
// Domínios permitidos para CORS
const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://desejosms.vercel.app';

// ---- Utilitários de segurança ----
function escapeString(str) {
    if (!str) return '';
    return String(str).replace(/[<>&"'`]/g, (c) => `&#${c.charCodeAt(0)};`);
}

function validatePaymentId(id) {
    // ID do MP é sempre numérico
    return /^\d{1,20}$/.test(String(id));
}

module.exports = async function handler(req, res) {
    // --- CORS restrito ao domínio do site ---
    const origin = req.headers.origin || '';
    // Webhook do MP não tem origin, mas chamadas internas sim
    if (origin && origin !== ALLOWED_ORIGIN) {
        return res.status(403).json({ error: 'Origem não autorizada' });
    }

    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-signature, x-request-id');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;

        // --- Validação básica do body ---
        if (!body || typeof body !== 'object') {
            return res.status(400).json({ error: 'Body inválido' });
        }

        // --- Validar assinatura do webhook (BLOQUEIO SE INVÁLIDA) ---
        if (WEBHOOK_SECRET) {
            const mpSignature = req.headers['x-signature'];
            const mpRequestId = req.headers['x-request-id'];

            if (!mpSignature || !mpRequestId) {
                console.warn('[Webhook] Headers de assinatura ausentes - possível requisição falsa');
                return res.status(401).json({ error: 'Assinatura ausente' });
            }

            const tsMatch = mpSignature.split(';').find(s => s.startsWith('ts='))?.split('=')[1];
            const v1Match = mpSignature.split(';').find(s => s.startsWith('v1='))?.split('=')[1];

            if (tsMatch && v1Match) {
                const signedTemplate = `id:${body?.data?.id || ''};request-id:${mpRequestId};ts:${tsMatch};`;
                const expectedHash = crypto.createHmac('sha256', WEBHOOK_SECRET)
                    .update(signedTemplate)
                    .digest('hex');

                if (!crypto.timingSafeEqual(
                    Buffer.from(expectedHash, 'hex'),
                    Buffer.from(v1Match.length === expectedHash.length ? v1Match : '0'.repeat(expectedHash.length), 'hex')
                )) {
                    console.warn('[Webhook] Assinatura INVÁLIDA - requisição bloqueada');
                    return res.status(401).json({ error: 'Assinatura inválida' });
                }
            }
        }

        // --- Processar apenas eventos de pagamento ---
        if (body.type !== 'payment' || !body.data?.id) {
            return res.status(200).json({ message: 'Evento ignorado' });
        }

        const paymentId = String(body.data.id);

        // --- Validar formato do ID do pagamento ---
        if (!validatePaymentId(paymentId)) {
            console.warn('[Webhook] ID de pagamento inválido:', paymentId);
            return res.status(400).json({ error: 'ID de pagamento inválido' });
        }

        // --- Inicializar Supabase com service key ---
        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            console.error('[Webhook] Variáveis de ambiente Supabase não configuradas');
            return res.status(500).json({ error: 'Configuração do servidor incompleta' });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // --- Buscar chaves do MP no Supabase ---
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'mercadopago_config')
            .single();

        if (settingsError || !settings) {
            console.error('[Webhook] Configuração MP não encontrada:', settingsError?.message);
            return res.status(200).json({ message: 'Config não encontrada' });
        }

        const accessToken = settings.value.secretKey || settings.value.access_token;

        if (!accessToken) {
            console.error('[Webhook] Access token do MP não configurado');
            return res.status(200).json({ message: 'Token MP ausente' });
        }

        // --- Consultar detalhes do pagamento no MP ---
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Idempotency-Key': `webhook-${paymentId}`
            }
        });

        if (!mpResponse.ok) {
            const errText = await mpResponse.text();
            console.error('[Webhook] Erro ao consultar MP:', errText.substring(0, 200));
            return res.status(200).json({ message: 'Erro ao consultar MP' });
        }

        const payment = await mpResponse.json();
        console.log(`[Webhook] Status do pagamento ${paymentId}:`, payment.status);

        // --- Atualizar registro de pagamento no Supabase ---
        await supabase
            .from('payments')
            .update({
                status: payment.status,
                updated_at: new Date().toISOString()
            })
            .eq('mp_payment_id', paymentId);

        // --- Se pagamento aprovado: ativar anúncio ---
        if (payment.status === 'approved') {
            const userEmail = payment.payer?.email || payment.metadata?.user_email;
            const planType = payment.metadata?.plan_type || 'basic';
            const adDataName = payment.metadata?.ad_name || 'Anúncio';
            const userPhone = payment.payer?.phone?.number || payment.metadata?.user_phone || '';

            // Validar email antes de usar
            if (userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
                const days = planType.toLowerCase() === 'basic' ? 7
                    : planType.toLowerCase() === 'premium' ? 15
                    : 30;

                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + days);

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
                    .select();

                if (updateError) {
                    console.error('[Webhook] Erro ao ativar anúncio:', updateError.message);
                } else if (updatedAds && updatedAds.length > 0) {
                    console.log(`[Webhook] Anúncio ativado para ${userEmail}: ${updatedAds.length} registro(s)`);

                    const ad = updatedAds[0];
                    const phoneToUse = userPhone || ad.whatsapp || ad.phone;

                    // Notificações (assíncronas, não bloqueiam resposta)
                    if (emailService?.sendAdApprovedEmail) {
                        emailService.sendAdApprovedEmail(userEmail, escapeString(ad.name), planType)
                            .catch(e => console.error('[Webhook] Erro Email:', e.message));
                    }

                    if (phoneToUse && whatsappService?.sendAdApprovedWhatsApp) {
                        whatsappService.sendAdApprovedWhatsApp(phoneToUse, escapeString(ad.name), planType)
                            .catch(e => console.error('[Webhook] Erro WhatsApp:', e.message));
                    }
                }
            } else {
                console.warn('[Webhook] Email do pagador inválido ou ausente');
            }
        }

        return res.status(200).json({ received: true, status: payment.status });

    } catch (error) {
        console.error('[Webhook] Erro interno:', error.message);
        // Sempre retornar 200 para o MP (evita reenvios)
        return res.status(200).json({ received: true });
    }
};
