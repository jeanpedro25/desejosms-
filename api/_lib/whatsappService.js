// WhatsApp Service - CommonJS para compatibilidade com Vercel
// Evolution API para disparo de mensagens

const API_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

/**
 * Formata número BR para padrão Evolution API: 55DDDNUMERO
 */
function formatNumber(phone) {
    if (!phone) return '';
    let num = String(phone).replace(/\D/g, '');
    // Remover DDI se já tiver
    if (num.startsWith('55') && num.length > 11) {
        return num;
    }
    // DDD + número (10 ou 11 dígitos)
    if (num.length === 10 || num.length === 11) {
        num = '55' + num;
    }
    return num;
}

/**
 * Escapa caracteres especiais do WhatsApp
 */
function escapeWApp(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Envia mensagem de texto via Evolution API
 */
async function sendText(phone, message) {
    if (!API_URL || !API_KEY || !INSTANCE) {
        console.log(`[WAPP-MOCK] Evolution API não configurada. Para: ${phone}`);
        return true;
    }

    // Validar telefone
    const number = formatNumber(phone);
    if (!number || number.length < 12) {
        console.warn('[WAPP] Número inválido:', phone);
        return false;
    }

    try {
        const url = `${API_URL}/message/sendText/${INSTANCE}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                number: number,
                options: { delay: 1200, presence: 'composing' },
                textMessage: { text: message }
            }),
            // Timeout de 10 segundos
            signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(JSON.stringify(data).substring(0, 200));
        }

        console.log(`[WAPP] Mensagem enviada para ${number}`);
        return true;
    } catch (error) {
        console.error(`[WAPP] Erro para ${phone}:`, error.message);
        return false;
    }
}

/**
 * Notifica aprovação do anúncio
 */
async function sendAdApprovedWhatsApp(phone, adName, planType) {
    if (!phone) return false;
    const safeName = escapeWApp(adName);
    const safePlan = escapeWApp(planType).toUpperCase();
    const msg = `*DesejosMS Informa:* ✅\n\nOlá! Boas notícias!\nSeu anúncio *${safeName}* (Plano ${safePlan}) foi aprovado e já está online!\n\nAgradecemos por anunciar conosco.`;
    return await sendText(phone, msg);
}

/**
 * Notifica vencimento/expiração do anúncio
 */
async function sendAdExpiringWhatsApp(phone, adName, cityName, daysLeft, adId) {
    if (!phone) return false;
    const safeName = escapeWApp(adName);
    const safeCity = escapeWApp(cityName);
    const safeAdId = String(adId).replace(/[^a-zA-Z0-9\-_]/g, '');
    const siteUrl = process.env.SITE_URL || 'https://desejosms.vercel.app';
    const renewUrl = `${siteUrl}/painel-anunciante.html?renew=${safeAdId}`;
    const daysNum = parseInt(daysLeft, 10);
    let msg = '';

    if (daysNum === 0) {
        msg = `*URGENTE - DesejosMS* ⚠️\n\nSeu anúncio *${safeName}* em *${safeCity}* expirou HOJE e saiu do ar.\n\nRenove agora:\n👉 ${renewUrl}\n\n_(Se já pagou, aguarde a confirmação automática)_`;
    } else {
        msg = `*AVISO - DesejosMS* ⚠️\n\nSeu anúncio *${safeName}* em *${safeCity}* vence em *${daysNum} ${daysNum === 1 ? 'dia' : 'dias'}*.\n\nRenove para não sair do ar:\n👉 ${renewUrl}\n\n_(Aprovação imediata via PIX)_`;
    }

    return await sendText(phone, msg);
}

module.exports = { sendAdApprovedWhatsApp, sendAdExpiringWhatsApp };
