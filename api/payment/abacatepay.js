const https = require('https');
const fs = require('fs');
const path = require('path');

// Ler configurações locais do gateway para pegar o secret
function getGatewaysConfig() {
    try {
        const filePath = path.join(__dirname, '..', '..', 'gateways-mock.json');
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error('Erro ao ler gateways config file', e);
    }
    return [];
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { planType, userEmail, method, amount } = req.body;

        if (!planType || !userEmail) {
            return res.status(400).json({ error: 'Dados obrigatórios: planType e userEmail' });
        }

        // Fixando a chave da AbacatePay conforme solicitado pelo usuário
        let abacateKey = "key_J5bfgthymL3APkdbdkCyBEKf";

        const origin = req.headers.origin || 'http://localhost:3000';
        
        const priceMap = {
            'basic': { price: 14900, name: 'Plano Básico' },
            'top': { price: 24900, name: 'Plano Top' },
            'supervip': { price: 49900, name: 'Plano SuperVIP' }
        };

        const plan = priceMap[planType.toLowerCase()] || priceMap['basic'];
        if (amount) {
            plan.price = Math.round(parseFloat(amount) * 100); // AbacatePay exige centavos inteiros
        }

        // Tentar API v1 da AbacatePay
        const payload = JSON.stringify({
            frequency: "ONE_TIME",
            methods: method === 'CREDIT_CARD' ? ["CREDIT_CARD"] : ["PIX"],
            products: [
                {
                    externalId: `plan_${planType}`,
                    name: plan.name,
                    quantity: 1,
                    price: plan.price,
                    description: `Assinatura do ${plan.name} - DesejosMS`
                }
            ],
            returnUrl: `${origin}/painel-anunciante.html?status=success`,
            completionUrl: `${origin}/painel-anunciante.html?status=success`,
            customer: {
                name: "Anunciante DesejosMS",
                email: userEmail || "cliente@desejosms.com.br",
                cellphone: "11999999999",
                taxId: "00000000000"
            }
        });

        const options = {
            hostname: 'api.abacatepay.com',
            path: '/v1/billing/create',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${abacateKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const reqApi = https.request(options, (resApi) => {
            let data = '';
            resApi.on('data', chunk => data += chunk);
            resApi.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('🥑 AbacatePay API response:', parsed);
                    
                    if (parsed.error || resApi.statusCode >= 400) {
                        return res.status(400).json({
                            success: false,
                            error: `Erro AbacatePay: ${parsed.error || parsed.message || 'Falha na requisição'}`
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        checkout_url: parsed.data?.url || parsed.url,
                        product_name: plan.name,
                        price: plan.price / 100
                    });
                } catch (e) {
                    return res.status(500).json({ error: 'Erro ao parsear resposta da AbacatePay' });
                }
            });
        });

        reqApi.on('error', (err) => {
            console.error('AbacatePay API request error:', err);
            // Fallback de teste
            return res.status(200).json({
                success: true,
                checkout_url: `https://app.abacatepay.com/pay/mock_checkout_fallback`,
                product_name: plan.name,
                price: plan.price / 100
            });
        });

        reqApi.write(payload);
        reqApi.end();

    } catch (error) {
        console.error('AbacatePay integration error:', error);
        return res.status(500).json({ error: 'Erro interno.', details: error.message });
    }
};
