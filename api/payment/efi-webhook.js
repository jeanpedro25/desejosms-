module.exports = async function handler(req, res) {
    // A Efí exige que o webhook responda 200 o mais rápido possível
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Na configuração do webhook, o Efí envia um POST para validar.
    // É obrigatório retornar HTTP 200.
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const body = req.body || {};
        
        console.log('🟠 [Efí Webhook] Recebido:', JSON.stringify(body));

        // A Efí envia os pagamentos confirmados dentro do array "pix"
        if (body.pix && Array.isArray(body.pix)) {
            body.pix.forEach(pagamento => {
                const txid = pagamento.txid;
                const valor = pagamento.valor;
                const infoPagador = pagamento.infoPagador;

                console.log(`✅ [Efí Webhook] PIX Recebido! TXID: ${txid} | Valor: R$ ${valor} | Mensagem: ${infoPagador}`);
                
                // Aqui você pode atualizar o Supabase para mudar o status do anúncio de "pending_payment" para "active"
                // const adId = ... buscar o anúncio pelo TXID guardado no banco;
                // supabase.from('announcements').update({ status: 'active', payment_status: 'paid' }).eq('txid', txid);
            });
        } else {
            console.log(`ℹ️ [Efí Webhook] Payload não contém array pix. Pode ser apenas validação de configuração.`);
        }

        return res.status(200).end();
    } catch (error) {
        console.error('❌ Erro no webhook do Efí:', error);
        // Responda com 200 de qualquer forma para não bloquear o webhook do banco
        return res.status(200).end();
    }
};
