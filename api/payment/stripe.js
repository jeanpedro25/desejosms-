const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rhsserqlbyyjgglcrwva.supabase.co';
// A chave sb_publishable funciona tanto no browser quanto no Node.js
const SUPABASE_ANON_KEY = 'sb_publishable_v83uLp_HYDgO9PXmjFl8eQ_kSzRGLNI';
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'COLOQUE_SUA_SERVICE_ROLE_KEY_AQUI')
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : SUPABASE_ANON_KEY;

// Chave Stripe - lida exclusivamente de variável de ambiente (configurada na Vercel e .env local)
const STRIPE_SECRET_FALLBACK = process.env.STRIPE_SECRET_KEY || null;

// =====================================================================
// PREÇOS MÍNIMOS DE SEGURANÇA (anti-hacker)
// Mesmo que o Supabase seja comprometido, esses são os mínimos aceitos.
// Um hacker NÃO pode pagar menos que isso.
// =====================================================================
const MIN_PRICES_CENTS = {
    'basic':    5000,   // R$ 50,00 mínimo
    'top':      10000,  // R$ 100,00 mínimo
    'supervip': 20000,  // R$ 200,00 mínimo
    'premium':  20000,  // R$ 200,00 mínimo
    'vip':      10000   // R$ 100,00 mínimo
};

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        // SEGURANÇA: só aceitar planType, userEmail e couponCode do frontend
        // O preço NUNCA vem do frontend — é determinado 100% pelo servidor
        const { planType, userEmail, adId, couponCode } = req.body;

        if (!planType || !userEmail) {
            return res.status(400).json({ error: 'Dados obrigatórios: planType e userEmail' });
        }

        // Validar planType (anti-injeção)
        const validPlans = ['basic', 'top', 'supervip', 'premium', 'vip'];
        const cleanPlanType = planType.toLowerCase().trim();
        if (!validPlans.includes(cleanPlanType)) {
            return res.status(400).json({ error: `Plano inválido: "${planType}". Válidos: ${validPlans.join(', ')}` });
        }

        // 1. Buscar chave secreta do Stripe no Supabase
        let stripeKey = STRIPE_SECRET_FALLBACK;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        try {
            const { data: settings } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'stripe_config')
                .single();

            if (settings?.value?.secretKey) {
                stripeKey = settings.value.secretKey;
                console.log('[Stripe] Usando chave do Supabase.');
            } else {
                console.log('[Stripe] Usando chave de fallback.');
            }
        } catch (e) {
            console.warn('[Stripe] Falha ao buscar chave do Supabase, usando fallback:', e.message);
        }

        if (!stripeKey || !stripeKey.startsWith('sk_')) {
            return res.status(503).json({ error: 'Chave secreta do Stripe inválida ou não configurada.' });
        }

        const stripe = require('stripe')(stripeKey);

        // ============================================================
        // 2. PREÇOS — SEMPRE do servidor, NUNCA do frontend
        // ============================================================
        // Preços padrão (hardcoded como backup seguro)
        let pricing = {
            'basic':    { amount: 14990, name: 'Plano Básico (30 dias)' },
            'top':      { amount: 24990, name: 'Plano Top (30 dias)' },
            'supervip': { amount: 39990, name: 'Plano SuperVIP (30 dias)' },
            'premium':  { amount: 49990, name: 'Plano Premium (30 dias)' },
            'vip':      { amount: 39990, name: 'Plano VIP (30 dias)' }
        };

        // Carregar preços dinâmicos do Supabase (configurados pelo admin)
        try {
            console.log('[Stripe] Buscando pricing_config no Supabase...');
            const { data: pricingRow, error: pricingError } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'pricing_config')
                .single();

            if (pricingError) {
                console.error('[Stripe] ERRO ao buscar pricing_config:', pricingError.message, pricingError.code);
            } else if (pricingRow?.value) {
                const dbPrices = pricingRow.value;
                console.log('[Stripe] pricing_config encontrado:', JSON.stringify(dbPrices));
                Object.keys(dbPrices).forEach(planKey => {
                    const priceInCents = Math.round(parseFloat(dbPrices[planKey]) * 100);
                    if (priceInCents > 0 && pricing[planKey]) {
                        // SEGURANÇA: aplicar preço mínimo
                        const minPrice = MIN_PRICES_CENTS[planKey] || 5000;
                        if (priceInCents >= minPrice) {
                            pricing[planKey].amount = priceInCents;
                            console.log(`[Stripe] ✅ Preço dinâmico: ${planKey} = R$ ${(priceInCents/100).toFixed(2)}`);
                        } else {
                            console.warn(`[Stripe] ⚠️ SEGURANÇA: Preço de ${planKey} (R$ ${(priceInCents/100).toFixed(2)}) abaixo do mínimo R$ ${(minPrice/100).toFixed(2)}. Usando mínimo.`);
                            pricing[planKey].amount = minPrice;
                        }
                    }
                });
            } else {
                console.log('[Stripe] pricing_config não encontrado ou vazio no Supabase.');
            }
        } catch (priceErr) {
            console.warn('[Stripe] Usando preços padrão (pricing_config indisponível):', priceErr.message);
        }

        const plan = pricing[cleanPlanType];
        if (!plan) {
            return res.status(404).json({ error: `Plano "${planType}" não encontrado.` });
        }

        // ============================================================
        // 3. VALIDAR CUPOM (se fornecido)
        // ============================================================
        let discountPct = 0;
        let appliedCoupon = null;
        if (couponCode && typeof couponCode === 'string' && couponCode.length > 0 && couponCode.length < 50) {
            try {
                // Buscar cupons no Supabase
                const { data: couponData } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('code', couponCode.toUpperCase())
                    .single();

                if (couponData) {
                    // Verificar se está ativo
                    const isActive = couponData.active !== false && couponData.status !== 'inactive';
                    const notExpired = !couponData.expires_at || new Date(couponData.expires_at) > new Date();
                    const notOverLimit = !couponData.limit || (couponData.used || 0) < couponData.limit;

                    if (isActive && notExpired && notOverLimit) {
                        discountPct = Number(couponData.discount) || 0;
                        appliedCoupon = couponData;
                        console.log(`[Stripe] \u2705 Cupom "${couponCode}" validado: ${discountPct}% desconto`);
                    } else {
                        console.log(`[Stripe] Cupom "${couponCode}" inválido (ativo:${isActive} expirado:${!notExpired} limite:${!notOverLimit})`);
                    }
                } else {
                    // Fallback: buscar no localStorage-sync (tabela settings)
                    const { data: localCoupons } = await supabase
                        .from('settings')
                        .select('value')
                        .eq('key', 'coupons')
                        .single();

                    if (localCoupons?.value) {
                        const coupons = Array.isArray(localCoupons.value) ? localCoupons.value : [];
                        const found = coupons.find(c => c.code === couponCode.toUpperCase() && c.active !== false);
                        if (found) {
                            discountPct = Number(found.discount) || 0;
                            appliedCoupon = found;
                            console.log(`[Stripe] \u2705 Cupom (settings) "${couponCode}" validado: ${discountPct}% desconto`);
                        }
                    }
                }
            } catch (couponErr) {
                console.warn('[Stripe] Erro ao validar cupom:', couponErr.message);
            }
        }

        // Aplicar desconto ao preço
        let finalAmount = plan.amount;
        let discountAmount = 0;
        if (discountPct > 0 && discountPct <= 100) {
            discountAmount = Math.round(plan.amount * (discountPct / 100));
            finalAmount = plan.amount - discountAmount;
            // SEGURANÇA: Permitir que o cupom reduza o preço, mas garantir um mínimo absoluto (ex: R$ 5,00) para evitar erros na Stripe
            const ABSOLUTE_MINIMUM_CENTS = 500; // R$ 5,00
            if (finalAmount < ABSOLUTE_MINIMUM_CENTS) {
                console.warn(`[Stripe] \u26a0\ufe0f Preço com desconto (R$ ${(finalAmount/100).toFixed(2)}) muito baixo. Usando mínimo absoluto do Stripe (R$ 5,00).`);
                finalAmount = ABSOLUTE_MINIMUM_CENTS;
                discountAmount = plan.amount - ABSOLUTE_MINIMUM_CENTS;
            }
            console.log(`[Stripe] Preço original: R$ ${(plan.amount/100).toFixed(2)} → Desconto ${discountPct}%: -R$ ${(discountAmount/100).toFixed(2)} → Final: R$ ${(finalAmount/100).toFixed(2)}`);
        }

        // ============================================================
        // 4. CRIAR CHECKOUT SESSION — Apenas Cartão de Crédito
        // ============================================================
        const siteUrl = process.env.SITE_URL || 'http://localhost:3001';

        console.log(`[Stripe] Checkout: ${userEmail} - ${plan.name} - R$ ${(finalAmount/100).toFixed(2)}${appliedCoupon ? ` (cupom: ${couponCode})` : ''}`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: plan.name + (appliedCoupon ? ` (Cupom: ${couponCode})` : ''),
                        description: 'DesejosMS — Anúncio por 30 dias'
                    },
                    unit_amount: finalAmount
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${siteUrl}/painel-anunciante.html?status=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/painel-anunciante.html?status=cancel`,
            customer_email: userEmail,
            metadata: {
                userEmail: userEmail,
                planType: cleanPlanType,
                adId: adId || 'new',
                originalPrice: plan.amount,
                discountPct: discountPct || 0,
                couponCode: couponCode || '',
                priceCharged: finalAmount
            }
        });

        return res.status(200).json({
            success: true,
            method: 'checkout_session',
            checkout_url: session.url,
            id: session.id,
            product_name: plan.name,
            price: finalAmount / 100,
            originalPrice: plan.amount / 100,
            discount: discountPct > 0 ? { pct: discountPct, amount: discountAmount / 100, coupon: couponCode } : null
        });

    } catch (error) {
        console.error('[Stripe] Erro geral:', error.message);

        // Verificar se é erro de chave inválida
        if (error.type === 'StripeAuthenticationError' || error.message?.includes('API key')) {
            return res.status(401).json({
                error: 'Chave da Stripe inválida. Verifique a chave secreta no Painel Admin → Configuração de Pagamentos.',
                details: error.message
            });
        }

        return res.status(500).json({
            error: 'Erro ao processar pagamento Stripe.',
            details: error.message
        });
    }
};
