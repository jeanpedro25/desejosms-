// ===== CONFIGURAÇÃO DE ESTADOS - SISTEMA MULTI-REGIONAL =====
// Sistema para expansão da marca Desejos para outros estados

// Configuração principal de estados
const STATES_CONFIG = {
    "MS": {
        enabled: true,
        name: "Mato Grosso do Sul",
        brand: "DesejosMS",
        brandFull: "DesejosMS Acompanhantes",
        watermark: "DesejosMS",
        domain: "desejosms.com.br",
        color: "#8B0000", // Vermelho padrão
        cities: [
            "Campo Grande", "Dourados", "Três Lagoas", "Corumbá", 
            "Ponta Porã", "Aquidauana", "Maracaju", "Nova Andradina",
            "Paranaíba", "Rio Brilhante", "Sidrolândia", "Naviraí",
            "Coxim", "Água Clara", "Amambai"
        ],
        enabledAt: "2025-08-25",
        isDefault: true
    },
    "SP": {
        enabled: true,
        name: "São Paulo",
        brand: "DesejosSP",
        brandFull: "DesejosSP Acompanhantes",
        watermark: "DesejosSP",
        domain: "desejossp.com.br",
        color: "#1E3A8A", // Azul SP
        cities: [
            "São Paulo", "Campinas", "Santos", "São Bernardo do Campo",
            "Santo André", "Osasco", "Ribeirão Preto", "Sorocaba",
            "São José dos Campos", "Jundiaí", "Piracicaba", "Bauru",
            "São Vicente", "Franca", "Guarulhos", "Diadema",
            "Taubaté", "Limeira", "Suzano", "Americana"
        ],
        enabledAt: "2025-08-26"
    },
    "RJ": {
        enabled: true,
        name: "Rio de Janeiro",
        brand: "DesejosRJ",
        brandFull: "DesejosRJ Acompanhantes",
        watermark: "DesejosRJ",
        domain: "desejosrj.com.br",
        color: "#059669", // Verde RJ
        cities: [
            "Rio de Janeiro", "Niterói", "Nova Iguaçu", "Duque de Caxias",
            "São Gonçalo", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda",
            "Magé", "Itaboraí", "Cabo Frio", "Angra dos Reis",
            "Nova Friburgo", "Barra Mansa", "Teresópolis", "Macaé",
            "Resende", "Araruama", "Queimados", "São João de Meriti"
        ],
        enabledAt: "2025-08-26"
    },
    "MG": {
        enabled: true,
        name: "Minas Gerais",
        brand: "DesejosMG",
        brandFull: "DesejosMG Acompanhantes",
        watermark: "DesejosMG",
        domain: "desejosmg.com.br",
        color: "#7C2D12", // Marrom MG
        cities: [
            "Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora",
            "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba",
            "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis",
            "Santa Luzia", "Ibirité", "Poços de Caldas", "Patos de Minas",
            "Pouso Alegre", "Teófilo Otoni", "Barbacena", "Sabará"
        ],
        enabledAt: "2025-08-26"
    },
    "PR": {
        enabled: true,
        name: "Paraná",
        brand: "DesejosPR",
        brandFull: "DesejosPR Acompanhantes",
        watermark: "DesejosPR",
        domain: "desejospr.com.br",
        color: "#0F766E", // Verde escuro PR
        cities: [
            "Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel",
            "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava",
            "Paranaguá", "Araucária", "Toledo", "Apucarana", "Pinhais",
            "Campo Largo", "Arapongas", "Almirante Tamandaré", "Umuarama",
            "Piraquara", "Cambé"
        ],
        enabledAt: "2025-08-26"
    }
};

// Funções para gerenciar estados
class StatesManager {
    constructor() {
        this.initializeStates();
    }

    // Inicializar estados no localStorage se não existir
    initializeStates() {
        if (!localStorage.getItem('statesConfig')) {
            localStorage.setItem('statesConfig', JSON.stringify(STATES_CONFIG));
        }
    }

    // Obter configuração de todos os estados
    getAllStates() {
        return JSON.parse(localStorage.getItem('statesConfig') || '{}');
    }

