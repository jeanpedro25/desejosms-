// Configuração dinâmica do site por estado
const siteConfig = {
    // Estado atual (pode ser alterado pelo admin)
    currentState: 'MS',

    // Configurações por estado
    states: {
        'MS': {
            name: 'Mato Grosso do Sul',
            shortName: 'MS',
            siteName: 'DesejosMS',
            siteTitle: 'Acompanhantes Mato Grosso do Sul',
            siteSubtitle: 'Encontre as melhores acompanhantes do Mato Grosso do Sul',
            cities: [
                { id: 'campo-grande', name: 'Campo Grande', active: true },
                { id: 'dourados', name: 'Dourados', active: true },
                { id: 'tres-lagoas', name: 'Três Lagoas', active: true },
                { id: 'corumba', name: 'Corumbá', active: true },
                { id: 'ponta-pora', name: 'Ponta Porã', active: true },
                { id: 'navirai', name: 'Naviraí', active: true },
                { id: 'aquidauana', name: 'Aquidauana', active: true },
                { id: 'sidrolandia', name: 'Sidrolândia', active: true }
            ],
            categories: [
                { id: 'mulher', name: 'MULHERES', icon: 'fas fa-female', active: true },
                { id: 'homem', name: 'HOMENS', icon: 'fas fa-male', active: true },
                { id: 'travesti', name: 'TRAVESTIS', icon: 'fas fa-venus-mars', active: true },
                { id: 'massagista', name: 'MASSAGISTA', icon: 'fas fa-hands', active: true }
            ]
        },
        'SP': {
            name: 'São Paulo',
            shortName: 'SP',
            siteName: 'DesejosSP',
            siteTitle: 'Acompanhantes São Paulo',
            siteSubtitle: 'Encontre as melhores acompanhantes de São Paulo',
            cities: [
                { id: 'sao-paulo', name: 'São Paulo', active: true },
                { id: 'campinas', name: 'Campinas', active: true },
                { id: 'santos', name: 'Santos', active: true },
                { id: 'sao-jose-dos-campos', name: 'São José dos Campos', active: true },
                { id: 'ribeirao-preto', name: 'Ribeirão Preto', active: true },
                { id: 'sorocaba', name: 'Sorocaba', active: true },
                { id: 'guarulhos', name: 'Guarulhos', active: true },
                { id: 'sao-bernardo-do-campo', name: 'São Bernardo do Campo', active: true }
            ],
            categories: [
                { id: 'mulher', name: 'MULHERES', icon: 'fas fa-female', active: true },
                { id: 'homem', name: 'HOMENS', icon: 'fas fa-male', active: true },
                { id: 'travesti', name: 'TRAVESTIS', icon: 'fas fa-venus-mars', active: true },
                { id: 'massagista', name: 'MASSAGISTA', icon: 'fas fa-hands', active: true }
            ]
        },
        'RJ': {
            name: 'Rio de Janeiro',
            shortName: 'RJ',
            siteName: 'DesejosRJ',
            siteTitle: 'Acompanhantes Rio de Janeiro',
            siteSubtitle: 'Encontre as melhores acompanhantes do Rio de Janeiro',
            cities: [
                { id: 'rio-de-janeiro', name: 'Rio de Janeiro', active: true },
                { id: 'niteroi', name: 'Niterói', active: true },
                { id: 'nova-iguacu', name: 'Nova Iguaçu', active: true },
                { id: 'sao-goncalo', name: 'São Gonçalo', active: true },
                { id: 'duque-de-caxias', name: 'Duque de Caxias', active: true },
                { id: 'petropolis', name: 'Petrópolis', active: true },
                { id: 'volta-redonda', name: 'Volta Redonda', active: true },
                { id: 'magu', name: 'Magé', active: true }
            ],
            categories: [
                { id: 'mulher', name: 'MULHERES', icon: 'fas fa-female', active: true },
                { id: 'homem', name: 'HOMENS', icon: 'fas fa-male', active: true },
                { id: 'travesti', name: 'TRAVESTIS', icon: 'fas fa-venus-mars', active: true },
                { id: 'massagista', name: 'MASSAGISTA', icon: 'fas fa-hands', active: true }
            ]
        },
        'MG': {
            name: 'Minas Gerais',
            shortName: 'MG',
            siteName: 'DesejosMG',
            siteTitle: 'Acompanhantes Minas Gerais',
            siteSubtitle: 'Encontre as melhores acompanhantes de Minas Gerais',
            cities: [
                { id: 'belo-horizonte', name: 'Belo Horizonte', active: true },
                { id: 'uberlandia', name: 'Uberlândia', active: true },
                { id: 'contagem', name: 'Contagem', active: true },
                { id: 'juiz-de-fora', name: 'Juiz de Fora', active: true },
                { id: 'betim', name: 'Betim', active: true },
                { id: 'montes-claros', name: 'Montes Claros', active: true },
                { id: 'ribeirao-das-neves', name: 'Ribeirão das Neves', active: true },
                { id: 'uberaba', name: 'Uberaba', active: true }
            ],
            categories: [
                { id: 'mulher', name: 'MULHERES', icon: 'fas fa-female', active: true },
                { id: 'homem', name: 'HOMENS', icon: 'fas fa-male', active: true },
                { id: 'travesti', name: 'TRAVESTIS', icon: 'fas fa-venus-mars', active: true },
                { id: 'massagista', name: 'MASSAGISTA', icon: 'fas fa-hands', active: true }
            ]
        }
    }
};

