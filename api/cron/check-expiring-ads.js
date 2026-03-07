// Vercel Cron Job: Roda diariamente para verificar anúncios ativos e
// enviar alertas de vencimento ou desativar os já vencidos via Email e WhatsApp

import { createClient } from '@supabase/supabase-js';
import { sendAdExpiringEmail } from '../_lib/emailService.js';
import { sendAdExpiringWhatsApp } from '../_lib/whatsappService.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(request, response) {
    // Proteger o Cron (A Vercel envia um header especial para autorizar a execução cron)
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('🔄 Iniciando Verificação de Vencimentos (CRON)...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Buscar todos os anúncios ativos que possuam data de expiração
        const { data: ads, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('status', 'active')
            .not('expires_at', 'is', null);

        if (error) throw error;
        console.log(`📊 Total de anúncios sendo analisados: ${ads.length}`);

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar p/ meia-noite

        for (const ad of ads) {
            const expireDate = new Date(ad.expires_at);
            expireDate.setHours(0, 0, 0, 0);

            // Calcular a diferença em DIAS
            const timeDiff = expireDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            const phoneToUse = ad.whatsapp || ad.phone;
            const cityState = `${ad.city}/${ad.state}`;

            // ---------------------------------------------------------
            // 🟡 FALTAM 3 DIAS 
            // ---------------------------------------------------------
            if (daysLeft === 3 && !ad.notified_expiry_3d) {
                console.log(`⏱️ Enviando alerta (3 dias) para: ${ad.name}`);
                
                await sendAdExpiringEmail(ad.user_email, ad.name, cityState, 3, ad.id);
                if (phoneToUse) await sendAdExpiringWhatsApp(phoneToUse, ad.name, cityState, 3, ad.id);

                await supabase.from('announcements').update({ notified_expiry_3d: true }).eq('id', ad.id);
            }

            // ---------------------------------------------------------
            // 🟠 FALTA 1 DIA 
            // ---------------------------------------------------------
            else if (daysLeft === 1 && !ad.notified_expiry_1d) {
                console.log(`⏱️ Enviando alerta (1 dia) para: ${ad.name}`);
                
                await sendAdExpiringEmail(ad.user_email, ad.name, cityState, 1, ad.id);
                if (phoneToUse) await sendAdExpiringWhatsApp(phoneToUse, ad.name, cityState, 1, ad.id);

                await supabase.from('announcements').update({ notified_expiry_1d: true }).eq('id', ad.id);
            }

            // ---------------------------------------------------------
            // 🔴 ESTÁ VENCIDO (Dias restantes <= 0)
            // ---------------------------------------------------------
            else if (daysLeft <= 0 && !ad.notified_expired) {
                console.log(`⛔ Anúncio expirou, desativando: ${ad.name}`);
                
                // Mudar para status pending (aguardando pagamento para voltar)
                await supabase.from('announcements').update({ 
                    status: 'pending', 
                    payment_status: 'expired',
                    notified_expired: true 
                }).eq('id', ad.id);

                // Avisar o usuário que saiu do ar
                await sendAdExpiringEmail(ad.user_email, ad.name, cityState, 0, ad.id);
                if (phoneToUse) await sendAdExpiringWhatsApp(phoneToUse, ad.name, cityState, 0, ad.id);
            }
        }

        return response.status(200).json({ success: true, processed: ads.length });

    } catch (err) {
        console.error('❌ Erro no Cron Job:', err.message);
        return response.status(500).json({ error: err.message });
    }
}
