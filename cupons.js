// Variáveis globais
let coupons = [];
let filteredCoupons = [];
let selectedCoupon = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadCoupons();
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

// Função para carregar cupons
function loadCoupons() {
    // Carregar cupons do localStorage ou criar dados de exemplo
    const storedCoupons = JSON.parse(localStorage.getItem('coupons')) || [];
    
    if (storedCoupons.length === 0) {
        // Criar dados de exemplo
        coupons = createSampleCoupons();
        localStorage.setItem('coupons', JSON.stringify(coupons));
    } else {
        coupons = storedCoupons;
    }
    
    filteredCoupons = [...coupons];
    renderCoupons();
    updateStats();
}

// Função para criar cupons de exemplo
function createSampleCoupons() {
    return [
        {
            id: 1,
            code: "DESCONTO30",
            discount: 30,
            days: 30,
            limit: 100,
            used: 45,
            plan: "all",
            minValue: 0,
            description: "30% de desconto em qualquer plano",
            status: "active",
            createdAt: "2024-01-01T00:00:00",
            expiresAt: "2024-02-01T00:00:00",
            usageHistory: [
                {
                    userId: 1,
                    userName: "Maria Silva",
                    userEmail: "maria@email.com",
                    usedAt: "2024-01-15T10:30:00",
                    originalPrice: 149.90,
                    discountAmount: 44.97,
                    finalPrice: 104.93,
                    plan: "basic"
                },
                {
                    userId: 2,
                    userName: "Ana Costa",
                    userEmail: "ana@email.com",
                    usedAt: "2024-01-18T14:20:00",
                    originalPrice: 249.90,
                    discountAmount: 74.97,
                    finalPrice: 174.93,
                    plan: "premium"
                }
            ]
        },
        {
            id: 2,
            code: "VIP50",
            discount: 50,
            days: 15,
            limit: 50,
            used: 50,
            plan: "vip",
            minValue: 200,
            description: "50% de desconto no plano VIP",
            status: "used",
            createdAt: "2024-01-05T00:00:00",
            expiresAt: "2024-01-20T00:00:00",
            usageHistory: [
                {
                    userId: 3,
                    userName: "Joana Santos",
                    userEmail: "joana@email.com",
                    usedAt: "2024-01-10T16:45:00",
                    originalPrice: 399.90,
                    discountAmount: 199.95,
                    finalPrice: 199.95,
                    plan: "vip"
                }
            ]
        },
        {
            id: 3,
            code: "TESTE7",
            discount: 20,
            days: 7,
            limit: null,
            used: 12,
            plan: "all",
            minValue: 0,
            description: "20% de desconto para teste",
            status: "expired",
            createdAt: "2024-01-10T00:00:00",
            expiresAt: "2024-01-17T00:00:00",
            usageHistory: []
        }
    ];
}

