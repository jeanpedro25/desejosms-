





// Função para criar dados de teste específicos para cada estado
function createStateSpecificTestData() {
    const config = window.getCurrentStateConfig ? window.getCurrentStateConfig() : null;

    if (!config || !config.cities || config.cities.length === 0) {
        console.log('Configuração de estado não encontrada, usando dados padrão MS');
        return getDefaultMSData();
    }

    // Pegar as duas primeiras cidades do estado
    const city1 = config.cities[0]?.name || 'Cidade 1';
    const city2 = config.cities[1]?.name || 'Cidade 2';

    console.log(`Criando dados de teste para ${config.name}: ${city1}, ${city2}`);

    return [
        // ===== PLANO SUPERVIP (4 anúncios) =====
        {
            id: Date.now() + 1,
            userEmail: "supervip1@teste.com",
            name: "Morena Bombom",
            age: 25,
            city: city1,
            description: "Garota morena, 25 anos, muito carinhosa e atenciosa. Atendo em motel próprio ou hotel.",
            price: "R$ 250,00",
            phone: "(67) 9-9815-0990",
            whatsapp: "(67) 9-9815-0990",
            category: "mulher",
            services: ["Motel", "Hotel", "Local Próprio", "Transling"],
            status: "active",
            createdAt: new Date().toISOString(),
            planType: "supervip",
            paidAmount: 500
        },
        {
            id: Date.now() + 2,
            userEmail: "supervip2@teste.com",
            name: "Loira Sensual",
            age: 28,
            city: city2,
            description: "Loira natural, 28 anos, muito experiente e profissional. Atendo em residência ou motel.",
            price: "R$ 280,00",
            phone: "(67) 9-9999-8888",
            whatsapp: "(67) 9-9999-8888",
            category: "mulher",
            services: ["Residência", "Motel", "Hotel"],
            status: "active",
            createdAt: new Date().toISOString(),
            planType: "supervip",
            paidAmount: 450
        },
        {
            id: Date.now() + 3,
            userEmail: "supervip3@teste.com",
            name: "Travesti Elegante",
            age: 24,
            city: city1,
            description: "Travesti elegante, 24 anos, muito carinhosa e profissional. Atendo em local próprio.",
            price: "R$ 300,00",
            phone: "(67) 9-8888-7777",
            whatsapp: "(67) 9-8888-7777",
            category: "travesti",
            services: ["Local Próprio", "Motel"],
            status: "active",
            createdAt: new Date().toISOString(),
            planType: "supervip",
            paidAmount: 400
        },
        {
            id: Date.now() + 4,
            userEmail: "supervip4@teste.com",
            name: "Homem Executivo",
            age: 30,
            city: city2,
            description: "Homem executivo, 30 anos, muito discreto e profissional. Atendo em hotel.",
            price: "R$ 350,00",
            phone: "(67) 9-7777-6666",
            whatsapp: "(67) 9-7777-6666",
            category: "homem",
            services: ["Hotel", "Residência"],
            status: "active",
            createdAt: new Date().toISOString(),
            planType: "supervip",
            paidAmount: 350
        }
    ];
}

// Função para dados padrão do MS (fallback)
function getDefaultMSData() {
    return [
        {
            id: Date.now() + 1,
            userEmail: "supervip1@teste.com",
            name: "Morena Bombom",
            age: 25,
            city: "Campo Grande",
            description: "Garota morena, 25 anos, muito carinhosa e atenciosa. Atendo em motel próprio ou hotel.",
            price: "R$ 250,00",
            phone: "(67) 9-9815-0990",
            whatsapp: "(67) 9-9815-0990",
            category: "mulher",
            services: ["Motel", "Hotel", "Local Próprio", "Transling"],
            status: "active",
            createdAt: new Date().toISOString(),
            planType: "supervip",
            paidAmount: 500
        },
        {
            id: Date.now() + 2,
            userEmail: "supervip2@teste.com",
            name: "Loira Sensual",
            age: 28,
            city: "Dourados",
            description: "Loira natural, 28 anos, muito experiente e profissional. Atendo em residência ou motel.",
            price: "R$ 280,00",
            phone: "(67) 9-9999-8888",
            whatsapp: "(67) 9-9999-8888",
            category: "mulher",
            services: ["Residência", "Motel", "Hotel"],
            status: "active",
            createdAt: new Date().toISOString(),
            planType: "supervip",
            paidAmount: 450
        }
    ];
}

// Variáveis de paginação
let currentPage = 0;
let announcementsPerPage = 6;
let allAnnouncements = [];

// Dados simulados (DEPRECIADOS - usar apenas dados do localStorage)
let profilesData = [];

