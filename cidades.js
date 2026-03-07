// Variáveis globais
let cities = [];
let filteredCities = [];
let selectedCity = null;
let importData = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadCities();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Fechar modais ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Função para carregar cidades
function loadCities() {
    // Carregar cidades do localStorage ou criar dados de exemplo
    const storedCities = JSON.parse(localStorage.getItem('cities')) || [];
    
    if (storedCities.length === 0) {
        // Criar dados de exemplo
        cities = createSampleCities();
        localStorage.setItem('cities', JSON.stringify(cities));
    } else {
        cities = storedCities;
    }
    
    filteredCities = [...cities];
    renderCities();
    updateStats();
}

// Função para criar cidades de exemplo
function createSampleCities() {
    return [
        {
            id: 1,
            name: "Campo Grande",
            state: "MS",
            status: "active",
            basePrice: 149.90,
            deliveryFee: 0.00,
            launchDate: "2024-01-01",
            description: "Capital do Mato Grosso do Sul - Cobertura completa",
            userCount: 1250,
            createdAt: "2024-01-01T00:00:00"
        },
        {
            id: 2,
            name: "São Paulo",
            state: "SP",
            status: "active",
            basePrice: 199.90,
            deliveryFee: 15.00,
            launchDate: "2024-01-15",
            description: "Capital de São Paulo - Área metropolitana",
            userCount: 3420,
            createdAt: "2024-01-15T00:00:00"
        },
        {
            id: 3,
            name: "Rio de Janeiro",
            state: "RJ",
            status: "active",
            basePrice: 189.90,
            deliveryFee: 12.00,
            launchDate: "2024-02-01",
            description: "Capital do Rio de Janeiro - Zona Sul e Centro",
            userCount: 2180,
            createdAt: "2024-02-01T00:00:00"
        },
        {
            id: 4,
            name: "Belo Horizonte",
            state: "MG",
            status: "coming_soon",
            basePrice: 169.90,
            deliveryFee: 8.00,
            launchDate: "2024-03-15",
            description: "Capital de Minas Gerais - Em breve",
            userCount: 0,
            createdAt: "2024-02-15T00:00:00"
        },
        {
            id: 5,
            name: "Curitiba",
            state: "PR",
            status: "inactive",
            basePrice: 159.90,
            deliveryFee: 10.00,
            launchDate: null,
            description: "Capital do Paraná - Temporariamente indisponível",
            userCount: 0,
            createdAt: "2024-01-20T00:00:00"
        }
    ];
}

