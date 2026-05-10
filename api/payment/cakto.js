// Vercel Serverless Function: Integrar com Cakto Gateway
// Mapeia planos do DesejosMS para links de checkout da Cakto
// As URLs de checkout são fixas e seguras — cadastradas diretamente no painel Cakto

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { planType, userEmail } = req.body;

        if (!planType || !userEmail) {
            return res.status(400).json({ error: 'Dados obrigatórios: planType e userEmail' });
        }

        // Mapeamento direto: tipo do plano → URL de checkout na Cakto
        // Esses links foram confirmados no painel da Cakto (Produtos > Links)
        // Formato curto: https://pay.cakto.com.br/{shortId}
        const checkoutMap = {
            'basic': {
                url: 'https://pay.cakto.com.br/3',
                name: 'Plano Basico',
                price: 79.90
            },
            'top': {
                url: 'https://pay.cakto.com.br/il2',
                name: 'Plano Top',
                price: 249.90
            },
            'supervip': {
                url: 'https://pay.cakto.com.br/8',
                name: 'Plano SuperVIP',
                price: 499.90
            }
        };

        const planKey = planType.toLowerCase();
        const plan = checkoutMap[planKey];

        if (!plan) {
            return res.status(404).json({
                error: `Plano "${planType}" não encontrado. Planos disponíveis: basic, top, supervip`
            });
        }

        // Adicionar email como parâmetro na URL para rastreamento
        const checkoutUrl = `${plan.url}?email=${encodeURIComponent(userEmail)}`;

        console.log(`[Cakto] Checkout gerado para ${userEmail} - ${plan.name} (R$ ${plan.price})`);

        return res.status(200).json({
            success: true,
            checkout_url: checkoutUrl,
            product_name: plan.name,
            price: plan.price
        });

    } catch (error) {
        console.error('Cakto API error:', error);
        return res.status(500).json({ error: 'Erro interno no servidor do gateway.', details: error.message });
    }
};
