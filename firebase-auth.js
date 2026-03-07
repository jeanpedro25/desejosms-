// ========================================
// FIREBASE AUTHENTICATION
// ========================================
// Sistema de autenticação com Firebase
// ========================================

import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    updateEmail,
    updatePassword
} from 'firebase/auth';
import { createUser, getUser, updateUser } from './firebase-database.js';

// ========================================
// CADASTRO
// ========================================

/**
 * Registrar novo usuário
 */
export async function signUp(email, password, userData) {
    try {
        console.log('🔐 Iniciando cadastro...', { email });

        // Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('✅ Usuário criado no Auth:', user.uid);

        // Atualizar profile (nome)
        if (userData.name) {
            await updateProfile(user, {
                displayName: userData.name
            });
        }

        // Criar documento do usuário no Firestore
        const userDataToSave = {
            email: user.email,
            name: userData.name || '',
            age: userData.age || null,
            whatsapp: userData.whatsapp || '',
            category: userData.category || '',
            role: 'anunciante',
            verified: false,
            plan: 'free',
            planExpiry: null
        };

        await createUser(user.uid, userDataToSave);

        console.log('✅ Cadastro completo!');

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email,
                ...userDataToSave
            }
        };
    } catch (error) {
        console.error('❌ Erro no cadastro:', error);

        // Mensagens de erro em português
        let errorMessage = 'Erro ao criar conta';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este email já está cadastrado';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Senha muito fraca (mínimo 6 caracteres)';
        }

        return { success: false, error: errorMessage };
    }
}

// ========================================
// LOGIN
// ========================================

/**
 * Fazer login
 */
export async function signIn(email, password) {
    try {
        console.log('🔐 Tentando login...', { email });

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('✅ Login bem-sucedido:', user.uid);

        // Buscar dados do usuário no Firestore
        const userDataResult = await getUser(user.uid);

        if (userDataResult.success) {
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    ...userDataResult.data
                }
            };
        }

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email
            }
        };
    } catch (error) {
        console.error('❌ Erro no login:', error);

        let errorMessage = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuário não encontrado';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Senha incorreta';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
        }

        return { success: false, error: errorMessage };
    }
}

// ========================================
// LOGOUT
// ========================================

/**
 * Fazer logout
 */
export async function logout() {
    try {
        await signOut(auth);
        console.log('✅ Logout bem-sucedido');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro no logout:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// RECUPERAÇÃO DE SENHA
// ========================================

/**
 * Enviar email de recuperação de senha
 */
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log('✅ Email de recuperação enviado');
        return {
            success: true,
            message: 'Email de recuperação enviado! Verifique sua caixa de entrada.'
        };
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);

        let errorMessage = 'Erro ao enviar email';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Email não encontrado';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email inválido';
        }

        return { success: false, error: errorMessage };
    }
}

// ========================================
// OBSERVADOR DE ESTADO
// ========================================

/**
 * Observar mudanças no estado de autenticação
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('👤 Usuário autenticado:', user.uid);

            // Buscar dados completos do usuário
            const userDataResult = await getUser(user.uid);

            if (userDataResult.success) {
                callback({
                    loggedIn: true,
                    user: {
                        uid: user.uid,
                        email: user.email,
                        ...userDataResult.data
                    }
                });
            } else {
                callback({
                    loggedIn: true,
                    user: {
                        uid: user.uid,
                        email: user.email
                    }
                });
            }
        } else {
            console.log('👤 Nenhum usuário autenticado');
            callback({ loggedIn: false, user: null });
        }
    });
}

// ========================================
// OBTER USUÁRIO ATUAL
// ========================================

/**
 * Obter usuário atualmente logado
 */
export async function getCurrentUser() {
    const user = auth.currentUser;

    if (user) {
        const userDataResult = await getUser(user.uid);

        if (userDataResult.success) {
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    ...userDataResult.data
                }
            };
        }

        return {
            success: true,
            user: {
                uid: user.uid,
                email: user.email
            }
        };
    }

    return { success: false, error: 'Nenhum usuário logado' };
}

// ========================================
// ATUALIZAR PERFIL
// ========================================

/**
 * Atualizar dados do perfil
 */
export async function updateUserProfile(updates) {
    try {
        const user = auth.currentUser;

        if (!user) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        // Atualizar no Auth (nome/foto)
        if (updates.name || updates.photoURL) {
            await updateProfile(user, {
                displayName: updates.name,
                photoURL: updates.photoURL
            });
        }

        // Atualizar email (requer reautenticação)
        if (updates.email && updates.email !== user.email) {
            await updateEmail(user, updates.email);
        }

        // Atualizar senha (requer reautenticação)
        if (updates.password) {
            await updatePassword(user, updates.password);
        }

        // Atualizar no Firestore
        const firestoreUpdates = { ...updates };
        delete firestoreUpdates.password; // Não salvar senha no Firestore

        await updateUser(user.uid, firestoreUpdates);

        console.log('✅ Perfil atualizado');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);

        let errorMessage = 'Erro ao atualizar perfil';
        if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'Por favor, faça login novamente para fazer esta alteração';
        }

        return { success: false, error: errorMessage };
    }
}

// ========================================
// EXPORTAR FUNÇÕES
// ========================================
export default {
    signUp,
    signIn,
    logout,
    resetPassword,
    onAuthChange,
    getCurrentUser,
    updateUserProfile
};