// Função para obter configuração do estado atual
function getCurrentStateConfig() {
    return siteConfig.states[siteConfig.currentState];
}

// Função para obter configuração de um estado específico
function getStateConfig(stateCode) {
    return siteConfig.states[stateCode];
}

// Função para alterar estado
function changeState(newState) {
    if (siteConfig.states[newState]) {
        siteConfig.currentState = newState;
        localStorage.setItem('currentState', newState);
        updateSiteForState();
        return true;
    }
    return false;
}

// Função para atualizar o site baseado no estado
function updateSiteForState() {
    const config = getCurrentStateConfig();

    console.log('🔄 Atualizando site para estado:', siteConfig.currentState, config);

    // Atualizar título da página
    document.title = `${config.siteName} - ${config.siteTitle}`;

    // Atualizar logo e nome do site (múltiplos seletores para garantir)
    const logoSelectors = [
        '.logo h1',
        '.logo-text .logo-title',
        '.logo-title'
    ];

    logoSelectors.forEach(selector => {
        const logoElement = document.querySelector(selector);
        if (logoElement) {
            logoElement.textContent = config.siteName;
            console.log(`✅ Logo atualizado (${selector}):`, config.siteName);
        }
    });

    // Atualizar título do modal de autenticação (apenas o modal de login/cadastro)
    const authModalTitle = document.querySelector('#authModal .auth-title');
    if (authModalTitle) {
        authModalTitle.textContent = config.siteName;
    }

    // Atualizar título principal
    const mainTitle = document.querySelector('.section-title');
    if (mainTitle) {
        mainTitle.textContent = config.siteTitle;
    }

    // Atualizar descrição/CTA do rodapé com o estado
    const footerDesc = document.querySelector('.footer-section p');
    if (footerDesc) {
        // Ajusta descrição para o estado atual
        footerDesc.textContent = `A melhor plataforma de classificados de ${config.name}. Conectamos pessoas com total segurança e discrição.`;
    }

    // Atualizar subtítulo
    const subtitle = document.querySelector('.section-subtitle');
    if (subtitle) {
        subtitle.textContent = config.siteSubtitle;
    }

    // Atualizar footer (logo e rodapé final)
    const footerLogo = document.querySelector('.footer-logo h3');
    if (footerLogo) {
        footerLogo.textContent = config.siteName;
    }
    // Rodapé final: © 2024 DesejosXX. Todos os direitos reservados.
    const footerBottomBrand = document.querySelector('.footer-bottom p:first-child');
    if (footerBottomBrand) {
        const year = new Date().getFullYear();
        footerBottomBrand.textContent = `© ${year} ${config.siteName}. Todos os direitos reservados.`;
    }

    // Atualizar seção de contatos do rodapé (email e localidade)
    try {
        const footerSections = Array.from(document.querySelectorAll('.footer-section'));
        const contactsSection = footerSections.find(sec => sec.querySelector('h3') && sec.querySelector('h3').textContent.trim().toLowerCase() === 'contatos');
        if (contactsSection) {
            const lis = contactsSection.querySelectorAll('ul li');
            const domain = `desejos${config.shortName.toLowerCase()}.com.br`;
            if (lis[0]) lis[0].textContent = `contato@${domain}`;
            if (lis[2]) lis[2].textContent = `${config.name}, Brasil`;
        }
    } catch (e) {
        console.warn('Não foi possível atualizar a seção de contatos do rodapé:', e);
    }

    // Atualizar aria-label da logo no header
    const headerLogoLink = document.querySelector('a.logo');
    if (headerLogoLink) {
        headerLogoLink.setAttribute('aria-label', config.siteName);
    }

    // Atualizar seletor de cidade
    updateCitySelector();

    // Atualizar categorias
    updateCategories();

    // Atualizar estatísticas (função existe apenas no index.html)
    if (typeof updateStatistics === 'function') updateStatistics();
}

