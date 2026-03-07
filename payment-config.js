// Configuração de Pagamentos - DesejosMS

// Variáveis globais
let paymentGateways = [];
let paymentMethods = [];
let pricingPlans = [];
let transactions = [];
let editingPlanId = null; // id do plano em modo edição

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadPaymentData();
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

// Carregar dados de pagamento
function loadPaymentData() {
    // Carregar gateways
    const storedGateways = JSON.parse(localStorage.getItem('paymentGateways')) || [];
    if (storedGateways.length === 0) {
        paymentGateways = createSampleGateways();
        localStorage.setItem('paymentGateways', JSON.stringify(paymentGateways));
    } else {
        paymentGateways = storedGateways;
    }
    
    // Carregar métodos
    const storedMethods = JSON.parse(localStorage.getItem('paymentMethods')) || [];
    if (storedMethods.length === 0) {
        paymentMethods = createSampleMethods();
        localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
    } else {
        paymentMethods = storedMethods;
    }
    
    // Carregar planos
    const storedPlans = JSON.parse(localStorage.getItem('pricingPlans')) || [];
    if (storedPlans.length === 0) {
        pricingPlans = createSamplePlans();
        localStorage.setItem('pricingPlans', JSON.stringify(pricingPlans));
    } else {
        pricingPlans = storedPlans;
    }

    // Garantir presença dos 3 planos padrão e normalizar ordem
    ensureDefaultPlansPresence();
    
    // Carregar transações
    const storedTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    if (storedTransactions.length === 0) {
        transactions = createSampleTransactions();
        localStorage.setItem('transactions', JSON.stringify(transactions));
    } else {
        transactions = storedTransactions;
    }
    
    renderAllData();
    updateStats();
}

// Garante que Básico, Top e SuperVIP existam e insere os que faltarem
function ensureDefaultPlansPresence() {
    const required = [
        { type: 'basic', name: 'Plano Básico', price: 149.90, duration: 30 },
        { type: 'top', name: 'Plano Top', price: 249.90, duration: 30 },
        { type: 'supervip', name: 'Plano SuperVIP', price: 399.90, duration: 30 }
    ];

    let changed = false;
    required.forEach(req => {
        const exists = pricingPlans.find(p => p.type === req.type);
        if (!exists) {
            pricingPlans.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                name: req.name,
                type: req.type,
                price: req.price,
                duration: req.duration,
                description: req.name,
                features: [],
                status: 'active',
                createdAt: new Date().toISOString()
            });
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem('pricingPlans', JSON.stringify(pricingPlans));
    }
}

// Criar gateways de exemplo
function createSampleGateways() {
    return [
        {
            id: 1,
            type: 'mercadopago',
            name: 'Mercado Pago',
            publicKey: 'pk_test_123456789',
            secretKey: 'sk_test_987654321',
            webhook: 'https://desejosms.com/webhook/mercadopago',
            environment: 'sandbox',
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            type: 'pix',
            name: 'PIX Banco Central',
            publicKey: 'pix_key_123',
            secretKey: 'pix_secret_456',
            webhook: 'https://desejosms.com/webhook/pix',
            environment: 'production',
            status: 'active',
            createdAt: new Date().toISOString()
        }
    ];
}

// Criar métodos de exemplo
function createSampleMethods() {
    return [
        {
            id: 1,
            type: 'credit_card',
            name: 'Cartão de Crédito',
            description: 'Aceita todos os principais cartões',
            fee: 2.99,
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            type: 'pix',
            name: 'PIX',
            description: 'Pagamento instantâneo via PIX',
            fee: 0.00,
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            type: 'boleto',
            name: 'Boleto Bancário',
            description: 'Pagamento via boleto com vencimento em 3 dias',
            fee: 3.49,
            status: 'active',
            createdAt: new Date().toISOString()
        }
    ];
}

