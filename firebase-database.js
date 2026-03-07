// ========================================
// FIREBASE DATABASE - Funções de Banco de Dados
// ========================================
// Todas as operações de CRUD para o Firestore
// ========================================

import { db } from './firebase-config.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';

// ========================================
// USUÁRIOS
// ========================================

/**
 * Criar novo usuário
 */
export async function createUser(userId, userData) {
    try {
        const userRef = doc(db, 'users', userId);
        const dataToSave = {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(userRef, dataToSave);
        console.log('✅ Usuário criado:', userId);
        return { success: true, userId };
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar usuário por ID
 */
export async function getUser(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { success: true, data: userSnap.data() };
        } else {
            return { success: false, error: 'Usuário não encontrado' };
        }
    } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar usuário por email
 */
export async function getUserByEmail(email) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return {
                success: true,
                data: userDoc.data(),
                userId: userDoc.id
            };
        } else {
            return { success: false, error: 'Usuário não encontrado' };
        }
    } catch (error) {
        console.error('❌ Erro ao buscar usuário por email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Atualizar usuário
 */
export async function updateUser(userId, updates) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Usuário atualizado:', userId);
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// ANÚNCIOS
// ========================================

/**
 * Criar novo anúncio
 */
export async function createAd(adData) {
    try {
        const adRef = doc(collection(db, 'anuncios'));
        const dataToSave = {
            ...adData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active',
            views: 0,
            contacts: 0
        };
        await setDoc(adRef, dataToSave);
        console.log('✅ Anúncio criado:', adRef.id);
        return { success: true, adId: adRef.id };
    } catch (error) {
        console.error('❌ Erro ao criar anúncio:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar todos os anúncios ativos
 */
export async function getActiveAds(options = {}) {
    try {
        const { category, city, plan, limitCount = 50 } = options;

        let q = collection(db, 'anuncios');
        let constraints = [where('status', '==', 'active')];

        // Filtros opcionais
        if (category) {
            constraints.push(where('category', '==', category));
        }
        if (city) {
            constraints.push(where('city', '==', city));
        }
        if (plan) {
            constraints.push(where('plan', '==', plan));
        }

        // Ordenação (VIP primeiro)
        constraints.push(orderBy('plan', 'desc'));
        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(limitCount));

        q = query(q, ...constraints);
        const querySnapshot = await getDocs(q);

        const ads = [];
        querySnapshot.forEach((doc) => {
            ads.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: ads };
    } catch (error) {
        console.error('❌ Erro ao buscar anúncios:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar anúncios de um usuário
 */
export async function getUserAds(userId) {
    try {
        const adsRef = collection(db, 'anuncios');
        const q = query(
            adsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const ads = [];
        querySnapshot.forEach((doc) => {
            ads.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: ads };
    } catch (error) {
        console.error('❌ Erro ao buscar anúncios do usuário:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Atualizar anúncio
 */
export async function updateAd(adId, updates) {
    try {
        const adRef = doc(db, 'anuncios', adId);
        await updateDoc(adRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Anúncio atualizado:', adId);
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar anúncio:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Deletar anúncio
 */
export async function deleteAd(adId) {
    try {
        const adRef = doc(db, 'anuncios', adId);
        await deleteDoc(adRef);
        console.log('✅ Anúncio deletado:', adId);
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao deletar anúncio:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Incrementar visualizações
 */
export async function incrementAdViews(adId) {
    try {
        const adRef = doc(db, 'anuncios', adId);
        const adSnap = await getDoc(adRef);

        if (adSnap.exists()) {
            const currentViews = adSnap.data().views || 0;
            await updateDoc(adRef, {
                views: currentViews + 1
            });
            return { success: true };
        }
        return { success: false, error: 'Anúncio não encontrado' };
    } catch (error) {
        console.error('❌ Erro ao incrementar views:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Incrementar contatos
 */
export async function incrementAdContacts(adId) {
    try {
        const adRef = doc(db, 'anuncios', adId);
        const adSnap = await getDoc(adRef);

        if (adSnap.exists()) {
            const currentContacts = adSnap.data().contacts || 0;
            await updateDoc(adRef, {
                contacts: currentContacts + 1
            });
            return { success: true };
        }
        return { success: false, error: 'Anúncio não encontrado' };
    } catch (error) {
        console.error('❌ Erro ao incrementar contatos:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// TRANSAÇÕES
// ========================================

/**
 * Criar transação
 */
export async function createTransaction(transactionData) {
    try {
        const transactionRef = doc(collection(db, 'transactions'));
        const dataToSave = {
            ...transactionData,
            createdAt: serverTimestamp(),
            status: 'pending'
        };
        await setDoc(transactionRef, dataToSave);
        console.log('✅ Transação criada:', transactionRef.id);
        return { success: true, transactionId: transactionRef.id };
    } catch (error) {
        console.error('❌ Erro ao criar transação:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Atualizar status da transação
 */
export async function updateTransactionStatus(transactionId, status, details = {}) {
    try {
        const transactionRef = doc(db, 'transactions', transactionId);
        await updateDoc(transactionRef, {
            status,
            ...details,
            updatedAt: serverTimestamp()
        });
        console.log('✅ Transação atualizada:', transactionId, status);
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar transação:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar transações de um usuário
 */
export async function getUserTransactions(userId) {
    try {
        const transactionsRef = collection(db, 'transactions');
        const q = query(
            transactionsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const transactions = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: transactions };
    } catch (error) {
        console.error('❌ Erro ao buscar transações:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// EXPORTAR TODAS AS FUNÇÕES
// ========================================
export default {
    // Usuários
    createUser,
    getUser,
    getUserByEmail,
    updateUser,

    // Anúncios
    createAd,
    getActiveAds,
    getUserAds,
    updateAd,
    deleteAd,
    incrementAdViews,
    incrementAdContacts,

    // Transações
    createTransaction,
    updateTransactionStatus,
    getUserTransactions
};
