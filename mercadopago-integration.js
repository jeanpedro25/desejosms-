// ========================================
// INTEGRAÇÃO MERCADO PAGO
// ========================================
// Sistema completo de pagamentos
// ========================================

import { mercadoPagoConfig, plans, paymentMethods } from './mercadopago-config.js';
import { createTransaction, updateTransactionStatus } from './firebase-database.js';
import { getCurrentUser } from './firebase-auth.js';

// ========================================
// INICIALIZAR MERCADO PAGO SDK
// ========================================
let mp = null;

export async function initMercadoPago() {
    try {
        // Carregar SDK do Mercado Pago
        if (typeof window !== 'undefined' && !window.MercadoPago) {
            await loadMercadoPagoSDK();
        }

        if (window.MercadoPago && mercadoPagoConfig.publicKey) {
            mp = new window.MercadoPago(mercadoPagoConfig.publicKey);
            console.log('✅ Mercado Pago SDK inicializado');
            return true;
        }

        console.warn('⚠️ Mercado Pago SDK não disponível');
        return false;
    } catch (error) {
        console.error('❌ Erro ao inicializar Mercado Pago:', error);
        return false;
    }
}

// Carregar SDK
function loadMercadoPagoSDK() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ========================================
// CRIAR PREFERÊNCIA DE PAGAMENTO
// ========================================

/**
 * Criar preferência de pagamento no Mercado Pago
 */
