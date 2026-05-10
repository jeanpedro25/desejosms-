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
        const { planType, userEmail, cpf, amount } = req.body;

        if (!planType || !userEmail || !cpf) {
            return res.status(400).json({ error: 'Dados obrigatórios: planType, userEmail, e cpf' });
        }

        // ==========================================
        // 1. CARREGAR CREDENCIAIS E CERTIFICADO
        // ==========================================
        const gateways = getGatewaysConfig();
        const gwConfig = gateways.find(g => g.type === 'efi') || {};
        
        let clientId = "Client_Id_2f233f7804928ac423c545d7e8004bf95a89f07b";
        let clientSecret = "Client_Secret_cae94e1bc3097723d451638fa356d820d3fbbf74";
        
        // Caminho para o certificado (precisa estar na raiz ou configurado)
        const certPath = path.join(__dirname, '..', '..', 'certificado.p12');

        if (!fs.existsSync(certPath)) {
            console.error("❌ ERRO CRÍTICO: Certificado Efí (certificado.p12) não encontrado na pasta principal.");
            return res.status(400).json({ error: 'Falta o arquivo certificado.p12 na raiz do site. Sem ele, o Banco Central não permite gerar o PIX.' });
        }

        if (!clientSecret) {
            return res.status(400).json({ error: 'Client Secret do Efí Bank não configurado no painel.' });
        }

        // O ambiente (Produção ou Homologação)
        const isProd = true;
        const apiHost = isProd ? 'pix.api.efipay.com.br' : 'pix-h.api.efipay.com.br';

        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const certificado = fs.readFileSync(certPath);

        const agent = new https.Agent({
            pfx: certificado,
            passphrase: '' // A Gerencianet emite o P12 sem senha por padrão
        });

        const priceMap = {
            'basic': { price: "149.00", name: 'Plano Básico' },
            'top': { price: "249.00", name: 'Plano Top' },
            'supervip': { price: "499.00", name: 'Plano SuperVIP' }
        };

        const plan = priceMap[planType.toLowerCase()] || priceMap['basic'];
        
        // Se o frontend mandar o 'amount' real (ex: R$ 1,50), usa ele!
        if (amount) {
            plan.price = parseFloat(amount).toFixed(2);
        }

        // ==========================================
        // 2. OBTER TOKEN OAUTH2
        // ==========================================
        const token = await new Promise((resolve, reject) => {
            const reqToken = https.request({
                hostname: apiHost,
                path: '/oauth/token',
                method: 'POST',
                agent: agent,
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/json'
                }
            }, (resAuth) => {
                let data = '';
                resAuth.on('data', chunk => data += chunk);
                resAuth.on('end', () => {
                    const parsed = JSON.parse(data);
                    if (parsed.access_token) resolve(parsed.access_token);
                    else reject(parsed);
                });
            });
            reqToken.on('error', reject);
            reqToken.write(JSON.stringify({ grant_type: 'client_credentials' }));
            reqToken.end();
        });

        // A API PIX da Efí exige a Chave PIX registrada na conta do Lojista
        // Fixado com a chave oficial enviada pelo usuário
        const chavePixEfi = "9ff61b64-c02a-46ed-8043-fe4ab2a37cae";

        // ==========================================
        // 3. CRIAR COBRANÇA PIX (COB)
        // ==========================================
        const cobBody = JSON.stringify({
            calendario: { expiracao: 3600 },
            devedor: { cpf: cpf, nome: "Anunciante" },
            valor: { original: plan.price },
            chave: chavePixEfi, // Chave Pix do recebedor
            solicitacaoPagador: `Pagamento ${plan.name} - DesejosMS`
        });

        const cob = await new Promise((resolve, reject) => {
            const reqCob = https.request({
                hostname: apiHost,
                path: '/v2/cob',
                method: 'POST',
                agent: agent,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }, (resCob) => {
                let data = '';
                resCob.on('data', chunk => data += chunk);
                resCob.on('end', () => resolve(JSON.parse(data)));
            });
            reqCob.on('error', reject);
            reqCob.write(cobBody);
            reqCob.end();
        });

        if (!cob.loc || !cob.loc.id) {
            throw new Error(`Falha ao gerar cobrança: ${JSON.stringify(cob)}`);
        }

        // ==========================================
        // 4. OBTER QR CODE
        // ==========================================
        const qrCodeData = await new Promise((resolve, reject) => {
            const reqQr = https.request({
                hostname: apiHost,
                path: `/v2/loc/${cob.loc.id}/qrcode`,
                method: 'GET',
                agent: agent,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }, (resQr) => {
                let data = '';
                resQr.on('data', chunk => data += chunk);
                resQr.on('end', () => resolve(JSON.parse(data)));
            });
            reqQr.on('error', reject);
            reqQr.end();
        });

        // ==========================================
        // 5. RETORNAR SUCESSO
        // ==========================================
        return res.status(200).json({
            success: true,
            txid: cob.txid,
            pix_copy_paste: qrCodeData.qrcode,
            qr_code_image: qrCodeData.imagemQrcode
        });

    } catch (error) {
        console.error('Efí Bank API error:', error);
        return res.status(500).json({ error: 'Erro interno.', details: error.message || error });
    }
};