// Função para carregar anúncios reais do localStorage
function loadRealAnnouncements() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];

    console.log('=== CARREGANDO ANÚNCIOS REAIS ===');
    console.log('Total de anúncios:', announcements.length);
    console.log('Anúncios ativos:', announcements.filter(ad => ad.status === 'active').length);
    console.log('Detalhes dos anúncios:', announcements.map(ad => ({
        id: ad.id,
        name: ad.name,
        category: ad.category,
        city: ad.city,
        status: ad.status,
        planType: ad.planType,
        userEmail: ad.userEmail
    })));

    // Verificar e corrigir anúncios existentes
    let needsUpdate = false;
    announcements.forEach(ad => {
        if (!ad.status) {
            ad.status = 'active';
            needsUpdate = true;
        }
        if (!ad.planType) {
            ad.planType = 'basic';
            needsUpdate = true;
        }
        if (!ad.category) {
            ad.category = 'mulher';
            needsUpdate = true;
        }
    });

    if (needsUpdate) {
        localStorage.setItem('announcements', JSON.stringify(announcements));
        console.log('Anúncios corrigidos e salvos');
    }

    // Não criar anúncios de exemplo: mostrar apenas cidades onde há anúncios reais
    const activeAnnouncements = announcements.filter(ad => ad.status === 'active');
    if (announcements.length === 0 || activeAnnouncements.length === 0) {
        console.log('Nenhum anúncio ativo encontrado. Mantendo lista vazia para não poluir o seletor de cidades.');
        // Atualizar seletor de cidades para refletir ausência de anúncios
        if (window.updateCitySelector) {
            setTimeout(() => window.updateCitySelector(), 100);
        }
        return announcements; // retorna vazio
    }

    // Atualizar seletor de cidades sempre que anúncios são carregados
    if (window.updateCitySelector) {
        setTimeout(() => window.updateCitySelector(), 100);
    }

    return announcements;
}

// Função auxiliar para normalizar strings (remover acentos)
function normalize(str) {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
}

// Função para carregar TOP anúncios (ordenados por valor pago)
function loadTopAnnouncements() {
    const announcements = loadRealAnnouncements();
    const currentCity = window.getCurrentCity ? window.getCurrentCity() : '';
    const config = window.getCurrentStateConfig ? window.getCurrentStateConfig() : null;
    const currentCategory = (window.currentCategoryFilter || localStorage.getItem('currentCategory') || 'all');

    console.log('=== DEBUG TOP ANÚNCIOS ===');
    console.log('Total de anúncios:', announcements.length);
    console.log('Anúncios por plano:', {
        supervip: announcements.filter(ad => ad.planType === 'supervip').length,
        top: announcements.filter(ad => ad.planType === 'top').length,
        basic: announcements.filter(ad => ad.planType === 'basic').length
    });

    // Excluir anúncios de usuários bloqueados
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const blockedMap = users.reduce((acc, u) => { if (u.blocked) acc[u.email] = true; return acc; }, {});

    // TOP ANÚNCIOS: Apenas SuperVIP
    let filteredAnnouncements = announcements.filter(ad => {
        const isTopTier = ['supervip'].includes((ad.planType || '').toLowerCase());
        const isActive = ad.status === 'active';
        const notBlocked = !blockedMap[ad.userEmail];

        console.log(`Anúncio: ${ad.name} | Plano: ${ad.planType} | Status: ${ad.status} | TopTier: ${isTopTier} | Ativo: ${isActive} | Não bloqueado: ${notBlocked}`);

        return isTopTier && isActive && notBlocked;
    });

    // Filtrar por categoria ativa, se houver
    if (currentCategory && currentCategory !== 'all') {
        filteredAnnouncements = filteredAnnouncements.filter(ad => (ad.category || '').toLowerCase().trim() === currentCategory.toLowerCase().trim());
    }

    // FILTRAR POR ESTADO ATUAL
    if (config) {
        const currentStateShort = config.shortName || 'MS';

        filteredAnnouncements = filteredAnnouncements.filter(ad => {
            // 1. Verificar propriedade state (mais confiável)
            if (ad.state) {
                return ad.state === currentStateShort;
            }

            // 2. Fallback: Assumir que o anúncio pertence ao estado atual
            // (Isso permite que cidades não listadas no config.cities, como Maracaju, apareçam)
            return true;
        });
    }

    // Filtrar por cidade se uma cidade estiver selecionada
    if (currentCity && currentCity !== 'all') {
        const currentCitySlug = normalize(currentCity);
        filteredAnnouncements = filteredAnnouncements.filter(ad => {
            const adCitySlug = normalize(ad.city);
            return adCitySlug.includes(currentCitySlug) || currentCitySlug.includes(adCitySlug);
        });
    }

    console.log('=== DEBUG TOP: Após filtro de estado/cidade ===');
    console.log('Quantidade restante:', filteredAnnouncements.length);
    filteredAnnouncements.forEach(a => console.log(a.name, a.city, a.state));

    // Ordenar SUPER VIP por valor pago (maior primeiro)
    const sortedAnnouncements = filteredAnnouncements.sort((a, b) => {
        return (b.paidAmount || 0) - (a.paidAmount || 0);
    });

    // Limitar a 6 anúncios TOP
    const topAnnouncements = sortedAnnouncements.slice(0, 6);

    const topGrid = document.getElementById('topAnnouncementsGrid');
    if (topGrid) {
        topGrid.innerHTML = '';

        if (topAnnouncements.length === 0) {
            topGrid.innerHTML = '<div class="no-top-ads">Nenhum anúncio TOP disponível no momento</div>';
        } else {
            topAnnouncements.forEach(ad => {
                const card = createTopCard(ad);
                topGrid.appendChild(card);
            });
        }
    }
}

