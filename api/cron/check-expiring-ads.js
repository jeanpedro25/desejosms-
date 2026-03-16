// Vercel Cron Job - CommonJS
// Roda diariamente para verificar anúncios ativos e enviar alertas de vencimento

const { createClient } = require('@supabase/supabase-js');
const { sendAdExpiringEmail } = require('../_lib/emailService');
const { sendAdExpiringWhatsApp } = require('../_lib/whatsappService');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(request, response) {
    // Proteger o Cron (a Vercel envia Authorization header)
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return response.status(500).json({ error: 'Supabase não configurado' });
    }

    try {
        console.log('[CRON] Iniciando verificação de vencimentos...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { data: ads, error } = await supabase
            .from('announcements')
            .select('id, name, user_email, city, state, whatsapp, phone, expires_at, notified_expiry_3d, notified_expiry_1d, notified_expired')
            .eq('status', 'active')
            .not('expires_at', 'is', null);

        if (error) throw error;

        console.log(`[CRON] Anúncios ativos analisados: ${ads.length}`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let count3d = 0, count1d = 0, countExpired = 0;

        for (const ad of ads) {
            try {
                const expireDate = new Date(ad.expires_at);
                expireDate.setHours(0, 0, 0, 0);

                const timeDiff = expireDate.getTime() - today.getTime();
                const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                const phoneToUse = ad.whatsapp || ad.phone;
                const cityState = `${ad.city || 'MS'}/${ad.state || 'MS'}`;

                if (daysLeft === 3 && !ad.notified_expiry_3d) {
                    console.log(`[CRON] Alerta 3 dias: ${ad.name}`);
                    await sendAdExpiringEmail(ad.user_email, ad.name, cityState, 3, ad.id);
                    if (phoneToUse) await sendAdExpiringWhatsApp(phoneToUse, ad.name, cityState, 3, ad.id);
                    await supabase.from('announcements').update({ notified_expiry_3d: true }).eq('id', ad.id);
                    count3d++;

                } else if (daysLeft === 1 && !ad.notified_expiry_1d) {
                    console.log(`[CRON] Alerta 1 dia: ${ad.name}`);
                    await sendAdExpiringEmail(ad.user_email, ad.name, cityState, 1, ad.id);
                    if (phoneToUse) await sendAdExpiringWhatsApp(phoneToUse, ad.name, cityState, 1, ad.id);
                    await supabase.from('announcements').update({ notified_expiry_1d: true }).eq('id', ad.id);
                    count1d++;

                } else if (daysLeft <= 0 && !ad.notified_expired) {
                    console.log(`[CRON] Expirado, desativando: ${ad.name}`);
                    await supabase.from('announcements').update({
                        status: 'pending',
                        payment_status: 'expired',
                        notified_expired: true
                    }).eq('id', ad.id);
                    await sendAdExpiringEmail(ad.user_email, ad.name, cityState, 0, ad.id);
                    if (phoneToUse) await sendAdExpiringWhatsApp(phoneToUse, ad.name, cityState, 0, ad.id);
                    countExpired++;
                }
            } catch (adErr) {
                console.error(`[CRON] Erro processando anúncio ${ad.id}:`, adErr.message);
            }
        }

        return response.status(200).json({
            success: true,
            processed: ads.length,
            alerts: { threeDay: count3d, oneDay: count1d, expired: countExpired }
        });

    } catch (err) {
        console.error('[CRON] Erro geral:', err.message);
        return response.status(500).json({ error: err.message });
    }
};