// Criar planos de exemplo
function createSamplePlans() {
    return [
        {
            id: 1,
            name: 'Plano Básico',
            type: 'basic',
            price: 149.90,
            duration: 30,
            description: 'Anúncio básico com funcionalidades essenciais',
            features: ['Anúncio visível', 'Contatos diretos', 'Suporte básico'],
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Plano Top',
            type: 'top',
            price: 249.90,
            duration: 30,
            description: 'Destaque especial com mais visualizações',
            features: ['Destaque na página', 'Mais visualizações', 'Suporte prioritário', 'Estatísticas avançadas'],
            status: 'active',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            name: 'Plano SuperVIP',
            type: 'supervip',
            price: 399.90,
            duration: 30,
            description: 'Máximo destaque e funcionalidades premium',
            features: ['Destaque máximo', 'Visualizações ilimitadas', 'Suporte VIP', 'Relatórios completos', 'Chat integrado'],
            status: 'active',
            createdAt: new Date().toISOString()
        }
    ];
}

// Criar transações de exemplo
function createSampleTransactions() {
    return [
        {
            id: 1,
            userId: 1,
            userName: 'Maria Silva',
            userEmail: 'maria@email.com',
            plan: 'basic',
            amount: 149.90,
            gateway: 'Mercado Pago',
            method: 'Cartão de Crédito',
            status: 'completed',
            transactionId: 'MP123456789',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        },
        {
            id: 2,
            userId: 2,
            userName: 'Ana Costa',
            userEmail: 'ana@email.com',
            plan: 'top',
            amount: 249.90,
            gateway: 'PIX',
            method: 'PIX',
            status: 'completed',
            transactionId: 'PIX987654321',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        },
        {
            id: 3,
            userId: 3,
            userName: 'Joana Santos',
            userEmail: 'joana@email.com',
            plan: 'supervip',
            amount: 399.90,
            gateway: 'Mercado Pago',
            method: 'Boleto',
            status: 'pending',
            transactionId: 'MP456789123',
            createdAt: new Date().toISOString()
        }
    ];
}

// Renderizar todos os dados
function renderAllData() {
    renderGateways();
    renderMethods();
    renderPlans();
    renderTransactions();
    syncPlansWithSystem(); // Sincronizar com todo o sistema
}