// Função para criar card TOP
function createTopCard(ad) {
    const card = document.createElement('div');
    card.className = 'top-card';

    const bio = `${ad.age} anos, ${ad.city}`;
    const services = ad.services || ['Atendimento completo'];
    const atendimento = services.includes('Local Próprio') ? 'Local Próprio' :
        services.includes('Motel') ? 'Motel' :
            services.includes('Hotel') ? 'Hotel' : 'Atendimento';

    // escolher imagem real do anúncio sem forçar crop
    let adImage = '';
    if (ad.photos && Array.isArray(ad.photos) && ad.photos.length > 0) adImage = ad.photos[0];
    else if (ad.photo) adImage = ad.photo; else if (ad.image) adImage = ad.image; else adImage = getProfileImage(ad.planType);

    card.innerHTML = `
        <div class="top-card-image" onclick="openProfilePage('${ad.id}')">
            <img src="${adImage}" alt="Foto" oncontextmenu="return false;">
            <div class="wm-card">${window.statesManager ? statesManager.getCurrentWatermark() : 'DesejosMS'}</div>
            <div class="plan-badge ${ad.planType}">${ad.planType.toUpperCase()}</div>
        </div>
        <div class="top-card-content">
            <div class="top-card-title" style="font-weight: 800; font-size: 1.05rem; margin-bottom: 2px;">${ad.name}</div>
            <div class="top-card-location">
                <span style="color: #8B0000;">(67) <strong>${ad.phone}</strong></span>
            </div>
            <div class="top-card-location city-line" style="color: #8B0000; font-size: 0.85rem; font-weight: bold;">
                Com Local &nbsp;<span style="font-weight: normal;">${ad.city}, MS</span>
            </div>
        </div>
    `;
    return card;
}

// Função para carregar anúncios regulares
function loadRegularAnnouncements() {
    const announcements = loadRealAnnouncements();
    const currentCity = window.getCurrentCity ? window.getCurrentCity() : '';
    const config = window.getCurrentStateConfig ? window.getCurrentStateConfig() : null;

    // Atualizar título dinâmico baseado na categoria e cidade atuais
    const activeCategory = document.querySelector('.nav-item.active');
    const category = activeCategory ? activeCategory.getAttribute('data-category') : 'all';

    // Obter cidade do seletor se não houver cidade atual
    let cityToUse = currentCity;
    if (!cityToUse) {
        const citySelector = document.getElementById('citySelector');
        if (citySelector && citySelector.value) {
            cityToUse = citySelector.value;
        }
    }

    updateSectionTitle(category, cityToUse);

    // Excluir anúncios de usuários bloqueados e filtrar fora os SUPERVIP (pois já aparecem no topo)
    const users2 = JSON.parse(localStorage.getItem('users') || '[]');
    const blockedMap2 = users2.reduce((acc, u) => { if (u.blocked) acc[u.email] = true; return acc; }, {});
    let activeAnnouncements = announcements.filter(ad => ad.status === 'active' && !blockedMap2[ad.userEmail] && (ad.planType || '').toLowerCase() !== 'supervip');

    // FILTRAR POR ESTADO ATUAL
    if (config) {
        const currentStateShort = config.shortName || 'MS';

        activeAnnouncements = activeAnnouncements.filter(ad => {
            // 1. Verificar propriedade state (mais confiável)
            if (ad.state) {
                return ad.state === currentStateShort;
            }

            // 2. Fallback: Assumir que o anúncio pertence ao estado atual
            return true;
        });
    }

    // Filtrar por cidade se uma cidade estiver selecionada
    if (currentCity && currentCity !== 'all') {
        const currentCitySlug = normalize(currentCity);
        activeAnnouncements = activeAnnouncements.filter(ad => {
            const adCitySlug = normalize(ad.city);
            return adCitySlug.includes(currentCitySlug) || currentCitySlug.includes(adCitySlug);
        });
    }

    // Ordenar anúncios pela regra de planos (SUPERVIP > TOP > BÁSICO) e por relevância
    const sortedAnnouncements = activeAnnouncements.sort((a, b) => {
        const planOrder = { 'supervip': 3, 'top': 2, 'basic': 1 };
        const aOrder = planOrder[a.planType] || 1;
        const bOrder = planOrder[b.planType] || 1;
        if (aOrder !== bOrder) return bOrder - aOrder;
        // Empate: ordenar por visualizações (desc) para dar mais relevância
        const aViews = a.views || 0;
        const bViews = b.views || 0;
        if (aViews !== bViews) return bViews - aViews;
        // Empate final: ordenar por data de criação (mais recente primeiro)
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return bDate - aDate;
    });

    // Carregar todos os anúncios de uma vez (sem paginação)
    loadFilteredAnnouncements(sortedAnnouncements);
}

