const crypto = require('crypto');

module.exports = async function handler(req, res) {
    // CORS headers para Webhooks
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-AbacatePay-Signature');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const body = req.body || {};
        
        console.log('🥑 [AbacatePay Webhook] Recebido:', JSON.stringify(body));

        // Eventos comuns na AbacatePay: "BILLING_PAID", "checkout.session.completed", etc
        const eventType = body.event || body.type;
        const data = body.data || body;

        // Idealmente, deve-se verificar o header X-AbacatePay-Signature com webhookSecret
        // const signature = req.headers['x-abacatepay-signature'];
        
        if (eventType === 'BILLING_PAID' || eventType === 'PAYMENT_PAID' || data.status === 'PAID') {
            const customerEmail = data.customer?.email || data.metadata?.email;
            const externalReference = data.externalReference || data.metadata?.externalReference;
            
            console.log(`✅ [AbacatePay Webhook] Pagamento Aprovado para ${customerEmail} - Ref: ${externalReference}`);
            
            // Aqui a lógica atualizaria o banco Supabase ou outro para "approved"
            // e enviaria e-mail de confirmação.
            // No momento do webhook, a plataforma já gerencia via localStorage e Supabase client do outro lado,
            // mas o ideal é que o webhook faça update Server-Side no Supabase Admin.
        } else {
            console.log(`ℹ️ [AbacatePay Webhook] Evento ignorado: ${eventType}`);
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('❌ Erro no webhook do AbacatePay:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
