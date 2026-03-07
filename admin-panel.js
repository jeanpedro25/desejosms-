// Admin JS – seleção e email em massa

document.addEventListener('DOMContentLoaded', () => {
    renderAdsTable();
});

function getAllAnnouncements(){
    return JSON.parse(localStorage.getItem('announcements') || '[]');
}

function filterAds(){ renderAdsTable(); }
function onFilterChange(){ renderAdsTable(); }
function onUsersFilterChange(){ loadUsersData(); }

function renderAdsTable(){
    const tbody = document.getElementById('adsTableBody');
    if (!tbody) return;
    const filter = document.getElementById('adsFilter')?.value || 'all';
    const plan = document.getElementById('planFilter')?.value || 'all';
    const term = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const from = document.getElementById('fromDate')?.value;
    const to = document.getElementById('toDate')?.value;
    const ads = getAllAnnouncements();
    const filtered = ads.filter(a=>{
        if (filter==='pending' && a.status!=='pending') return false;
        if (filter==='active' && a.status!=='active') return false;
        if (filter==='rejected' && a.status!=='rejected') return false;
        if (plan!=='all' && (a.planType!==plan)) return false;
        if (term){
            const hay = `${a.name||''} ${a.userEmail||''} ${a.city||''}`.toLowerCase();
            if (!hay.includes(term)) return false;
        }
        if (from){
            const dt = new Date(a.createdAt||Date.now());
            if (dt < new Date(from)) return false;
        }
        if (to){
            const dt = new Date(a.createdAt||Date.now());
            const end = new Date(to); end.setHours(23,59,59,999);
            if (dt > end) return false;
        }
        return true;
    });
    tbody.innerHTML = filtered.map(a=>{
        const photo = (a.photos && a.photos[0]) || 'https://via.placeholder.com/40x40/CCCCCC/333333?text=A';
        return `
        <tr>
            <td><input type="checkbox" class="ad-select" data-id="${a.id}" data-email="${a.userEmail || ''}" onchange="updateSelectedCount()"></td>
            <td><div style="display:flex;align-items:center;gap:8px;"><img src="${photo}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">${a.name || '(sem título)'}</div></td>
            <td>${a.userEmail || 'undefined'}</td>
            <td><span class="status-badge ${a.status}">${(a.status||'').toUpperCase()}</span></td>
            <td><span class="plan-badge ${a.planType}">${String(a.planType||'').toUpperCase()}</span></td>
            <td>${new Date(a.createdAt||Date.now()).toLocaleDateString('pt-BR')}</td>
            <td>
                <button class="action-btn" title="Aprovar" onclick="approveAd(${a.id})"><i class="fas fa-check"></i></button>
                <button class="action-btn" title="Rejeitar" onclick="rejectAd(${a.id})"><i class="fas fa-times"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function toggleSelectAllAds(cb){
    document.querySelectorAll('.ad-select').forEach(i=>{ i.checked = cb.checked; });
    updateSelectedCount();
}

function openBulkEmailModal(){
    document.getElementById('bulkEmailSubject').value = 'Finalize seu anúncio no DesejosMS';
    document.getElementById('bulkEmailBody').value = 'Olá! Você iniciou a criação de um anúncio e ele está pendente/rascunho. Clique para continuar e finalizar.';
    document.getElementById('bulkEmailModal').classList.add('active');
}

function closeModal(id){
    document.getElementById(id).classList.remove('active');
}

function sendBulkEmails(){
    const subject = document.getElementById('bulkEmailSubject').value.trim();
    const body = document.getElementById('bulkEmailBody').value.trim();
    const selected = Array.from(document.querySelectorAll('.ad-select:checked'));
    if (selected.length===0){ alert('Selecione pelo menos um anúncio.'); return; }
    const recipients = selected.map(i=>i.getAttribute('data-email')).filter(Boolean);
    if (recipients.length===0){ alert('Os anúncios selecionados não possuem email.'); return; }

    // Gateway personalizado como webhook (mesma lógica do painel do anunciante)
    const gateways = JSON.parse(localStorage.getItem('paymentGateways') || '[]');
    const custom = gateways.find(g=>g.type==='custom' && g.status==='active' && g.webhook);
    const payload = { to: recipients, subject, body };
    if (custom && custom.webhook){
        fetch(custom.webhook, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'bulk_reminder', data: payload }) })
            .then(()=>{ alert('Emails enviados (webhook).'); closeModal('bulkEmailModal'); })
            .catch(()=>{ queueEmailsLocally(recipients, subject, body); });
    } else {
        queueEmailsLocally(recipients, subject, body);
    }
}

function queueEmailsLocally(recipients, subject, body){
    const queue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
    recipients.forEach(to => {
        queue.push({ id: Date.now()+Math.random(), to, subject, body, createdAt: new Date().toISOString(), status:'queued' });
    });
    localStorage.setItem('emailQueue', JSON.stringify(queue));
    alert('Emails enfileirados (simulado). Configure o webhook no Gateway Personalizado para envio real.');
    closeModal('bulkEmailModal');
}

// Placeholders
function approveAd(id){ /* impl futura */ alert('Aprovar '+id); }
function rejectAd(id){ /* impl futura */ alert('Rejeitar '+id); }

function selectAllFiltered(){
    document.querySelectorAll('.ad-select').forEach(i=>{ i.checked = true; });
    updateSelectedCount();
}

function updateSelectedCount(){
    const count = document.querySelectorAll('.ad-select:checked').length;
    const el = document.getElementById('selectedCount');
    if (el) el.textContent = `${count} selecionados`;
}

function clearSelection(){
    document.querySelectorAll('.ad-select').forEach(i=>{ i.checked = false; });
    const headerCb = document.getElementById('selectAllAds');
    if (headerCb) headerCb.checked = false;
    updateSelectedCount();
}

function clearFilters(){
    const ids = ['adsFilter','planFilter','searchInput','fromDate','toDate'];
    ids.forEach(id=>{
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName==='SELECT') el.selectedIndex = 0;
        else el.value = '';
    });
    renderAdsTable();
}

// Exportações CSV
function exportAdsCSV(){
    const headers = ['ID','Anúncio','Email','Status','Plano','Criado em'];
    const ads = JSON.parse(localStorage.getItem('announcements')||'[]');
    const rows = [headers];
    ads.forEach(a=> rows.push([
        a.id,
        a.name,
        a.userEmail,
        a.status,
        (a.planType||'').toUpperCase(),
        new Date(a.createdAt).toLocaleDateString('pt-BR')
    ]));
    downloadCSV(rows, `anuncios_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportUsersCSV(){
    const headers = ['Nome','Email','Verificado','Último Acesso'];
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    const rows = [headers];
    users.forEach(u=> rows.push([
        u.name||'',
        u.email||'',
        u.verified?'Sim':'Não',
        u.lastAccess||'Nunca'
    ]));
    downloadCSV(rows, `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(rows, filename){
    // Excel pt-BR costuma esperar ponto e vírgula como separador e BOM UTF-8
    const sep = ';';
    const csv = rows
        .map(r => r.map(field => `"${String(field).replace(/"/g,'""')}"`).join(sep))
        .join('\n');
    const BOM = '\ufeff';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Variáveis globais
let currentSection = 'dashboard';
let selectedAd = null;
let selectedUser = null;

// Função para carregar logo personalizada
function loadCustomLogo() {
    const brandSettings = JSON.parse(localStorage.getItem('brandSettings')) || {};
    console.log('Brand settings (admin):', brandSettings);
    
    // Tentar diferentes seletores para encontrar o ícone
    let logoIcon = document.querySelector('.sidebar-header h2 i');
    if (!logoIcon) {
        logoIcon = document.querySelector('.sidebar-header i');
    }
    if (!logoIcon) {
        logoIcon = document.querySelector('.logo-icon');
    }
    
    console.log('Logo icon found (admin):', logoIcon);
    
    if (brandSettings.logo && logoIcon) {
        console.log('Loading custom logo (admin):', brandSettings.logo);
        
        // Criar elemento de imagem para substituir o ícone
        const logoImg = document.createElement('img');
        logoImg.src = brandSettings.logo;
        logoImg.alt = 'Logo personalizada';
        logoImg.style.cssText = `
            width: 1.5rem;
            height: 1.5rem;
            object-fit: contain;
            border-radius: 4px;
            box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        `;
        
        // Substituir o ícone pela imagem
        logoIcon.parentNode.replaceChild(logoImg, logoIcon);
        console.log('Logo replaced successfully (admin)!');
    } else {
        console.log('No logo to load or icon not found (admin)');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carregar logo personalizada
    loadCustomLogo();
    
    loadDashboardData();
    setupEventListeners();
    updateLastUpdate();
    updateVerificationsBadge();
});

// Configurar event listeners
function setupEventListeners() {
    // Navegação
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            
            // Se tem data-section, é navegação interna
            if (section) {
                e.preventDefault();
                switchSection(section);
            }
            // Se não tem data-section, é link externo (deixar funcionar normalmente)
        });
    });

    // Fechar modais ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Função para alternar entre seções