// Função para criar card de perfil
function createProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    let planBadge = '';
    if (profile.planType === 'supervip') planBadge = '<div class="plan-badge supervip">SUPER VIP</div>';
    else if (profile.planType === 'top') planBadge = '<div class="plan-badge top">TOP</div>';

    const displayName = profile.name;
    const bioOptions = ['Promoção rapidinha', 'Atendimento exclusivo', 'Local próprio', 'Muito carinhosa', 'Experiência garantida', 'Discreta e elegante'];
    const randomBio = bioOptions[Math.floor(Math.random() * bioOptions.length)];

    // escolher imagem real do anúncio sem redimensionamento agressivo
    let mainImage = '';
    if (profile.photos && Array.isArray(profile.photos) && profile.photos.length > 0) mainImage = profile.photos[0];
    else if (profile.photo) mainImage = profile.photo; else if (profile.image) mainImage = profile.image; else mainImage = getProfileImage(profile.planType);

    card.innerHTML = `
        <div class="profile-image" style="cursor: pointer;" onclick="openProfilePage('${profile.id}')">
            ${planBadge}
            <img src="${mainImage}" alt="Foto" oncontextmenu="return false;">
            <div class="wm-card">${window.statesManager ? statesManager.getCurrentWatermark() : 'DesejosMS'}</div>
        </div>
        <div class="profile-info">
            <div class="profile-name" style="cursor: pointer; font-weight: 800; font-size: 1.05rem; margin-bottom: 2px;" onclick="openProfilePage('${profile.id}')">${displayName}</div>
            <div class="profile-location">
                <span style="color: #8B0000;">(67) <strong>${profile.phone || profile.whatsapp || '9999-0000'}</strong></span>
            </div>
            <div class="profile-location city-line" style="color: #8B0000; font-size: 0.85rem; font-weight: bold;">
                Com Local &nbsp;<span style="font-weight: normal;">${profile.city}, ${window.getCurrentStateConfig ? window.getCurrentStateConfig().shortName : 'MS'}</span>
            </div>
        </div>
    `;
    return card;
}

// Função para gerar imagem baseada no plano
function getProfileImage(planType) {
    const images = {
        'supervip': [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=250&fit=crop'
        ],
        'top': [
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=250&fit=crop'
        ],
        'basic': [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=250&fit=crop'
        ]
    };

    const planImages = images[planType] || images['basic'];
    return planImages[Math.floor(Math.random() * planImages.length)];
}

// Função para gerar estrelas de avaliação
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';

    // Estrelas cheias
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star" style="color: #FFD700;"></i>';
    }

    // Meia estrela
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt" style="color: #FFD700;"></i>';
    }

    // Estrelas vazias
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star" style="color: #FFD700;"></i>';
    }

    return stars;
}

// Função para abrir página de perfil
function openProfilePage(profileId) {
    // Salvar o ID do perfil selecionado no localStorage
    localStorage.setItem('selectedProfileId', profileId);

    // Buscar informações do perfil para determinar o tipo de plano
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
    const profile = announcements.find(ad => ad.id == profileId);

    if (profile && profile.planType === 'supervip') {
        // SUPERVIP vai para perfil-supervip.html (página luxuosa)
        window.location.href = `perfil-supervip.html?id=${profileId}`;
    } else {
        // TOP e Básico vão para perfil-basico-top.html
        window.location.href = `perfil-basico-top.html?id=${profileId}`;
    }
}

// Função para ligar
function callPhone(phone) {
    console.log(`📞 TELEFONE CLICADO: ${phone}`);
    window.location.href = `tel:${phone}`;
}

