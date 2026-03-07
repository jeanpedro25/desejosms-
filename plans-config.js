// Configuração Centralizada de Planos - DesejosMS
// Este arquivo centraliza todas as configurações de planos para sincronização com todo o sistema

// Configuração global de planos
const PLANS_CONFIG = {
    // Tipos de planos disponíveis
    types: {
        basic: {
            name: 'Plano Básico',
            type: 'basic',
            defaultPrice: 149.90,
            duration: 30,
            description: 'Anúncio básico com funcionalidades essenciais',
            features: ['Anúncio visível', 'Contatos diretos', 'Suporte básico'],
            color: '#3498db',
            icon: 'fas fa-star'
        },
        top: {
            name: 'Plano Top',
            type: 'top',
            defaultPrice: 249.90,
            duration: 30,
            description: 'Destaque especial com mais visualizações',
            features: ['Destaque na página', 'Mais visualizações', 'Suporte prioritário', 'Estatísticas avançadas'],
            color: '#f39c12',
            icon: 'fas fa-crown'
        },
        supervip: {
            name: 'Plano SuperVIP',
            type: 'supervip',
            defaultPrice: 399.90,
            duration: 30,
            description: 'Máximo destaque e funcionalidades premium',
            features: ['Destaque máximo', 'Visualizações ilimitadas', 'Suporte VIP', 'Relatórios completos', 'Chat integrado'],
            color: '#e74c3c',
            icon: 'fas fa-gem'
        }
    }
};

// Funções de acesso global
window.PlansManager = {
    // Obter todos os planos ativos
    getActivePlans: function() {
        const storedPlans = JSON.parse(localStorage.getItem('pricingPlans')) || [];
        return storedPlans.filter(plan => plan.status === 'active');
    },
    
    // Obter plano por tipo
    getPlanByType: function(planType) {
        const plans = this.getActivePlans();
        return plans.find(plan => plan.type === planType);
    },
    
    // Obter preço do plano
    getPlanPrice: function(planType) {
        const plan = this.getPlanByType(planType);
        return plan ? plan.price : PLANS_CONFIG.types[planType]?.defaultPrice || 0;
    },
    
    // Obter detalhes do plano
    getPlanDetails: function(planType) {
        const plan = this.getPlanByType(planType);
        if (!plan) {
            return PLANS_CONFIG.types[planType] || null;
        }
        
        // Mesclar com configuração padrão
        const defaultConfig = PLANS_CONFIG.types[planType] || {};
        return {
            ...defaultConfig,
            ...plan
        };
    },
    
    // Listar todos os tipos de planos
    getPlanTypes: function() {
        return Object.keys(PLANS_CONFIG.types);
    },
    
    // Verificar se plano existe
    planExists: function(planType) {
        return planType in PLANS_CONFIG.types;
    },
    
    // Obter configuração padrão do plano
    getDefaultPlanConfig: function(planType) {
        return PLANS_CONFIG.types[planType] || null;
    },
    
    // Sincronizar planos com localStorage
    syncPlans: function() {
        const activePlans = this.getActivePlans();
        const planPrices = {};
        
        activePlans.forEach(plan => {
            planPrices[plan.type] = plan.price;
        });
        
        localStorage.setItem('planPrices', JSON.stringify(planPrices));
        console.log('Planos sincronizados:', planPrices);
        
        return planPrices;
    },
    
    // Atualizar preços em anúncios existentes
    updateAnnouncementPrices: function() {
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        let updated = false;
        
        announcements.forEach(announcement => {
            if (announcement.planType) {
                const newPrice = this.getPlanPrice(announcement.planType);
                if (announcement.paidAmount !== newPrice) {
                    announcement.paidAmount = newPrice;
                    updated = true;
                }
            }
        });
        
        if (updated) {
            localStorage.setItem('announcements', JSON.stringify(announcements));
            console.log('Preços dos anúncios atualizados');
        }
        
        return updated;
    },
    
    // Validar configuração de planos
    validatePlans: function() {
        const activePlans = this.getActivePlans();
        const errors = [];
        
        // Verificar se todos os tipos padrão existem
        Object.keys(PLANS_CONFIG.types).forEach(type => {
            const plan = activePlans.find(p => p.type === type);
            if (!plan) {
                errors.push(`Plano ${type} não encontrado`);
            }
        });
        
        // Verificar preços
        activePlans.forEach(plan => {
            if (!plan.price || plan.price <= 0) {
                errors.push(`Preço inválido para plano ${plan.type}`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
};

// Inicialização automática
document.addEventListener('DOMContentLoaded', function() {
    // Sincronizar planos na inicialização
    window.PlansManager.syncPlans();
    
    // Atualizar preços de anúncios se necessário
    window.PlansManager.updateAnnouncementPrices();
    
    console.log('PlansManager inicializado');
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PLANS_CONFIG, PlansManager: window.PlansManager };
}