function switchSection(sectionName) {
    // Remover classe active de todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover classe active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Adicionar classe active à seção selecionada
    document.getElementById(`${sectionName}-section`).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Atualizar título da seção
    updateSectionTitle(sectionName);
    
    // Carregar dados específicos da seção
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'ads':
            loadAdsData();
            break;
        case 'payments':
            loadPaymentsData();
            break;
        case 'brand':
            loadBrandData();
            break;
        case 'settings':
            loadSettingsData();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
    
    currentSection = sectionName;
}

// Função para atualizar título da seção
function updateSectionTitle(sectionName) {
    const titles = {
        'dashboard': 'Dashboard Administrativo',
        'users': 'Gerenciamento de Usuários',
        'ads': 'Gerenciamento de Anúncios',
        'payments': 'Gerenciamento de Pagamentos',
        'brand': 'Marca e Logo',
        'settings': 'Configurações da Plataforma',
        'reports': 'Relatórios Fundamentais'
    };
    
    const subtitles = {
        'dashboard': 'Gerencie toda estrutura do seu site',
        'users': 'Visualize e gerencie usuários do sistema',
        'ads': 'Aprove ou rejeite anúncios pendentes',
        'payments': 'Monitore pagamentos e receitas',
        'brand': 'Personalize a identidade visual do seu site',
        'settings': 'Configure preços, cidades e cupons',
        'reports': 'Relatórios detalhados do sistema'
    };
    
    document.getElementById('sectionTitle').textContent = titles[sectionName];
    document.getElementById('sectionSubtitle').textContent = subtitles[sectionName];
}

// Função para carregar dados do dashboard
function loadDashboardData() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Calcular estatísticas
    const totalUsers = users.length;
    const activeAds = announcements.filter(ad => ad.status === 'active').length;
    const pendingAds = announcements.filter(ad => ad.status === 'pending').length;
    const monthlyRevenue = calculateMonthlyRevenue();
    
    // Atualizar cards de estatísticas
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeAds').textContent = activeAds;
    document.getElementById('pendingAds').textContent = pendingAds;
    document.getElementById('monthlyRevenue').textContent = `R$ ${monthlyRevenue.toFixed(2)}`;
    
    // Atualizar badges de notificação
    document.getElementById('usersBadge').textContent = totalUsers;
    document.getElementById('adsBadge').textContent = pendingAds;
    
    // Atualizar ações necessárias
    document.getElementById('pendingAdsCount').textContent = `${pendingAds} anúncios pendentes`;
    document.getElementById('pendingVerifications').textContent = 'Verificações pendentes';
    updateVerificationsBadge();
}

function updateVerificationsBadge(){
    const verifs = JSON.parse(localStorage.getItem('verifications')||'[]');
    const pending = verifs.filter(v=>v.status==='pending').length;
    const badge = document.getElementById('verificationsBadge');
    if (badge) badge.textContent = pending;
}

// Função para calcular receita mensal
function calculateMonthlyRevenue() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return announcements
        .filter(ad => {
            const adDate = new Date(ad.createdAt);
            return adDate.getMonth() === currentMonth && 
                   adDate.getFullYear() === currentYear &&
                   ad.status === 'active';
        })
        .reduce((sum, ad) => sum + (ad.paidAmount || 0), 0);
}

