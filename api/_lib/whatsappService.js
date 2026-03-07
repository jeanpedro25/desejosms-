// Serviço interno para disparo de WhatsApp via Evolution API
// Deve ser hospedado na Vercel as variáveis de ambiente:
// EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME

const API_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

/**
 * Formata número BR para o padrão WAPP: 55[DDD][NUMERO]@s.whatsapp.net
 */
function formatNumber(phone) {
    let num = phone.replace(/\D/g, ''); // só números
    if (num.length === 10 || num.length === 11) {
        num = '55' + num;
    }
    return num;
}

/**
 * Envia uma mensagem de texto simples
 */
async function sendText(phone, message) {
    if (!API_URL || !API_KEY || !INSTANCE) {
        console.log(`[WAPP-MOCK] EVOLUTION API NÃO CONFIGURADA. LOG: Enviaria para ${phone}: "${message}"`);
        return true; 
    }

    try {
        const url = `${API_URL}/message/sendText/${INSTANCE}`;
        const number = formatNumber(phone);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                number: number,
                options: { delay: 1200, presence: "composing" }, // simular 'digitando...'
                textMessage: { text: message }
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));
        
        console.log(`📱 WhatsApp enviado com sucesso para ${number}`);
        return true;
    } catch (error) {
        console.error(`❌ Erro WhatsApp API [${phone}]:`, error.message);
        return false;
    }
}

/**
 * Notifica que o anúncio foi aprovado
 */
export async function sendAdApprovedWhatsApp(phone, adName, planType) {
    if (!phone) return false;
    
    const msg = `*DesejosMS Informa:* ✅\n\nOlá! Boas notícias!\nSeu anúncio *${adName}* (Plano ${planType.toUpperCase()}) acabou de ser aprovado e já está online!\n\nAgradecemos por anunciar conosco.`;
    return await sendText(phone, msg);
}

/**
 * Notifica que o anúncio está expirando
 */
export async function sendAdExpiringWhatsApp(phone, adName, cityName, daysLeft, adId) {
    if (!phone) return false;
    
    const renewUrl = `${process.env.SITE_URL || 'https://desejosms.vercel.app'}/painel-anunciante.html?renew=${adId}`;
    let msg = '';

    if (daysLeft === 0) {
        msg = `*URGENTE - DesejosMS* ⚠️\n\nO seu anúncio *${adName}* ativo em *${cityName}* expirou HOJE e saiu do ar.\n\nNão perca seus acessos! Efetue o pagamento do PIX para renová-lo agora mesmo clicando abaixo:\n\n👉 ${renewUrl}\n\n_(Se já pagou, o sistema baixará em breve)_`;
    } else {
        msg = `*AVISO - DesejosMS* ⚠️\n\nO seu anúncio *${adName}* ativo em *${cityName}* vence em *${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}*.\n\nPara garantir que seu perfil não saia do site, gere o PIX e renove seu plano clicando no link seguro abaixo:\n\n👉 ${renewUrl}\n\n_(Aprovação na hora.)_`;
    }

    return await sendText(phone, msg);
}
