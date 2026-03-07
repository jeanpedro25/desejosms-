// Variáveis de paginação
let currentPage = 0;
let announcementsPerPage = 6;
let allAnnouncements = [];



// Simulated data for profiles
let profilesData = [
    {
        id: 1,
        name: "Morena Completa",
        description: "Garota morena, 25 anos, muito carinhosa e atenciosa. Atendo em motel próprio ou hotel.",
        location: "Dourados - MS",
        phone: "(67) 9-9815-0990",
        price: "R$ 100,00",
        category: "garotas",
        city: "Dourados",
        hasLocal: true,
        age: 25,
        services: ["Motel", "Hotel", "Local Próprio"],
        isPremium: false,
        planType: "basic",
        paidAmount: 149.90
    },
    {
        id: 2,
        name: "Loira Sensual",
        description: "Loira natural, 28 anos, muito experiente e profissional. Atendo em residência ou motel.",
        location: "Campo Grande - MS",
        phone: "(67) 9-9999-8888",
        price: "R$ 150,00",
        category: "garotas",
        city: "Campo Grande",
        hasLocal: false,
        age: 28,
        services: ["Motel", "Residência"],
        isPremium: true,
        planType: "basic",
        paidAmount: 249.90
    },
    {
        id: 3,
        name: "Asiática Exótica",
        description: "Garota asiática, 22 anos, muito discreta e elegante. Atendo apenas em hotel.",
        location: "Três Lagoas - MS",
        phone: "(67) 9-8888-7777",
        price: "R$ 200,00",
        category: "garotas",
        city: "Três Lagoas",
        hasLocal: false,
        age: 22,
        services: ["Hotel"],
        isPremium: true,
        planType: "vip",
        paidAmount: 399.90
    }
];

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
    
    // Criar anúncios de exemplo se não existirem ou se não há anúncios ativos
    const activeAnnouncements = announcements.filter(ad => ad.status === 'active');
    if (announcements.length === 0 || activeAnnouncements.length === 0) {
        console.log('Criando anúncios de exemplo...');
        const exampleAnnouncements = [
            // ===== PLANO SUPERVIP (4 anúncios) =====
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
                isVip: true,
                planType: "supervip",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 199.99,
                views: 3247,
                rating: 4.9
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
                services: ["Motel", "Residência", "Local Próprio", "Transling"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "supervip",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 199.99,
                views: 2892,
                rating: 4.8
            },
            {
                id: Date.now() + 3,
                userEmail: "supervip3@teste.com",
                name: "Asiática Exótica",
                age: 24,
                city: "Três Lagoas",
                description: "Asiática exótica, 24 anos, muito discreta e elegante. Atendimento exclusivo.",
                price: "R$ 300,00",
                phone: "(67) 9-8888-7777",
                whatsapp: "(67) 9-8888-7777",
                category: "mulher",
                services: ["Hotel", "Jantar", "Eventos", "Massagem"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "supervip",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 199.99,
                views: 4156,
                rating: 4.9
            },
            {
                id: Date.now() + 4,
                userEmail: "supervip4@teste.com",
                name: "Morena Deliciosa",
                age: 26,
                city: "Corumbá",
                description: "Morena sensual, 26 anos, muito experiente. Atendo em local próprio ou motel.",
                price: "R$ 220,00",
                phone: "(67) 9-7777-6666",
                whatsapp: "(67) 9-7777-6666",
                category: "mulher",
                services: ["Local Próprio", "Motel", "Massagem", "Oral"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "supervip",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 199.99,
                views: 3056,
                rating: 4.7
            },
            
            // ===== PLANO TOP (4 anúncios) =====
            {
                id: Date.now() + 5,
                userEmail: "top1@teste.com",
                name: "Loira Natural",
                age: 22,
                city: "Campo Grande",
                description: "Loira natural, 22 anos, muito carinhosa. Atendo em motel ou residência.",
                price: "R$ 180,00",
                phone: "(67) 9-6666-5555",
                whatsapp: "(67) 9-6666-5555",
                category: "mulher",
                services: ["Motel", "Residência", "Oral"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "top",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 149.99,
                views: 1445,
                rating: 4.5,
                facilitation: true
            },
            {
                id: Date.now() + 6,
                userEmail: "top2@teste.com",
                name: "Morena Completa",
                age: 27,
                city: "Dourados",
                description: "Morena completa, 27 anos, muito atenciosa. Atendo em local próprio.",
                price: "R$ 160,00",
                phone: "(67) 9-5555-4444",
                whatsapp: "(67) 9-5555-4444",
                category: "mulher",
                services: ["Local Próprio", "Motel", "Massagem"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "top",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 149.99,
                views: 1234,
                rating: 4.6,
                facilitation: true
            },
            {
                id: Date.now() + 7,
                userEmail: "top3@teste.com",
                name: "Loira Safadinha",
                age: 23,
                city: "Três Lagoas",
                description: "Loira safadinha, 23 anos, muito experiente. Atendo em hotel ou motel.",
                price: "R$ 170,00",
                phone: "(67) 9-4444-3333",
                whatsapp: "(67) 9-4444-3333",
                category: "mulher",
                services: ["Hotel", "Motel", "Transling"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "top",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 149.99,
                views: 1567,
                rating: 4.4
            },
            {
                id: Date.now() + 8,
                userEmail: "top4@teste.com",
                name: "Morena Gostosa",
                age: 25,
                city: "Corumbá",
                description: "Morena gostosa, 25 anos, muito carinhosa. Atendo em residência.",
                price: "R$ 150,00",
                phone: "(67) 9-3333-2222",
                whatsapp: "(67) 9-3333-2222",
                category: "mulher",
                services: ["Residência", "Oral", "Massagem"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "top",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 149.99,
                views: 1345,
                rating: 4.3
            },
            
            // ===== PLANO BÁSICO (4 anúncios) =====
            {
                id: Date.now() + 9,
                userEmail: "basic1@teste.com",
                name: "Loira Primeira Vez",
                age: 20,
                city: "Campo Grande",
                description: "Loira primeira vez, 20 anos, muito carinhosa. Atendo em motel.",
                price: "R$ 120,00",
                phone: "(67) 9-2222-1111",
                whatsapp: "(67) 9-2222-1111",
                category: "mulher",
                services: ["Motel", "Oral"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: false,
                planType: "basic",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 99.99,
                views: 445,
                rating: 4.2
            },
            {
                id: Date.now() + 10,
                userEmail: "basic2@teste.com",
                name: "Morena Iniciante",
                age: 21,
                city: "Dourados",
                description: "Morena iniciante, 21 anos, muito atenciosa. Atendo em residência.",
                price: "R$ 100,00",
                phone: "(67) 9-1111-0000",
                whatsapp: "(67) 9-1111-0000",
                category: "mulher",
                services: ["Residência", "Oral"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: false,
                planType: "basic",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 99.99,
                views: 334,
                rating: 4.1
            },
            {
                id: Date.now() + 11,
                userEmail: "basic3@teste.com",
                name: "Loira Novata",
                age: 19,
                city: "Três Lagoas",
                description: "Loira novata, 19 anos, muito carinhosa. Atendo em motel.",
                price: "R$ 110,00",
                phone: "(67) 9-0000-9999",
                whatsapp: "(67) 9-0000-9999",
                category: "mulher",
                services: ["Motel", "Oral"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: false,
                planType: "basic",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 99.99,
                views: 223,
                rating: 4.0
            },
            {
                id: Date.now() + 12,
                userEmail: "basic4@teste.com",
                name: "Morena Inexperiente",
                age: 20,
                city: "Corumbá",
                description: "Morena inexperiente, 20 anos, muito atenciosa. Atendo em residência.",
                price: "R$ 90,00",
                phone: "(67) 9-9999-8888",
                whatsapp: "(67) 9-9999-8888",
                category: "mulher",
                services: ["Residência", "Oral"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: false,
                planType: "basic",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 99.99,
                views: 112,
                rating: 3.9
            },
            
            // ===== CATEGORIA MASSAGISTA (2 anúncios) =====
            {
                id: Date.now() + 13,
                userEmail: "massagista1@teste.com",
                name: "Massagista Profissional",
                age: 30,
                city: "Campo Grande",
                description: "Massagista profissional, 30 anos, muito experiente. Atendo em local próprio.",
                price: "R$ 150,00",
                phone: "(67) 9-8888-7777",
                whatsapp: "(67) 9-8888-7777",
                category: "massagista",
                services: ["Local Próprio", "Massagem Relaxante", "Massagem Terapêutica"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "top",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 149.99,
                views: 856,
                rating: 4.7
            },
            {
                id: Date.now() + 14,
                userEmail: "massagista2@teste.com",
                name: "Massagista Especializada",
                age: 28,
                city: "Dourados",
                description: "Massagista especializada, 28 anos, muito atenciosa. Atendo em residência.",
                price: "R$ 120,00",
                phone: "(67) 9-7777-6666",
                whatsapp: "(67) 9-7777-6666",
                category: "massagista",
                services: ["Residência", "Massagem Relaxante"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: false,
                planType: "basic",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 99.99,
                views: 445,
                rating: 4.3
            },
            
            // ===== ANÚNCIOS DE HOMEM =====
            {
                id: Date.now() + 15,
                userEmail: "homem1@teste.com",
                name: "Homem Atraente",
                age: 28,
                city: "Campo Grande",
                description: "Homem atraente, 28 anos, muito discreto. Atendo em motel ou residência.",
                price: "R$ 200,00",
                phone: "(67) 9-1111-2222",
                whatsapp: "(67) 9-1111-2222",
                category: "homem",
                services: ["Motel", "Residência", "Companhia"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "top",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 149.99,
                views: 678,
                rating: 4.5
            },
            {
                id: Date.now() + 16,
                userEmail: "homem2@teste.com",
                name: "Homem Executivo",
                age: 32,
                city: "Dourados",
                description: "Homem executivo, 32 anos, muito profissional. Atendo em hotel.",
                price: "R$ 250,00",
                phone: "(67) 9-2222-3333",
                whatsapp: "(67) 9-2222-3333",
                category: "homem",
                services: ["Hotel", "Companhia Executiva", "Eventos"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "supervip",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 199.99,
                views: 892,
                rating: 4.8
            },
            
            // ===== ANÚNCIOS DE TRAVESTI =====
            {
                id: Date.now() + 17,
                userEmail: "travesti1@teste.com",
                name: "Travesti Sensual",
                age: 26,
                city: "Campo Grande",
                description: "Travesti sensual, 26 anos, muito carinhosa. Atendo em local próprio.",
                price: "R$ 180,00",
                phone: "(67) 9-3333-4444",
                whatsapp: "(67) 9-3333-4444",
                category: "travesti",
                services: ["Local Próprio", "Motel", "Oral"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "top",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 149.99,
                views: 567,
                rating: 4.6
            },
            {
                id: Date.now() + 18,
                userEmail: "travesti2@teste.com",
                name: "Travesti Elegante",
                age: 29,
                city: "Três Lagoas",
                description: "Travesti elegante, 29 anos, muito discreta. Atendo em hotel.",
                price: "R$ 220,00",
                phone: "(67) 9-4444-5555",
                whatsapp: "(67) 9-4444-5555",
                category: "travesti",
                services: ["Hotel", "Companhia", "Eventos"],
                status: "active",
                createdAt: new Date().toISOString(),
                isVip: true,
                planType: "supervip",
                paymentRequired: false,
                needsVerification: false,
                paidAmount: 199.99,
                views: 734,
                rating: 4.7
            }
        ];
        
        localStorage.setItem('announcements', JSON.stringify(exampleAnnouncements));
        return exampleAnnouncements;
    }
    
    return announcements;
}

// Função para carregar TOP anúncios (ordenados por valor pago)
function loadTopAnnouncements() {
    const announcements = loadRealAnnouncements();
    const currentCity = getCurrentCity();
    const config = getCurrentStateConfig();
    
    let filteredAnnouncements = announcements.filter(ad => (ad.planType === 'supervip' || ad.planType === 'top') && ad.status === 'active');
    
    // Filtrar por cidade se uma cidade estiver selecionada
    if (currentCity) {
        // Primeiro, tentar encontrar no sistema de cidades do admin
        const adminCities = JSON.parse(localStorage.getItem('cities')) || [];
        const cityConfig = adminCities.find(city => 
            city.name.toLowerCase().replace(/\s+/g, '-') === currentCity
        );
        
        if (cityConfig) {
            filteredAnnouncements = filteredAnnouncements.filter(ad => 
                ad.city.toLowerCase().includes(cityConfig.name.toLowerCase())
            );
        } else {
            // Fallback para cidades do config.js
            const configCity = config.cities.find(city => city.id === currentCity);
            if (configCity) {
                filteredAnnouncements = filteredAnnouncements.filter(ad => 
                    ad.city.toLowerCase().includes(configCity.name.toLowerCase())
                );
            }
        }
    }
    
    const topAnnouncements = filteredAnnouncements
        .sort((a, b) => {
            // Ordenar por plano (SUPERVIP primeiro, depois TOP)
            const planOrder = { 'supervip': 2, 'top': 1 };
            const aOrder = planOrder[a.planType] || 0;
            const bOrder = planOrder[b.planType] || 0;
            if (aOrder !== bOrder) return bOrder - aOrder;
            // Se mesmo plano, ordenar por valor pago
            return b.paidAmount - a.paidAmount;
        })
        .slice(0, 3); // Pegar apenas os 3 primeiros
    
    const topGrid = document.getElementById('topAnnouncementsGrid');
    if (!topGrid) return;
    
    topGrid.innerHTML = '';
    
    topAnnouncements.forEach((ad, index) => {
        const rank = index + 1;
        const card = createTopAnnouncementCard(ad, rank);
        topGrid.appendChild(card);
    });
}

// Função para criar card de TOP anúncio
function createTopAnnouncementCard(ad, rank) {
    const card = document.createElement('div');
    card.className = 'top-announcement-card';
    card.setAttribute('data-rank', `#${rank}`);
    
    const tags = ad.services.slice(0, 4).map(service => 
        `<span class="top-card-tag">${service}</span>`
    ).join('');
    
    // Gerar estrelas usando a nova função
    const rating = ad.rating || 0;
    const stars = generateStars(rating);
    
    // Determinar badge do plano
    const planBadge = ad.planType === 'supervip' ? 'SUPERVIP' : 'TOP';
    const planClass = ad.planType === 'supervip' ? 'supervip' : 'top';
    
    card.innerHTML = `
        <div class="plan-badge ${planClass}">${planBadge}</div>
        <div class="top-card-image">
            <img src="https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=${encodeURIComponent(ad.name)}" 
                 alt="${ad.name}" 
                 oncontextmenu="return false;">
            <div class="watermark">DesejosMS</div>
        </div>
        <div class="top-card-content">
            <div class="top-card-title">${ad.name}</div>
            <div class="top-card-rating">
                ${stars}
                <span class="rating-text">(${rating.toFixed(1)})</span>
            </div>
            <div class="top-card-location">${ad.city}, MS</div>
            <div class="top-card-description">${ad.description}</div>
            <div class="top-card-tags">
                ${tags}
            </div>
            <div class="top-card-stats">
                <span>${ad.views} visualizações</span>
                <span>${Math.floor((ad.views / 1000) * 100)}%</span>
            </div>
            <div class="top-card-price">${ad.price}</div>
            <div class="top-card-actions">
                <button class="top-card-btn phone" onclick="callPhone('${ad.phone}')">
                    <i class="fas fa-phone"></i> Ligar
                </button>
                <button class="top-card-btn whatsapp" onclick="openWhatsApp('${ad.whatsapp}')">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
            </div>
            <a href="perfil-individual.html?id=${ad.id}" class="top-card-link">
                Ver Perfil Premium
            </a>
        </div>
    `;
    
    return card;
}

// Função para carregar anúncios regulares
function loadRegularAnnouncements() {
    const announcements = loadRealAnnouncements();
    const currentCity = getCurrentCity();
    const config = getCurrentStateConfig();
    
    let activeAnnouncements = announcements.filter(ad => ad.status === 'active');
    
    // Filtrar por cidade se uma cidade estiver selecionada
    if (currentCity) {
        // Primeiro, tentar encontrar no sistema de cidades do admin
        const adminCities = JSON.parse(localStorage.getItem('cities')) || [];
        const cityConfig = adminCities.find(city => 
            city.name.toLowerCase().replace(/\s+/g, '-') === currentCity
        );
        
        if (cityConfig) {
            activeAnnouncements = activeAnnouncements.filter(ad => 
                ad.city.toLowerCase().includes(cityConfig.name.toLowerCase())
            );
        } else {
            // Fallback para cidades do config.js
            const configCity = config.cities.find(city => city.id === currentCity);
            if (configCity) {
                activeAnnouncements = activeAnnouncements.filter(ad => 
                    ad.city.toLowerCase().includes(configCity.name.toLowerCase())
                );
            }
        }
    }
    
    console.log('Anúncios ativos encontrados:', activeAnnouncements.length);
    
    // Ordenar anúncios por categoria e plano
    const sortedAnnouncements = activeAnnouncements.sort((a, b) => {
        // Primeiro ordenar por categoria: mulher > homem > travesti > massagista
        const categoryOrder = { 'mulher': 4, 'homem': 3, 'travesti': 2, 'massagista': 1 };
        const aCategoryOrder = categoryOrder[a.category] || 0;
        const bCategoryOrder = categoryOrder[b.category] || 0;
        
        if (aCategoryOrder !== bCategoryOrder) {
            return bCategoryOrder - aCategoryOrder; // Ordem decrescente (mulher primeiro)
        }
        
        // Se mesma categoria, ordenar por plano (SUPERVIP > TOP > BÁSICO)
        const planOrder = { 'supervip': 3, 'top': 2, 'basic': 1 };
        const aOrder = planOrder[a.planType] || 1;
        const bOrder = planOrder[b.planType] || 1;
        return bOrder - aOrder;
    });
    
    console.log('Anúncios ordenados:', sortedAnnouncements.length);
    
    // Armazenar todos os anúncios ordenados para paginação
    allAnnouncements = sortedAnnouncements;
    
    const profilesGrid = document.getElementById('profilesGrid');
    if (!profilesGrid) {
        console.error('Elemento profilesGrid não encontrado!');
        return;
    }
    
    // Resetar paginação
    resetPagination();
    
    profilesGrid.innerHTML = '';
    
    // Carregar apenas a primeira página
    const firstPageAnnouncements = sortedAnnouncements.slice(0, announcementsPerPage);
    
    console.log('Primeira página:', firstPageAnnouncements.length, 'anúncios');
    
    firstPageAnnouncements.forEach(ad => {
        const card = createProfileCard(ad);
        profilesGrid.appendChild(card);
    });
    
    // Esconder botão se não há mais anúncios
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn && sortedAnnouncements.length <= announcementsPerPage) {
        loadMoreBtn.style.display = 'none';
    }
}

// Função para criar card de perfil regular
function createProfileCard(profile) {
    const card = document.createElement('div');
    
    // Aplicar classe baseada no plano
    if (profile.planType === 'supervip') {
        card.className = 'profile-card supervip-card';
    } else if (profile.planType === 'top') {
        card.className = 'profile-card top-card';
    } else {
        card.className = 'profile-card basic-card';
    }
    
    // Gerar estrelas baseado na avaliação
    const rating = profile.rating || 0;
    const stars = generateStars(rating);
    
    // Determinar badge do plano
    let planBadge = '';
    if (profile.planType === 'top' || profile.planType === 'supervip') {
        const planText = profile.planType === 'supervip' ? 'SUPERVIP' : 'TOP';
        const planClass = profile.planType === 'supervip' ? 'supervip' : 'top';
        planBadge = `<div class="plan-badge ${planClass}">${planText}</div>`;
    }
    
    // Badge de facilitação
    let facilitationBadge = '';
    if (profile.facilitation) {
        facilitationBadge = `<div class="facilitation-badge">Facilitação</div>`;
    }
    
    // Usar apenas o nome original do anúncio (sem sufixos de plano)
    const displayName = profile.name;
    
    // Criar bio breve
    const bioOptions = [
        'Promoção rapidinha',
        'Atendimento exclusivo',
        'Local próprio',
        'Muito carinhosa',
        'Experiência garantida',
        'Discreta e elegante'
    ];
    const randomBio = bioOptions[Math.floor(Math.random() * bioOptions.length)];
    
    card.innerHTML = `
        <div class="profile-image" style="cursor: pointer;" onclick="openProfilePage('${profile.id}')">
            ${planBadge}
            ${facilitationBadge}
            <img src="${getProfileImage(profile.planType)}" 
                 alt="Foto" 
                 oncontextmenu="return false;">
            <div class="watermark">DesejosMS</div>
        </div>
        <div class="profile-info">
            <div class="profile-name" style="cursor: pointer;" onclick="openProfilePage('${profile.id}')">${displayName}</div>
            <div class="profile-bio">${randomBio}</div>
            <div class="profile-location">
                <i class="fas fa-map-marker-alt"></i>
                ${profile.city}, MS
            </div>
            <div class="profile-services">
                <i class="fas fa-check-circle"></i>
                ${profile.services ? profile.services.slice(0, 2).join(', ') : 'Atendimento completo'}
            </div>
            <button class="whatsapp-btn" onclick="openWhatsApp('${profile.whatsapp || profile.phone}', '${displayName}')">
                <i class="fab fa-whatsapp"></i>
                WhatsApp
            </button>
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
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=250&fit=crop'
        ],
        'basic': [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=250&fit=crop',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=250&fit=crop'
        ]
    };
    
    const planImages = images[planType] || images.basic;
    return planImages[Math.floor(Math.random() * planImages.length)];
}

// Função para gerar estrelas
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
    
    // Abrir a página de perfil
    window.location.href = 'profile.html';
}

// Função para ligar
function callPhone(phone) {
    window.location.href = `tel:${phone}`;
}

// Função para abrir WhatsApp
function openWhatsApp(phone, name = '') {
    const message = `Olá ${name}! Vi seu anúncio no DesejosMS e gostaria de mais informações.`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Função para configurar event listeners
function setupEventListeners() {
    // Filtros de categoria
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe active de todos
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Adicionar classe active ao clicado
            this.classList.add('active');
            
            // Filtrar perfis
            const category = this.getAttribute('data-category');
            filterProfiles(category);
        });
    });
    
    // Busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterProfiles('all', searchTerm);
        });
    }
    
    // Filtro de cidade
    const citySelector = document.getElementById('citySelector');
    if (citySelector) {
        citySelector.addEventListener('change', function() {
            const selectedCity = this.value;
            console.log('Cidade selecionada:', selectedCity);
            // Obter categoria ativa atual
            const activeCategory = document.querySelector('.nav-item.active');
            const category = activeCategory ? activeCategory.getAttribute('data-category') : 'all';
            filterProfiles(category, '', selectedCity);
        });
    }
    
    // Botão carregar mais
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            loadMoreAnnouncements();
        });
    }
}

// Função para filtrar perfis
function filterProfiles(category = 'all', searchTerm = '', city = '') {
    const announcements = loadRealAnnouncements();
    
    console.log('Filtrando anúncios - Categoria:', category, 'Cidade:', city);
    console.log('Total de anúncios:', announcements.length);
    console.log('Anúncios por categoria:', {
        mulher: announcements.filter(ad => ad.category === 'mulher').length,
        homem: announcements.filter(ad => ad.category === 'homem').length,
        travesti: announcements.filter(ad => ad.category === 'travesti').length,
        massagista: announcements.filter(ad => ad.category === 'massagista').length
    });
    
    // Mostrar detalhes dos anúncios de massagista
    const massagistaAds = announcements.filter(ad => ad.category === 'massagista');
    if (massagistaAds.length > 0) {
        console.log('Anúncios de massagista encontrados:', massagistaAds.map(ad => ({
            name: ad.name,
            city: ad.city,
            status: ad.status
        })));
    }
    
    let filtered = announcements.filter(ad => {
        console.log(`Verificando anúncio: ${ad.name} - Categoria: ${ad.category} - Status: ${ad.status}`);
        
        // Filtro por categoria
        if (category !== 'all' && ad.category !== category) {
            console.log(`Anúncio ${ad.name} rejeitado: categoria ${ad.category} não corresponde a ${category}`);
            return false;
        }
        
        // Filtro por busca
        if (searchTerm && !ad.name.toLowerCase().includes(searchTerm) && 
            !ad.description.toLowerCase().includes(searchTerm) &&
            !ad.city.toLowerCase().includes(searchTerm)) {
            console.log(`Anúncio ${ad.name} rejeitado: não corresponde ao termo de busca ${searchTerm}`);
            return false;
        }
        
        // Filtro por cidade
        if (city && !ad.city.toLowerCase().includes(city.toLowerCase())) {
            console.log(`Anúncio ${ad.name} rejeitado: cidade ${ad.city} não corresponde a ${city}`);
            return false;
        }
        
        // Filtro por facilitação
        if (window.facilitationFilterActive && !ad.facilitation) {
            console.log(`Anúncio ${ad.name} rejeitado: não tem facilitação`);
            return false;
        }
        
        console.log(`Anúncio ${ad.name} aceito`);
        return true;
    });
    
    // Ordenar anúncios: mais recentes primeiro, depois por categoria e plano
    filtered = filtered.sort((a, b) => {
        // Primeiro: ordenar por data de criação (mais recente primeiro)
        const aDate = new Date(a.createdAt || a.id || 0);
        const bDate = new Date(b.createdAt || b.id || 0);
        if (aDate.getTime() !== bDate.getTime()) {
            return bDate.getTime() - aDate.getTime(); // Mais recente primeiro
        }
        
        // Segundo: ordenar por categoria (mulher > homem > travesti > massagista)
        const categoryOrder = { 'mulher': 4, 'homem': 3, 'travesti': 2, 'massagista': 1 };
        const aOrder = categoryOrder[a.category] || 0;
        const bOrder = categoryOrder[b.category] || 0;
        
        if (aOrder !== bOrder) {
            return bOrder - aOrder; // Ordem decrescente (mulher primeiro)
        }
        
        // Terceiro: ordenar por plano (SUPERVIP > TOP > BÁSICO)
        const planOrder = { 'supervip': 3, 'top': 2, 'basic': 1 };
        const aPlanOrder = planOrder[a.planType] || 1;
        const bPlanOrder = planOrder[b.planType] || 1;
        return bPlanOrder - aPlanOrder;
    });
    
    console.log('Anúncios após filtros:', filtered.length);
    console.log('Anúncios filtrados:', filtered.map(ad => ({
        name: ad.name,
        category: ad.category,
        city: ad.city
    })));
    
    // Carregar anúncios filtrados
    loadFilteredAnnouncements(filtered);
}

// Função para carregar anúncios filtrados
function loadFilteredAnnouncements(announcements) {
    const profilesGrid = document.getElementById('profilesGrid');
    if (!profilesGrid) return;
    
    // Armazenar anúncios filtrados para paginação
    allAnnouncements = announcements;
    
    // Resetar paginação
    resetPagination();
    
    profilesGrid.innerHTML = '';
    
    // Carregar apenas a primeira página
    const firstPageAnnouncements = announcements.slice(0, announcementsPerPage);
    
    firstPageAnnouncements.forEach(ad => {
        const card = createProfileCard(ad);
        profilesGrid.appendChild(card);
    });
    
    // Esconder botão se não há mais anúncios
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn && announcements.length <= announcementsPerPage) {
        loadMoreBtn.style.display = 'none';
    }
}

// Função para carregar perfis
function loadProfiles() {
    // Carregar TOP anúncios
    loadTopAnnouncements();
    
    // Carregar anúncios regulares (mulheres por padrão)
    loadRegularAnnouncements();
    
    // Filtrar para mostrar todos os anúncios por padrão
    filterProfiles('all');
    
    // Atualizar estatísticas
    updateStatistics();
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar configuração do site
    initSiteConfig();
    

    
    // Carregar perfis
    loadProfiles();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Função temporária para corrigir anúncios (remover depois)
    window.fixAnnouncements = function() {
        console.log('Corrigindo anúncios...');
        localStorage.removeItem('announcements');
        loadProfiles();
        alert('Anúncios corrigidos! Recarregue a página.');
    };
    
    // Função para corrigir categorias dos anúncios
    window.fixCategories = function() {
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        console.log('=== CORRIGINDO CATEGORIAS ===');
        console.log('Anúncios antes da correção:', announcements.length);
        
        let fixedCount = 0;
        announcements.forEach(ad => {
            if (!ad.category || ad.category === undefined || ad.category === '') {
                ad.category = 'mulher'; // Categoria padrão
                fixedCount++;
                console.log(`Categoria corrigida para anúncio: ${ad.name}`);
            }
        });
        
        if (fixedCount > 0) {
            localStorage.setItem('announcements', JSON.stringify(announcements));
            console.log(`${fixedCount} anúncios corrigidos`);
            alert(`${fixedCount} anúncios tiveram suas categorias corrigidas!`);
            loadProfiles(); // Recarregar
        } else {
            console.log('Nenhum anúncio precisou de correção');
            alert('Todos os anúncios já têm categorias válidas!');
        }
    };
    
    // Função para verificar anúncio específico
    window.checkAnnouncement = function() {
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        console.log('=== VERIFICAÇÃO DE ANÚNCIOS ===');
        console.log('Total de anúncios:', announcements.length);
        
        announcements.forEach((ad, index) => {
            console.log(`Anúncio ${index + 1}:`, {
                id: ad.id,
                name: ad.name,
                category: ad.category,
                city: ad.city,
                status: ad.status,
                planType: ad.planType
            });
        });
        
        const massagistaAds = announcements.filter(ad => ad.category === 'massagista');
        console.log('Anúncios de massagista:', massagistaAds);
        
        const pontaPoraAds = announcements.filter(ad => ad.city.toLowerCase().includes('ponta'));
        console.log('Anúncios de Ponta Porã:', pontaPoraAds);
    };
    
    // Função para verificar categorias
    window.checkCategories = function() {
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        console.log('=== VERIFICAÇÃO DE CATEGORIAS ===');
        
        const categories = {
            mulher: announcements.filter(ad => ad.category === 'mulher'),
            homem: announcements.filter(ad => ad.category === 'homem'),
            travesti: announcements.filter(ad => ad.category === 'travesti'),
            massagista: announcements.filter(ad => ad.category === 'massagista'),
            undefined: announcements.filter(ad => !ad.category || ad.category === undefined)
        };
        
        console.log('Anúncios por categoria:');
        Object.keys(categories).forEach(category => {
            console.log(`${category}: ${categories[category].length} anúncios`);
            if (categories[category].length > 0) {
                console.log('Detalhes:', categories[category].map(ad => ({
                    name: ad.name,
                    city: ad.city,
                    status: ad.status
                })));
            }
        });
        
        // Verificar filtros ativos
        const currentCategory = document.querySelector('.category-filter.active')?.getAttribute('data-category') || 'all';
        const currentCity = document.getElementById('citySelector')?.value || '';
        console.log('Filtros ativos:', { category: currentCategory, city: currentCity });
    };
    
    // Variável global para controle do filtro de facilitação
    window.facilitationFilterActive = false;
    
    // Função para alternar filtro de facilitação
    window.toggleFacilitationFilter = function() {
        window.facilitationFilterActive = !window.facilitationFilterActive;
        
        const filterBtn = document.getElementById('facilitationFilter');
        const filterText = document.getElementById('facilitationText');
        
        if (window.facilitationFilterActive) {
            filterBtn.classList.add('active');
            filterText.textContent = 'Facilitação ✓';
        } else {
            filterBtn.classList.remove('active');
            filterText.textContent = 'Facilitação';
        }
        
        // Recarregar filtros com facilitação
        const activeCategory = document.querySelector('.nav-item.active');
        const category = activeCategory ? activeCategory.getAttribute('data-category') : 'all';
        const citySelector = document.getElementById('citySelector');
        const selectedCity = citySelector ? citySelector.value : '';
        
        filterProfiles(category, '', selectedCity);
    };
});

// Bloquear botão direito em todas as imagens
document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
    }
});

// Modal styles removed - using individual pages now

// Função para carregar mais anúncios
function loadMoreAnnouncements() {
    currentPage++;
    
    const startIndex = currentPage * announcementsPerPage;
    const endIndex = startIndex + announcementsPerPage;
    const nextAnnouncements = allAnnouncements.slice(startIndex, endIndex);
    
    const profilesGrid = document.getElementById('profilesGrid');
    
    nextAnnouncements.forEach(ad => {
        const card = createProfileCard(ad);
        profilesGrid.appendChild(card);
    });
    
    // Verificar se ainda há mais anúncios para carregar
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (endIndex >= allAnnouncements.length) {
        loadMoreBtn.style.display = 'none';
    }
}

// Função para atualizar estatísticas
function updateStatistics() {
    const currentCity = getCurrentCity();
    const stats = getCityStatistics(currentCity);
    
    // Atualizar elementos na página
    const activeAdsElement = document.getElementById('activeAdsCount');
    const activeUsersElement = document.getElementById('activeUsersCount');
    const verifiedElement = document.getElementById('verifiedPercentage');
    
    if (activeAdsElement) activeAdsElement.textContent = stats.activeAds;
    if (activeUsersElement) activeUsersElement.textContent = stats.activeUsers;
    if (verifiedElement) verifiedElement.textContent = stats.verifiedPercentage;
}

// Função para resetar paginação
function resetPagination() {
    currentPage = 0;
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'block';
    }
} 