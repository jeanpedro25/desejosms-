// Webhook da Cakto para aprovação, reembolso e chargeback automática de anúncios
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const payload = req.body;

        if (!payload || !payload.event) {
            return res.status(400).json({ error: 'Payload ou evento inválido.' });
        }

        const event = payload.event;
        const eventData = payload.data || {};
        const customerEmail = eventData.customer ? eventData.customer.email : null;
        const paymentId = eventData.id ? String(eventData.id) : null;

        console.log(`[Cakto Webhook] Evento: "${event}" para o e-mail: ${customerEmail}`);

        if (!customerEmail) {
            return res.status(400).json({ error: 'E-mail do cliente ausente no payload.' });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // ==========================================
        // 1. EVENTO: COMPRA APROVADA
        // ==========================================
        if (event === 'purchase_approved' || eventData.status === 'approved') {
            console.log('✅ Pagamento Aprovado. Ativando o anúncio...');

            // Buscar anúncio pendente mais recente deste usuário
            const { data: ads, error: adsError } = await supabase
                .from('announcements')
                .select('*')
                .eq('user_email', customerEmail)
                .order('created_at', { ascending: false });

            if (adsError) {
                console.error('Erro ao buscar anúncio no Supabase:', adsError);
                return res.status(500).json({ error: 'Erro no banco de dados.' });
            }

            // Ativar o primeiro anúncio que encontrar (geralmente o pendente ou o mais recente)
            const adToActivate = ads && ads.length > 0 ? ads[0] : null;

            if (adToActivate) {
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30); // Ativo por 30 dias

                const { error: updateError } = await supabase
                    .from('announcements')
                    .update({
                        status: 'active',
                        payment_status: 'approved',
                        payment_id: paymentId,
                        expires_at: expiresAt.toISOString()
                    })
                    .eq('id', adToActivate.id);

                if (updateError) {
                    console.error('Erro ao ativar anúncio no Supabase:', updateError);
                } else {
                    console.log(`🚀 Anúncio [${adToActivate.id}] ativado com sucesso por 30 dias!`);
                }
            } else {
                console.log(`Aviso: Nenhum anúncio localizado para ativar para o e-mail ${customerEmail}.`);
            }

            // Registrar/Atualizar pagamento na tabela de pagamentos
            await supabase
                .from('payments')
                .upsert({
                    user_email: customerEmail,
                    mp_payment_id: paymentId, // Usamos essa coluna padrão para guardar o ID externo
                    amount: eventData.amount || 0,
                    status: 'approved',
                    plan_type: eventData.product ? eventData.product.name : 'Cakto Plan'
                }, { onConflict: 'mp_payment_id' });

            return res.status(200).json({ success: true, message: 'Anúncio ativado com sucesso.' });
        }

        // ==========================================
        // 2. EVENTO: REEMBOLSO OU CHARGEBACK (Má Fé / 7 Dias)
        // ==========================================
        if (event === 'refund' || event === 'chargeback' || eventData.status === 'refunded') {
            console.log('⚠️ Reembolso/Chargeback detectado. Desativando anúncios...');

            // Desativar TODOS os anúncios ativos do usuário
            const { error: deactiveError } = await supabase
                .from('announcements')
                .update({
                    status: 'rejected', // Desativa retirando do ar
                    payment_status: 'refunded'
                })
                .eq('user_email', customerEmail);

            if (deactiveError) console.error('Erro ao desativar anúncios:', deactiveError);

            // Atualizar status do pagamento
            await supabase
                .from('payments')
                .update({ status: 'refunded' })
                .eq('mp_payment_id', paymentId);

            // SEGURANÇA ANTIFRAUDE: Bloquear se houver reincidência de reembolso
            // Contar quantos reembolsos esse usuário já fez
            const { data: refundedPayments } = await supabase
                .from('payments')
                .select('id')
                .eq('user_email', customerEmail)
                .eq('status', 'refunded');

            const totalRefunds = (refundedPayments ? refundedPayments.length : 0) + 1; // +1 do evento atual

            if (totalRefunds >= 2) {
                console.log(`🚫 Usuário reincidente (${totalRefunds} reembolsos). Bloqueando conta...`);
                await supabase
                    .from('users')
                    .update({ blocked: true })
                    .eq('email', customerEmail);
            }

            return res.status(200).json({ success: true, message: 'Anúncio desativado e antifraude checado.' });
        }

        return res.status(200).json({ success: true, message: 'Evento ignorado.' });

    } catch (e) {
        console.error('Erro crítico no Cakto Webhook:', e);
        return res.status(500).json({ error: 'Erro interno no servidor.', details: e.message });
    }
}
