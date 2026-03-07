import { Resend } from 'resend';

// Inicializa o Resend com a chave da Vercel
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const FROM_EMAIL = 'DesejosMS <contato@desejosms.com>'; // Substitua pelo seu domínio verificado no Resend

/**
 * Envia e-mail de anúncio recém aprovado
 */
export async function sendAdApprovedEmail(toEmail, adName, planType) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[EMAIL-MOCK] E-mail de Aprovação simulado para ${toEmail}`);
        return true;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: toEmail,
            subject: '✅ Seu anúncio está Online!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                    <h2 style="color: #d11b62; text-align: center;">DesejosMS</h2>
                    <h3>Olá! Ótima notícia!</h3>
                    <p>O seu PIX foi confirmado e seu anúncio <strong>${adName}</strong> no plano ${planType.toUpperCase()} já está no ar.</p>
                    <p>Ele ficará ativo conforme a duração do seu plano. Avisaremos você quando estiver perto de vencer.</p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.SITE_URL || 'https://desejosms.vercel.app'}" style="background-color: #d11b62; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Acessar o Site</a>
                    </div>
                </div>
            `
        });

        if (error) throw error;
        console.log(`📩 E-mail de aprovação enviado para ${toEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Erro ao enviar e-mail de aprovação:', err);
        return false;
    }
}

/**
 * Envia e-mail de aviso de vencimento / link de renovação
 */
export async function sendAdExpiringEmail(toEmail, adName, cityName, daysLeft, adId) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[EMAIL-MOCK] E-mail de Vencimento (${daysLeft} dias) simulado para ${toEmail}`);
        return true;
    }

    const renewUrl = `${process.env.SITE_URL || 'https://desejosms.vercel.app'}/painel-anunciante.html?renew=${adId}`;
    
    let title = daysLeft === 0 ? "⚠️ Seu anúncio SAIU DO AR!" : `⚠️ Seu anúncio vence em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`;
    let message = daysLeft === 0 
        ? `Seu anúncio <strong>${adName}</strong> em ${cityName} acabou de vencer e foi removido das buscas.` 
        : `Faltam apenas ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} para o seu anúncio <strong>${adName}</strong> em ${cityName} vencer.`;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: toEmail,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eeeedd; border-radius: 8px; padding: 20px; background-color: #fffaf0;">
                    <h2 style="color: #d11b62; text-align: center;">DesejosMS</h2>
                    <h3 style="color: #b22222;">${title}</h3>
                    <p>${message}</p>
                    <p>Não perca seus clientes! Renove seu plano agora mesmo pagando via PIX com aprovação imediata.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${renewUrl}" style="background-color: #00a650; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">RENAR COM PIX AGORA</a>
                    </div>
                    <p style="font-size: 12px; color: #666; text-align: center;">Se já pagou, desconsidere este e-mail.</p>
                </div>
            `
        });

        if (error) throw error;
        console.log(`📩 E-mail de vencimento enviado para ${toEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Erro ao enviar e-mail de vencimento:', err);
        return false;
    }
}
