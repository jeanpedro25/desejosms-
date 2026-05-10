// Vercel Serverless Function: Webhook da Cakto
// Recebe confirmações de pagamento e ativa o anúncio no Supabase automaticamente
// URL para configurar na Cakto: https://seusite.com/api/webhook/cakto

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-cakto-signature');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const body = req.body;

        if (!body || typeof body !== 'object') {
            return res.status(400).json({ error: 'Body inválido' });
        }

        console.log('[Cakto Webhook] Evento recebido:', JSON.stringify(body).substring(0, 500));

        // ── Extrair dados do evento Cakto ─────────────────────────────────
        // A Cakto envia eventos com structure: { event, data: { ... } }
        // Eventos relevantes: 'purchase.complete', 'payment.approved'
        const eventType = body.event || body.type || '';
        const paymentData = body.data || body;

        const paymentStatus = paymentData.status || paymentData.payment_status || '';
        const buyerEmail = paymentData.buyer?.email
            || paymentData.customer?.email
            || paymentData.email
            || '';

        const planType = paymentData.metadata?.plan_type
            || paymentData.items?.[0]?.reference
            || 'basic';

        const transactionId = paymentData.id
            || paymentData.transaction_id
            || paymentData.order_id
            || String(Date.now());

        console.log(`[Cakto Webhook] Event: ${eventType} | Status: ${paymentStatus} | Email: ${buyerEmail}`);

        // ── Verificar se o pagamento foi aprovado ─────────────────────────
        const isApproved =
            eventType.toLowerCase().includes('complete') ||
            eventType.toLowerCase().includes('approved') ||
            paymentStatus.toLowerCase() === 'paid' ||
            paymentStatus.toLowerCase() === 'approved' ||
            paymentStatus.toLowerCase() === 'complete';

        if (!isApproved) {
            console.log('[Cakto Webhook] Pagamento não aprovado, ignorando...');
            return res.status(200).json({ received: true, message: 'Evento ignorado' });
        }

        if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
            console.warn('[Cakto Webhook] Email do comprador inválido ou ausente:', buyerEmail);
            return res.status(200).json({ received: true, message: 'Email inválido' });
        }

        // ── Inicializar Supabase ──────────────────────────────────────────
        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            console.error('[Cakto Webhook] Variáveis de ambiente Supabase não configuradas');
            return res.status(500).json({ error: 'Configuração do servidor incompleta' });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // ── Calcular data de expiração ────────────────────────────────────
        const planTypeLower = String(planType).toLowerCase();
        const days = planTypeLower === 'basic' ? 30
            : planTypeLower === 'top' ? 30
            : planTypeLower === 'supervip' ? 30
            : 30;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        // ── Ativar anúncio(s) pendentes do usuário ────────────────────────
        const { data: updatedAds, error: updateError } = await supabase
            .from('announcements')
            .update({
                status: 'active',
                payment_id: transactionId,
                payment_status: 'approved',
                plan_type: planTypeLower,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_email', buyerEmail)
            .in('status', ['pending', 'pending_payment'])
            .select();

        if (updateError) {
            console.error('[Cakto Webhook] Erro ao ativar anúncio:', updateError.message);
            return res.status(200).json({ received: true, error: updateError.message });
        }

        if (updatedAds && updatedAds.length > 0) {
            console.log(`[Cakto Webhook] ✅ ${updatedAds.length} anúncio(s) ativado(s) para: ${buyerEmail}`);
        } else {
            console.warn(`[Cakto Webhook] ⚠️ Nenhum anúncio pendente encontrado para: ${buyerEmail}`);
        }

        return res.status(200).json({
            received: true,
            activated: updatedAds?.length || 0,
            email: buyerEmail
        });

    } catch (error) {
        console.error('[Cakto Webhook] Erro interno:', error.message);
        return res.status(200).json({ received: true, error: error.message });
    }
};