export async function createPaymentPreference(planId, userId, userEmail) {
    try {
        const plan = plans[planId];

        if (!plan) {
            throw new Error('Plano não encontrado');
        }

        console.log('💳 Criando preferência de pagamento...', { planId, userId });

        // Criar transação no Firebase primeiro
        const transactionResult = await createTransaction({
            userId,
            planId,
            amount: plan.price,
            status: 'pending',
            paymentMethod: null
        });

        if (!transactionResult.success) {
            throw new Error('Erro ao criar transação');
        }

        const transactionId = transactionResult.transactionId;

        // Preparar dados para API do Mercado Pago
        const preferenceData = {
            items: [
                {
                    id: planId,
                    title: plan.name,
                    description: plan.features.join(', '),
                    quantity: 1,
                    unit_price: plan.price,
                    currency_id: 'BRL'
                }
            ],
            payer: {
                email: userEmail
            },
            back_urls: {
                success: `${window.location.origin}/pagamento-sucesso?transaction=${transactionId}`,
                failure: `${window.location.origin}/pagamento-falha?transaction=${transactionId}`,
                pending: `${window.location.origin}/pagamento-pendente?transaction=${transactionId}`
            },
            auto_return: 'approved',
            notification_url: mercadoPagoConfig.webhookUrl,
            external_reference: transactionId,
            metadata: {
                userId,
                planId,
                transactionId
            },
            payment_methods: {
                excluded_payment_types: [],
                installments: 12
            }
        };

        // Fazer requisição para API do Mercado Pago
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mercadoPagoConfig.accessToken}`
            },
            body: JSON.stringify(preferenceData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar preferência');
        }

        const preference = await response.json();

        console.log('✅ Preferência criada:', preference.id);

        // Atualizar transação com ID da preferência
        await updateTransactionStatus(transactionId, 'pending', {
            preferenceId: preference.id
        });

        return {
            success: true,
            preferenceId: preference.id,
            initPoint: preference.init_point, // URL para redirecionar usuário
            transactionId
        };
    } catch (error) {
        console.error('❌ Erro ao criar preferência:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ========================================
// PROCESSAR PAGAMENTO
// ========================================

/**
 * Iniciar fluxo de pagamento
 */
export async function startPayment(planId) {
    try {
        // Verificar se usuário está logado
        const userResult = await getCurrentUser();

        if (!userResult.success || !userResult.user) {
            throw new Error('Você precisa estar logado para fazer um pagamento');
        }

        const user = userResult.user;

        // Inicializar Mercado Pago se necessário
        if (!mp) {
            const initialized = await initMercadoPago();
            if (!initialized) {
                throw new Error('Erro ao inicializar sistema de pagamentos');
            }
        }

        // Criar preferência
        const preferenceResult = await createPaymentPreference(
            planId,
            user.uid,
            user.email
        );

        if (!preferenceResult.success) {
            throw new Error(preferenceResult.error);
        }

        console.log('💳 Redirecionando para pagamento...');

        // Redirecionar para checkout do Mercado Pago
        window.location.href = preferenceResult.initPoint;

        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao iniciar pagamento:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ========================================
// VERIFICAR STATUS DO PAGAMENTO
// ========================================

/**
 * Verificar status de um pagamento pelo ID
 */
export async function checkPaymentStatus(paymentId) {
    try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${mercadoPagoConfig.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao consultar pagamento');
        }

        const payment = await response.json();

        return {
            success: true,
            status: payment.status,
            statusDetail: payment.status_detail,
            payment
        };
    } catch (error) {
        console.error('❌ Erro ao verificar pagamento:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ========================================
// PROCESSAR WEBHOOK
// ========================================

/**
 * Processar notificação de webhook do Mercado Pago
 */
export async function processWebhook(webhookData) {
    try {
        console.log('🔔 Webhook recebido:', webhookData);

        const { type, data } = webhookData;

        // Processar apenas notificações de pagamento
        if (type === 'payment') {
            const paymentId = data.id;

            // Buscar informações do pagamento
            const paymentResult = await checkPaymentStatus(paymentId);

            if (!paymentResult.success) {
                throw new Error('Erro ao buscar informações do pagamento');
            }

            const payment = paymentResult.payment;
            const transactionId = payment.external_reference;
            const status = payment.status;

            console.log('💳 Status do pagamento:', status);

            // Atualizar transação no Firebase
            let newStatus = 'pending';

            if (status === 'approved') {
                newStatus = 'approved';

                // Ativar plano do usuário
                const userId = payment.metadata.user_id;
                const planId = payment.metadata.plan_id;

                if (userId && planId) {
                    await activateUserPlan(userId, planId);
                }
            } else if (status === 'rejected') {
                newStatus = 'rejected';
            } else if (status === 'cancelled') {
                newStatus = 'cancelled';
            } else if (status === 'refunded') {
                newStatus = 'refunded';
            }

            await updateTransactionStatus(transactionId, newStatus, {
                paymentId,
                paymentStatus: status,
                paymentDetails: payment.status_detail
            });

            console.log('✅ Transação atualizada:', transactionId, newStatus);

            return { success: true };
        }

        return { success: true, message: 'Webhook não processado' };
    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ========================================
// ATIVAR PLANO DO USUÁRIO
// ========================================

/**
 * Ativar plano após pagamento aprovado
 */
async function activateUserPlan(userId, planId) {
    try {
        const plan = plans[planId];

        if (!plan) {
            throw new Error('Plano não encontrado');
        }

        // Calcular data de expiração
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + plan.duration);

        // Atualizar usuário
        const { updateUser } = await import('./firebase-database.js');

        await updateUser(userId, {
            plan: planId,
            planExpiry: expiryDate.toISOString(),
            planActivatedAt: new Date().toISOString()
        });

        console.log('✅ Plano ativado:', { userId, planId });

        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao ativar plano:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ========================================
// CALCULAR DESCONTO
// ========================================

/**
 * Calcular preço com desconto (ex: PIX)
 */
export function calculatePrice(planId, paymentMethodId) {
    const plan = plans[planId];
    const paymentMethod = paymentMethods[paymentMethodId];

    if (!plan || !paymentMethod) {
        return { price: 0, discount: 0 };
    }

    let price = plan.price;
    let discount = 0;

    if (paymentMethod.discount) {
        discount = (price * paymentMethod.discount) / 100;
        price = price - discount;
    }

    return {
        originalPrice: plan.price,
        discount,
        finalPrice: price
    };
}

// ========================================
// EXPORTAR FUNÇÕES
// ========================================
export default {
    initMercadoPago,
    createPaymentPreference,
    startPayment,
    checkPaymentStatus,
    processWebhook,
    calculatePrice
};