// Função para renderizar cidades
function renderCities() {
    const grid = document.getElementById('citiesGrid');
    
    if (filteredCities.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Nenhuma cidade encontrada</h3>
                <p>Não há cidades que correspondam aos filtros aplicados.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    filteredCities.forEach(city => {
        const card = createCityCard(city);
        grid.appendChild(card);
    });
}

// Função para criar card de cidade
function createCityCard(city) {
    const card = document.createElement('div');
    card.className = 'city-card';
    card.onclick = () => openCityDetails(city);
    
    const statusText = {
        'active': 'Ativa',
        'inactive': 'Inativa',
        'coming_soon': 'Em Breve'
    };
    
    const stateNames = {
        'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
        'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal',
        'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão',
        'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
        'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco',
        'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
        'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima',
        'SC': 'Santa Catarina', 'SP': 'São Paulo', 'SE': 'Sergipe',
        'TO': 'Tocantins'
    };
    
    card.innerHTML = `
        ${city.userCount > 0 ? `<div class="user-badge">${city.userCount}</div>` : ''}
        
        <div class="city-header">
            <div class="city-info">
                <div class="city-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="city-details">
                    <h3>${city.name}</h3>
                    <p>${stateNames[city.state]}</p>
                </div>
            </div>
            <span class="city-status ${city.status}">${statusText[city.status]}</span>
        </div>
        
        <div class="city-info-details">
            <div class="info-item">
                <span class="info-label">Preço Base:</span>
                <span class="info-value">R$ ${city.basePrice.toFixed(2)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Taxa de Entrega:</span>
                <span class="info-value">R$ ${city.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Usuários:</span>
                <span class="info-value">${city.userCount}</span>
            </div>
            ${city.launchDate ? `
                <div class="info-item">
                    <span class="info-label">Lançamento:</span>
                    <span class="info-value">${new Date(city.launchDate).toLocaleDateString('pt-BR')}</span>
                </div>
            ` : ''}
        </div>
        
        <div class="city-actions">
            <button class="btn btn-primary" onclick="event.stopPropagation(); editCity(${city.id})">
                <i class="fas fa-edit"></i>
                Editar
            </button>
            <button class="btn btn-success" onclick="event.stopPropagation(); viewUsers(${city.id})">
                <i class="fas fa-users"></i>
                Usuários
            </button>
        </div>
    `;
    
    return card;
}

// Função para abrir detalhes da cidade
function openCityDetails(city) {
    selectedCity = city;
    
    const modal = document.getElementById('cityModal');
    const details = document.getElementById('cityDetails');
    
    const statusText = {
        'active': 'Ativa',
        'inactive': 'Inativa',
        'coming_soon': 'Em Breve'
    };
    
    const stateNames = {
        'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
        'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal',
        'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão',
        'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
        'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco',
        'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
        'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima',
        'SC': 'Santa Catarina', 'SP': 'São Paulo', 'SE': 'Sergipe',
        'TO': 'Tocantins'
    };
    
    details.innerHTML = `
        <div class="city-details-full">
            <div class="details-section">
                <h3>Informações da Cidade</h3>
                <div class="detail-row">
                    <span class="label">Nome:</span>
                    <span class="value">${city.name}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Estado:</span>
                    <span class="value">${stateNames[city.state]} (${city.state})</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">
                        <span class="city-status ${city.status}">${statusText[city.status]}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="label">Usuários Ativos:</span>
                    <span class="value">${city.userCount}</span>
                </div>
                ${city.launchDate ? `
                    <div class="detail-row">
                        <span class="label">Data de Lançamento:</span>
                        <span class="value">${new Date(city.launchDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="details-section">
                <h3>Configurações de Preço</h3>
                <div class="detail-row">
                    <span class="label">Preço Base:</span>
                    <span class="value">R$ ${city.basePrice.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Taxa de Entrega:</span>
                    <span class="value">R$ ${city.deliveryFee.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Preço Total:</span>
                    <span class="value">R$ ${(city.basePrice + city.deliveryFee).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Criado em:</span>
                    <span class="value">${new Date(city.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
            
            <div class="details-section" style="grid-column: 1 / -1;">
                <h3>Descrição</h3>
                <p style="color: #6c757d; line-height: 1.6;">${city.description}</p>
            </div>
        </div>
    `;
    
    // Mostrar/esconder botões baseado no status
    const activateBtn = document.getElementById('activateBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    
    if (city.status === 'active') {
        activateBtn.style.display = 'none';
        deactivateBtn.style.display = 'inline-flex';
    } else {
        activateBtn.style.display = 'inline-flex';
        deactivateBtn.style.display = 'none';
    }
    
    modal.classList.add('active');
}

// Função para editar cidade
function editCity(cityId) {
    const city = cities.find(c => c.id === cityId);
    if (!city) return;
    
    // Preencher formulário com dados da cidade
    document.getElementById('cityName').value = city.name;
    document.getElementById('cityState').value = city.state;
    document.getElementById('cityStatus').value = city.status;
    document.getElementById('cityLaunchDate').value = city.launchDate || '';
    document.getElementById('cityBasePrice').value = city.basePrice;
    document.getElementById('cityDeliveryFee').value = city.deliveryFee;
    document.getElementById('cityDescription').value = city.description;
    
    // Rolar para o formulário
    document.querySelector('.add-section').scrollIntoView({ behavior: 'smooth' });
    
    // Alterar texto do botão
    const addBtn = document.querySelector('.btn-primary');
    addBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Cidade';
    addBtn.onclick = () => updateCity(cityId);
}

// Função para atualizar cidade
function updateCity(cityId) {
    const city = cities.find(c => c.id === cityId);
    if (!city) return;
    
    const name = document.getElementById('cityName').value.trim();
    const state = document.getElementById('cityState').value;
    const status = document.getElementById('cityStatus').value;
    const launchDate = document.getElementById('cityLaunchDate').value || null;
    const basePrice = parseFloat(document.getElementById('cityBasePrice').value) || 0;
    const deliveryFee = parseFloat(document.getElementById('cityDeliveryFee').value) || 0;
    const description = document.getElementById('cityDescription').value.trim();
    
    // Validações
    if (!name || !state) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Atualizar cidade
    city.name = name;
    city.state = state;
    city.status = status;
    city.launchDate = launchDate;
    city.basePrice = basePrice;
    city.deliveryFee = deliveryFee;
    city.description = description;
    
    localStorage.setItem('cities', JSON.stringify(cities));
    
    // Limpar formulário e restaurar botão
    clearForm();
    
    // Atualizar interface
    loadCities();
    
    alert('Cidade atualizada com sucesso!');
}

// Função para visualizar usuários da cidade
function viewUsers(cityId) {
    const city = cities.find(c => c.id === cityId);
    if (!city) return;
    
    alert(`Cidade: ${city.name}\nUsuários ativos: ${city.userCount}\n\nFuncionalidade de visualização detalhada de usuários será implementada em breve.`);
}

// Função para adicionar cidade
function addCity() {
    const name = document.getElementById('cityName').value.trim();
    const state = document.getElementById('cityState').value;
    const status = document.getElementById('cityStatus').value;
    const launchDate = document.getElementById('cityLaunchDate').value || null;
    const basePrice = parseFloat(document.getElementById('cityBasePrice').value) || 0;
    const deliveryFee = parseFloat(document.getElementById('cityDeliveryFee').value) || 0;
    const description = document.getElementById('cityDescription').value.trim();
    
    // Validações
    if (!name || !state) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Verificar se cidade já existe
    if (cities.some(c => c.name.toLowerCase() === name.toLowerCase() && c.state === state)) {
        alert('Esta cidade já está cadastrada.');
        return;
    }
    
    const newCity = {
        id: Date.now(),
        name: name,
        state: state,
        status: status,
        basePrice: basePrice,
        deliveryFee: deliveryFee,
        launchDate: launchDate,
        description: description || `${name} - ${state}`,
        userCount: 0,
        createdAt: new Date().toISOString()
    };
    
    cities.push(newCity);
    localStorage.setItem('cities', JSON.stringify(cities));
    
    // Limpar formulário
    clearForm();
    
    // Atualizar interface
    loadCities();
    
    alert('Cidade adicionada com sucesso!');
}

// Função para limpar formulário
function clearForm() {
    document.getElementById('cityName').value = '';
    document.getElementById('cityState').value = '';
    document.getElementById('cityStatus').value = 'active';
    document.getElementById('cityLaunchDate').value = '';
    document.getElementById('cityBasePrice').value = '';
    document.getElementById('cityDeliveryFee').value = '';
    document.getElementById('cityDescription').value = '';
    
    // Restaurar botão original
    const addBtn = document.querySelector('.btn-primary');
    addBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Cidade';
    addBtn.onclick = addCity;
}

// Função para ativar cidade
function activateCity() {
    if (!selectedCity) return;
    
    selectedCity.status = 'active';
    localStorage.setItem('cities', JSON.stringify(cities));
    
    loadCities();
    closeModal('cityModal');
    
    alert('Cidade ativada com sucesso!');
}

// Função para desativar cidade
function deactivateCity() {
    if (!selectedCity) return;
    
    selectedCity.status = 'inactive';
    localStorage.setItem('cities', JSON.stringify(cities));
    
    loadCities();
    closeModal('cityModal');
    
    alert('Cidade desativada com sucesso!');
}

// Função para excluir cidade
function deleteCity() {
    if (!selectedCity) return;
    
    if (!confirm('Tem certeza que deseja excluir esta cidade? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    const index = cities.findIndex(c => c.id === selectedCity.id);
    if (index !== -1) {
        cities.splice(index, 1);
        localStorage.setItem('cities', JSON.stringify(cities));
        
        loadCities();
        closeModal('cityModal');
        
        alert('Cidade excluída com sucesso!');
    }
}

// Função para filtrar cidades
function filterCities() {
    const statusFilter = document.getElementById('statusFilter').value;
    const stateFilter = document.getElementById('stateFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredCities = cities.filter(city => {
        const statusMatch = statusFilter === 'all' || city.status === statusFilter;
        const stateMatch = stateFilter === 'all' || city.state === stateFilter;
        const searchMatch = city.name.toLowerCase().includes(searchTerm);
        
        return statusMatch && stateMatch && searchMatch;
    });
    
    renderCities();
}

// Função para buscar cidades
function searchCities() {
    filterCities();
}

// Função para atualizar estatísticas
function updateStats() {
    const totalCities = cities.length;
    const activeCities = cities.filter(c => c.status === 'active').length;
    const totalUsers = cities.reduce((sum, c) => sum + c.userCount, 0);
    
    document.getElementById('totalCities').textContent = totalCities;
    document.getElementById('activeCities').textContent = activeCities;
    document.getElementById('totalUsers').textContent = totalUsers;
}

// Função para exportar cidades
function exportCities() {
    const data = {
        exportDate: new Date().toISOString(),
        totalCities: cities.length,
        activeCities: cities.filter(c => c.status === 'active').length,
        totalUsers: cities.reduce((sum, c) => sum + c.userCount, 0),
        cities: cities
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `cidades_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('Relatório exportado com sucesso!');
}

// Função para importar cidades
function importCities() {
    const modal = document.getElementById('importModal');
    modal.classList.add('active');
}

// Função para lidar com seleção de arquivo
function handleFileSelect() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            importData = data.cities || data;
            
            // Mostrar preview
            const preview = document.getElementById('importPreview');
            const previewContent = document.getElementById('importPreviewContent');
            const confirmBtn = document.getElementById('confirmImportBtn');
            
            previewContent.innerHTML = `
                <p><strong>${importData.length}</strong> cidades encontradas:</p>
                <ul>
                    ${importData.slice(0, 5).map(city => `
                        <li>${city.name} - ${city.state}</li>
                    `).join('')}
                    ${importData.length > 5 ? `<li>... e mais ${importData.length - 5} cidades</li>` : ''}
                </ul>
            `;
            
            preview.style.display = 'block';
            confirmBtn.style.display = 'inline-flex';
            
        } catch (error) {
            alert('Erro ao ler arquivo. Certifique-se de que é um arquivo JSON válido.');
        }
    };
    
    reader.readAsText(file);
}

// Função para confirmar importação
function confirmImport() {
    if (!importData || !Array.isArray(importData)) {
        alert('Dados inválidos para importação.');
        return;
    }
    
    // Adicionar novas cidades (evitar duplicatas)
    let addedCount = 0;
    importData.forEach(importCity => {
        const exists = cities.some(city => 
            city.name.toLowerCase() === importCity.name.toLowerCase() && 
            city.state === importCity.state
        );
        
        if (!exists) {
            const newCity = {
                id: Date.now() + Math.random(),
                name: importCity.name,
                state: importCity.state,
                status: importCity.status || 'active',
                basePrice: importCity.basePrice || 149.90,
                deliveryFee: importCity.deliveryFee || 0,
                launchDate: importCity.launchDate || null,
                description: importCity.description || `${importCity.name} - ${importCity.state}`,
                userCount: importCity.userCount || 0,
                createdAt: new Date().toISOString()
            };
            
            cities.push(newCity);
            addedCount++;
        }
    });
    
    localStorage.setItem('cities', JSON.stringify(cities));
    loadCities();
    
    closeModal('importModal');
    alert(`${addedCount} cidades importadas com sucesso!`);
}

// Função para fechar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    
    // Limpar dados de importação
    if (modalId === 'importModal') {
        importData = null;
        document.getElementById('importFile').value = '';
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('confirmImportBtn').style.display = 'none';
    }
}


