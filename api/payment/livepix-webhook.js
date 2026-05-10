const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rhsserqlbyyjgglcrwva.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v83uLp_HYDgO9PXmjFl8eQ_kSzRGLNI';
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'COLOQUE_SUA_SERVICE_ROLE_KEY_AQUI') 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : SUPABASE_ANON_KEY;

module.exports = async function handler(req, res) {
    // LivePix exige resposta rápida
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const body = req.body || {};
        console.log('❤️ [LivePix Webhook] Recebido:', JSON.stringify(body));

        // Estrutura LivePix v2: 
        // { "userId": "...", "clientId": "...", "event": "confirmed", "resource": { "id": "...", "reference": "...", "type": "payment" } }
        const event = body.event;
        const resource = body.resource;

        if (resource && resource.type === 'payment' && (event === 'confirmed' || event === 'payment.confirmed')) {
            const reference = resource.reference; 
            const paymentId = resource.id;

            if (!reference) {
                console.warn('[LivePix Webhook] Referência não encontrada no payload.');
                return res.status(200).json({ received: true });
            }

            console.log(`✅ [LivePix Webhook] Pagamento Aprovado! Referência: ${reference}`);

            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

            // 1. Buscar o pagamento pelo external_id (reference)
            const { data: paymentRecord, error: payError } = await supabase
                .from('payments')
                .update({ 
                    status: 'approved', 
                    completed_at: new Date().toISOString() 
                })
                .eq('external_id', reference)
                .select()
                .single();

            if (payError) {
                console.warn(`⚠️ [LivePix Webhook] Erro ao atualizar tabela payments ou registro não encontrado: ${payError.message}`);
            }

            // 2. Ativar o anúncio correspondente
            // Extrair adId da referência (formato: ad_123_timestamp)
            const match = reference.match(/ad_([^_]+)/);
            const adId = (paymentRecord && paymentRecord.ad_id) || (match ? match[1] : null);

            if (adId) {
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                const { error: adError } = await supabase
                    .from('announcements')
                    .update({
                        status: 'active',
                        payment_status: 'approved',
                        payment_id: paymentId,
                        expires_at: expiresAt.toISOString()
                    })
                    .eq('id', adId);
                
                if (adError) {
                    console.error(`❌ [LivePix Webhook] Erro ao ativar anúncio ${adId}:`, adError.message);
                } else {
                    console.log(`🚀 [LivePix Webhook] Anúncio ${adId} ativado com sucesso!`);
                }
            } else {
                console.warn('[LivePix Webhook] adId não identificado para esta referência.');
            }
        } else {
            console.log(`ℹ️ [LivePix Webhook] Evento ignorado ou não processável: ${event}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ [LivePix Webhook] Erro interno:', error);
        return res.status(200).json({ error: error.message }); // Sempre retornar 200 para o gateway
    }
};