// Função para abrir WhatsApp
function openWhatsApp(phone, name = '') {
    console.log(`📱 WHATSAPP CLICADO: ${name} - ${phone}`);
    const message = name ? `Olá ${name}, vi seu anúncio no DesejosMS e gostaria de conversar.` : 'Olá, vi seu anúncio no DesejosMS e gostaria de conversar.';
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Função para atualizar estatísticas
function updateStatistics() {
    const currentCity = getCurrentCity();
    const stats = getCityStatistics(currentCity);

    const activeAdsElement = document.getElementById('activeAdsCount');
    const activeUsersElement = document.getElementById('activeUsersCount');
    const verifiedPercentageElement = document.getElementById('verifiedPercentage');

    if (activeAdsElement) activeAdsElement.textContent = stats.activeAds;
    if (activeUsersElement) activeUsersElement.textContent = stats.activeUsers;
    if (verifiedPercentageElement) verifiedPercentageElement.textContent = stats.verifiedPercentage;
}

// Função para configurar event listeners
function setupEventListeners() {
    console.log('=== CONFIGURANDO EVENT LISTENERS ===');

    // Aguardar um pouco para garantir que os botões foram criados
    setTimeout(() => {
        const navItems = document.querySelectorAll('.nav-item');
        console.log('Encontrados', navItems.length, 'botões de categoria');

        navItems.forEach((item, index) => {
            console.log(`Configurando evento para botão ${index}: ${item.textContent}`);

            // Remover event listeners antigos para evitar duplicação
            if (item.categoryClickHandler) {
                item.removeEventListener('click', item.categoryClickHandler);
            }

            // Criar novo handler
            item.categoryClickHandler = function (e) {
                e.preventDefault();
                console.log(`🎯 CLIQUE DETECTADO: ${this.textContent.trim()} (categoria: ${this.getAttribute('data-category')})`);

                // Remover classe active de todos os botões
                navItems.forEach(nav => nav.classList.remove('active'));

                // Adicionar classe active ao botão clicado e persistir estado
                this.classList.add('active');
                const category = this.getAttribute('data-category');
                window.currentCategoryFilter = category;
                localStorage.setItem('currentCategory', category);

                // Adicionar efeito visual temporário
                this.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);

                // Obter cidade selecionada
                const citySelector = document.getElementById('citySelector');
                const selectedCity = citySelector ? citySelector.value : '';

                // Filtrar perfis com categoria e cidade
                console.log(`Filtrando por categoria: ${category}, cidade: ${selectedCity}`);

                // Mostrar loading visual
                const profilesGrid = document.getElementById('profilesGrid');
                if (profilesGrid) {
                    profilesGrid.innerHTML = '<div class="loading">Carregando anúncios...</div>';
                }

                // Filtrar imediatamente (sem delay)
                filterProfiles(category, '', selectedCity);
                // Atualizar bloco TOP conforme categoria
                loadTopAnnouncements();
            };

            // Adicionar event listener
            item.addEventListener('click', item.categoryClickHandler);
        });

        // Busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                const searchTerm = this.value.toLowerCase();
                // Obter categoria e cidade ativas
                const activeCategory = document.querySelector('.nav-item.active');
                const category = activeCategory ? activeCategory.getAttribute('data-category') : 'all';
                const citySelector = document.getElementById('citySelector');
                const selectedCity = citySelector ? citySelector.value : '';
                filterProfiles(category, searchTerm, selectedCity);
            });
        }

        // Seletor de cidade
        const citySelector = document.getElementById('citySelector');
        if (citySelector) {
            citySelector.addEventListener('change', function () {
                const selectedCity = this.value;
                setCurrentCity(selectedCity);

                // Obter categoria ativa
                const activeCategory = document.querySelector('.nav-item.active');
                const category = activeCategory ? activeCategory.getAttribute('data-category') : 'all';

                // Filtrar por categoria e cidade
                filterProfiles(category, '', selectedCity);
                // Atualizar bloco TOP conforme cidade
                loadTopAnnouncements();
            });
        }
    }, 500); // Aguardar 500ms para garantir que os botões foram criados
}

// Função para atualizar título da seção
function updateSectionTitle(category, city) {
    const titleElement = document.getElementById('dynamicSectionTitle');
    if (!titleElement) return;

    let title = 'Anúncios Recentes';

    // Verificar se há uma categoria ativa
    let finalCategory = category;
    if (!finalCategory || finalCategory === 'all') {
        const activeCategory = document.querySelector('.nav-item.active');
        finalCategory = activeCategory ? activeCategory.getAttribute('data-category') : 'all';
    }

    // Usar a categoria ativa se não foi especificada
    if (city && finalCategory !== 'all') {
        const categoryNames = {
            'mulher': 'Mulheres',
            'homem': 'Homens',
            'travesti': 'Travestis',
            'massagista': 'Massagistas'
        };

        const categoryName = categoryNames[finalCategory] || finalCategory;

        // Converter ID da cidade para nome se necessário
        let cityName = city;
        if (city && city.includes('-')) {
            // Se é um ID de cidade (ex: campo-grande), converter para nome
            cityName = city.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }

        // Obter estado atual para mostrar no título
        const currentState = window.getCurrentStateConfig ? window.getCurrentStateConfig() : null;
        const stateShort = currentState ? currentState.shortName : 'MS';

        title = `${categoryName} em ${cityName}, ${stateShort}`;
        console.log('Título definido (categoria + cidade):', title);
    } else if (finalCategory !== 'all') {
        const categoryNames = {
            'mulher': 'Mulheres',
            'homem': 'Homens',
            'travesti': 'Travestis',
            'massagista': 'Massagistas'
        };

        const categoryName = categoryNames[finalCategory] || finalCategory;

        // Obter estado atual para mostrar no título
        const currentState = window.getCurrentStateConfig ? window.getCurrentStateConfig() : null;
        const stateName = currentState ? currentState.name : 'Mato Grosso do Sul';

        title = `${categoryName} - ${stateName}`;
        console.log('Título definido (apenas categoria):', title);
    } else if (city) {
        // Converter ID da cidade para nome se necessário
        let cityName = city;
        if (city && city.includes('-')) {
            cityName = city.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }

        // Obter estado atual para mostrar no título
        const currentState = window.getCurrentStateConfig ? window.getCurrentStateConfig() : null;
        const stateShort = currentState ? currentState.shortName : 'MS';

        title = `Anúncios em ${cityName}, ${stateShort}`;
        console.log('Título definido (apenas cidade):', title);
    }

    titleElement.textContent = title;
}

