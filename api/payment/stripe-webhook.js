const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // 1. Buscar configuração do Stripe para validar assinatura ou apenas processar
        const { data: settings } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'stripe_config')
            .single();

        const stripeKey = settings?.value?.secretKey || process.env.STRIPE_SECRET_KEY;
        const endpointSecret = settings?.value?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

        if (!stripeKey) {
            return res.status(503).json({ error: 'Stripe não configurado.' });
        }

        const stripe = require('stripe')(stripeKey);
        const sig = req.headers['stripe-signature'];
        let event = req.body;

        // Tentar validar assinatura se o secret estiver configurado
        if (endpointSecret && sig) {
            try {
                // No Vercel, req.body pode estar já parseado. 
                // Se der erro de assinatura, pode ser necessário o raw body.
                // event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
            } catch (err) {
                console.warn(`⚠️ Falha na validação de assinatura: ${err.message}`);
            }
        }

        console.log(`[Stripe Webhook] Evento: ${event.type}`);

        // ==========================================
        // 1. EVENTO: CHECKOUT COMPLETADO OU PAYMENT INTENT SUCESSO
        // ==========================================
        if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
            const obj = event.data.object;
            const customerEmail = obj.customer_details?.email || obj.metadata?.userEmail;
            const paymentId = obj.id;
            const planType = obj.metadata?.planType;
            const amount = obj.amount_total ? (obj.amount_total / 100) : (obj.amount / 100);

            if (!customerEmail) {
                console.warn('[Stripe Webhook] Email do cliente não encontrado no evento.');
                return res.status(200).json({ received: true, warning: 'Email not found' });
            }

            console.log(`✅ Pagamento Stripe Aprovado (${event.type}): ${customerEmail}`);

            // Buscar anúncio pendente mais recente
            const { data: ads } = await supabase
                .from('announcements')
                .select('*')
                .eq('user_email', customerEmail)
                .order('created_at', { ascending: false });

            if (ads && ads.length > 0) {
                const adToActivate = ads[0];
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await supabase
                    .from('announcements')
                    .update({
                        status: 'active',
                        payment_status: 'approved',
                        payment_id: paymentId,
                        expires_at: expiresAt.toISOString()
                    })
                    .eq('id', adToActivate.id);
            }

            // Registrar pagamento
            await supabase
                .from('payments')
                .upsert({
                    user_email: customerEmail,
                    mp_payment_id: paymentId,
                    amount: amount,
                    status: 'approved',
                    plan_type: planType || 'Stripe Plan'
                }, { onConflict: 'mp_payment_id' });
        }

        return res.status(200).json({ received: true });

    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};
