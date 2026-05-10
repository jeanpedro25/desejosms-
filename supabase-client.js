// Configuração e inicialização do Supabase
const supabaseUrl = 'https://rhsserqlbyyjgglcrwva.supabase.co';
// Chave pública anon (novo formato Supabase)
const supabaseKey = 'sb_publishable_v83uLp_HYDgO9PXmjFl8eQ_kSzRGLNI';

// Criar o cliente Supabase globalmente
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log('🔗 Supabase conectado a:', supabaseUrl);

// ==========================================
// MÓDULO SUPABASE - ANÚNCIOS (ANNOUNCEMENTS)
// ==========================================

// 1. Buscar todos os anúncios e salvar no localStorage (Sincronização MVP)
window.syncSupabaseToLocal = async function() {
    console.log('🔄 Sincronizando Supabase -> LocalStorage...');
    try {
        const { data, error } = await window.supabaseClient
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Formatar do padrão banco (snake_case) para padrão local (camelCase)
        if (data && data.length > 0) {
            const formattedAds = data.map(ad => ({
                id: ad.id,
                userEmail: ad.user_email,
                name: ad.name,
                age: ad.age,
                state: ad.state,
                city: ad.city,
                description: ad.description,
                price: ad.price,
                phone: ad.phone,
                whatsapp: ad.whatsapp,
                category: ad.category,
                services: ad.services || [],
                photos: ad.photos || [],
                status: ad.status,
                planType: ad.plan_type,
                isVip: ad.is_vip,
                views: ad.views,
                paidAmount: ad.paid_amount,
                createdAt: ad.created_at,
                updatedAt: ad.updated_at
            }));

            localStorage.setItem('announcements', JSON.stringify(formattedAds));
            console.log(`✅ Sincronizado ${formattedAds.length} anúncios do Supabase.`);
            return formattedAds;
        }
        return [];
    } catch (e) {
        console.error('❌ Erro ao buscar anúncios do Supabase:', e);
        return null;
    }
};

// 2. Criar um novo Anúncio
window.createAdInSupabase = async function(adData) {
    try {
        console.log('☁️ Salvando anúncio no Supabase...');
        const insertData = {
            user_email: adData.userEmail,
            name: adData.name,
            age: adData.age,
            state: adData.state,
            city: adData.city,
            description: adData.description,
            price: adData.price,
            phone: adData.phone || adData.whatsapp,
            whatsapp: adData.whatsapp,
            category: adData.category,
            services: adData.services || [],
            photos: adData.photos || [],
            status: adData.status || 'pending',
            plan_type: adData.planType || 'basic',
            is_vip: adData.isVip || false,
            views: adData.views || 0,
            paid_amount: adData.paidAmount || 0
        };
        
        const { data, error } = await window.supabaseClient
            .from('announcements')
            .insert([insertData])
            .select();
            
        if (error) throw error;
        console.log('✅ Anúncio salvo com sucesso no Supabase ID:', data[0].id);
        
        // Atualizar o LocalStorage com a nova fonte da verdade
        await window.syncSupabaseToLocal();
        return data[0];
    } catch (e) {
        console.error('❌ Erro ao criar anúncio no Supabase:', e);
        throw e;
    }
};

// 3. Atualizar Anúncio Existente
window.updateAdInSupabase = async function(id, updateFields) {
    try {
        console.log(`☁️ Atualizando anúncio ${id} no Supabase...`);
        const { data, error } = await window.supabaseClient
            .from('announcements')
            .update(updateFields)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        
        await window.syncSupabaseToLocal();
        console.log('✅ Anúncio atualizado com sucesso.');
        return data[0];
    } catch (e) {
        console.error('❌ Erro ao atualizar anúncio no Supabase:', e);
        throw e;
    }
};

// 4. Deletar Anúncio
window.deleteAdInSupabase = async function(id) {
    try {
        const { error } = await window.supabaseClient
            .from('announcements')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        await window.syncSupabaseToLocal();
        return true;
    } catch (e) {
        console.error('❌ Erro ao deletar do Supabase:', e);
        throw e;
    }
};

// ==========================================
// MÓDULO SUPABASE - USUÁRIOS (USERS)
// ==========================================

