const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (serão preenchidas pelo ambiente ou fallback)
const supabaseUrl = process.env.SUPABASE_URL || 'https://vjpkzmvkpjvvkpjvvkpj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key-here';
const kiwifyWebhookSecret = 'u1zql56ygx6';

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        console.log('🥝 Recebendo Webhook da Kiwify...');
        
        const payload = req.body;
        console.log('Payload Kiwify:', JSON.stringify(payload));

        // Validar status da compra
        const orderStatus = payload.order_status; // 'approved', 'refunded', etc.
        const adId = payload.custom; // Passamos no redirect
        const customerEmail = payload.customer_email;

        if (orderStatus === 'paid' || orderStatus === 'approved') {
            console.log(`✅ Pagamento Aprovado para o anúncio: ${adId}`);

            // Inicializar Supabase Admin (necessário para atualizar qualquer registro)
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Atualizar status do anúncio para 'active'
            const { data, error } = await supabase
                .from('announcements')
                .update({ 
                    status: 'active',
                    approved_at: new Date().toISOString(),
                    paid_amount: payload.amount_cents / 100
                })
                .eq('id', adId);

            if (error) {
                console.error('❌ Erro ao atualizar anúncio no Supabase:', error);
                return res.status(500).json({ error: 'Erro ao atualizar anúncio' });
            }

            console.log('🚀 Anúncio ativado com sucesso!');
        } else {
            console.log(`ℹ️ Status do pedido ignorado: ${orderStatus}`);
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
