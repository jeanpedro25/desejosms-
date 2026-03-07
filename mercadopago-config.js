// ========================================
// CONFIGURAÇÃO DO MERCADO PAGO
// ========================================
// Configuração segura do Mercado Pago
// As credenciais vêm do arquivo .env
// ========================================

// ========================================
// AMBIENTE
// ========================================
const isDevelopment = process.env.NODE_ENV === 'development';

// ========================================
// CREDENCIAIS
// ========================================
// Usar credenciais de TESTE em desenvolvimento
// Usar credenciais de PRODUÇÃO em produção
export const mercadoPagoConfig = {
    publicKey: isDevelopment
        ? (process.env.MERCADOPAGO_PUBLIC_KEY_TEST || import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY_TEST)
        : (process.env.MERCADOPAGO_PUBLIC_KEY_PROD || import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY_PROD),

    accessToken: isDevelopment
        ? (process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN_TEST)
        : (process.env.MERCADOPAGO_ACCESS_TOKEN_PROD || import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN_PROD),

    webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL,
    webhookSecret: process.env.WEBHOOK_SECRET || import.meta.env.VITE_WEBHOOK_SECRET,

    environment: isDevelopment ? 'test' : 'production'
};

// ========================================
// PLANOS
// ========================================
export const plans = {
    basico: {
        id: 'basico',
        name: 'Plano Básico',
        price: 149.90,
        duration: 30, // dias
        features: [
            'Anúncio ativo por 30 dias',
            'Até 3 fotos',
            'Aparece em buscas normais',
            'Estatísticas básicas'
        ],
        color: '#3498db'
    },
    top: {
        id: 'top',
        name: 'Plano Top',
        price: 249.90,
        duration: 30,
        features: [
            'Anúncio destacado por 30 dias',
            'Até 6 fotos',
            'Aparece no topo das buscas',
            'Badge "TOP"',
            'Estatísticas avançadas',
            'Suporte prioritário'
        ],
        color: '#e74c3c'
    },
    supervip: {
        id: 'supervip',
        name: 'Plano SuperVIP',
        price: 399.90,
        duration: 30,
        features: [
            'Anúncio VIP por 30 dias',
            'Fotos ilimitadas',
            'Primeiro lugar em todas as buscas',
            'Badge "VIP" dourado',
            'Destaque na home',
            'Estatísticas completas',
            'Suporte VIP 24/7',
            'Verificação prioritária'
        ],
        color: '#f39c12'
    }
};

// ========================================
// MÉTODOS DE PAGAMENTO
// ========================================
export const paymentMethods = {
    credit_card: {
        id: 'credit_card',
        name: 'Cartão de Crédito',
        icon: '💳',
        enabled: true
    },
    debit_card: {
        id: 'debit_card',
        name: 'Cartão de Débito',
        icon: '💳',
        enabled: true
    },
    pix: {
        id: 'pix',
        name: 'PIX',
        icon: '🔄',
        enabled: true,
        discount: 5 // 5% de desconto no PIX
    },
    boleto: {
        id: 'boleto',
        name: 'Boleto Bancário',
        icon: '🧾',
        enabled: true
    }
};

// ========================================
// CARTÕES DE TESTE (SANDBOX)
// ========================================
export const testCards = {
    approved: {
        number: '5031 4332 1540 6351',
        cvv: '123',
        expiry: '11/25',
        name: 'APRO'
    },
    rejected: {
        number: '5031 7557 3453 0604',
        cvv: '123',
        expiry: '11/25',
        name: 'OTHE'
    },
    pending: {
        number: '5031 4332 1540 6351',
        cvv: '123',
        expiry: '11/25',
        name: 'CONT'
    }
};

// ========================================
// VALIDAÇÃO
// ========================================
export function validateConfig() {
    const errors = [];

    if (!mercadoPagoConfig.publicKey || mercadoPagoConfig.publicKey.includes('xxxxx')) {
        errors.push('Public Key não configurada');
    }

    if (!mercadoPagoConfig.accessToken || mercadoPagoConfig.accessToken.includes('xxxxx')) {
        errors.push('Access Token não configurado');
    }

    if (errors.length > 0) {
        console.warn('⚠️ Mercado Pago não configurado completamente:', errors);
        return false;
    }

    console.log('✅ Mercado Pago configurado:', mercadoPagoConfig.environment);
    return true;
}

// ========================================
// EXPORTAR
// ========================================
export default {
    config: mercadoPagoConfig,
    plans,
    paymentMethods,
    testCards,
    validateConfig
};