// Função para carregar dados de usuários
function loadUsersData() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];

    const status = document.getElementById('userStatusFilter')?.value || 'all';
    const term = (document.getElementById('userSearchInput')?.value || '').toLowerCase();
    const from = document.getElementById('userFromDate')?.value;
    const to = document.getElementById('userToDate')?.value;

    const usersTableBody = document.getElementById('usersTableBody');
    usersTableBody.innerHTML = '';

    const filtered = users.filter(user => {
        if (status==='verified' && !user.verified) return false;
        if (status==='unverified' && user.verified) return false;
        if (status==='blocked' && !user.blocked) return false;
        if (term){
            const hay = `${user.name||''} ${user.email||''}`.toLowerCase();
            if (!hay.includes(term)) return false;
        }
        if (from){
            const dt = new Date(user.lastAccess || 0);
            if (dt < new Date(from)) return false;
        }
        if (to){
            const dt = new Date(user.lastAccess || 0);
            const end = new Date(to); end.setHours(23,59,59,999);
            if (dt > end) return false;
        }
        return true;
    });

    filtered.forEach(user => {
        const userAds = announcements.filter(ad => ad.userEmail === user.email);
        const activeAds = userAds.filter(ad => ad.status === 'active').length;
        const lastAccess = user.lastAccess || 'Nunca';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #f8f9fa; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #6c757d;">
                        ${(user.name||'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: bold;">${user.name||'Usuário'}</div>
                        <div style="font-size: 12px; color: #666;">${user.email||''}</div>
                    </div>
                </div>
            </td>
            <td>${user.email||''}</td>
            <td>
                <span class="status-badge ${user.blocked ? 'blocked' : (user.verified ? 'active' : 'pending')}">
                    ${user.blocked ? 'BLOQUEADO' : (user.verified ? 'VERIFICADO' : 'PENDENTE')}
                </span>
            </td>
            <td>${activeAds} anúncios</td>
            <td>${lastAccess}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-success" onclick="verifyUser('${user.email||''}')" style="padding: 5px 10px; font-size: 12px;" title="Verificar usuário">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-warning" onclick="blockUser('${user.email||''}')" style="padding: 5px 10px; font-size: 12px;" title="Bloquear usuário">
                        <i class="fas fa-ban"></i>
                    </button>
                    <button class="btn btn-danger" onclick="confirmDeleteUser('${user.email||''}')" style="padding: 5px 10px; font-size: 12px;" title="Excluir usuário">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        usersTableBody.appendChild(row);
    });
}

// Visualizar documentos enviados pelo usuário (lê localStorage.pendingVerifications)
function viewUserDocs(userEmail){
    const docs = JSON.parse(localStorage.getItem('pendingVerifications')||'[]').filter(v=>v.userEmail===userEmail);
    const content = document.getElementById('userDocsContent');
    if (!content) return;
    if (docs.length===0){
        content.innerHTML = '<p style="color:#6c757d">Nenhum documento enviado para este usuário.</p>';
    } else {
        content.innerHTML = docs.map(d=>`
            <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid #eee;border-radius:8px;padding:10px;margin-bottom:8px;">
                <div>
                    <div><strong>Tipo:</strong> ${d.type||'Documento'}</div>
                    <div style="font-size:12px;color:#6c757d"><strong>Enviado em:</strong> ${new Date(d.submittedAt||Date.now()).toLocaleString('pt-BR')}</div>
                </div>
                <div style="display:flex;gap:8px;">
                    ${d.url?`<a class="btn btn-secondary" href="${d.url}" target="_blank"><i class=\"fas fa-eye\"></i> Abrir</a>`:''}
                    ${d.url?`<a class=\"btn btn-primary\" href="${d.url}" download><i class=\"fas fa-download\"></i> Baixar</a>`:''}
                </div>
            </div>
        `).join('');
    }
    const modal = document.getElementById('userDocsModal');
    if (modal) modal.classList.add('active');
}


// Função para carregar dados de anúncios
function loadAdsData() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    
    console.log('Admin - Anúncios carregados:', announcements.length);
    console.log('Admin - Anúncios ativos:', announcements.filter(ad => ad.status === 'active').length);
    console.log('Admin - Todos os anúncios:', announcements);
    
    const adsTableBody = document.getElementById('adsTableBody');
    adsTableBody.innerHTML = '';
    
    announcements.forEach(ad => {
        const createdDate = new Date(ad.createdAt).toLocaleDateString('pt-BR');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="https://via.placeholder.com/40x40/FFB6C1/FFFFFF?text=${encodeURIComponent(ad.name.charAt(0))}" 
                         style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
                    <div>
                        <div style="font-weight: bold;">${ad.name}</div>
                        <div style="font-size: 12px; color: #666;">${ad.city}, MS</div>
                    </div>
                </div>
            </td>
            <td>${ad.userEmail}</td>
            <td>
                <span class="status-badge ${ad.status}">
                    ${ad.status === 'active' ? 'Ativo' : ad.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                </span>
            </td>
            <td>
                <span style="font-weight: bold; color: #8B0000;">${ad.planType.toUpperCase()}</span>
            </td>
            <td>${createdDate}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-primary" onclick="viewAdDetails(${ad.id})" style="padding: 5px 10px; font-size: 12px;">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-success" onclick="approveAd(${ad.id})" style="padding: 5px 10px; font-size: 12px;">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger" onclick="rejectAd(${ad.id})" style="padding: 5px 10px; font-size: 12px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        adsTableBody.appendChild(row);
    });
}

// Função para carregar dados de pagamentos
function loadPaymentsData() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const activeAds = announcements.filter(ad => ad.status === 'active');
    
    const monthlyPayments = activeAds.length;
    const monthlyRevenue = activeAds.reduce((sum, ad) => sum + (ad.paidAmount || 0), 0);
    
    document.getElementById('monthlyPayments').textContent = monthlyPayments;
    document.getElementById('monthlyRevenue').textContent = `R$ ${monthlyRevenue.toFixed(2)}`;
}

// Função para carregar dados de configurações
function loadSettingsData() {
    // Carregar preços dos planos
    const planPrices = JSON.parse(localStorage.getItem('planPrices')) || {
        basic: 149.90,
        premium: 249.90,
        vip: 399.90
    };
    
    document.getElementById('basicPrice').value = planPrices.basic;
    document.getElementById('premiumPrice').value = planPrices.premium;
    document.getElementById('vipPrice').value = planPrices.vip;
    
    // Carregar cidades disponíveis
    const availableCities = JSON.parse(localStorage.getItem('availableCities')) || [
        'campo-grande', 'dourados', 'tres-lagoas', 'corumba', 'ponta-pora'
    ];
    
    availableCities.forEach(city => {
        const checkbox = document.getElementById(city);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    // Carregar cupons existentes
    loadCoupons();
}

// Função para carregar dados de relatórios
function loadReportsData() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    
    const activeAdvertisers = announcements.filter(ad => ad.status === 'active').length;
    const pendingAdvertisers = announcements.filter(ad => ad.status === 'pending').length;
    const rejectedAdvertisers = announcements.filter(ad => ad.status === 'rejected').length;
    const testAdvertisers = announcements.filter(ad => ad.status === 'test').length;
    
    const monthlyBilling = calculateMonthlyRevenue();
            const supervipAds = announcements.filter(ad => ad.planType === 'supervip' && ad.status === 'active').length;
        const topAds = announcements.filter(ad => ad.planType === 'top' && ad.status === 'active').length;
        const basicAds = announcements.filter(ad => ad.planType === 'basic' && ad.status === 'active').length;
    const vipAds = announcements.filter(ad => ad.planType === 'vip' && ad.status === 'active').length;
    
    document.getElementById('activeAdvertisers').textContent = activeAdvertisers;
    document.getElementById('pendingAdvertisers').textContent = pendingAdvertisers;
    document.getElementById('rejectedAdvertisers').textContent = rejectedAdvertisers;
    document.getElementById('testAdvertisers').textContent = testAdvertisers;
    
    document.getElementById('monthlyBilling').textContent = `R$ ${monthlyBilling.toFixed(2)}`;
    document.getElementById('premiumAds').textContent = premiumAds;
    document.getElementById('vipAds').textContent = vipAds;
}

// Função para atualizar última atualização
function updateLastUpdate() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ', ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdate').textContent = formattedDate;
}

// Funções de ação do dashboard
function showPendingAds() {
    switchSection('ads');
    document.getElementById('adsFilter').value = 'pending';
    filterAds();
}

// Função removida - agora redireciona para verificacoes.html

// Funções de gerenciamento de anúncios
function viewAdDetails(adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const ad = announcements.find(a => a.id === adId);
    
    if (!ad) return;
    
    selectedAd = ad;
    
    const modal = document.getElementById('adDetailsModal');
    const content = document.getElementById('adDetailsContent');
    
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">${ad.name}</h3>
            <p style="color: #666; margin-bottom: 15px;">${ad.description}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
                <strong>Anunciante:</strong> ${ad.userEmail}
            </div>
            <div>
                <strong>Cidade:</strong> ${ad.city}, MS
            </div>
            <div>
                <strong>Idade:</strong> ${ad.age} anos
            </div>
            <div>
                <strong>Preço:</strong> ${ad.price}
            </div>
            <div>
                <strong>Plano:</strong> ${ad.planType.toUpperCase()}
            </div>
            <div>
                <strong>Status:</strong> 
                <span class="status-badge ${ad.status}">
                    ${ad.status === 'active' ? 'Ativo' : ad.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                </span>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <strong>Serviços:</strong>
            <div style="margin-top: 10px;">
                ${(ad.services || []).map(service => `<span style="background: #f8f9fa; padding: 5px 10px; border-radius: 15px; margin-right: 5px; font-size: 12px;">${service}</span>`).join('')}
            </div>
        </div>
        
        <div>
            <strong>Contato:</strong> ${ad.whatsapp}
        </div>
    `;
    
    modal.classList.add('active');
}

function approveAd(adId) {
    if (!selectedAd) {
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        selectedAd = announcements.find(a => a.id === adId);
    }
    
    if (selectedAd) {
        selectedAd.status = 'active';
        
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        const index = announcements.findIndex(a => a.id === selectedAd.id);
        
        if (index !== -1) {
            announcements[index] = selectedAd;
            localStorage.setItem('announcements', JSON.stringify(announcements));
            
            alert('Anúncio aprovado com sucesso!');
            closeModal('adDetailsModal');
            loadAdsData();
            loadDashboardData();
        }
    }
}

function rejectAd(adId) {
    if (!selectedAd) {
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        selectedAd = announcements.find(a => a.id === adId);
    }
    
    if (selectedAd) {
        selectedAd.status = 'rejected';
        
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        const index = announcements.findIndex(a => a.id === selectedAd.id);
        
        if (index !== -1) {
            announcements[index] = selectedAd;
            localStorage.setItem('announcements', JSON.stringify(announcements));
            
            alert('Anúncio rejeitado.');
            closeModal('adDetailsModal');
            loadAdsData();
            loadDashboardData();
        }
    }
}

function approveAllAds() {
    if (confirm('Tem certeza que deseja aprovar todos os anúncios pendentes?')) {
        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        
        announcements.forEach(ad => {
            if (ad.status === 'pending') {
                ad.status = 'active';
            }
        });
        
        localStorage.setItem('announcements', JSON.stringify(announcements));
        
        alert('Todos os anúncios pendentes foram aprovados!');
        loadAdsData();
        loadDashboardData();
    }
}

function filterAds() {
    const filter = document.getElementById('adsFilter').value;
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    
    let filteredAds = announcements;
    
    if (filter !== 'all') {
        filteredAds = announcements.filter(ad => ad.status === filter);
    }
    
    // Recarregar tabela com anúncios filtrados
    loadAdsData();
}

// Funções de gerenciamento de usuários
function viewUserDetails(userEmail) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === userEmail);
    
    if (!user) return;
    
    selectedUser = user;
    
    const modal = document.getElementById('userDetailsModal');
    const content = document.getElementById('userDetailsContent');
    
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">${user.name}</h3>
            <p style="color: #666;">${user.email}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
                <strong>Status:</strong> 
                <span class="status-badge ${user.verified ? 'active' : 'pending'}">
                    ${user.verified ? 'Verificado' : 'Pendente'}
                </span>
            </div>
            <div>
                <strong>Último Acesso:</strong> ${user.lastAccess || 'Nunca'}
            </div>
            <div>
                <strong>Data de Cadastro:</strong> ${new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </div>
            <div>
                <strong>Anúncios Ativos:</strong> ${user.activeAds || 0}
            </div>
        </div>
        
        ${user.verified ? '' : `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <strong>Aguardando Verificação</strong>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Este usuário ainda não foi verificado. Verifique os documentos enviados.</p>
            </div>
        `}
    `;
    
    modal.classList.add('active');
}

function verifyUser(userEmail) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.email === userEmail);
    if (userIndex !== -1) {
        users[userIndex].verified = true;
        users[userIndex].blocked = false;
        localStorage.setItem('users', JSON.stringify(users));
        alert('Usuário verificado com sucesso!');
        closeModal('userDetailsModal');
        loadUsersData();
        loadDashboardData();
    }
}

function blockUser(userEmail) {
    if (confirm('Tem certeza que deseja bloquear este usuário?')) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.email === userEmail);
        
        if (userIndex !== -1) {
            users[userIndex].blocked = true;
            users[userIndex].verified = false;
            localStorage.setItem('users', JSON.stringify(users));
            
            alert('Usuário bloqueado com sucesso!');
            closeModal('userDetailsModal');
            loadUsersData();
            loadDashboardData();
        }
    }
}

// Confirmação e exclusão
function confirmDeleteUser(userEmail){
    window.__userToDelete = userEmail;
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) modal.classList.add('active');
}

function confirmDeleteProceed(){
    const userEmail = window.__userToDelete;
    if (!userEmail) { closeModal('confirmDeleteModal'); return; }
    // Remover usuário
    let users = JSON.parse(localStorage.getItem('users')||'[]');
    users = users.filter(u=>u.email!==userEmail);
    localStorage.setItem('users', JSON.stringify(users));
    // Remover anúncios do usuário
    let announcements = JSON.parse(localStorage.getItem('announcements')||'[]');
    announcements = announcements.filter(a=>a.userEmail!==userEmail);
    localStorage.setItem('announcements', JSON.stringify(announcements));
    // Remover documentos pendentes
    let verifs = JSON.parse(localStorage.getItem('pendingVerifications')||'[]');
    verifs = verifs.filter(v=>v.userEmail!==userEmail);
    localStorage.setItem('pendingVerifications', JSON.stringify(verifs));
    closeModal('confirmDeleteModal');
    alert('Usuário e dados relacionados removidos.');
    loadUsersData();
    loadAdsData();
    loadDashboardData();
    window.__userToDelete = null;
}

// Funções de configurações
// Função updatePrices removida - agora centralizada em payment-config.js

function updateCities() {
    const cityCheckboxes = document.querySelectorAll('.city-item input[type="checkbox"]');
    const availableCities = [];
    
    cityCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            availableCities.push(checkbox.id);
        }
    });
    
    localStorage.setItem('availableCities', JSON.stringify(availableCities));
    alert('Cidades atualizadas com sucesso!');
}

function createCoupon() {
    const code = document.getElementById('couponCode').value.trim();
    const discount = parseInt(document.getElementById('couponDiscount').value);
    const days = parseInt(document.getElementById('couponDays').value);
    
    if (!code || !discount || !days) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const coupons = JSON.parse(localStorage.getItem('coupons')) || [];
    
    const newCoupon = {
        id: Date.now(),
        code: code.toUpperCase(),
        discount: discount,
        days: days,
        active: true,
        createdAt: new Date().toISOString()
    };
    
    coupons.push(newCoupon);
    localStorage.setItem('coupons', JSON.stringify(coupons));
    
    // Limpar formulário
    document.getElementById('couponCode').value = '';
    document.getElementById('couponDiscount').value = '';
    document.getElementById('couponDays').value = '';
    
    alert('Cupom criado com sucesso!');
    loadCoupons();
}

function loadCoupons() {
    const coupons = JSON.parse(localStorage.getItem('coupons')) || [];
    const couponsList = document.getElementById('couponsList');
    
    if (coupons.length === 0) {
        couponsList.innerHTML = '<p style="color: #666; text-align: center;">Nenhum cupom criado ainda.</p>';
        return;
    }
    
    couponsList.innerHTML = '';
    
    coupons.forEach(coupon => {
        const couponDiv = document.createElement('div');
        couponDiv.className = 'coupon-card';
        couponDiv.innerHTML = `
            <div class="coupon-header">
                <strong>${coupon.code}</strong>
                <span class="coupon-status ${coupon.active ? 'active' : 'inactive'}">
                    ${coupon.active ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div style="margin: 10px 0;">
                <div><strong>Desconto:</strong> ${coupon.discount}%</div>
                <div><strong>Dias de Teste:</strong> ${coupon.days}</div>
                <div><strong>Criado em:</strong> ${new Date(coupon.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="coupon-actions">
                <button class="btn-toggle" onclick="toggleCoupon(${coupon.id})">
                    ${coupon.active ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn-delete" onclick="deleteCoupon(${coupon.id})">
                    Excluir
                </button>
            </div>
        `;
        couponsList.appendChild(couponDiv);
    });
}

function toggleCoupon(couponId) {
    const coupons = JSON.parse(localStorage.getItem('coupons')) || [];
    const couponIndex = coupons.findIndex(c => c.id === couponId);
    
    if (couponIndex !== -1) {
        coupons[couponIndex].active = !coupons[couponIndex].active;
        localStorage.setItem('coupons', JSON.stringify(coupons));
        loadCoupons();
    }
}

function deleteCoupon(couponId) {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
        const coupons = JSON.parse(localStorage.getItem('coupons')) || [];
        const filteredCoupons = coupons.filter(c => c.id !== couponId);
        localStorage.setItem('coupons', JSON.stringify(filteredCoupons));
        loadCoupons();
    }
}

// Funções de relatórios
function generatePaymentReport() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const activeAds = announcements.filter(ad => ad.status === 'active');
    
    const report = {
        totalPayments: activeAds.length,
        totalRevenue: activeAds.reduce((sum, ad) => sum + (ad.paidAmount || 0), 0),
        pixPayments: Math.floor(activeAds.length * 0.7), // Simulado
        cardPayments: Math.floor(activeAds.length * 0.3), // Simulado
        date: new Date().toLocaleDateString('pt-BR')
    };
    
    // Simular download do relatório
    alert(`Relatório gerado com sucesso!\n\nTotal de Pagamentos: ${report.totalPayments}\nReceita Total: R$ ${report.totalRevenue.toFixed(2)}\nPagamentos PIX: ${report.pixPayments}\nPagamentos Cartão: ${report.cardPayments}`);
}

function exportReport() {
    const reports = loadReportsData();
    
    // Simular exportação
    alert('Relatório exportado com sucesso!');
}

// Funções de modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Função de logout
function logout() {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
        window.location.href = 'index.html';
    }
}

// Funções de verificação
function approveVerification() {
    alert('Verificação aprovada com sucesso!');
    closeModal('verificationModal');
}

function rejectVerification() {
    alert('Verificação rejeitada.');
    closeModal('verificationModal');
}

// Atualizar dados a cada 30 segundos
setInterval(() => {
    if (currentSection === 'dashboard') {
        loadDashboardData();
        updateLastUpdate();
    }
}, 30000);

// Funções de gerenciamento de estado
function setupStateSelector() {
    const stateSelector = document.getElementById('currentState');
    if (stateSelector) {
        stateSelector.value = siteConfig.currentState;
    }
}

function changeCurrentState(newState) {
    // Esta função é chamada quando o usuário muda o seletor
    // A mudança só é aplicada quando clicar em "Aplicar Mudança"
}

function applyStateChange() {
    const stateSelector = document.getElementById('currentState');
    const newState = stateSelector.value;
    
    if (changeState(newState)) {
        alert(`Estado alterado para ${getCurrentStateConfig().name} com sucesso!`);
        
        // Recarregar dados do dashboard
        loadDashboardData();
        loadSettingsData();
        
        // Redirecionar para a página inicial após 2 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    } else {
        alert('Erro ao alterar estado!');
    }
}

// ===== FUNÇÕES DE MARCA E LOGO =====

// Carregar configurações de marca
function loadBrandSettings() {
    const brandSettings = JSON.parse(localStorage.getItem('brandSettings')) || {
        logo: null,
        primaryColor: '#8B0000',
        secondaryColor: '#FFD700',
        accentColor: '#FF4500',
        siteName: 'DesejosMS',
        siteTagline: 'ONDE O SEU DESEJO SE TRANSFORMA EM PRAZER',
        siteEmail: 'contato@desejosms.com.br',
        sitePhone: '(67) 9999-0000'
    };
    
    // Carregar logo se existir
    if (brandSettings.logo) {
        document.getElementById('currentLogo').src = brandSettings.logo;
        document.getElementById('currentLogo').style.display = 'block';
        document.getElementById('defaultLogo').style.display = 'none';
        document.getElementById('removeLogoBtn').style.display = 'inline-block';
    }
    
    // Carregar cores
    document.getElementById('primaryColor').value = brandSettings.primaryColor;
    document.getElementById('secondaryColor').value = brandSettings.secondaryColor;
    document.getElementById('accentColor').value = brandSettings.accentColor;
    
    // Atualizar valores das cores
    updateColorValues();
    
    // Carregar informações do site
    document.getElementById('siteName').value = brandSettings.siteName;
    document.getElementById('siteTagline').value = brandSettings.siteTagline;
    document.getElementById('siteEmail').value = brandSettings.siteEmail;
    document.getElementById('sitePhone').value = brandSettings.sitePhone;
}

// Preview da logo com conversão para PNG
function previewLogo(input) {
    const file = input.files[0];
    if (file) {
        // Verificar tamanho do arquivo (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Arquivo muito grande! Tamanho máximo: 2MB');
            return;
        }
        
        // Verificar tipo do arquivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem!');
            return;
        }
        
        // Converter para PNG
        convertToPNG(file);
    }
}

// Função para converter imagem para PNG
function convertToPNG(file) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Definir tamanho do canvas (mantendo proporção)
        const maxWidth = 800;
        const maxHeight = 400;
        let { width, height } = img;
        
        // Calcular proporção
        if (width > height) {
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
        }
        
        // Configurar canvas
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem no canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para PNG
        const pngDataUrl = canvas.toDataURL('image/png', 0.9);
        
        // Mostrar preview
        const logoImg = document.getElementById('currentLogo');
        logoImg.src = pngDataUrl;
        logoImg.style.display = 'block';
        document.getElementById('defaultLogo').style.display = 'none';
        document.getElementById('saveLogoBtn').style.display = 'inline-block';
        document.getElementById('removeLogoBtn').style.display = 'inline-block';
        
        // Mostrar mensagem de conversão
        showNotification('Imagem convertida para PNG com sucesso!', 'success');
        
        console.log('Imagem convertida para PNG:', pngDataUrl.substring(0, 50) + '...');
    };
    
    img.onerror = function() {
        alert('Erro ao carregar a imagem. Tente novamente.');
    };
    
    // Carregar imagem
    img.src = URL.createObjectURL(file);
}

// Salvar logo
function saveLogo() {
    const logoImg = document.getElementById('currentLogo');
    if (logoImg.src && logoImg.style.display !== 'none') {
        const brandSettings = JSON.parse(localStorage.getItem('brandSettings')) || {};
        brandSettings.logo = logoImg.src;
        localStorage.setItem('brandSettings', JSON.stringify(brandSettings));
        
        showNotification('Logo PNG salva com sucesso!', 'success');
        document.getElementById('saveLogoBtn').style.display = 'none';
        
        console.log('Logo PNG salva:', logoImg.src.substring(0, 50) + '...');
    }
}

// Remover logo
function removeLogo() {
    if (confirm('Tem certeza que deseja remover a logo atual?')) {
        const brandSettings = JSON.parse(localStorage.getItem('brandSettings')) || {};
        delete brandSettings.logo;
        localStorage.setItem('brandSettings', JSON.stringify(brandSettings));
        
        document.getElementById('currentLogo').style.display = 'none';
        document.getElementById('defaultLogo').style.display = 'flex';
        document.getElementById('saveLogoBtn').style.display = 'none';
        document.getElementById('removeLogoBtn').style.display = 'none';
        
        // Limpar input de arquivo
        document.getElementById('logoUpload').value = '';
        
        alert('Logo removida com sucesso!');
    }
}

// Preview das cores
function previewColors() {
    updateColorValues();
}

// Atualizar valores das cores
function updateColorValues() {
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const accentColor = document.getElementById('accentColor').value;
    
    document.querySelectorAll('.color-value')[0].textContent = primaryColor;
    document.querySelectorAll('.color-value')[1].textContent = secondaryColor;
    document.querySelectorAll('.color-value')[2].textContent = accentColor;
}

// Salvar cores da marca
function saveBrandColors() {
    const brandSettings = JSON.parse(localStorage.getItem('brandSettings')) || {};
    brandSettings.primaryColor = document.getElementById('primaryColor').value;
    brandSettings.secondaryColor = document.getElementById('secondaryColor').value;
    brandSettings.accentColor = document.getElementById('accentColor').value;
    
    localStorage.setItem('brandSettings', JSON.stringify(brandSettings));
    alert('Cores salvas com sucesso!');
}

// Salvar informações do site
function saveSiteInfo() {
    const brandSettings = JSON.parse(localStorage.getItem('brandSettings')) || {};
    brandSettings.siteName = document.getElementById('siteName').value;
    brandSettings.siteTagline = document.getElementById('siteTagline').value;
    brandSettings.siteEmail = document.getElementById('siteEmail').value;
    brandSettings.sitePhone = document.getElementById('sitePhone').value;
    
    localStorage.setItem('brandSettings', JSON.stringify(brandSettings));
    alert('Informações do site salvas com sucesso!');
}

// Função para carregar dados da seção de marca
function loadBrandData() {
    loadBrandSettings();
}

// ===== GESTÃO DE ESTADOS =====

// Carregar dados da seção de estados
function loadStatesData() {
    if (!window.statesManager) {
        console.error('StatesManager não encontrado. Carregue states-config.js primeiro.');
        return;
    }

    loadEnabledStates();
    loadAvailableStates();
    updateStatesStats();
}

// Carregar estados habilitados
function loadEnabledStates() {
    const enabledStatesList = document.getElementById('enabledStatesList');
    if (!enabledStatesList) return;

    const enabledStates = statesManager.getEnabledStates();

    if (enabledStates.length === 0) {
        enabledStatesList.innerHTML = `
            <div class="no-states-message">
                <i class="fas fa-info-circle"></i>
                <h4>Nenhum estado ativo</h4>
                <p>Ative estados na seção ao lado para começar a expansão.</p>
            </div>
        `;
        return;
    }

    enabledStatesList.innerHTML = '';

    enabledStates.forEach(stateCode => {
        const stateConfig = statesManager.getStateConfig(stateCode);
        if (stateConfig) {
            const stateItem = createEnabledStateItem(stateCode, stateConfig);
            enabledStatesList.appendChild(stateItem);
        }
    });
}

// Criar item de estado habilitado
function createEnabledStateItem(stateCode, stateConfig) {
    const div = document.createElement('div');
    div.className = 'enabled-state-item';

    div.innerHTML = `
        <div class="enabled-state-info">
            <h4>${stateConfig.brand}</h4>
            <p>${stateConfig.name}</p>
            <div class="enabled-state-meta">
                <span><i class="fas fa-city"></i> ${stateConfig.cities.length} cidades</span>
                <span><i class="fas fa-calendar"></i> Ativo desde ${stateConfig.enabledAt}</span>
                <span><i class="fas fa-globe"></i> ${stateConfig.domain}</span>
            </div>
        </div>
        <div class="enabled-state-actions">
            <button class="btn-disable" onclick="disableState('${stateCode}')">
                <i class="fas fa-times"></i> Desativar
            </button>
        </div>
    `;

    return div;
}

// Carregar estados disponíveis
function loadAvailableStates() {
    const availableStatesGrid = document.getElementById('availableStatesGrid');
    if (!availableStatesGrid) return;

    const allStates = statesManager.getAllStates();
    const availableStates = Object.keys(allStates).filter(code => !allStates[code].enabled);

    if (availableStates.length === 0) {
        availableStatesGrid.innerHTML = `
            <div class="no-states-message">
                <i class="fas fa-check-circle"></i>
                <h4>Todos os estados estão ativos</h4>
                <p>Parabéns! Você ativou todos os estados disponíveis.</p>
            </div>
        `;
        return;
    }

    availableStatesGrid.innerHTML = '';

    availableStates.forEach(stateCode => {
        const stateConfig = statesManager.getStateConfig(stateCode);
        if (stateConfig) {
            const stateItem = createAvailableStateItem(stateCode, stateConfig);
            availableStatesGrid.appendChild(stateItem);
        }
    });
}

// Criar item de estado disponível
function createAvailableStateItem(stateCode, stateConfig) {
    const div = document.createElement('div');
    div.className = 'available-state-item';

    div.innerHTML = `
        <div class="available-state-info">
            <h4>${stateConfig.brand}</h4>
            <p>${stateConfig.name}</p>
            <div class="available-state-meta">
                <span><i class="fas fa-city"></i> ${stateConfig.cities.length} cidades</span>
                <span><i class="fas fa-globe"></i> ${stateConfig.domain}</span>
                <span style="color: ${stateConfig.color}"><i class="fas fa-palette"></i> Tema personalizado</span>
            </div>
        </div>
        <div>
            <button class="btn-enable" onclick="enableState('${stateCode}')">
                <i class="fas fa-plus"></i> Ativar Estado
            </button>
        </div>
    `;

    return div;
}

// Atualizar estatísticas de estados
function updateStatesStats() {
    const allStates = statesManager.getAllStates();
    const enabledStates = statesManager.getEnabledStates();

    const totalStates = Object.keys(allStates).length;
    const activeStates = enabledStates.length;
    const totalCities = Object.values(allStates).reduce((sum, state) => sum + state.cities.length, 0);

    document.getElementById('totalStatesCount').textContent = totalStates;
    document.getElementById('activeStatesCount').textContent = activeStates;
    document.getElementById('totalCitiesCount').textContent = totalCities;
}

// Habilitar estado
function enableState(stateCode) {
    const stateConfig = statesManager.getStateConfig(stateCode);

    if (!stateConfig) {
        alert('Estado não encontrado!');
        return;
    }

    const confirmMessage = `Tem certeza que deseja ativar o estado ${stateConfig.name}?\n\nIsso criará a marca "${stateConfig.brand}" com ${stateConfig.cities.length} cidades disponíveis.`;

    if (confirm(confirmMessage)) {
        if (statesManager.toggleState(stateCode, true)) {
            showNotification(`Estado ${stateConfig.name} ativado com sucesso!`, 'success');
            loadStatesData(); // Recarregar dados
            loadDashboardData(); // Atualizar dashboard
        } else {
            alert('Erro ao ativar estado!');
        }
    }
}

// Desabilitar estado
function disableState(stateCode) {
    const stateConfig = statesManager.getStateConfig(stateCode);

    if (!stateConfig) {
        alert('Estado não encontrado!');
        return;
    }

    // Verificar se é o estado padrão
    if (stateConfig.isDefault) {
        alert('Não é possível desativar o estado padrão (MS)!');
        return;
    }

    const confirmMessage = `ATENÇÃO: Tem certeza que deseja desativar o estado ${stateConfig.name}?\n\nIsso irá:\n- Remover a marca "${stateConfig.brand}" da seleção\n- Impedir novos cadastros neste estado\n- Manter anúncios existentes ativos\n\nEsta ação pode ser revertida a qualquer momento.`;

    if (confirm(confirmMessage)) {
        if (statesManager.toggleState(stateCode, false)) {
            showNotification(`Estado ${stateConfig.name} desativado.`, 'warning');
            loadStatesData(); // Recarregar dados
            loadDashboardData(); // Atualizar dashboard
        } else {
            alert('Erro ao desativar estado!');
        }
    }
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Adicionar estilos se não existirem
    if (!document.getElementById('notificationStyles')) {
        const styles = document.createElement('style');
        styles.id = 'notificationStyles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 15px 20px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 300px;
                border-left: 4px solid #3498db;
                animation: slideIn 0.3s ease;
            }
            .notification-success { border-left-color: #28a745; }
            .notification-warning { border-left-color: #ffc107; }
            .notification-error { border-left-color: #dc3545; }
            .notification-content { display: flex; align-items: center; gap: 10px; flex: 1; }
            .notification-close { background: none; border: none; cursor: pointer; color: #6c757d; }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
        document.head.appendChild(styles);
    }

    // Adicionar ao DOM
    document.body.appendChild(notification);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Adicionar gestão de estados ao switch de seções
const originalSwitchSection = switchSection;
switchSection = function(sectionName) {
    originalSwitchSection(sectionName);

    // Carregar dados específicos da seção de estados
    if (sectionName === 'states') {
        // Carregar script de estados se não estiver carregado
        if (!window.statesManager) {
            const script = document.createElement('script');
            script.src = 'states-config.js';
            script.onload = () => loadStatesData();
            document.head.appendChild(script);
        } else {
            loadStatesData();
        }
    }
};

// ===== GESTÃO DE ESTADOS UNIFICADA =====

// Carregar dados dos estados
function loadStatesData() {
    console.log('🗺️ Carregando dados dos estados...');

    // Verificar se o states-config.js está carregado
    if (typeof statesManager === 'undefined') {
        console.error('❌ states-config.js não carregado');
        return;
    }

    const states = statesManager.getAllStates();
    const activeStates = statesManager.getActiveStates();
    const cities = JSON.parse(localStorage.getItem('cities')) || [];
    const activeCities = cities.filter(city => city.status === 'active');
    const ads = JSON.parse(localStorage.getItem('announcements')) || [];
    const activeAds = ads.filter(ad => ad.status === 'active');

    // Atualizar estatísticas
    document.getElementById('totalStatesCount').textContent = Object.keys(states).length;
    document.getElementById('activeStatesCount').textContent = Object.keys(activeStates).length;
    document.getElementById('totalCitiesCount').textContent = activeCities.length;
    document.getElementById('activeAdsCount').textContent = activeAds.length;

    // Renderizar grid de estados
    renderStatesGrid(states);

    console.log('✅ Estados carregados:', Object.keys(states).length);
}

// Renderizar grid de estados
function renderStatesGrid(states) {
    const grid = document.getElementById('statesGrid');
    if (!grid) return;

    grid.innerHTML = '';

    Object.entries(states).forEach(([code, state]) => {
        const isActive = state.enabled;
        const citiesCount = state.cities ? state.cities.length : 0;

        const stateCard = document.createElement('div');
        stateCard.className = `state-card ${isActive ? 'active' : 'inactive'}`;

        stateCard.innerHTML = `
            <div class="state-header">
                <h3 class="state-title">${state.brand || `Desejos${code}`}</h3>
                <span class="state-status ${isActive ? 'active' : 'inactive'}">
                    ${isActive ? 'Ativo' : 'Inativo'}
                </span>
            </div>

            <div class="state-info">
                <div class="state-info-item">
                    <span class="state-info-label">Estado:</span>
                    <span class="state-info-value">${state.name} (${code})</span>
                </div>
                <div class="state-info-item">
                    <span class="state-info-label">Cidades:</span>
                    <span class="state-info-value">${citiesCount} cidades</span>
                </div>
                <div class="state-info-item">
                    <span class="state-info-label">Domínio:</span>
                    <span class="state-info-value">${state.domain || 'Não definido'}</span>
                </div>
                <div class="state-info-item">
                    <span class="state-info-label">Cor:</span>
                    <span class="state-info-value">
                        <span style="display: inline-block; width: 20px; height: 20px; background: ${state.color}; border-radius: 4px; vertical-align: middle;"></span>
                        ${state.color}
                    </span>
                </div>
                ${state.enabledAt ? `
                <div class="state-info-item">
                    <span class="state-info-label">Ativado em:</span>
                    <span class="state-info-value">${state.enabledAt}</span>
                </div>
                ` : ''}
            </div>

            <div class="state-actions">
                <button class="btn btn-sm ${isActive ? 'btn-warning' : 'btn-success'}"
                        onclick="toggleState('${code}')">
                    <i class="fas fa-${isActive ? 'pause' : 'play'}"></i>
                    ${isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn btn-sm btn-primary" onclick="editState('${code}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-info" onclick="manageCities('${code}')">
                    <i class="fas fa-city"></i> Cidades
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteState('${code}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;

        grid.appendChild(stateCard);
    });
}

// Alternar status do estado
function toggleState(stateCode) {
    if (!confirm(`Tem certeza que deseja alterar o status do estado ${stateCode}?`)) {
        return;
    }

    const success = statesManager.toggleState(stateCode);
    if (success) {
        showNotification(`Estado ${stateCode} ${success.enabled ? 'ativado' : 'desativado'} com sucesso!`, 'success');
        loadStatesData();

        // Atualizar painel anunciante se necessário
        updateAnnouncerStates();
    } else {
        showNotification('Erro ao alterar status do estado', 'error');
    }
}

// Abrir modal para adicionar estado
function openAddStateModal() {
    document.getElementById('stateModalTitle').textContent = 'Adicionar Estado';
    document.getElementById('stateForm').reset();
    document.getElementById('stateModal').style.display = 'block';

    // Limpar campo de edição
    document.getElementById('stateForm').removeAttribute('data-editing');
}

// Editar estado
function editState(stateCode) {
    const states = statesManager.getAllStates();
    const state = states[stateCode];

    if (!state) {
        showNotification('Estado não encontrado', 'error');
        return;
    }

    document.getElementById('stateModalTitle').textContent = 'Editar Estado';
    document.getElementById('stateCode').value = stateCode;
    document.getElementById('stateName').value = state.name;
    document.getElementById('stateBrand').value = state.brand;
    document.getElementById('stateDomain').value = state.domain || '';
    document.getElementById('stateColor').value = state.color;
    document.getElementById('stateStatus').value = state.enabled.toString();
    document.getElementById('stateCities').value = state.cities ? state.cities.join(', ') : '';

    // Marcar como edição
    document.getElementById('stateForm').setAttribute('data-editing', stateCode);
    document.getElementById('stateModal').style.display = 'block';
}

// Salvar estado
function saveState() {
    const form = document.getElementById('stateForm');
    const isEditing = form.getAttribute('data-editing');

    const stateData = {
        code: document.getElementById('stateCode').value.toUpperCase(),
        name: document.getElementById('stateName').value,
        brand: document.getElementById('stateBrand').value,
        domain: document.getElementById('stateDomain').value,
        color: document.getElementById('stateColor').value,
        enabled: document.getElementById('stateStatus').value === 'true',
        cities: document.getElementById('stateCities').value
            .split(',')
            .map(city => city.trim())
            .filter(city => city.length > 0)
    };

    // Validação
    if (!stateData.code || !stateData.name || !stateData.brand) {
        showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }

    let success;
    if (isEditing) {
        success = statesManager.updateState(isEditing, stateData);
    } else {
        success = statesManager.addState(stateData.code, stateData);
    }

    if (success) {
        showNotification(`Estado ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
        closeStateModal();
        loadStatesData();
        updateAnnouncerStates();
    } else {
        showNotification(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} estado`, 'error');
    }
}

// Fechar modal de estado
function closeStateModal() {
    document.getElementById('stateModal').style.display = 'none';
    document.getElementById('stateForm').reset();
    document.getElementById('stateForm').removeAttribute('data-editing');
}

// Excluir estado
function deleteState(stateCode) {
    if (!confirm(`Tem certeza que deseja excluir o estado ${stateCode}? Esta ação não pode ser desfeita.`)) {
        return;
    }

    const success = statesManager.removeState(stateCode);
    if (success) {
        showNotification(`Estado ${stateCode} excluído com sucesso!`, 'success');
        loadStatesData();
        updateAnnouncerStates();
    } else {
        showNotification('Erro ao excluir estado', 'error');
    }
}

// Gerenciar cidades de um estado
function manageCities(stateCode) {
    const states = statesManager.getAllStates();
    const state = states[stateCode];

    if (!state) {
        showNotification('Estado não encontrado', 'error');
        return;
    }

    // Abrir modal de gerenciamento de cidades
    openBulkCityModal();

    // Selecionar o estado
    const stateSelect = document.getElementById('bulkStateSelect');
    stateSelect.value = stateCode;

    // Carregar cidades do estado
    loadStateCities();
}

// Abrir modal de gerenciamento de cidades
function openBulkCityModal() {
    // Carregar estados no select
    const stateSelect = document.getElementById('bulkStateSelect');
    const states = statesManager.getAllStates();

    stateSelect.innerHTML = '<option value="">Selecione um estado</option>';
    Object.entries(states).forEach(([code, state]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${state.name} (${code})`;
        stateSelect.appendChild(option);
    });

    document.getElementById('bulkCityModal').style.display = 'block';
}

// Fechar modal de cidades
function closeBulkCityModal() {
    document.getElementById('bulkCityModal').style.display = 'none';
    document.getElementById('citiesList').innerHTML = '';
}

// Carregar cidades do estado selecionado
function loadStateCities() {
    const stateCode = document.getElementById('bulkStateSelect').value;
    const citiesList = document.getElementById('citiesList');

    if (!stateCode) {
        citiesList.innerHTML = '<p>Selecione um estado para ver as cidades</p>';
        return;
    }

    const states = statesManager.getAllStates();
    const state = states[stateCode];

    if (!state || !state.cities) {
        citiesList.innerHTML = '<p>Nenhuma cidade encontrada para este estado</p>';
        return;
    }

    citiesList.innerHTML = state.cities.map((city, index) => `
        <div class="city-item" data-index="${index}">
            <span class="city-name">${city}</span>
            <div>
                <button class="btn btn-sm btn-danger" onclick="removeCity('${stateCode}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Adicionar nova cidade
function addNewCity() {
    const stateCode = document.getElementById('bulkStateSelect').value;

    if (!stateCode) {
        showNotification('Selecione um estado primeiro', 'error');
        return;
    }

    const cityName = prompt('Nome da nova cidade:');
    if (!cityName || !cityName.trim()) {
        return;
    }

    const success = statesManager.addCityToState(stateCode, cityName.trim());
    if (success) {
        showNotification('Cidade adicionada com sucesso!', 'success');
        loadStateCities();
        loadStatesData();
    } else {
        showNotification('Erro ao adicionar cidade', 'error');
    }
}

// Remover cidade
function removeCity(stateCode, cityIndex) {
    if (!confirm('Tem certeza que deseja remover esta cidade?')) {
        return;
    }

    const success = statesManager.removeCityFromState(stateCode, cityIndex);
    if (success) {
        showNotification('Cidade removida com sucesso!', 'success');
        loadStateCities();
        loadStatesData();
    } else {
        showNotification('Erro ao remover cidade', 'error');
    }
}

// Salvar alterações em massa das cidades
function saveBulkCities() {
    showNotification('Alterações salvas com sucesso!', 'success');
    closeBulkCityModal();
    loadStatesData();
}

// Exportar dados dos estados
function exportStatesData() {
    const states = statesManager.getAllStates();
    const cities = JSON.parse(localStorage.getItem('cities')) || [];

    const exportData = {
        states: states,
        cities: cities,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `estados-cidades-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Dados exportados com sucesso!', 'success');
}

// Sincronizar com config
function syncWithConfig() {
    if (!confirm('Tem certeza que deseja sincronizar com o arquivo de configuração? Isso pode sobrescrever alterações locais.')) {
        return;
    }

    // Recarregar states-config.js
    const script = document.createElement('script');
    script.src = 'states-config.js?t=' + Date.now();
    script.onload = () => {
        loadStatesData();
        showNotification('Sincronização concluída!', 'success');
    };
    script.onerror = () => {
        showNotification('Erro ao sincronizar configuração', 'error');
    };
    document.head.appendChild(script);
}

// Atualizar estados disponíveis no painel anunciante
function updateAnnouncerStates() {
    // Esta função será chamada sempre que houver mudanças nos estados
    // para garantir que o painel anunciante seja atualizado
    console.log('🔄 Atualizando estados disponíveis para anunciantes...');

    // Disparar evento customizado para outros sistemas
    window.dispatchEvent(new CustomEvent('statesUpdated', {
        detail: {
            activeStates: statesManager.getActiveStates(),
            timestamp: Date.now()
        }
    }));
}

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    // Definir cor baseada no tipo
    switch (type) {
        case 'success':
            notification.style.background = '#28a745';
            break;
        case 'error':
            notification.style.background = '#dc3545';
            break;
        case 'warning':
            notification.style.background = '#ffc107';
            notification.style.color = '#333';
            break;
        default:
            notification.style.background = '#17a2b8';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Inicializar gestão de estados quando a seção for mostrada
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na seção de estados
    const statesSection = document.getElementById('states-section');
    if (statesSection) {
        // Carregar dados quando a seção de estados for ativada
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (statesSection.classList.contains('active')) {
                        loadStatesData();
                    }
                }
            });
        });

        observer.observe(statesSection, { attributes: true });
    }
});