    // Obter apenas estados habilitados
    getEnabledStates() {
        const states = this.getAllStates();
        return Object.keys(states).filter(code => states[code].enabled);
    }

    // Obter configuração de um estado específico
    getStateConfig(stateCode) {
        const states = this.getAllStates();
        return states[stateCode] || null;
    }

    // Habilitar/desabilitar estado (apenas admin)
    toggleState(stateCode, enabled = null) {
        const states = this.getAllStates();
        if (states[stateCode]) {
            // Se enabled não for fornecido, alternar o estado atual
            const newEnabled = enabled !== null ? enabled : !states[stateCode].enabled;

            states[stateCode].enabled = newEnabled;
            states[stateCode].enabledAt = newEnabled ? new Date().toISOString().split('T')[0] : null;
            localStorage.setItem('statesConfig', JSON.stringify(states));
            return states[stateCode];
        }
        return false;
    }

    // Obter apenas estados ativos (com enabled: true)
    getActiveStates() {
        const states = this.getAllStates();
        const activeStates = {};
        Object.keys(states).forEach(code => {
            if (states[code].enabled) {
                activeStates[code] = states[code];
            }
        });
        return activeStates;
    }

    // Adicionar novo estado
    addState(stateCode, stateData) {
        try {
            const states = this.getAllStates();
            states[stateCode] = {
                enabled: stateData.enabled || false,
                name: stateData.name,
                brand: stateData.brand,
                brandFull: `${stateData.brand} Acompanhantes`,
                watermark: stateData.brand,
                domain: stateData.domain || `desejos${stateCode.toLowerCase()}.com.br`,
                color: stateData.color || "#8B0000",
                cities: stateData.cities || [],
                enabledAt: stateData.enabled ? new Date().toISOString().split('T')[0] : null
            };

            localStorage.setItem('statesConfig', JSON.stringify(states));
            return true;
        } catch (error) {
            console.error('Erro ao adicionar estado:', error);
            return false;
        }
    }

    // Atualizar estado existente
    updateState(stateCode, stateData) {
        try {
            const states = this.getAllStates();
            if (!states[stateCode]) {
                return false;
            }

            const currentState = states[stateCode];
            states[stateCode] = {
                ...currentState,
                name: stateData.name,
                brand: stateData.brand,
                brandFull: `${stateData.brand} Acompanhantes`,
                watermark: stateData.brand,
                domain: stateData.domain || currentState.domain,
                color: stateData.color || currentState.color,
                cities: stateData.cities || currentState.cities,
                enabled: stateData.enabled,
                enabledAt: stateData.enabled && !currentState.enabled ?
                    new Date().toISOString().split('T')[0] : currentState.enabledAt
            };

            localStorage.setItem('statesConfig', JSON.stringify(states));
            return true;
        } catch (error) {
            console.error('Erro ao atualizar estado:', error);
            return false;
        }
    }

    // Remover estado
    removeState(stateCode) {
        try {
            if (stateCode === 'MS') {
                console.error('Não é possível remover o estado MS (padrão)');
                return false;
            }

            const states = this.getAllStates();
            delete states[stateCode];
            localStorage.setItem('statesConfig', JSON.stringify(states));
            return true;
        } catch (error) {
            console.error('Erro ao remover estado:', error);
            return false;
        }
    }

    // Adicionar cidade a um estado
    addCityToState(stateCode, cityName) {
        try {
            const states = this.getAllStates();
            if (!states[stateCode]) {
                return false;
            }

            if (!states[stateCode].cities) {
                states[stateCode].cities = [];
            }

            // Verificar se a cidade já existe
            if (states[stateCode].cities.includes(cityName)) {
                console.error('Cidade já existe neste estado');
                return false;
            }

            states[stateCode].cities.push(cityName);
            localStorage.setItem('statesConfig', JSON.stringify(states));
            return true;
        } catch (error) {
            console.error('Erro ao adicionar cidade:', error);
            return false;
        }
    }