// Função para atualizar seletor de cidade
function updateCitySelector() {
    try {
        const config = getCurrentStateConfig();
        const citySelector = document.getElementById('citySelector');

        if (citySelector) {
            citySelector.innerHTML = '';

            // Adicionar opção "Todas as cidades"
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = `Todas as cidades de ${config.name}`;
            citySelector.appendChild(allOption);

            // Obter cidades que realmente têm anúncios ativos
            const citiesWithAds = getCitiesWithActiveAds();

            if (citiesWithAds.length > 0) {
                // Mostrar apenas cidades com anúncios ativos
                citiesWithAds.forEach(cityName => {
                    const option = document.createElement('option');
                    option.value = cityName.toLowerCase().replace(/\s+/g, '-');
                    option.textContent = cityName;
                    citySelector.appendChild(option);
                });

                console.log(`✅ Seletor atualizado com ${citiesWithAds.length} cidades que têm anúncios:`, citiesWithAds);
            } else {
                // Se não há anúncios, mostrar mensagem
                const noAdsOption = document.createElement('option');
                noAdsOption.value = '';
                noAdsOption.textContent = 'Nenhuma cidade com anúncios disponível';
                noAdsOption.disabled = true;
                citySelector.appendChild(noAdsOption);

                console.log('⚠️ Nenhuma cidade com anúncios ativos encontrada');
            }
        }
    } catch (e) {
        console.error('Erro ao atualizar seletor de cidades:', e);
    }
}

// Função para obter cidades que têm anúncios ativos
function getCitiesWithActiveAds() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    
    // Filtrar anúncios ativos
    const activeAds = announcements.filter(ad => ad.status === 'active');

    // Extrair cidades únicas dos anúncios ativos
    const citiesWithAds = [...new Set(activeAds.map(ad => ad.city))].filter(city => city && city.trim() !== '');

    // Ordenar alfabeticamente
    return citiesWithAds.sort();
}

// Função para atualizar categorias
function updateCategories() {
    const config = getCurrentStateConfig();
    const navContainer = document.getElementById('navItems');

    if (navContainer) {
        navContainer.innerHTML = '';

        // Adicionar categorias ativas na ordem correta
        const activeCategories = config.categories.filter(cat => cat.active);
        activeCategories.forEach((category, index) => {
            const categoryElement = document.createElement('a');
            categoryElement.href = '#';
            categoryElement.className = 'nav-item';
            categoryElement.setAttribute('data-category', category.id);
            categoryElement.innerHTML = `<i class="${category.icon}"></i> ${category.name}`;

            // Marcar a primeira categoria como ativa por padrão
            if (index === 0) {
                categoryElement.classList.add('active');
            }

            navContainer.appendChild(categoryElement);
        });

        // Após criar os botões, carregar todos os anúncios por padrão
        setTimeout(() => {
            console.log('Carregando todos os anúncios por padrão');
            loadProfiles();
        }, 100);
    }
}

// Função para obter cidade atual do usuário
function getCurrentCity() {
    return localStorage.getItem('currentCity') || '';
}

// Função para definir cidade atual
function setCurrentCity(cityId) {
    console.log('🏙️ Definindo cidade atual:', cityId);
    localStorage.setItem('currentCity', cityId);

    // Atualizar estatísticas (função existe apenas no index.html)
    if (typeof updateStatistics === 'function') updateStatistics();

    // Filtrar anúncios por cidade
    filterAnnouncementsByCity(cityId);

    // Atualizar seletor de cidade se existir
    const citySelector = document.getElementById('citySelector');
    if (citySelector && cityId) {
        citySelector.value = cityId;
    }

    // Recarregar perfis com filtro de cidade
    if (window.filterProfiles) {
        const activeCategory = document.querySelector('.nav-item.active');
        const category = activeCategory ? activeCategory.getAttribute('data-category') : 'all';
        window.filterProfiles(category, '', cityId);
    }

    // Recarregar TOP anúncios
    if (window.loadTopAnnouncements) {
        window.loadTopAnnouncements();
    }
}