// Função para renderizar cupons
function renderCoupons() {
    const grid = document.getElementById('couponsGrid');
    
    if (filteredCoupons.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-ticket-alt"></i>
                <h3>Nenhum cupom encontrado</h3>
                <p>Não há cupons que correspondam aos filtros aplicados.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    filteredCoupons.forEach(coupon => {
        const card = createCouponCard(coupon);
        grid.appendChild(card);
    });
}

// Função para criar card de cupom
function createCouponCard(coupon) {
    const card = document.createElement('div');
    card.className = 'coupon-card';
    card.onclick = () => openCouponDetails(coupon);
    
    const createdDate = new Date(coupon.createdAt).toLocaleDateString('pt-BR');
    const expiresDate = new Date(coupon.expiresAt).toLocaleDateString('pt-BR');
    const isExpired = new Date() > new Date(coupon.expiresAt);
    const isUsed = coupon.limit && coupon.used >= coupon.limit;
    
    let status = 'active';
    if (isExpired) status = 'expired';
    else if (isUsed) status = 'used';
    
    const statusText = {
        'active': 'Ativo',
        'expired': 'Expirado',
        'used': 'Usado'
    };
    
    const planText = {
        'all': 'Todos os Planos',
        'basic': 'Apenas Básico',
        'premium': 'Apenas Premium',
        'vip': 'Apenas VIP'
    };
    
    card.innerHTML = `
        ${coupon.usageHistory.length > 0 ? `<div class="usage-badge">${coupon.usageHistory.length}</div>` : ''}
        
        <div class="coupon-header">
            <div class="coupon-code">${coupon.code}</div>
            <span class="coupon-status ${status}">${statusText[status]}</span>
        </div>
        
        <div class="coupon-details">
            <div class="detail-item">
                <span class="detail-label">Desconto:</span>
                <span class="detail-value">${coupon.discount}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Plano:</span>
                <span class="detail-value">${planText[coupon.plan]}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Usos:</span>
                <span class="detail-value">${coupon.used}${coupon.limit ? '/' + coupon.limit : ''}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Validade:</span>
                <span class="detail-value">${expiresDate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Valor Mínimo:</span>
                <span class="detail-value">${coupon.minValue > 0 ? 'R$ ' + coupon.minValue.toFixed(2) : 'Sem mínimo'}</span>
            </div>
        </div>
        
        <div class="coupon-actions">
            <button class="btn btn-primary" onclick="event.stopPropagation(); viewUsageHistory(${coupon.id})">
                <i class="fas fa-history"></i>
                Histórico
            </button>
            <button class="btn btn-success" onclick="event.stopPropagation(); copyCouponCode('${coupon.code}')">
                <i class="fas fa-copy"></i>
                Copiar
            </button>
            <button class="btn btn-danger" onclick="event.stopPropagation(); deleteCoupon(${coupon.id})">
                <i class="fas fa-trash"></i>
                Excluir
            </button>
        </div>
    `;
    
    return card;
}

// Função para abrir detalhes do cupom
function openCouponDetails(coupon) {
    selectedCoupon = coupon;
    
    const modal = document.getElementById('couponModal');
    const details = document.getElementById('couponDetails');
    
    const createdDate = new Date(coupon.createdAt).toLocaleDateString('pt-BR');
    const expiresDate = new Date(coupon.expiresAt).toLocaleDateString('pt-BR');
    const isExpired = new Date() > new Date(coupon.expiresAt);
    const isUsed = coupon.limit && coupon.used >= coupon.limit;
    
    let status = 'active';
    if (isExpired) status = 'expired';
    else if (isUsed) status = 'used';
    
    const statusText = {
        'active': 'Ativo',
        'expired': 'Expirado',
        'used': 'Usado'
    };
    
    const planText = {
        'all': 'Todos os Planos',
        'basic': 'Apenas Básico',
        'premium': 'Apenas Premium',
        'vip': 'Apenas VIP'
    };
    
    details.innerHTML = `
        <div class="coupon-details-full">
            <div class="details-section">
                <h3>Informações do Cupom</h3>
                <div class="detail-row">
                    <span class="label">Código:</span>
                    <span class="value">${coupon.code}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Desconto:</span>
                    <span class="value">${coupon.discount}%</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">
                        <span class="coupon-status ${status}">${statusText[status]}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="label">Plano:</span>
                    <span class="value">${planText[coupon.plan]}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Valor Mínimo:</span>
                    <span class="value">${coupon.minValue > 0 ? 'R$ ' + coupon.minValue.toFixed(2) : 'Sem mínimo'}</span>
                </div>
            </div>
            
            <div class="details-section">
                <h3>Estatísticas</h3>
                <div class="detail-row">
                    <span class="label">Usos:</span>
                    <span class="value">${coupon.used}${coupon.limit ? '/' + coupon.limit : ''}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Criado em:</span>
                    <span class="value">${createdDate}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Expira em:</span>
                    <span class="value">${expiresDate}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Dias de Validade:</span>
                    <span class="value">${coupon.days} dias</span>
                </div>
                <div class="detail-row">
                    <span class="label">Limite:</span>
                    <span class="value">${coupon.limit ? coupon.limit + ' usos' : 'Ilimitado'}</span>
                </div>
            </div>
            
            <div class="details-section">
                <h3>Descrição</h3>
                <p style="color: #6c757d; line-height: 1.6;">${coupon.description}</p>
            </div>
        </div>
    `;
    
    // Mostrar/esconder botões baseado no status
    const activateBtn = document.getElementById('activateBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    
    if (status === 'active') {
        activateBtn.style.display = 'none';
        deactivateBtn.style.display = 'inline-flex';
    } else {
        activateBtn.style.display = 'inline-flex';
        deactivateBtn.style.display = 'none';
    }
    
    modal.classList.add('active');
}

// Função para visualizar histórico de uso
function viewUsageHistory(couponId) {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return;
    
    const modal = document.getElementById('usageModal');
    const history = document.getElementById('usageHistory');
    
    if (coupon.usageHistory.length === 0) {
        history.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>Nenhum uso registrado</h3>
                <p>Este cupom ainda não foi utilizado.</p>
            </div>
        `;
    } else {
        history.innerHTML = `
            <div class="usage-section">
                <h3>Histórico de Uso - ${coupon.code}</h3>
                <div class="usage-list">
                    ${coupon.usageHistory.map(usage => `
                        <div class="usage-item">
                            <div class="usage-item-header">
                                <span class="usage-user">${usage.userName}</span>
                                <span class="usage-date">${new Date(usage.usedAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div class="usage-details">
                                <div class="usage-detail">
                                    <span class="label">Plano:</span>
                                    <span class="value">${usage.plan.toUpperCase()}</span>
                                </div>
                                <div class="usage-detail">
                                    <span class="label">Valor Original:</span>
                                    <span class="value">R$ ${usage.originalPrice.toFixed(2)}</span>
                                </div>
                                <div class="usage-detail">
                                    <span class="label">Desconto:</span>
                                    <span class="value">R$ ${usage.discountAmount.toFixed(2)}</span>
                                </div>
                                <div class="usage-detail">
                                    <span class="label">Valor Final:</span>
                                    <span class="value">R$ ${usage.finalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    modal.classList.add('active');
}

// Função para copiar código do cupom
function copyCouponCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert(`Código "${code}" copiado para a área de transferência!`);
    }).catch(() => {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Código "${code}" copiado para a área de transferência!`);
    });
}

// Função para criar cupom
function createCoupon() {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const discount = parseInt(document.getElementById('couponDiscount').value);
    const days = parseInt(document.getElementById('couponDays').value);
    const limit = document.getElementById('couponLimit').value ? parseInt(document.getElementById('couponLimit').value) : null;
    const plan = document.getElementById('couponPlan').value;
    const minValue = parseFloat(document.getElementById('couponMinValue').value) || 0;
    const description = document.getElementById('couponDescription').value.trim();
    
    // Validações
    if (!code || !discount || !days) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    if (code.length > 20) {
        alert('O código do cupom deve ter no máximo 20 caracteres.');
        return;
    }
    
    if (discount < 1 || discount > 100) {
        alert('O desconto deve estar entre 1% e 100%.');
        return;
    }
    
    if (days < 1 || days > 365) {
        alert('A validade deve estar entre 1 e 365 dias.');
        return;
    }
    
    // Verificar se código já existe
    if (coupons.some(c => c.code === code)) {
        alert('Este código de cupom já existe.');
        return;
    }
    
    const newCoupon = {
        id: Date.now(),
        code: code,
        discount: discount,
        days: days,
        limit: limit,
        used: 0,
        plan: plan,
        minValue: minValue,
        description: description || `${discount}% de desconto`,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        usageHistory: []
    };
    
    coupons.push(newCoupon);
    localStorage.setItem('coupons', JSON.stringify(coupons));
    
    // Limpar formulário
    clearForm();
    
    // Atualizar interface
    loadCoupons();
    
    alert('Cupom criado com sucesso!');
}

// Função para limpar formulário
function clearForm() {
    document.getElementById('couponCode').value = '';
    document.getElementById('couponDiscount').value = '';
    document.getElementById('couponDays').value = '';
    document.getElementById('couponLimit').value = '';
    document.getElementById('couponPlan').value = 'all';
    document.getElementById('couponMinValue').value = '';
    document.getElementById('couponDescription').value = '';
}

// Função para ativar cupom
function activateCoupon() {
    if (!selectedCoupon) return;
    
    selectedCoupon.status = 'active';
    localStorage.setItem('coupons', JSON.stringify(coupons));
    
    loadCoupons();
    closeModal('couponModal');
    
    alert('Cupom ativado com sucesso!');
}

// Função para desativar cupom
function deactivateCoupon() {
    if (!selectedCoupon) return;
    
    selectedCoupon.status = 'inactive';
    localStorage.setItem('coupons', JSON.stringify(coupons));
    
    loadCoupons();
    closeModal('couponModal');
    
    alert('Cupom desativado com sucesso!');
}

// Função para excluir cupom
function deleteCoupon() {
    if (!selectedCoupon) return;
    
    if (!confirm('Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    const index = coupons.findIndex(c => c.id === selectedCoupon.id);
    if (index !== -1) {
        coupons.splice(index, 1);
        localStorage.setItem('coupons', JSON.stringify(coupons));
        
        loadCoupons();
        closeModal('couponModal');
        
        alert('Cupom excluído com sucesso!');
    }
}

// Função para filtrar cupons
function filterCoupons() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredCoupons = coupons.filter(coupon => {
        const isExpired = new Date() > new Date(coupon.expiresAt);
        const isUsed = coupon.limit && coupon.used >= coupon.limit;
        
        let status = 'active';
        if (isExpired) status = 'expired';
        else if (isUsed) status = 'used';
        
        const statusMatch = statusFilter === 'all' || status === statusFilter;
        const searchMatch = coupon.code.toLowerCase().includes(searchTerm);
        
        return statusMatch && searchMatch;
    });
    
    renderCoupons();
}

// Função para buscar cupons
function searchCoupons() {
    filterCoupons();
}

// Função para atualizar estatísticas
function updateStats() {
    const activeCoupons = coupons.filter(c => {
        const isExpired = new Date() > new Date(c.expiresAt);
        const isUsed = c.limit && c.used >= c.limit;
        return !isExpired && !isUsed;
    }).length;
    
    const totalUses = coupons.reduce((sum, c) => sum + c.used, 0);
    
    const totalDiscount = coupons.reduce((sum, c) => {
        return sum + c.usageHistory.reduce((usageSum, usage) => usageSum + usage.discountAmount, 0);
    }, 0);
    
    document.getElementById('activeCoupons').textContent = activeCoupons;
    document.getElementById('totalUses').textContent = totalUses;
    document.getElementById('totalDiscount').textContent = `R$ ${totalDiscount.toFixed(2)}`;
}

// Função para exportar cupons
function exportCoupons() {
    const data = {
        exportDate: new Date().toISOString(),
        totalCoupons: coupons.length,
        activeCoupons: coupons.filter(c => {
            const isExpired = new Date() > new Date(c.expiresAt);
            const isUsed = c.limit && c.used >= c.limit;
            return !isExpired && !isUsed;
        }).length,
        totalUses: coupons.reduce((sum, c) => sum + c.used, 0),
        totalDiscount: coupons.reduce((sum, c) => {
            return sum + c.usageHistory.reduce((usageSum, usage) => usageSum + usage.discountAmount, 0);
        }, 0),
        coupons: coupons
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `cupons_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('Relatório exportado com sucesso!');
}

// Função para fechar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Função para excluir cupom
function deleteCoupon(couponId) {
    if (!confirm('Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    const index = coupons.findIndex(c => c.id === couponId);
    if (index !== -1) {
        coupons.splice(index, 1);
        localStorage.setItem('coupons', JSON.stringify(coupons));
        
        loadCoupons();
        updateStats();
        
        alert('Cupom excluído com sucesso!');
    }
}