// Renderizar gateways
function renderGateways() {
    const grid = document.getElementById('gatewaysGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    paymentGateways.forEach(gateway => {
        const card = document.createElement('div');
        card.className = 'gateway-card';
        
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${gateway.name}</div>
                    <div class="card-subtitle">${getGatewayTypeName(gateway.type)}</div>
                </div>
                <span class="card-status status-${gateway.status}">${gateway.status}</span>
            </div>
            
            <div class="card-content">
                <div class="card-info">
                    <span class="card-label">Ambiente:</span>
                    <span class="card-value">${gateway.environment}</span>
                </div>
                <div class="card-info">
                    <span class="card-label">Chave Pública:</span>
                    <span class="card-value">${gateway.publicKey.substring(0, 10)}...</span>
                </div>
                <div class="card-info">
                    <span class="card-label">Webhook:</span>
                    <span class="card-value">${gateway.webhook ? 'Configurado' : 'Não configurado'}</span>
                </div>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editGateway(${gateway.id})">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn btn-danger" onclick="deleteGateway(${gateway.id})">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Renderizar métodos
function renderMethods() {
    const grid = document.getElementById('methodsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    paymentMethods.forEach(method => {
        const card = document.createElement('div');
        card.className = 'method-card';
        
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${method.name}</div>
                    <div class="card-subtitle">${getMethodTypeName(method.type)}</div>
                </div>
                <span class="card-status status-${method.status}">${method.status}</span>
            </div>
            
            <div class="card-content">
                <div class="card-info">
                    <span class="card-label">Descrição:</span>
                    <span class="card-value">${method.description}</span>
                </div>
                <div class="card-info">
                    <span class="card-label">Taxa:</span>
                    <span class="card-value">${method.fee}%</span>
                </div>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editMethod(${method.id})">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn btn-danger" onclick="deleteMethod(${method.id})">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Renderizar planos
function renderPlans() {
    const grid = document.getElementById('pricingGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Ordenar na sequência: basic, top, supervip
    const order = { basic: 1, top: 2, supervip: 3 };
    const sorted = [...pricingPlans].sort((a,b) => (order[a.type]||99) - (order[b.type]||99));
    sorted.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'plan-card';
        
        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-title">${plan.name}</div>
                    <div class="card-subtitle">${getPlanTypeName(plan.type)}</div>
                </div>
                <span class="card-status status-${plan.status}">${plan.status}</span>
            </div>
            
            <div class="card-content">
                <div class="card-info">
                    <span class="card-label">Preço:</span>
                    <span class="card-value">R$ ${plan.price.toFixed(2)}</span>
                </div>
                <div class="card-info">
                    <span class="card-label">Duração:</span>
                    <span class="card-value">${plan.duration} dias</span>
                </div>
                <div class="card-info">
                    <span class="card-label">Recursos:</span>
                    <span class="card-value">${plan.features.length} recursos</span>
                </div>
                <div class="plan-description" style="margin-top:8px; color:#adb5bd; font-size:12px;">${getPlanBusinessDescription(plan.type)}</div>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editPlan(${plan.id})">
                    <i class="fas fa-edit"></i>
                    Editar
                </button>
                <button class="btn ${plan.status==='active'?'btn-danger':'btn-success'}" onclick="togglePlanStatus(${plan.id})">
                    <i class="fas ${plan.status==='active'?'fa-ban':'fa-check'}"></i>
                    ${plan.status==='active'?'Desativar':'Ativar'}
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Descrição de negócio dos planos (visível somente em Config. Pagamentos)
function getPlanBusinessDescription(type){
    const map = {
        basic: 'Exibido após TOP e SUPERVIP. Sem destaque. Permite editar anúncio.',
        top: 'Exibido após SUPERVIP e antes do Básico. Destaque rosa. Edita, pausar/reativar.',
        supervip: 'Topo da lista. Card maior. Destaque ouro. Aparece nas páginas das concorrentes. Edita, pausar/reativar.'
    };
    return map[type] || '';
}

// Renderizar transações
function renderTransactions() {
    const table = document.getElementById('transactionsTable');
    if (!table) return;
    
    table.innerHTML = `
        <div class="table-header">
            <div>Usuário</div>
            <div>Plano</div>
            <div>Valor</div>
            <div>Gateway</div>
            <div>Método</div>
            <div>Status</div>
        </div>
    `;
    
    transactions.forEach(transaction => {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        row.innerHTML = `
            <div class="table-cell" data-label="Usuário">
                <div>
                    <div>${transaction.userName}</div>
                    <small>${transaction.userEmail}</small>
                </div>
            </div>
            <div class="table-cell" data-label="Plano">
                <span class="card-status status-${transaction.plan}">${getPlanTypeName(transaction.plan)}</span>
            </div>
            <div class="table-cell" data-label="Valor">
                R$ ${transaction.amount.toFixed(2)}
            </div>
            <div class="table-cell" data-label="Gateway">
                ${transaction.gateway}
            </div>
            <div class="table-cell" data-label="Método">
                ${transaction.method}
            </div>
            <div class="table-cell" data-label="Status">
                <span class="transaction-status status-${transaction.status}">${getStatusName(transaction.status)}</span>
            </div>
        `;
        
        table.appendChild(row);
    });
}

// Atualizar estatísticas
function updateStats() {
    const activeGateways = paymentGateways.filter(g => g.status === 'active').length;
    const totalTransactions = transactions.length;
    const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
    
    document.getElementById('activeGateways').textContent = activeGateways;
    document.getElementById('totalTransactions').textContent = totalTransactions;
    document.getElementById('totalRevenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
}

// Funções auxiliares
function getGatewayTypeName(type) {
    const types = {
        'mercadopago': 'Mercado Pago',
        'stripe': 'Stripe',
        'paypal': 'PayPal',
        'pix': 'PIX',
        'pagseguro': 'PagSeguro',
        'custom': 'Personalizado'
    };
    return types[type] || type;
}

function getMethodTypeName(type) {
    const types = {
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito',
        'pix': 'PIX',
        'boleto': 'Boleto',
        'bank_transfer': 'Transferência',
        'crypto': 'Criptomoedas'
    };
    return types[type] || type;
}

function getPlanTypeName(type) {
    const types = {
        'basic': 'Básico',
        'top': 'Top',
        'supervip': 'SuperVIP',
        'custom': 'Personalizado'
    };
    return types[type] || type;
}

function getStatusName(status) {
    const statuses = {
        'completed': 'Concluído',
        'pending': 'Pendente',
        'failed': 'Falhou',
        'cancelled': 'Cancelado'
    };
    return statuses[status] || status;
}

// Funções de modal
function showAddGatewayModal() {
    document.getElementById('addGatewayModal').classList.add('active');
}

function showAddMethodModal() {
    document.getElementById('addMethodModal').classList.add('active');
}

function showAddPlanModal() {
    // Modo adicionar: limpar formulário e id de edição
    editingPlanId = null;
    resetPlanModal();
    document.getElementById('addPlanModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (modalId === 'addPlanModal') {
        editingPlanId = null;
    }
}

// Salvar gateway
function saveGateway() {
    const type = document.getElementById('gatewayType').value;
    const name = document.getElementById('gatewayName').value;
    const publicKey = document.getElementById('gatewayPublicKey').value;
    const secretKey = document.getElementById('gatewaySecretKey').value;
    const webhook = document.getElementById('gatewayWebhook').value;
    const environment = document.getElementById('gatewayEnvironment').value;
    const status = document.getElementById('gatewayStatus').value;
    
    if (!type || !name || !publicKey || !secretKey) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const gateway = {
        id: Date.now(),
        type,
        name,
        publicKey,
        secretKey,
        webhook,
        environment,
        status,
        createdAt: new Date().toISOString()
    };
    
    paymentGateways.push(gateway);
    localStorage.setItem('paymentGateways', JSON.stringify(paymentGateways));
    
    renderGateways();
    updateStats();
    closeModal('addGatewayModal');
    
    // Limpar formulário
    document.getElementById('gatewayType').value = '';
    document.getElementById('gatewayName').value = '';
    document.getElementById('gatewayPublicKey').value = '';
    document.getElementById('gatewaySecretKey').value = '';
    document.getElementById('gatewayWebhook').value = '';
}

// Salvar método
function savePaymentMethod() {
    const type = document.getElementById('methodType').value;
    const name = document.getElementById('methodName').value;
    const description = document.getElementById('methodDescription').value;
    const fee = parseFloat(document.getElementById('methodFee').value) || 0;
    const status = document.getElementById('methodStatus').value;
    
    if (!type || !name) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const method = {
        id: Date.now(),
        type,
        name,
        description,
        fee,
        status,
        createdAt: new Date().toISOString()
    };
    
    paymentMethods.push(method);
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
    
    renderMethods();
    updateStats();
    closeModal('addMethodModal');
    
    // Limpar formulário
    document.getElementById('methodType').value = '';
    document.getElementById('methodName').value = '';
    document.getElementById('methodDescription').value = '';
    document.getElementById('methodFee').value = '';
}

// Salvar plano
function savePricingPlan() {
    const name = document.getElementById('planName').value;
    const type = document.getElementById('planType').value;
    const price = parseFloat(document.getElementById('planPrice').value);
    const duration = parseInt(document.getElementById('planDuration').value);
    const description = document.getElementById('planDescription').value;
    const status = document.getElementById('planStatus').value;
    
    if (!name || !type || !price || !duration) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Coletar recursos
    const features = [];
    document.querySelectorAll('.feature-input').forEach(input => {
        if (input.value.trim()) {
            features.push(input.value.trim());
        }
    });
    
    if (editingPlanId) {
        // Atualizar plano existente
        const idx = pricingPlans.findIndex(p => p.id === editingPlanId);
        if (idx !== -1) {
            pricingPlans[idx] = {
                ...pricingPlans[idx],
                name,
                type,
                price,
                duration,
                description,
                features,
                status
            };
        }
    } else {
        // Criar novo plano
        const plan = {
            id: Date.now(),
            name,
            type,
            price,
            duration,
            description,
            features,
            status,
            createdAt: new Date().toISOString()
        };
        pricingPlans.push(plan);
    }
    localStorage.setItem('pricingPlans', JSON.stringify(pricingPlans));
    
    renderPlans();
    updateStats();
    syncPlansWithSystem(); // Sincronizar com todo o sistema
    closeModal('addPlanModal');
    
    // Limpar formulário
    resetPlanModal();
}

// Funções de recursos
function addFeature() {
    const featuresList = document.getElementById('planFeatures');
    const featureItem = document.createElement('div');
    featureItem.className = 'feature-item';
    featureItem.innerHTML = `
        <input type="text" placeholder="Novo recurso" class="feature-input">
        <button type="button" class="remove-feature" onclick="removeFeature(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    featuresList.appendChild(featureItem);
}

function removeFeature(button) {
    button.parentElement.remove();
}

// Abrir modal em modo edição e preencher com dados do plano
function editPlan(id) {
    const plan = pricingPlans.find(p => p.id === id);
    if (!plan) return;
    editingPlanId = id;
    // Preencher formulário
    document.getElementById('planName').value = plan.name || '';
    document.getElementById('planType').value = plan.type || '';
    document.getElementById('planPrice').value = plan.price != null ? plan.price : '';
    document.getElementById('planDuration').value = plan.duration || 30;
    document.getElementById('planDescription').value = plan.description || '';
    document.getElementById('planStatus').value = plan.status || 'active';
    // Recursos
    const featuresList = document.getElementById('planFeatures');
    featuresList.innerHTML = '';
    (plan.features || []).forEach(f => {
        const featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        featureItem.innerHTML = `
            <input type="text" value="${f}" class="feature-input">
            <button type="button" class="remove-feature" onclick="removeFeature(this)">
                <i class="fas fa-times"></i>
            </button>`;
        featuresList.appendChild(featureItem);
    });
    if ((plan.features || []).length === 0) {
        addFeature();
    }
    document.getElementById('addPlanModal').classList.add('active');
}

// Limpa o formulário do modal de planos
function resetPlanModal() {
    document.getElementById('planName').value = '';
    document.getElementById('planType').value = '';
    document.getElementById('planPrice').value = '';
    document.getElementById('planDuration').value = '30';
    document.getElementById('planDescription').value = '';
    document.getElementById('planStatus').value = 'active';
    document.getElementById('planFeatures').innerHTML = `
        <div class="feature-item">
            <input type="text" placeholder="Recurso 1" class="feature-input">
            <button type="button" class="remove-feature" onclick="removeFeature(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
}

// Funções de exclusão
function deleteGateway(id) {
    if (confirm('Tem certeza que deseja excluir este gateway?')) {
        paymentGateways = paymentGateways.filter(g => g.id !== id);
        localStorage.setItem('paymentGateways', JSON.stringify(paymentGateways));
        renderGateways();
        updateStats();
    }
}

function deleteMethod(id) {
    if (confirm('Tem certeza que deseja excluir este método?')) {
        paymentMethods = paymentMethods.filter(m => m.id !== id);
        localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
        renderMethods();
        updateStats();
    }
}

function deletePlan(id) {
    // Descontinuado: remoção de plano não é mais permitida
    alert('Exclusão de plano desativada. Utilize o botão Ativar/Desativar.');
}

// Ativar/Desativar plano
function togglePlanStatus(id){
    const idx = pricingPlans.findIndex(p=>p.id===id);
    if (idx === -1) return;
    pricingPlans[idx].status = pricingPlans[idx].status === 'active' ? 'inactive' : 'active';
    localStorage.setItem('pricingPlans', JSON.stringify(pricingPlans));
    renderPlans();
    updateStats();
    syncPlansWithSystem();
    alert(`Plano ${pricingPlans[idx].name} ${pricingPlans[idx].status==='active'?'ativado':'desativado'}.`);
}

// Funções de exportação
function exportTransactions() {
    const csvContent = generateTransactionsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateTransactionsCSV() {
    const headers = ['ID', 'Usuário', 'Email', 'Plano', 'Valor', 'Gateway', 'Método', 'Status', 'Data'];
    const rows = transactions.map(t => [
        t.id,
        t.userName,
        t.userEmail,
        getPlanTypeName(t.plan),
        t.amount.toFixed(2),
        t.gateway,
        t.method,
        getStatusName(t.status),
        new Date(t.createdAt).toLocaleDateString('pt-BR')
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function refreshTransactions() {
    // Simular atualização de transações
    const newTransaction = {
        id: Date.now(),
        userId: Math.floor(Math.random() * 100) + 1,
        userName: `Usuário ${Math.floor(Math.random() * 100) + 1}`,
        userEmail: `user${Math.floor(Math.random() * 100) + 1}@email.com`,
        plan: ['basic', 'top', 'supervip'][Math.floor(Math.random() * 3)],
        amount: [149.90, 249.90, 399.90][Math.floor(Math.random() * 3)],
        gateway: ['Mercado Pago', 'PIX'][Math.floor(Math.random() * 2)],
        method: ['Cartão de Crédito', 'PIX', 'Boleto'][Math.floor(Math.random() * 3)],
        status: 'completed',
        transactionId: `TXN${Date.now()}`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
    };
    
    transactions.unshift(newTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    renderTransactions();
    updateStats();
    
    alert('Transações atualizadas com sucesso!');
}

// Atualizar campos do gateway baseado no tipo
function updateGatewayFields() {
    const type = document.getElementById('gatewayType').value;
    const publicKeyField = document.getElementById('gatewayPublicKey');
    const secretKeyField = document.getElementById('gatewaySecretKey');
    
    // Limpar campos
    publicKeyField.placeholder = '';
    secretKeyField.placeholder = '';
    
    // Definir placeholders baseado no tipo
    switch(type) {
        case 'mercadopago':
            publicKeyField.placeholder = 'pk_test_... ou pk_prod_...';
            secretKeyField.placeholder = 'sk_test_... ou sk_prod_...';
            break;
        case 'stripe':
            publicKeyField.placeholder = 'pk_test_... ou pk_live_...';
            secretKeyField.placeholder = 'sk_test_... ou sk_live_...';
            break;
        case 'pix':
            publicKeyField.placeholder = 'Chave PIX';
            secretKeyField.placeholder = 'Token de acesso';
            break;
        case 'pagseguro':
            publicKeyField.placeholder = 'email@exemplo.com';
            secretKeyField.placeholder = 'token_...';
            break;
        default:
            publicKeyField.placeholder = 'Chave pública';
            secretKeyField.placeholder = 'Chave secreta';
    }
}

// ===== FUNÇÕES DE SINCRONIZAÇÃO COM TODO O SISTEMA =====

// Sincronizar planos com todo o sistema
function syncPlansWithSystem() {
    console.log('=== SINCRONIZANDO PLANOS COM TODO O SISTEMA ===');
    
    // 1. Sincronizar com localStorage principal
    const planPrices = {};
    pricingPlans.forEach(plan => {
        planPrices[plan.type] = plan.price;
    });
    
    localStorage.setItem('planPrices', JSON.stringify(planPrices));
    console.log('Planos sincronizados com localStorage:', planPrices);
    
    // 2. Sincronizar com config.js
    syncPlansWithConfig();
    
    // 3. Sincronizar com painel do anunciante
    syncPlansWithAdvertiserPanel();
    
    // 4. Sincronizar com sistema de anúncios
    syncPlansWithAnnouncements();
    
    console.log('✅ Sincronização completa!');
}

// Sincronizar com config.js
function syncPlansWithConfig() {
    // Atualizar configurações globais se existirem
    if (typeof window.siteConfig !== 'undefined') {
        // Atualizar preços nos estados
        Object.keys(window.siteConfig.states).forEach(state => {
            if (window.siteConfig.states[state].plans) {
                pricingPlans.forEach(plan => {
                    if (window.siteConfig.states[state].plans[plan.type]) {
                        window.siteConfig.states[state].plans[plan.type].price = plan.price;
                    }
                });
            }
        });
    }
}

// Sincronizar com painel do anunciante
function syncPlansWithAdvertiserPanel() {
    // Atualizar dados que podem estar sendo usados no painel do anunciante
    const advertiserData = {
        plans: pricingPlans.filter(p=>p.status==='active'),
        lastUpdate: new Date().toISOString()
    };
    
    localStorage.setItem('advertiserPlans', JSON.stringify(advertiserData));
}

// Sincronizar com sistema de anúncios
function syncPlansWithAnnouncements() {
    // Atualizar anúncios existentes com novos preços se necessário
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    
    announcements.forEach(announcement => {
        if (announcement.planType) {
            const plan = pricingPlans.find(p => p.type === announcement.planType);
            if (plan) {
                announcement.paidAmount = plan.price;
            }
        }
    });
    
    localStorage.setItem('announcements', JSON.stringify(announcements));
}

// Função para obter preço do plano (usada por outros sistemas)
function getPlanPrice(planType) {
    const plan = pricingPlans.find(p => p.type === planType);
    return plan ? plan.price : 0;
}

// Função para obter detalhes do plano (usada por outros sistemas)
function getPlanDetails(planType) {
    const plan = pricingPlans.find(p => p.type === planType);
    return plan || null;
}

// Função para listar todos os planos (usada por outros sistemas)
function getAllPlans() {
    return pricingPlans.filter(p => p.status === 'active');
}
