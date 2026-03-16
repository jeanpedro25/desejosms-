// Email Service - CommonJS para compatibilidade com Vercel
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || '');
const FROM_EMAIL = 'DesejosMS <noreply@desejosms.com.br>';

// Utilitário para escapar HTML em emails
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Envia e-mail de anúncio aprovado
 */
async function sendAdApprovedEmail(toEmail, adName, planType) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[EMAIL-MOCK] Aprovação simulada para ${toEmail}`);
        return true;
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
        console.error('[EMAIL] Email inválido:', toEmail);
        return false;
    }

    const safeAdName = escapeHtml(adName);
    const safePlanType = escapeHtml(planType).toUpperCase();
    const siteUrl = escapeHtml(process.env.SITE_URL || 'https://desejosms.vercel.app');

    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: toEmail,
            subject: '✅ Seu anúncio está Online no DesejosMS!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px; background: #fff;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <h2 style="color: #8B0000; margin:0;">❤️ DesejosMS</h2>
                    </div>
                    <h3 style="color:#333;">Olá! Ótima notícia!</h3>
                    <p style="color:#555;">O seu PIX foi confirmado e seu anúncio <strong>${safeAdName}</strong> no plano <strong>${safePlanType}</strong> já está no ar.</p>
                    <p style="color:#555;">Ele ficará ativo conforme a duração do seu plano. Avisaremos quando estiver perto de vencer.</p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${siteUrl}" style="background-color: #8B0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Acessar o Site</a>
                    </div>
                    <hr style="margin:30px 0; border:none; border-top:1px solid #eee;">
                    <p style="font-size:11px; color:#999; text-align:center;">DesejosMS - Mato Grosso do Sul<br>Este é um e-mail automático, não responda.</p>
                </div>
            `
        });

        if (error) throw error;
        console.log(`[EMAIL] Aprovação enviada para ${toEmail}`);
        return true;
    } catch (err) {
        console.error('[EMAIL] Erro ao enviar aprovação:', err.message);
        return false;
    }
}

/**
 * Envia e-mail de aviso de vencimento
 */
async function sendAdExpiringEmail(toEmail, adName, cityName, daysLeft, adId) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[EMAIL-MOCK] Vencimento (${daysLeft} dias) simulado para ${toEmail}`);
        return true;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
        console.error('[EMAIL] Email inválido:', toEmail);
        return false;
    }

    const safeAdName = escapeHtml(adName);
    const safeCityName = escapeHtml(cityName);
    const safeAdId = String(adId).replace(/[^a-zA-Z0-9\-_]/g, '');
    const siteUrl = escapeHtml(process.env.SITE_URL || 'https://desejosms.vercel.app');
    const renewUrl = `${siteUrl}/painel-anunciante.html?renew=${safeAdId}`;

    const daysNum = parseInt(daysLeft, 10);
    const title = daysNum === 0
        ? '⚠️ Seu anúncio SAIU DO AR!'
        : `⚠️ Seu anúncio vence em ${daysNum} ${daysNum === 1 ? 'dia' : 'dias'}`;

    const message = daysNum === 0
        ? `Seu anúncio <strong>${safeAdName}</strong> em ${safeCityName} expirou e foi removido das buscas.`
        : `Faltam apenas ${daysNum} ${daysNum === 1 ? 'dia' : 'dias'} para o seu anúncio <strong>${safeAdName}</strong> em ${safeCityName} vencer.`;

    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: toEmail,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ffd; border-radius: 8px; padding: 20px; background: #fffaf0;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <h2 style="color: #8B0000; margin:0;">❤️ DesejosMS</h2>
                    </div>
                    <h3 style="color: #b22222;">${escapeHtml(title)}</h3>
                    <p style="color:#555;">${message}</p>
                    <p style="color:#555;">Não perca seus clientes! Renove seu plano agora pagando via PIX com aprovação imediata.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${renewUrl}" style="background-color: #00a650; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">RENOVAR COM PIX AGORA</a>
                    </div>
                    <p style="font-size: 12px; color: #666; text-align: center;">Se já pagou, desconsidere este e-mail.</p>
                    <hr style="margin:30px 0; border:none; border-top:1px solid #eee;">
                    <p style="font-size:11px; color:#999; text-align:center;">DesejosMS - Este é um e-mail automático, não responda.</p>
                </div>
            `
        });

        if (error) throw error;
        console.log(`[EMAIL] Vencimento enviado para ${toEmail}`);
        return true;
    } catch (err) {
        console.error('[EMAIL] Erro ao enviar vencimento:', err.message);
        return false;
    }
}

module.exports = { sendAdApprovedEmail, sendAdExpiringEmail };