    // Remover cidade de um estado
    removeCityFromState(stateCode, cityIndex) {
        try {
            const states = this.getAllStates();
            if (!states[stateCode] || !states[stateCode].cities) {
                return false;
            }

            states[stateCode].cities.splice(cityIndex, 1);
            localStorage.setItem('statesConfig', JSON.stringify(states));
            return true;
        } catch (error) {
            console.error('Erro ao remover cidade:', error);
            return false;
        }
    }

    // Obter estado atual do usuário
    getCurrentState() {
        return localStorage.getItem('currentState') || 'MS'; // MS como padrão
    }

    // Definir estado atual
    setCurrentState(stateCode) {
        const stateConfig = this.getStateConfig(stateCode);
        if (stateConfig && stateConfig.enabled) {
            localStorage.setItem('currentState', stateCode);
            return true;
        }
        return false;
    }

    // Obter configuração da marca atual
    getCurrentBrandConfig() {
        const currentState = this.getCurrentState();
        return this.getStateConfig(currentState);
    }

    // Obter marca d'água atual
    getCurrentWatermark() {
        const brandConfig = this.getCurrentBrandConfig();
        return brandConfig ? brandConfig.watermark : 'DesejosMS';
    }

    // Obter nome da marca atual
    getCurrentBrand() {
        const brandConfig = this.getCurrentBrandConfig();
        return brandConfig ? brandConfig.brand : 'DesejosMS';
    }

    // Obter nome completo da marca atual
    getCurrentBrandFull() {
        const brandConfig = this.getCurrentBrandConfig();
        return brandConfig ? brandConfig.brandFull : 'DesejosMS Acompanhantes';
    }

    // Obter cor do tema atual
    getCurrentColor() {
        const brandConfig = this.getCurrentBrandConfig();
        return brandConfig ? brandConfig.color : '#8B0000';
    }

    // Obter cidades do estado atual
    getCurrentCities() {
        const brandConfig = this.getCurrentBrandConfig();
        return brandConfig ? brandConfig.cities : [];
    }

    // Verificar se estado está habilitado
    isStateEnabled(stateCode) {
        const stateConfig = this.getStateConfig(stateCode);
        return stateConfig ? stateConfig.enabled : false;
    }
}

// Instância global do gerenciador de estados
const statesManager = new StatesManager();

// Função para atualizar marca d'água em todas as páginas
function updateWatermarkForCurrentState() {
    const watermark = statesManager.getCurrentWatermark();
    const watermarkElements = document.querySelectorAll('.wm-card, .watermark');
    
    watermarkElements.forEach(element => {
        element.textContent = watermark;
    });
}

// Função para atualizar marca no header
function updateBrandInHeader() {
    const brand = statesManager.getCurrentBrand();

    // Atualizar título da página (mantém padrão)
    document.title = `${brand} - Acompanhantes`;

    // Atualizar título da logo (Desejos + UF)
    const logoTitleEl = document.querySelector('.logo-text .logo-title, #logoTitle');
    if (logoTitleEl) {
        logoTitleEl.textContent = brand;
    }

    // NÃO sobrescrever o slogan com "Acompanhantes"
    // Se quiser, poderíamos ajustar o slogan específico aqui,
    // mas por padrão mantemos o existente.
}

// Função para aplicar cor do tema
function applyCurrentThemeColor() {
    const color = statesManager.getCurrentColor();
    const root = document.documentElement;
    root.style.setProperty('--primary-color', color);
}

// Inicializar sistema quando página carregar
document.addEventListener('DOMContentLoaded', function() {
    updateWatermarkForCurrentState();
    updateBrandInHeader();
    applyCurrentThemeColor();

    // Garantir que títulos, subtítulos e rodapé sejam sincronizados com o estado atual
    if (window.updateSiteForState) {
        try { window.updateSiteForState(); } catch (e) { console.warn('Falha ao aplicar updateSiteForState:', e); }
    }
});

// Exportar para uso global
window.statesManager = statesManager;
window.updateWatermarkForCurrentState = updateWatermarkForCurrentState;
window.updateBrandInHeader = updateBrandInHeader;
window.applyCurrentThemeColor = applyCurrentThemeColor;
