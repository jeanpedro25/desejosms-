// Vercel Serverless Function: Integrar com Cakto Gateway
// Busca as chaves do Supabase e tenta mapear o produto para redirecionamento
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
        const { planType, userEmail } = req.body;

        if (!planType || !userEmail) {
            return res.status(400).json({ error: 'Dados obrigatórios: planType e userEmail' });
        }

        // 1. Buscar chaves do Cakto no Supabase
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'cakto_config')
            .single();

        if (settingsError || !settings) {
            return res.status(503).json({
                error: 'Gateway Cakto não configurado no painel Admin.'
            });
        }

        const caktoConfig = settings.value;
        const clientId = caktoConfig.publicKey; // Salvo como public key no painel
        const clientSecret = caktoConfig.secretKey; // Salvo como secret key no painel

        if (!clientId || !clientSecret) {
            return res.status(503).json({
                error: 'Credenciais da Cakto incompletas. Configure Client ID e Client Secret no Admin.'
            });
        }

        // 2. Obter Token OAuth da Cakto
        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', clientId);
        tokenParams.append('client_secret', clientSecret);

        const tokenResponse = await fetch('https://api.cakto.com.br/public_api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return res.status(401).json({
                error: 'Falha na autenticação com a Cakto. Verifique suas chaves.',
                cakto_error: tokenData
            });
        }

        const accessToken = tokenData.access_token;

        // 3. Listar produtos da Cakto para encontrar o Checkout correspondente
        const productsResponse = await fetch('https://api.cakto.com.br/public_api/products/', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const productsData = await productsResponse.json();

        if (!productsResponse.ok) {
            return res.status(502).json({
                error: 'Erro ao listar produtos na Cakto.',
                cakto_error: productsData
            });
        }

        const products = productsData.results || [];
        
        // Mapeamento de nomes de planos esperados
        const planNames = {
            'basic': 'Plano Básico',
            'top': 'Plano Top',
            'supervip': 'Plano SuperVIP'
        };
        const expectedName = planNames[planType.toLowerCase()] || planType;

        // Tentar encontrar produto com nome compatível
        const matchedProduct = products.find(p => 
            p.name.toLowerCase().includes(expectedName.toLowerCase()) || 
            expectedName.toLowerCase().includes(p.name.toLowerCase())
        );

        if (!matchedProduct) {
            // Se não encontrou, retornar o primeiro produto como fallback ou mensagem clara
            if (products.length > 0) {
                const fallbackProduct = products[0];
                const fallbackUrl = `https://pay.cakto.com.br/${fallbackProduct.short_id || fallbackProduct.id}`;
                return res.status(200).json({
                    success: true,
                    checkout_url: fallbackUrl,
                    message: `Aviso: Não encontramos um produto exatamente com o nome "${expectedName}" no seu painel Cakto. Redirecionando para o produto "${fallbackProduct.name}".`
                });
            }

            return res.status(404).json({
                error: `Nenhum produto cadastrado na Cakto. Acesse o painel da Cakto e crie o "${expectedName}" para poder cobrar.`
            });
        }

        // Construir URL do checkout
        // Usamos o short_id ou id da oferta se estiver disponível
        const checkoutId = matchedProduct.short_id || matchedProduct.id;
        const checkoutUrl = `https://pay.cakto.com.br/${checkoutId}`;

        return res.status(200).json({
            success: true,
            checkout_url: checkoutUrl,
            product_name: matchedProduct.name
        });

    } catch (error) {
        console.error('Cakto API error:', error);
        return res.status(500).json({ error: 'Erro interno no servidor do gateway.', details: error.message });
    }
};