window.syncUsersFromSupabase = async function() {
    try {
        const { data, error } = await window.supabaseClient.from('users').select('*');
        if (error) {
            // RLS ou erro de permissão - NÃO apagar localStorage
            console.warn('Supabase users inacessível (RLS?):', error.message);
            return null;
        }
        if (data && data.length > 0) {
            // Merge: não sobrescrever usuários locais que não estão no Supabase
            const local = JSON.parse(localStorage.getItem('users') || '[]');
            const merged = [...data];
            local.forEach(lu => {
                if (!merged.find(su => (su.email||'').toLowerCase() === (lu.email||'').toLowerCase())) {
                    merged.push(lu);
                }
            });
            localStorage.setItem('users', JSON.stringify(merged));
            return merged;
        }
        return null; // Se Supabase devolveu vazio, NÃO limpar o localStorage
    } catch (e) {
        console.warn('Sync users falhou:', e.message);
        return null;
    }
};

window.upsertUserInSupabase = async function(userData) {
    try {
        // Mapear campos para o padrão snake_case do banco
        const dbData = {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            phone: userData.phone,
            age: userData.age,
            category: userData.category,
            state: userData.state || 'MS',
            verified: userData.verified ?? false,
            blocked: userData.blocked ?? false,
            created_at: userData.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await window.supabaseClient
            .from('users')
            .upsert([dbData], { onConflict: 'email' })
            .select();
        if (error) throw error;
        await window.syncUsersFromSupabase();
        return data[0];
    } catch (e) {
        console.error('❌ Erro ao salvar usuário no Supabase:', e);
        throw e;
    }
};

// ==========================================
// MÓDULO SUPABASE - VERIFICAÇÕES (VERIFICATIONS)
// ==========================================

window.syncVerificationsFromSupabase = async function() {
    try {
        const { data, error } = await window.supabaseClient.from('verifications').select('*');
        if (error) throw error;
        
        // Formatar para o padrão local (camelCase)
        const formatted = (data || []).map(v => ({
            id: v.id,
            userId: v.user_id,
            userEmail: v.user_email,
            userName: v.user_name,
            status: v.status,
            documents: v.documents,
            notes: v.notes,
            adminNotes: v.admin_notes,
            submittedAt: v.submitted_at,
            approvedAt: v.approved_at,
            rejectedAt: v.rejected_at
        }));
        
        localStorage.setItem('verifications', JSON.stringify(formatted));
        return formatted;
    } catch (e) {
        console.error('❌ Erro ao sincronizar verficações:', e);
        return null;
    }
};

window.upsertVerificationInSupabase = async function(verData) {
    try {
        const dbData = {
            user_email: verData.userEmail,
            user_name: verData.userName,
            status: verData.status,
            documents: verData.documents,
            notes: verData.notes,
            admin_notes: verData.adminNotes,
            submitted_at: verData.submittedAt,
            approved_at: verData.approvedAt,
            rejected_at: verData.rejectedAt
        };
        
        // Tentar encontrar por email para fazer update ou insert
        const { data: existing } = await window.supabaseClient
            .from('verifications')
            .select('id')
            .eq('user_email', verData.userEmail)
            .single();

        let result;
        if (existing) {
            const { data, error } = await window.supabaseClient
                .from('verifications')
                .update(dbData)
                .eq('id', existing.id)
                .select();
            if (error) throw error;
            result = data[0];
        } else {
            const { data, error } = await window.supabaseClient
                .from('verifications')
                .insert([dbData])
                .select();
            if (error) throw error;
            result = data[0];
        }
        
        await window.syncVerificationsFromSupabase();
        return result;
    } catch (e) {
        console.error('❌ Erro ao salvar verificação no Supabase:', e);
        throw e;
    }
};

// ── STORAGE: Upload de fotos do anúncio ──────────────────────
// Recebe array de dataURLs (base64), faz upload no bucket 'ad-photos'
// Retorna array de URLs públicas
window.uploadPhotosToStorage = async function(dataUrls, adState, userEmail, adId) {
    if (!window.supabaseClient) return dataUrls; // fallback: manter base64
    const publicUrls = [];
    const state = (adState || 'MS').toUpperCase();
    const emailSlug = (userEmail || 'unknown').replace(/[^a-z0-9]/gi, '_');
    const folder = `${state}/${emailSlug}/${adId || Date.now()}`;

    for (let i = 0; i < dataUrls.length; i++) {
        const dataUrl = dataUrls[i];
        // Já é URL pública do Storage? Não re-upload
        if (typeof dataUrl === 'string' && dataUrl.startsWith('https://') && dataUrl.includes('supabase')) {
            publicUrls.push(dataUrl);
            continue;
        }
        // Converter base64 → Blob
        try {
            const res  = await fetch(dataUrl);
            const blob = await res.blob();
            const ext  = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
            const path = `${folder}/foto_${i + 1}_${Date.now()}.${ext}`;

            const { data, error } = await window.supabaseClient.storage
                .from('ad-photos')
                .upload(path, blob, { upsert: true, contentType: blob.type });

            if (error) {
                console.warn('⚠️ Erro upload foto', i, error.message);
                publicUrls.push(dataUrl); // fallback: manter base64
                continue;
            }

            const { data: urlData } = window.supabaseClient.storage
                .from('ad-photos')
                .getPublicUrl(path);

            publicUrls.push(urlData.publicUrl);
            console.log(`✅ Foto ${i+1} enviada:`, urlData.publicUrl);
        } catch (err) {
            console.warn('⚠️ Falha ao converter/upload foto:', err.message);
            publicUrls.push(dataUrl);
        }
    }
    return publicUrls;
};

// ── STORAGE: Upload de vídeo do anúncio ──────────────────────
window.uploadVideoToStorage = async function(dataUrl, adState, userEmail, adId) {
    if (!window.supabaseClient || !dataUrl) return dataUrl;
    if (typeof dataUrl === 'string' && dataUrl.startsWith('https://') && dataUrl.includes('supabase')) return dataUrl;
    const state    = (adState || 'MS').toUpperCase();
    const emailSlug = (userEmail || 'unknown').replace(/[^a-z0-9]/gi, '_');
    const folder   = `${state}/${emailSlug}/${adId || Date.now()}`;
    try {
        const res  = await fetch(dataUrl);
        const blob = await res.blob();
        const ext  = blob.type.includes('webm') ? 'webm' : 'mp4';
        const path = `${folder}/video_${Date.now()}.${ext}`;

        const { error } = await window.supabaseClient.storage
            .from('ad-videos')
            .upload(path, blob, { upsert: true, contentType: blob.type });

        if (error) { console.warn('⚠️ Erro upload vídeo:', error.message); return dataUrl; }

        const { data: urlData } = window.supabaseClient.storage
            .from('ad-videos')
            .getPublicUrl(path);

        console.log('✅ Vídeo enviado:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (err) {
        console.warn('⚠️ Falha ao enviar vídeo:', err.message);
        return dataUrl;
    }
};

// ==========================================
// MÓDULO SUPABASE - CONFIGURAÇÕES (SETTINGS)
// ==========================================

window.syncSettingsFromSupabase = async function() {
    if (!window.supabaseClient) return null;
    console.log('🔄 Sincronizando configurações de pagamento do Supabase...');
    try {
        const { data, error } = await window.supabaseClient
            .from('settings')
            .select('key, value');
        
        if (error) throw error;
        if (!data) return null;

        const existing = JSON.parse(localStorage.getItem('paymentGateways') || '[]');
        
        const mp = data.find(item => item.key === 'mercadopago_config');
        const cakto = data.find(item => item.key === 'cakto_config');
        const stripe = data.find(item => item.key === 'stripe_config');

        // Sincronizar Mercado Pago
        if (mp && mp.value && mp.value.publicKey) {
            const idx = existing.findIndex(g => g.type === 'mercadopago');
            const gateway = {
                id: idx !== -1 ? existing[idx].id : Date.now(),
                type: 'mercadopago',
                name: 'Mercado Pago',
                publicKey: mp.value.publicKey,
                status: mp.value.status || 'active',
                environment: mp.value.environment || 'production'
            };
            if (idx !== -1) existing[idx] = gateway; else existing.push(gateway);
        }

        // Sincronizar Cakto
        if (cakto && cakto.value && cakto.value.publicKey) {
            const idx = existing.findIndex(g => g.type === 'cakto');
            const gateway = {
                id: idx !== -1 ? existing[idx].id : Date.now() + 1,
                type: 'cakto',
                name: 'Cakto',
                publicKey: cakto.value.publicKey,
                status: cakto.value.status || 'active'
            };
            if (idx !== -1) existing[idx] = gateway; else existing.push(gateway);
        }

        // Sincronizar Stripe
        if (stripe && stripe.value && (stripe.value.publicKey || stripe.value.secretKey)) {
            const idx = existing.findIndex(g => g.type === 'stripe');
            const gateway = {
                id: idx !== -1 ? existing[idx].id : Date.now() + 2,
                type: 'stripe',
                name: 'Stripe (Pix/Cartão)',
                publicKey: stripe.value.publicKey || '',
                status: stripe.value.status || 'active'
            };
            if (idx !== -1) existing[idx] = gateway; else existing.push(gateway);
        }

        localStorage.setItem('paymentGateways', JSON.stringify(existing));
        console.log('✅ Configurações de pagamento sincronizadas.');
        return existing;
    } catch (e) {
        console.error('❌ Falha ao sincronizar configurações:', e);
        return null;
    }
};