// Função para obter estatísticas baseadas na cidade
function getCityStatistics(cityId = '') {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];

    let filteredAnnouncements = announcements.filter(ad => ad.status === 'active');

    // Filtrar por cidade específica
    if (cityId) {
        filteredAnnouncements = filteredAnnouncements.filter(ad => {
            const adCitySlug = ad.city.toLowerCase().replace(/\s+/g, '-');
            return adCitySlug === cityId;
        });
    }

    return {
        activeAds: filteredAnnouncements.length,
        activeUsers: new Set(filteredAnnouncements.map(ad => ad.userEmail)).size,
        verifiedPercentage: filteredAnnouncements.length > 0 ? '100%' : '0%'
    };
}

// Função para filtrar anúncios por cidade
function filterAnnouncementsByCity(cityId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];

    let filteredAnnouncements = announcements.filter(ad => ad.status === 'active');

    // Filtrar por cidade específica
    if (cityId) {
        filteredAnnouncements = filteredAnnouncements.filter(ad => {
            const adCitySlug = ad.city.toLowerCase().replace(/\s+/g, '-');
            return adCitySlug === cityId;
        });
    }

    // Recarregar anúncios filtrados
    if (typeof loadFilteredAnnouncements === 'function') {
        loadFilteredAnnouncements(filteredAnnouncements);
    }

    // Recarregar TOP anúncios filtrados
    if (typeof loadTopAnnouncements === 'function') {
        loadTopAnnouncements();
    }
}

function filterAnnouncements({category = 'all', city = '', searchTerm = '', facilitation = false} = {}) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const validCategories = ['mulher', 'homem', 'travesti', 'massagista'];
    return announcements.filter(ad => {
        if (category !== 'all' && validCategories.includes(category) && ad.category !== category) {
            return false;
        }
        if (city && (ad.city || '').toLowerCase().replace(/\s+/g, '-') !== city.toLowerCase().replace(/\s+/g, '-')) {
            return false;
        }
        if (searchTerm && !ad.name.toLowerCase().includes(searchTerm) &&
            !ad.description.toLowerCase().includes(searchTerm) &&
            !ad.city.toLowerCase().includes(searchTerm)) {
            return false;
        }
        if (facilitation && !ad.facilitation) {
            return false;
        }
        return true;
    });
}

// Inicializar configuração
function initSiteConfig() {
    console.log('🚀 Inicializando configuração do site...');

    // Carregar estado salvo ou usar padrão
    const savedState = localStorage.getItem('currentState');
    console.log('💾 Estado salvo no localStorage:', savedState);

    if (savedState && siteConfig.states[savedState]) {
        siteConfig.currentState = savedState;
        console.log('✅ Estado aplicado:', savedState);
    } else {
        console.log('⚠️ Usando estado padrão:', siteConfig.currentState);
    }

    // Aplicar configurações imediatamente
    updateSiteForState();

    // Forçar atualização das categorias após um pequeno delay
    setTimeout(() => {
        updateSiteForState();
        loadCitiesForCurrentState();
    }, 100);

    // Verificar se há cidade selecionada
    const selectedCity = localStorage.getItem('selectedCity') || localStorage.getItem('currentCity');
    if (selectedCity) {
        console.log('🏙️ Cidade selecionada encontrada:', selectedCity);
        setTimeout(() => {
            setCurrentCity(selectedCity);
        }, 200);
    }
}

// Exportar para uso global
window.siteConfig = siteConfig;
window.getCurrentStateConfig = getCurrentStateConfig;
window.changeState = changeState;
window.updateSiteForState = updateSiteForState;
window.getCurrentCity = getCurrentCity;
window.setCurrentCity = setCurrentCity;
window.getCityStatistics = getCityStatistics;
window.filterAnnouncementsByCity = filterAnnouncementsByCity;
window.filterAnnouncements = filterAnnouncements;
window.initSiteConfig = initSiteConfig;
window.updateCitySelector = updateCitySelector;
window.getCitiesWithActiveAds = getCitiesWithActiveAds;

// Inicialização robusta (executa mesmo se DOM já estiver pronto)
(function ensureInit(){
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){
            console.log('📄 DOM carregado, inicializando configuração...');
            initSiteConfig();
        });
    } else {
        console.log('⚡ DOM já pronto, inicializando configuração imediatamente...');
        initSiteConfig();
    }
})();
