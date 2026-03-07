// Vercel Serverless Function: Consultar status do pagamento
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Payment ID obrigatório' });

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Buscar no Supabase
        const { data: payment } = await supabase
            .from('payments')
            .select('*')
            .eq('mp_payment_id', String(id))
            .single();

        if (payment) {
            return res.status(200).json({
                status: payment.status,
                payment_id: payment.mp_payment_id,
                amount: payment.amount,
                plan_type: payment.plan_type,
                created_at: payment.created_at
            });
        }

        // Consultar diretamente no MP
        const { data: settings } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'mercadopago_config')
            .single();

        if (!settings) return res.status(404).json({ error: 'Config MP não encontrada' });

        const accessToken = settings.value.secretKey || settings.value.access_token;
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!mpResponse.ok) return res.status(404).json({ error: 'Pagamento não encontrado' });

        const mpPayment = await mpResponse.json();
        return res.status(200).json({
            status: mpPayment.status,
            payment_id: String(mpPayment.id),
            status_detail: mpPayment.status_detail
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