// FUNÇÃO PRINCIPAL DE FILTRAGEM - CORRIGIDA
function filterProfiles(category = 'all', searchTerm = '', city = '') {
    console.log('=== FILTRO ATIVADO ===');
    console.log('Categoria:', category);
    console.log('Cidade:', city);
    console.log('Busca:', searchTerm);

    // Atualizar título dinâmico
    updateSectionTitle(category, city);

    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const validCategories = ['mulher', 'homem', 'travesti', 'massagista'];

    console.log('Total de anúncios:', announcements.length);
    console.log('Anúncios por categoria:', {
        mulher: announcements.filter(ad => ad.category === 'mulher').length,
        homem: announcements.filter(ad => ad.category === 'homem').length,
        travesti: announcements.filter(ad => ad.category === 'travesti').length,
        massagista: announcements.filter(ad => ad.category === 'massagista').length
    });

    // Mostrar detalhes de todos os anúncios para debug
    console.log('=== DETALHES DE TODOS OS ANÚNCIOS ===');
    announcements.forEach((ad, index) => {
        console.log(`${index + 1}. ${ad.name} - Categoria: "${ad.category}" - Cidade: "${ad.city}" - Status: ${ad.status}`);
    });

    let filtered = announcements.filter(ad => {
        // Filtro por status - apenas anúncios ativos
        if (ad.status !== 'active') {
            console.log(`Rejeitado ${ad.name}: status inativo (${ad.status})`);
            return false;
        }

        // FILTRO POR ESTADO ATUAL
        const config = getCurrentStateConfig();
        if (config) {
            const currentStateShort = config.shortName || 'MS';

            // 1. Verificar propriedade state
            if (ad.state) {
                if (ad.state !== currentStateShort) {
                    console.log(`❌ Rejeitado ${ad.name}: estado "${ad.state}" != "${currentStateShort}"`);
                    return false;
                }
            } else {
                // 2. Fallback: aceitar no estado atual, permitindo cidades como Maracaju
                return true;
            }
        }

        // Filtro por categoria - CORREÇÃO: usar comparação exata
        if (category !== 'all' && validCategories.includes(category)) {
            // Normalizar strings para comparação
            const adCategory = (ad.category || '').toLowerCase().trim();
            const filterCategory = category.toLowerCase().trim();

            if (adCategory !== filterCategory) {
                console.log(`❌ Rejeitado ${ad.name}: categoria "${adCategory}" != "${filterCategory}"`);
                return false;
            } else {
                console.log(`✅ Categoria correta: ${ad.name} - "${adCategory}" == "${filterCategory}"`);
            }
        }

        // Filtro por cidade (melhorado para funcionar com IDs e nomes de cidades)
        if (city && city !== '') {
            const adCity = (ad.city || '').toLowerCase().trim();
            const filterCity = city.toLowerCase().trim();

            // Converter ID da cidade para nome se necessário
            let cityNameToMatch = filterCity;
            if (filterCity.includes('-')) {
                // Se é um ID de cidade (ex: sao-paulo), converter para nome
                cityNameToMatch = filterCity.split('-').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                cityNameToMatch = cityNameToMatch.toLowerCase();
            }

            // Verificar correspondência de várias formas
            const matches =
                adCity.includes(filterCity) ||
                filterCity.includes(adCity) ||
                adCity.includes(cityNameToMatch) ||
                cityNameToMatch.includes(adCity);

            if (!matches) {
                console.log(`❌ Rejeitado ${ad.name}: cidade "${adCity}" não corresponde a "${filterCity}" (${cityNameToMatch})`);
                return false;
            } else {
                console.log(`✅ Cidade correta: ${ad.name} - "${adCity}" corresponde a "${filterCity}" (${cityNameToMatch})`);
            }
        }

        // Filtro por busca
        if (searchTerm && !ad.name.toLowerCase().includes(searchTerm) &&
            !ad.description.toLowerCase().includes(searchTerm) &&
            !ad.city.toLowerCase().includes(searchTerm)) {
            console.log(`Rejeitado ${ad.name}: não contém "${searchTerm}"`);
            return false;
        }

        // NOVO: Excluir SUPERVIP da listagem comum, pois já aparecem no Top Anúncios no topo da página
        if ((ad.planType || '').toLowerCase() === 'supervip') {
            console.log(`Rejeitado ${ad.name}: plano SUPERVIP`);
            return false;
        }

        console.log(`✅ Aceito ${ad.name}: categoria="${ad.category}", cidade="${ad.city}"`);
        return true;
    });

    // Ordenar resultado por plano (SUPERVIP > TOP > BÁSICO), depois por visibilidade
    const planOrder = { supervip: 3, top: 2, basic: 1 };
    filtered.sort((a, b) => {
        const ao = planOrder[a.planType] || 1;
        const bo = planOrder[b.planType] || 1;
        if (ao !== bo) return bo - ao;
        const av = a.views || 0;
        const bv = b.views || 0;
        if (av !== bv) return bv - av;
        const adt = new Date(a.createdAt || 0).getTime();
        const bdt = new Date(b.createdAt || 0).getTime();
        return bdt - adt;
    });

    console.log('=== RESULTADO FINAL ===');
    console.log('Anúncios filtrados:', filtered.length);
    console.log('Resultado:', filtered.map(ad => `${ad.name} (${ad.category})`));

    // IMPORTANTE: Mostrar quantos anúncios de cada categoria foram filtrados
    if (category !== 'all') {
        const categoryCounts = {
            mulher: filtered.filter(ad => ad.category === 'mulher').length,
            homem: filtered.filter(ad => ad.category === 'homem').length,
            travesti: filtered.filter(ad => ad.category === 'travesti').length,
            massagista: filtered.filter(ad => ad.category === 'massagista').length
        };
        console.log('Anúncios filtrados por categoria:', categoryCounts);
        console.log(`🎯 Categoria "${category}": ${categoryCounts[category]} anúncios`);

        // Verificar se há anúncios da categoria selecionada
        if (categoryCounts[category] === 0) {
            console.log('⚠️ ATENÇÃO: Nenhum anúncio encontrado para a categoria selecionada!');
            console.log('Verificando se há anúncios com essa categoria no localStorage...');
            const allAnnouncements = JSON.parse(localStorage.getItem('announcements')) || [];
            const categoryAnnouncements = allAnnouncements.filter(ad => ad.category === category);
            console.log(`Anúncios com categoria "${category}" no localStorage:`, categoryAnnouncements.length);
            if (categoryAnnouncements.length > 0) {
                console.log('Detalhes:', categoryAnnouncements.map(ad => ({
                    name: ad.name,
                    category: ad.category,
                    status: ad.status
                })));
            }
        }
    }

    // Atualizar visual da categoria ativa no menu
    try {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(btn => btn.classList.remove('active'));

        if (category !== 'all') {
            const activeButton = document.querySelector(`[data-category="${category}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
                console.log(`✅ Categoria "${category}" ativada visualmente`);
            }
        }

        // Mostrar feedback visual da categoria ativa
        showCategoryFeedback(category, filtered.length);
    } catch (e) {
        console.warn('Falha ao atualizar estado visual das categorias:', e);
    }

    // CORREÇÃO: Garantir que os cards sejam renderizados
    loadFilteredAnnouncements(filtered);
}

// Função para mostrar feedback visual da categoria ativa
function showCategoryFeedback(category, count) {
    // Remover feedback anterior
    const existingFeedback = document.querySelector('.category-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Obter cidade selecionada
    const citySelector = document.getElementById('citySelector');
    const selectedCity = citySelector ? citySelector.value : '';

    // Criar novo feedback
    const feedback = document.createElement('div');
    feedback.className = 'category-feedback';

    const categoryNames = {
        'all': 'TODOS OS ANÚNCIOS',
        'mulher': 'MULHERES',
        'homem': 'HOMENS',
        'travesti': 'TRAVESTIS',
        'massagista': 'MASSAGISTAS'
    };

    const categoryName = categoryNames[category] || category.toUpperCase();

    // Criar texto do feedback baseado na combinação
    let feedbackText = `Mostrando: <strong>${categoryName}</strong>`;
    if (selectedCity && selectedCity !== '') {
        feedbackText += ` em <strong>${selectedCity}</strong>`;
    }

    feedback.innerHTML = `
        <div class="feedback-content">
            <i class="fas fa-filter"></i>
            <span class="feedback-text">${feedbackText}</span>
            <span class="feedback-count">(${count} anúncios)</span>
        </div>
    `;

    // Adicionar ao topo da seção de anúncios
    const announcementsSection = document.querySelector('.announcements-section');
    if (announcementsSection) {
        announcementsSection.insertBefore(feedback, announcementsSection.firstChild);
    }
}

// Função para carregar anúncios filtrados - CORRIGIDA
function loadFilteredAnnouncements(announcements) {
    console.log('=== CARREGANDO ANÚNCIOS FILTRADOS ===');
    console.log('Quantidade de anúncios a serem exibidos:', announcements.length);

    const profilesGrid = document.getElementById('profilesGrid');
    if (!profilesGrid) {
        console.error('Elemento profilesGrid não encontrado!');
        return;
    }

    allAnnouncements = announcements;
    profilesGrid.innerHTML = '';

    // Mostrar indicador de categoria ativa (fora do grid, acima dos cards)
    const section = profilesGrid.parentElement; // .announcements-section
    const oldIndicator = section.querySelector('.category-indicator');
    if (oldIndicator) oldIndicator.remove();

    // Carregar todos os anúncios filtrados de uma vez (sem paginação)
    if (announcements.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; color: #ddd;"></i>
                <h3>Nenhum anúncio encontrado</h3>
                <p>Tente selecionar outra categoria ou cidade</p>
            </div>
        `;
        profilesGrid.appendChild(noResults);
        console.log('Nenhum anúncio encontrado - exibindo mensagem');
    } else {
        announcements.forEach((ad, index) => {
            console.log(`Criando card ${index + 1}: ${ad.name} (${ad.category})`);
            const card = createProfileCard(ad);
            profilesGrid.appendChild(card);
        });
        console.log(`${announcements.length} cards criados com sucesso`);
    }
}

// Função para carregar perfis - CORRIGIDA
function loadProfiles() {
    console.log('=== CARREGANDO PERFIS ===');

    // Carregar TOP anúncios
    loadTopAnnouncements();

    // Carregar anúncios regulares
    loadRegularAnnouncements();

    // Atualizar estatísticas
    updateStatistics();
}

// Inicializar quando o DOM estiver pronto - CORRIGIDO
document.addEventListener('DOMContentLoaded', async function () {
    console.log('=== INICIALIZAÇÃO DO SISTEMA ===');

    // Sincronizar com Banco de Dados Oficial na nuvem (Supabase) antes de renderizar
    if (window.syncSupabaseToLocal) {
        await window.syncSupabaseToLocal();
    }

    // Aguardar um pouco para garantir que todos os scripts foram carregados
    setTimeout(() => {
        // Inicializar configuração do site
        if (typeof initSiteConfig === 'function') {
            initSiteConfig();
            console.log('Configuração inicializada');
        }

        // Aguardar mais um pouco para garantir que updateCategories foi definida
        setTimeout(() => {
            // Atualizar categorias no menu
            if (typeof updateCategories === 'function') {
                updateCategories();
                console.log('Categorias atualizadas');

                // Verificar se os botões foram criados
                const navItems = document.querySelectorAll('.nav-item');
                console.log('Botões de categoria encontrados:', navItems.length);
                navItems.forEach((item, index) => {
                    console.log(`Botão ${index}: ${item.textContent} (data-category: ${item.getAttribute('data-category')})`);
                });

                // Configurar event listeners (deve ser logo após updateCategories)
                setupEventListeners();
                console.log('Event listeners configurados');

                // Carregar perfis
                loadProfiles();
                console.log('Perfis carregados');

                // Aplicar filtro inicial para mostrar todos os anúncios
                setTimeout(() => {
                    console.log('Aplicando filtro inicial...');

                    if (window.AUTOMATIC_SEO_CITY) {
                        const rawName = window.AUTOMATIC_SEO_CITY;
                        const cityParam = rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                        console.log('Filtro Automático de SEO detectado:', rawName);

                        // Procurar o id do <select> para travar nele
                        const citySelector = document.getElementById('citySelector');
                        if (citySelector) {
                            Array.from(citySelector.options).forEach(opt => {
                                if (opt.value === cityParam || opt.text.toLowerCase() === rawName.toLowerCase()) {
                                    opt.selected = true;
                                    if (typeof setCurrentCity === 'function') setCurrentCity(opt.value);
                                }
                            });
                        }

                        filterProfiles('all', '', cityParam);
                    } else {
                        filterProfiles('all');
                    }
                }, 1000);

            } else {
                console.error('Função updateCategories não encontrada!');
            }
        }, 200);
    }, 100);
});

// Funções auxiliares para debug e teste
window.testCategoryFilter = function (category) {
    console.log(`=== TESTE DE FILTRO: ${category} ===`);
    filterProfiles(category);
};

window.checkAnnouncements = function () {
    console.log('=== VERIFICAÇÃO DE ANÚNCIOS ===');
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    console.log('Total de anúncios:', announcements.length);

    if (announcements.length === 0) {
        console.log('NENHUM ANÚNCIO ENCONTRADO!');
        console.log('Gerando anúncios de exemplo...');
        loadRealAnnouncements(); // Isso criará os anúncios de exemplo
    } else {
        console.log('Anúncios por categoria:');
        const categories = ['mulher', 'homem', 'travesti', 'massagista'];
        categories.forEach(cat => {
            const count = announcements.filter(ad => ad.category === cat).length;
            console.log(`${cat}: ${count} anúncios`);
        });
    }
};

// Exportar funções para uso global
window.filterProfiles = filterProfiles;
window.loadProfiles = loadProfiles;
window.loadFilteredAnnouncements = loadFilteredAnnouncements;
window.setupEventListeners = setupEventListeners;

// Função para resetar anúncios e criar novos (para teste)
window.resetAnnouncementsForTesting = function () {
    console.log('🔄 Resetando anúncios para teste...');
    localStorage.removeItem('announcements');
    console.log('✅ Anúncios removidos do localStorage');

    // Recarregar anúncios (irá criar os novos automaticamente)
    loadRealAnnouncements();

    // Recarregar a página para aplicar mudanças
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};

