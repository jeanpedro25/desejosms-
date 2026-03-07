// ========================================
// CONFIGURAÇÃO DO FIREBASE
// ========================================
// Este arquivo configura a conexão com o Firebase
// As credenciais vêm do arquivo .env (não está no código!)
// ========================================

// Importar Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// ========================================
// CONFIGURAÇÃO
// ========================================
// Estas variáveis vêm do arquivo .env
// NUNCA coloque credenciais reais aqui!
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ========================================
// INICIALIZAR FIREBASE
// ========================================
let app;
let db;
let auth;
let storage;
let analytics;

try {
    // Inicializar Firebase
    app = initializeApp(firebaseConfig);

    // Inicializar serviços
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    // Analytics (apenas em produção)
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
    }

    console.log('✅ Firebase inicializado com sucesso!');
} catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
}

// ========================================
// EXPORTAR SERVIÇOS
// ========================================
export { app, db, auth, storage, analytics };
export default firebaseConfig;
