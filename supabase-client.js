// Configuração e inicialização do Supabase
const supabaseUrl = 'https://rhsserqlbyyjgglcrwva.supabase.co';
const supabaseKey = 'sb_publishable_v83uLp_HYDgO9PXmjFl8eQ_kSzRGLNI'; 

// Criar o cliente Supabase globalmente
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log('🔗 Cliente Supabase inicializado com sucesso.');

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
