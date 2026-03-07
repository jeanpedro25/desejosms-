// ========================================
// MIGRAÇÃO DE DADOS - localStorage → Firebase
// ========================================

import { createUser, createAd } from './firebase-database.js';

export async function migrateUsers() {
    try {
        console.log('🔄 Migrando usuários...');
        const usersJson = localStorage.getItem('users');
        if (!usersJson) return { success: true, migrated: 0 };

        const users = JSON.parse(usersJson);
        let migrated = 0;

        for (const user of users) {
            const userId = `migrated_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const result = await createUser(userId, {
                email: user.email,
                name: user.name || '',
                age: user.age || null,
                whatsapp: user.whatsapp || '',
                category: user.category || '',
                role: 'anunciante',
                verified: false,
                plan: 'free',
                migratedFrom: 'localStorage'
            });
            if (result.success) migrated++;
        }

        console.log(`✅ ${migrated} usuários migrados`);
        return { success: true, migrated };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function migrateAds() {
    try {
        console.log('🔄 Migrando anúncios...');
        const adsJson = localStorage.getItem('anuncios');
        if (!adsJson) return { success: true, migrated: 0 };

        const ads = JSON.parse(adsJson);
        let migrated = 0;

        for (const ad of ads) {
            const result = await createAd({
                userId: ad.userId || 'unknown',
                name: ad.name || '',
                age: ad.age || null,
                category: ad.category || 'garotas',
                city: ad.city || '',
                description: ad.description || '',
                phone: ad.phone || '',
                photos: ad.photos || [],
                plan: ad.plan || 'basico',
                status: ad.status || 'active'
            });
            if (result.success) migrated++;
        }

        console.log(`✅ ${migrated} anúncios migrados`);
        return { success: true, migrated };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function migrateAllData() {
    const results = {
        users: await migrateUsers(),
        ads: await migrateAds()
    };
    return results;
}

export default { migrateUsers, migrateAds, migrateAllData };
