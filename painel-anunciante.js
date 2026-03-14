// Variáveis globais
let currentStep = 1;
let selectedPlan = null;
let adData = {
    title: '',
    city: '',
    age: '',
    price: '',
    category: '',
    whatsapp: '',
    description: '',
    services: [],
    availability: '24h',
    serviceType: 'motel',
    photos: []
};

// Função para resetar dados do formulário
function resetAdData() {
    adData = {
        title: '',
        city: '',
        age: '',
        price: '',
        category: '',
        whatsapp: '',
        description: '',
        services: [],
        availability: '24h',
        serviceType: 'motel',
        photos: []
    };
    selectedPlan = null;
    currentStep = 1;
    console.log('Dados do formulário resetados');
}

// Logout simples (ambiente front): limpa sessão do anunciante
function logoutUser() {
    try {
        // Se tiver algum token/sessão, limpar
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userVerified');
        // Manter anúncios e configs
        alert('Você saiu da sua conta.');
        window.location.href = 'index.html';
    } catch (e) {
        window.location.href = 'index.html';
    }
}

// Função para carregar planos do sistema centralizado
function loadPlansFromConfig() {
    console.log('=== CARREGANDO PLANOS DO SISTEMA CENTRALIZADO ===');

    if (typeof window.PlansManager === 'undefined') {
        console.log('PlansManager não encontrado, usando planos padrão');
        return;
    }

    const activePlans = window.PlansManager.getActivePlans();
    console.log('Planos ativos encontrados:', activePlans.length);

    // Atualizar planos na interface
    activePlans.forEach(plan => {
        updatePlanCard(plan);
    });

    console.log('Planos carregados com sucesso!');
}

// Função para atualizar card de plano na interface
function updatePlanCard(plan) {
    const planCard = document.querySelector(`[data-plan="${plan.type}"]`);
    if (!planCard) {
        console.log(`Card do plano ${plan.type} não encontrado`);
        return;
    }

    // Atualizar preço
    const priceElement = planCard.querySelector('.price');
    if (priceElement) {
        priceElement.textContent = `R$ ${plan.price.toFixed(2).replace('.', ',')}`;
    }

    // Atualizar nome
    const nameElement = planCard.querySelector('h4');
    if (nameElement) {
        nameElement.textContent = plan.name.toUpperCase();
    }

    // Atualizar ícone
    const iconElement = planCard.querySelector('.plan-header i');
    if (iconElement && plan.icon) {
        iconElement.className = plan.icon;
    }

    // Atualizar features
    const featuresContainer = planCard.querySelector('.plan-features');
    if (featuresContainer && plan.features) {
        featuresContainer.innerHTML = '';
        plan.features.forEach(feature => {
            const featureDiv = document.createElement('div');
            featureDiv.className = 'feature';
            featureDiv.innerHTML = `
                <i class="fas fa-check"></i>
                <span>${feature}</span>
            `;
            featuresContainer.appendChild(featureDiv);
        });
    }

    console.log(`Card do plano ${plan.type} atualizado`);
}



// Inicialização
document.addEventListener('DOMContentLoaded', async function () {
    console.log('=== INICIALIZAÇÃO DO PAINEL DO ANUNCIANTE ===');

    if (window.syncSupabaseToLocal) {
        await window.syncSupabaseToLocal();
    }

    // RESET INICIAL: não apagar rascunho; apenas normalizar se corrompido
    console.log('🧹 Executando reset inicial...');
    localStorage.removeItem('tempPlan');
    localStorage.removeItem('tempSelectedPlan');
    // preservar 'tempAdCreation' como rascunho para continuar depois
    sessionStorage.removeItem('formStep');

    // Resetar variáveis globais
    currentStep = 1;
    selectedPlan = null;
    adData = {
        title: '',
        city: '',
        age: '',
        price: '',
        category: '',
        whatsapp: '',
        description: '',
        services: [],
        availability: '24h',
        serviceType: 'motel',
        photos: []
    };

    console.log('✅ Reset inicial concluído');

    // Inicializar configuração do site
    initSiteConfig();

    // Definir status de verificação padrão se não existir
    if (!localStorage.getItem('userVerified')) {
        localStorage.setItem('userVerified', 'false');
    }

    // Garantir dados mínimos do usuário no storage (fallback para ambiente de teste)
    if (!localStorage.getItem('userEmail')) {
        localStorage.setItem('userEmail', 'teste@desejosms.com');
    }
    if (!localStorage.getItem('userName')) {
        localStorage.setItem('userName', 'João Silva');
    }
    if (!localStorage.getItem('userVerified')) {
        localStorage.setItem('userVerified', 'false');
    }

    loadDashboardStats();
    loadUserAds();
    loadPlansFromConfig(); // Carregar planos do sistema centralizado
    setupEventListeners();
    generateVerificationCode();
    loadAvailableStates(); // Carregar estados disponíveis

    // Listener para atualizações de estados do admin
    window.addEventListener('statesUpdated', function (event) {
        console.log('🔄 Estados atualizados pelo admin, recarregando estados...');
        loadAvailableStates();
    });

    // Verificar periodicamente se há atualizações nos estados
    setInterval(() => {
        if (typeof statesManager !== 'undefined') {
            loadAvailableStates();
        }
    }, 30000); // Verificar a cada 30 segundos

    // Restaurar rascunho se existir
    try {
        const saved = JSON.parse(localStorage.getItem('tempAdCreation') || 'null');
        if (saved && saved.adData) {
            adData = { ...adData, ...saved.adData };
            adData.photos = adData.photos || [];
            selectedPlan = saved.selectedPlan || selectedPlan;
            currentStep = saved.currentStep || 1;
            console.log('📝 Rascunho restaurado do localStorage (leve)');
        }
    } catch (e) { console.warn('Falha ao restaurar rascunho:', e); }

    // Configurar botão próximo inicialmente desabilitado
    setupNextButton();

    // Configurar modal de criação de anúncio
    setupCreateAdModal();

    console.log('🎉 Painel do anunciante inicializado com sucesso!');

    loadUserNotifications();

    // -------------------------------------------------------------
    // RENOVAÇÃO AUTOMÁTICA (Link do E-mail/WhatsApp)
    // -------------------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const renewId = urlParams.get('renew');
    if (renewId) {
        console.log(`⏳ Link de renovação detectado para o ID: ${renewId}`);
        setTimeout(() => triggerRenewalProtocol(renewId), 1500);
    }
});

// Protocolo de Renovação Rápida
async function triggerRenewalProtocol(adId) {
    if (!window.supabaseClient) return;
    try {
        const { data: ad, error } = await window.supabaseClient
            .from('announcements')
            .select('*')
            .eq('id', adId)
            .single();

        if (error || !ad) {
            alert('Anúncio não encontrado para renovação.');
            return;
        }

        // Abastecer os dados globais para que o gerador de PIX saiba o que cobrar
        adData = {
            id: ad.id,
            name: ad.name,
            city: ad.city,
            category: ad.category
        };
        selectedPlan = ad.plan_type || 'premium';

        // Exibir modal de confirmação e pagamento logo de cara
        alert(`Bem-vindo de volta! Prontos para renovar o anúncio "${ad.name}" em ${ad.city}?`);
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('active'); // caso use class
            // Gerar o QR code imediatamente
            if (typeof generatePIX === 'function') {
                generatePIX();
            }
        }
    } catch (err) {
        console.error('Erro na renovação rápida:', err);
    }
}

// Configurar event listeners
function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');

    // Tabs de navegação
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Seleção de planos - Configuração robusta
    setupPlanSelection();

    // Upload de fotos
    setupPhotoUpload();

    // Payment tabs
    const paymentTabs = document.querySelectorAll('.payment-tabs .tab-btn');
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            switchPaymentMethod(this);
        });
    });

    console.log('✅ Event listeners configurados');
}

// Continuar criação a partir do rascunho
function continueDraft() {
    try {
        const draft = JSON.parse(localStorage.getItem('tempAdCreation') || 'null');
        if (!draft || !draft.adData) { alert('Rascunho não encontrado.'); return; }
        adData = draft.adData;
        selectedPlan = draft.selectedPlan || selectedPlan;
        currentStep = draft.currentStep || 1;
        showCreateAdModal();
        updateProgressBar();
        showStep(currentStep);
        updateStepButtons();
    } catch (e) { console.error(e); alert('Falha ao continuar o rascunho.'); }
}

// Descartar rascunho salvo
function discardDraft() {
    if (!confirm('Deseja remover este rascunho?')) return;
    localStorage.removeItem('tempAdCreation');
    loadUserAds();
}

// Simular envio de e-mail para lembrar do rascunho
function sendDraftReminderEmail() {
    const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';
    // Tenta enviar via webhook (se configurado em payment-config)
    const gateways = JSON.parse(localStorage.getItem('paymentGateways') || '[]');
    const custom = gateways.find(g => g.type === 'custom' && g.status === 'active' && g.webhook);
    const payload = {
        to: userEmail,
        subject: 'Finalize seu anúncio no DesejosMS',
        body: 'Olá! Você iniciou a criação de um anúncio e ficou em rascunho. Clique para continuar e finalizar.'
    };
    if (custom && custom.webhook) {
        try {
            fetch(custom.webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'draft_reminder', data: payload })
            }).then(() => {
                alert('Lembrete enviado para ' + userEmail + ' (webhook).');
            }).catch(() => {
                // fallback local
                const queue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
                queue.push({ id: Date.now(), ...payload, createdAt: new Date().toISOString(), status: 'queued' });
                localStorage.setItem('emailQueue', JSON.stringify(queue));
                alert('Lembrete enfileirado (simulado). Configure o webhook para envio real.');
            });
            return;
        } catch (e) { }
    }
    // Sem webhook: simular fila local
    const queue = JSON.parse(localStorage.getItem('emailQueue') || '[]');
    queue.push({ id: Date.now(), ...payload, createdAt: new Date().toISOString(), status: 'queued' });
    localStorage.setItem('emailQueue', JSON.stringify(queue));
    alert('Lembrete enfileirado (simulado). Configure o webhook em Configuração de Pagamentos > Gateway Personalizado.');
}

// Configurar seleção de planos
function setupPlanSelection() {
    console.log('🎯 Configurando seleção de planos...');

    // Remover event listeners existentes
    document.querySelectorAll('.plan-card').forEach(card => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
    });

    // Adicionar novos event listeners
    document.querySelectorAll('.plan-card').forEach(card => {
        card.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📋 Plano clicado:', this.getAttribute('data-plan'));
            selectPlan(this);
        });

        // Adicionar hover effects
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    console.log('✅ Seleção de planos configurada');
}

// Configurar upload de fotos e vídeo
function setupPhotoUpload() {
    console.log('📸 Configurando upload de fotos e vídeos...');

    const uploadZone = document.getElementById('uploadZone');
    
    // Remover listeners do input de foto usando cloneNode
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        const newPhotoInput = photoInput.cloneNode(true);
        photoInput.parentNode.replaceChild(newPhotoInput, photoInput);
        newPhotoInput.addEventListener('change', (e) => {
            console.log('📁 Arquivos selecionados:', e.target.files.length);
            handleFiles(e.target.files);
        });
        console.log('✅ Photo input configurado');
    }

    if (uploadZone) {
        // Remover event listeners existentes
        const newUploadZone = uploadZone.cloneNode(true);
        uploadZone.parentNode.replaceChild(newUploadZone, uploadZone);

        // Adicionar novos event listeners
        newUploadZone.addEventListener('click', (e) => {
            e.preventDefault();
            const currentPhotoInput = document.getElementById('photoInput');
            if (currentPhotoInput) {
                currentPhotoInput.click();
            }
        });

        newUploadZone.addEventListener('dragover', handleDragOver);
        newUploadZone.addEventListener('drop', handleDrop);

        console.log('✅ Upload zone configurada');
    }
    
    // Configurar upload e preview de vídeo
    const videoInput = document.getElementById('videoInput');
    if (videoInput) {
        const newVideoInput = videoInput.cloneNode(true);
        videoInput.parentNode.replaceChild(newVideoInput, videoInput);
        newVideoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                if (file.size > 20 * 1024 * 1024) { // 20MB
                    alert('O vídeo deve ter no máximo 20MB.');
                    newVideoInput.value = '';
                    return;
                }
                const videoPreview = document.getElementById('videoPreview');
                if (videoPreview) {
                    const videoUrl = URL.createObjectURL(file);
                    videoPreview.innerHTML = `
                        <video src="${videoUrl}" controls style="width: 100%; max-height: 200px; border-radius: 8px; margin-top: 10px;"></video>
                        <button type="button" onclick="document.getElementById('videoInput').value=''; document.getElementById('videoPreview').innerHTML=''; delete adData.video;" style="margin-top: 5px; background: red; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Remover Vídeo
                        </button>
                    `;
                }
                const reader = new FileReader();
                reader.onload = function(evt) { adData.video = evt.target.result; };
                reader.readAsDataURL(file);
            }
        });
        console.log('✅ Video input configurado');
    }
}

// Configurar modal de criação de anúncio
function setupCreateAdModal() {
    console.log('🪟 Configurando modal de criação de anúncio...');

    // Configurar botões do modal
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (nextBtn) {
        // Remover event listeners existentes
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        // Adicionar novo event listener
        newNextBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('➡️ Botão próximo clicado');
            nextStep();
        });

        // Garantir que o onclick seja preservado
        newNextBtn.onclick = nextStep;

        // Configurar estado inicial
        newNextBtn.disabled = true;
        newNextBtn.style.opacity = '0.5';
        newNextBtn.style.cursor = 'not-allowed';
        newNextBtn.title = 'Selecione um plano para continuar';

        console.log('✅ Botão próximo configurado');
    }

    if (prevBtn) {
        // Remover event listeners existentes
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

        // Adicionar novo event listener
        newPrevBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('⬅️ Botão anterior clicado');
            previousStep();
        });

        // Garantir que o onclick seja preservado
        newPrevBtn.onclick = previousStep;

        console.log('✅ Botão anterior configurado');
    }

    // Configurar campos do formulário
    setupFormFields();

    console.log('✅ Modal de criação configurado');
}

// Configurar campos do formulário
function setupFormFields() {
    console.log('📝 Configurando campos do formulário...');

    const formFields = [
        'adTitle', 'adCity', 'adAge', 'adPrice', 'adCategory', 'adWhatsApp', 'adDescription'
    ];

    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Adicionar event listener para validação em tempo real
            field.addEventListener('input', function () {
                validateField(this);
            });

            // Adicionar event listener para blur
            field.addEventListener('blur', function () {
                validateField(this);
            });

            console.log(`✅ Campo ${fieldId} configurado`);
        }
    });
}

// Validar campo individual
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.getAttribute('placeholder') || field.name || 'Campo';

    // Remover classes de erro anteriores
    field.classList.remove('error', 'success');

    if (!value) {
        field.classList.add('error');
        field.title = `${fieldName} é obrigatório`;
        return false;
    } else {
        field.classList.add('success');
        field.title = `${fieldName} preenchido corretamente`;
        return true;
    }
}

// Configurar botão próximo inicialmente desabilitado
function setupNextButton() {
    console.log('🔘 Configurando botão próximo...');

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
        nextBtn.style.cursor = 'not-allowed';
        nextBtn.title = 'Selecione um plano para continuar';
        console.log('✅ Botão próximo configurado como desabilitado');
    } else {
        console.warn('⚠️ Botão próximo não encontrado');
    }
}

// Função para sincronizar status de verificação em todo o sistema
function syncVerificationStatus() {
    // Determinar email atual
    const currentEmail = (localStorage.getItem('userEmail') || 'teste@desejosms.com').toLowerCase();
    let isVerified = localStorage.getItem('userVerified') === 'true';
    let createdAt = null;
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const u = users.find(x => (x.email || '').toLowerCase() === currentEmail);
        if (u) {
            if (typeof u.verified === 'boolean') {
                isVerified = !!u.verified;
                localStorage.setItem('userVerified', isVerified.toString());
            }
            if (u.name) localStorage.setItem('userName', u.name);
            if (u.phone) localStorage.setItem('userPhone', u.phone);
            if (u.age != null) localStorage.setItem('userAge', String(u.age));
            if (u.category) localStorage.setItem('userCategory', u.category);
            
            // Obter data de criação
            if (u.createdAt) {
                createdAt = u.createdAt.seconds ? new Date(u.createdAt.seconds * 1000) : new Date(u.createdAt);
            }
        }
    } catch (e) { /* ignora */ }

    // Buscar status de verificação mais recente
    let latestVerification = null;
    try {
        const verifs = JSON.parse(localStorage.getItem('verifications') || '[]');
        const mine = verifs.filter(v => (v.userEmail || '').toLowerCase() === currentEmail);
        if (mine.length > 0) {
            mine.sort((a, b) => new Date(b.submittedAt || b.approvedAt || b.rejectedAt || 0) - new Date(a.submittedAt || a.approvedAt || a.rejectedAt || 0));
            latestVerification = mine[0];
            if (latestVerification.status === 'approved' && !isVerified) {
                isVerified = true;
                localStorage.setItem('userVerified', 'true');
            }
        }
    } catch (_) { }

    // Dashboard
    const dashboardStatus = document.getElementById('accountStatus');
    const dashboardNotice = document.getElementById('accountStatusNotice');
    
    if (dashboardStatus) {
        if (isVerified) {
            dashboardStatus.textContent = 'Verificada';
            dashboardStatus.className = 'stat-number';
            dashboardStatus.style.color = '#fff';
            if (dashboardNotice) dashboardNotice.innerHTML = '<i class="fas fa-check-circle"></i> Conta Protegida';
        } else {
            // Lógica de prazo de 10 dias para o dashboard
            const GRACE_PERIOD_DAYS = 10;
            let daysLeft = GRACE_PERIOD_DAYS;
            if (createdAt) {
                const now = new Date();
                const diffTime = Math.abs(now - createdAt);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                daysLeft = GRACE_PERIOD_DAYS - diffDays;
            }
            
            dashboardStatus.textContent = 'Não Verificada';
            dashboardStatus.style.color = daysLeft <= 2 ? '#ff4d4d' : '#fff';
            
            if (dashboardNotice) {
                if (daysLeft <= 0) {
                    dashboardNotice.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Prazo esgotado! Sua conta será excluída em breve.`;
                } else {
                    dashboardNotice.innerHTML = `<i class="fas fa-clock"></i> Você tem <strong>${daysLeft} dias</strong> para verificar sua conta, após esse período sua conta será excluída.`;
                }
                dashboardNotice.style.color = '#fff';
            }
        }
    }
    // Perfil label
    const profileStatus = document.getElementById('verificationStatus');
    if (profileStatus) {
        if (isVerified) {
            profileStatus.innerHTML = '<i class="fas fa-check-circle"></i> Verificada';
            profileStatus.className = 'status-verified';
        } else {
            profileStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Não Verificada';
            profileStatus.className = 'status-not-verified';
        }
    }
    // Card amarelo -> estados
    const card = document.getElementById('verificationCard');
    const msg = document.getElementById('verificationCardMsg');
    const actions = document.getElementById('verificationCardActions');
    if (card && msg && actions) {
        if (isVerified) {
            card.style.background = '#d4edda';
            card.style.border = '1px solid #c3e6cb';
            card.style.color = '#155724';
            msg.textContent = 'Conta verificada! Você já pode criar e gerenciar anúncios.';
            actions.innerHTML = '<span style="font-weight:700; color:#155724;"><i class="fas fa-check"></i> Aprovado</span>';
        } else if (latestVerification && latestVerification.status === 'pending') {
            card.style.background = '#fff3cd';
            card.style.border = '1px solid #ffeeba';
            card.style.color = '#856404';
            msg.textContent = 'Seus documentos foram enviados e estão em análise.';
            actions.innerHTML = '<span style="font-weight:700; color:#856404;"><i class="fas fa-hourglass-half"></i> Em análise</span>';
        } else if (latestVerification && latestVerification.status === 'rejected') {
            card.style.background = '#f8d7da';
            card.style.border = '1px solid #f5c6cb';
            card.style.color = '#721c24';
            const reason = latestVerification.adminNotes || 'Documentos rejeitados. Envie novamente.';
            msg.textContent = 'Reprovado: ' + reason;
            actions.innerHTML = '<button class="btn btn-primary" onclick="showVerificationModal()"><i class="fas fa-id-card"></i> Enviar novamente</button>';
        } else {
            // Lógica de prazo de 10 dias
            const GRACE_PERIOD_DAYS = 10;
            let daysLeft = GRACE_PERIOD_DAYS;
            
            if (createdAt) {
                const now = new Date();
                const diffTime = Math.abs(now - createdAt);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                daysLeft = GRACE_PERIOD_DAYS - diffDays;
            }
            
            card.style.background = daysLeft <= 2 ? '#fff0f0' : '#fff3cd';
            card.style.border = daysLeft <= 2 ? '1px solid #ffcccc' : '1px solid #ffeeba';
            card.style.color = daysLeft <= 2 ? '#b30000' : '#856404';
            
            if (daysLeft <= 0) {
                msg.innerHTML = `<strong>⚠️ PRAZO ESGOTADO:</strong> Sua conta expirou! Seus anúncios estão ocultos e <strong>o perfil será excluído permanentemente</strong> por falta de verificação.`;
            } else {
                msg.innerHTML = `<strong>🛡️ VERIFICAÇÃO PENDENTE:</strong> Você tem <strong>${daysLeft} dias</strong> para verificar sua conta. Após esse prazo, seu perfil será <strong>excluído</strong>.<br><small><i>Aviso: Seus anúncios só ficam visíveis após a verificação, mesmo se já estiverem pagos.</i></small>`;
            }
            
            actions.innerHTML = '<button class="btn btn-primary" onclick="showVerificationModal()"><i class="fas fa-id-card"></i> Verificar Agora</button>';
        }
    }
}

// Ouvir mudanças vindas do admin (ou outras abas)
window.addEventListener('storage', function (e) {
    if (e.key === 'users' || e.key === 'verifications' || e.key === 'userVerified') {
        try { syncVerificationStatus(); loadDashboardStats(); } catch (_) { }
    }
});

// Função para carregar estatísticas do dashboard
function loadDashboardStats() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';

    const userAds = announcements.filter(ad => ad.userEmail === userEmail);
    const activeAds = userAds.filter(ad => ad.status === 'active');
    const pendingAds = userAds.filter(ad => ad.status === 'pending');

    // Calcular total de visualizações
    const totalViews = userAds.reduce((sum, ad) => sum + (ad.views || 0), 0);

    // Atualizar estatísticas (tolerante à ausência dos elementos)
    const totalViewsEl = document.getElementById('totalViews');
    const activeAdsEl = document.getElementById('activeAds');
    const pendingAdsEl = document.getElementById('pendingAds');
    if (totalViewsEl) totalViewsEl.textContent = String(totalViews);
    if (activeAdsEl) activeAdsEl.textContent = String(activeAds.length);
    if (pendingAdsEl) pendingAdsEl.textContent = String(pendingAds.length);

    // Sincronizar status de verificação
    syncVerificationStatus();
}

// Função para carregar anúncios do usuário
function loadUserAds() {
    console.log('=== CARREGANDO ANÚNCIOS DO USUÁRIO ===');
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';
    const userAds = announcements.filter(ad => ad.userEmail === userEmail);

    console.log('Total de anúncios:', announcements.length);
    console.log('Email do usuário:', userEmail);
    console.log('Anúncios do usuário:', userAds.length);
    console.log('Anúncios do usuário:', userAds);

    // Verificar se há anúncios pendentes que precisam de verificação
    const pendingAds = userAds.filter(ad => ad.status === 'pending' && ad.needsVerification);
    if (pendingAds.length > 0) {
        showVerificationReminder(pendingAds.length);
    }

    // Normalizar planType que possam ter sido salvos como objeto
    let normalized = false;
    announcements.forEach(ad => {
        if (ad.planType && typeof ad.planType === 'object') {
            ad.planType = ad.planType.type || 'basic';
            normalized = true;
        }
    });
    if (normalized) {
        localStorage.setItem('announcements', JSON.stringify(announcements));
    }

    const adsTable = document.getElementById('adsTable');
    if (!adsTable) return;

    if (userAds.length === 0) {
        adsTable.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-plus-circle" style="font-size: 48px; margin-bottom: 20px; color: #ddd;"></i>
                <h3>Nenhum anúncio criado</h3>
                <p>Clique em "Criar Anúncio" para começar</p>
            </div>
        `;
        return;
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ANÚNCIO</th>
                    <th>STATUS</th>
                    <th>PERFORMANCE</th>
                    <th>EXPIRAÇÃO</th>
                    <th>PLANO</th>
                    <th>AÇÕES</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Inserir rascunho, se existir
    try {
        const draft = JSON.parse(localStorage.getItem('tempAdCreation') || 'null');
        if (draft && draft.adData) {
            const d = draft.adData;
            const draftPhoto = (d.photos && d.photos[0]) || 'https://via.placeholder.com/50x50/CCCCCC/333333?text=R';
            const draftPlan = (draft.selectedPlan && (draft.selectedPlan.type || draft.selectedPlan)) || 'basic';
            const draftName = d.title && d.title.trim() ? d.title : 'Rascunho de anúncio';
            const draftCity = d.city || 'Cidade não informada';
            tableHTML += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${draftPhoto}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
                            <div>
                                <div style="font-weight: bold;">${draftName}</div>
                                <div style="font-size: 12px; color: #666;">${draftCity}, MS</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge pending">Rascunho</span>
                    </td>
                    <td>
                        <div>—</div>
                        <div style="font-size: 12px; color: #666;">Etapa ${draft.currentStep || 1}/4</div>
                    </td>
                    <td>
                        <div>—</div>
                        <div style="font-size: 12px; color: #666;">—</div>
                    </td>
                    <td>
                        <span class="plan-badge ${draftPlan}">${String(draftPlan).toUpperCase()}</span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="action-btn" onclick="continueDraft()" title="Continuar criação">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="action-btn" onclick="sendDraftReminderEmail()" title="Enviar lembrete por e-mail">
                                <i class="fas fa-envelope"></i>
                            </button>
                            <button class="action-btn" onclick="discardDraft()" title="Descartar rascunho">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (e) { console.warn('Falha ao ler rascunho:', e); }

    userAds.forEach(ad => {
        const daysRemaining = Math.max(0, 30 - Math.floor((Date.now() - new Date(ad.createdAt)) / (1000 * 60 * 60 * 24)));
        const performance = Math.floor((ad.views || 0) / 1000 * 100);

        // Usar primeira foto do anúncio ou placeholder
        const photoSrc = ad.photos && ad.photos.length > 0 ? ad.photos[0] : `https://via.placeholder.com/50x50/FFB6C1/FFFFFF?text=${encodeURIComponent(ad.name.charAt(0))}`;

        tableHTML += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${photoSrc}" 
                             style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
                        <div>
                            <div style="font-weight: bold;">${ad.name}</div>
                            <div style="font-size: 12px; color: #666;">${ad.city}, MS</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${ad.status}">${ad.status === 'active' ? 'Aprovado' : (ad.status === 'paused' ? 'Pausado' : 'Pendente')}</span>
                </td>
                <td>
                    <div>${ad.views || 0} visualizações</div>
                    <div style="font-size: 12px; color: #666;">${performance}%</div>
                </td>
                <td>
                    <div>${daysRemaining} dias</div>
                    <div style="font-size: 12px; color: #666;">${30 - daysRemaining}/30</div>
                </td>
                <td>
                    <span class="plan-badge ${ad.planType}">${ad.planType.toUpperCase()}</span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        ${ad.planType === 'supervip' ? `
                        <button class="action-btn" onclick="editAd(${ad.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        ${(ad.planType === 'top' || ad.planType === 'supervip') ? `
                        <button class="action-btn" onclick="pauseAd(${ad.id})" title="${ad.status === 'paused' ? 'Retomar' : 'Pausar'}">
                            <i class="fas ${ad.status === 'paused' ? 'fa-play' : 'fa-pause'}"></i>
                        </button>
                        ` : ''}
                        ${ad.planType !== 'supervip' ? `
                        <button class="action-btn" onclick="promoteAd(${ad.id})" title="Fazer Upgrade">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    adsTable.innerHTML = tableHTML;
}

// Função para alternar entre tabs
function switchTab(tabName) {
    // Remover classe active de todas as tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    // Adicionar classe active à tab selecionada
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Carregar dados específicos da tab
    if (tabName === 'profile') {
        loadUserProfile();
    } else if (tabName === 'stats') {
        loadUserStats();
    }
}

// Função para carregar perfil do usuário
function loadUserProfile() {
    const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';
    const userName = localStorage.getItem('userName') || 'João Silva';
    const userPhone = localStorage.getItem('userPhone') || 'Não informado';
    const userAge = localStorage.getItem('userAge') || 'Não informada';
    const userCategory = localStorage.getItem('userCategory') || 'Não informada';

    // Gerar ou carregar o REF Único do Anunciante (Nível Nacional)
    let advertiserRef = localStorage.getItem('advertiserRef');
    if (!advertiserRef) {
        // Gerador de ID Único Discreto: REF- + 4 números + Letra do plano/cat
        const randomNum = Math.floor(1000 + Math.random() * 8999);
        const timestamp = Date.now().toString().slice(-2);
        advertiserRef = `REF-${randomNum}${timestamp}`;
        localStorage.setItem('advertiserRef', advertiserRef);
    }

    // Se não existir nada no storage ainda, criar um perfil padrão
    if (!localStorage.getItem('userProfileInitialized')) {
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userPhone', userPhone);
        localStorage.setItem('userAge', userAge);
        localStorage.setItem('userCategory', userCategory);
        localStorage.setItem('userProfileInitialized', 'true');
    }

    // Atualizar informações do perfil
    document.getElementById('userName').textContent = userName;
    document.getElementById('userPhone').textContent = userPhone;
    document.getElementById('userAge').textContent = userAge;
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = userEmail;
    document.getElementById('userCategory').textContent = userCategory;

    // Exibir o ID do Anunciante
    const userRefEl = document.getElementById('userRef');
    if (userRefEl) userRefEl.textContent = advertiserRef;

    // Sincronizar anúncios existentes com este REF (Nível Nacional)
    try {
        const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
        let changed = false;
        announcements.forEach(ad => {
            if (ad.userEmail === userEmail && !ad.advertiserRef) {
                ad.advertiserRef = advertiserRef;
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('announcements', JSON.stringify(announcements));
            console.log('✅ Anúncios existentes sincronizados com o novo REF Anunciante');
        }
    } catch (e) { console.error('Erro ao sincronizar REFs:', e); }

    // Sincronizar status de verificação
    syncVerificationStatus();
}

// Função para carregar estatísticas do usuário
function loadUserStats() {
    console.log('Carregando estatísticas do usuário...');
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';
    const userAds = announcements.filter(ad => ad.userEmail === userEmail);

    if (userAds.length === 0) {
        statsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">Você ainda não possui anúncios ativos para exibir estatísticas.</div>';
        return;
    }

    let html = '';
    userAds.forEach(ad => {
        const views = ad.views || 0;
        // Simulação realista de engajamento do WhatsApp (historicamente entre 10% a 25% das views viram cliques)
        const mockClicks = Math.floor(views * (0.12 + Math.random() * 0.08));

        const formattedCity = (ad.city||'').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        html += `
            <div style="display:flex; flex-direction:column; background: white; border: 1px solid #eeeedd; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); gap: 15px; width:100%; box-sizing: border-box; transition: transform 0.2s;">
                <div style="margin-bottom: 5px;">
                    <h3 style="margin:0; color:#8B0000; font-size: 1.15rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${ad.name}">${ad.name}</h3>
                    <div style="font-size: 0.85rem; color:#666; margin-top: 4px;">
                        <i class="fas fa-map-marker-alt" style="color:#d11b62; margin-right: 4px;"></i>${formattedCity}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="text-align: center; padding: 15px 10px; background: #f8f9fa; border-radius: 8px; border-bottom: 3px solid #6c757d; box-sizing: border-box;">
                        <i class="fas fa-eye" style="font-size: 22px; color: #6c757d; margin-bottom: 10px;"></i>
                        <div style="font-size: 24px; font-weight: 800; color: #333; line-height: 1;">${views}</div>
                        <div style="font-size: 0.75rem; color: #666; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Acessos</div>
                    </div>
                    
                    <div style="text-align: center; padding: 15px 10px; background: #f0fff4; border-radius: 8px; border-bottom: 3px solid #25d366; box-sizing: border-box;">
                        <i class="fab fa-whatsapp" style="font-size: 22px; color: #25d366; margin-bottom: 10px;"></i>
                        <div style="font-size: 24px; font-weight: 800; color: #333; line-height: 1;">${views === 0 ? 0 : mockClicks}</div>
                        <div style="font-size: 0.75rem; color: #666; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">WhatsApp</div>
                    </div>
                </div>
                
                <div style="text-align:center; font-size:0.75rem; color:#aaa; border-top: 1px solid #f5f5f5; padding-top: 12px; margin-top: auto;">
                    <i class="fas fa-sync-alt"></i> Atualizado em tempo real
                </div>
            </div>
        `;
    });

    statsGrid.innerHTML = html;
}

// Função para mostrar modal de criação de anúncio
function showCreateAdModal() {
    console.log('🪟 Abrindo modal de criação de anúncio...');

    try {
        // Bloquear criação se usuário estiver bloqueado
        const usersList = JSON.parse(localStorage.getItem('users') || '[]');
        const currentEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';
        const currentUser = usersList.find(u => u.email === currentEmail);
        if (currentUser && currentUser.blocked) {
            alert('Sua conta está bloqueada pelo administrador. Você não pode criar anúncios.');
            return;
        }
        const modal = document.getElementById('createAdModal');
        if (!modal) {
            console.error('❌ Modal não encontrado');
            alert('Erro: Modal não encontrado. Recarregue a página.');
            return;
        }

        // Sempre carregar estados e limpar o que for básico
        loadAvailableStates();
        
        // Tentar carregar rascunho se existir ou resetar para novo
        if (localStorage.getItem('adCreationDraft')) {
            loadAdDraft();
        } else {
            resetAdForm();
        }

        // Mostrar modal
        modal.classList.add('active');

        // Configurar event listeners do modal
        setupModalEventListeners();

        // Focar no primeiro campo
        setTimeout(() => {
            const firstPlanCard = document.querySelector('.plan-card');
            if (firstPlanCard) {
                firstPlanCard.focus();
            }
        }, 100);

        console.log('✅ Modal aberto com sucesso');

    } catch (error) {
        console.error('❌ Erro ao abrir modal:', error);
        alert('Erro ao abrir modal. Tente novamente.');
    }
}

// Função para salvar rascunho do anúncio
function saveAdDraft() {
    console.log('📝 Salvando rascunho...');
    
    // Não persistir dados binários grandes no localStorage
    const lightweightAdData = { ...adData };
    if (lightweightAdData.photos) delete lightweightAdData.photos;
    if (lightweightAdData.video) delete lightweightAdData.video;

    const draft = {
        currentStep: currentStep,
        selectedPlan: selectedPlan,
        adData: lightweightAdData,
        timestamp: Date.now()
    };
    localStorage.setItem('adCreationDraft', JSON.stringify(draft));
}

// Função para carregar rascunho do anúncio
function loadAdDraft() {
    try {
        const savedDraft = localStorage.getItem('adCreationDraft');
        if (!savedDraft) return;

        const draft = JSON.parse(savedDraft);
        const now = Date.now();
        
        // Se o rascunho for muito antigo (mais de 24h), ignorar
        if (now - draft.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('adCreationDraft');
            return;
        }

        console.log('📦 Carregando rascunho encontrado...');
        currentStep = draft.currentStep || 1;
        selectedPlan = draft.selectedPlan || null;
        adData = draft.adData || adData;
        
        // Garantir que photos exista como array, já que removemos no save
        if (!adData.photos) {
            adData.photos = [];
        }
        Object.keys(adData).forEach(key => {
            const el = document.getElementById('ad' + key.charAt(0).toUpperCase() + key.slice(1));
            if (el && adData[key]) {
                el.value = adData[key];
            }
        });

        // Marcar plano selecionado visualmente
        if (selectedPlan) {
            const planType = typeof selectedPlan === 'object' ? selectedPlan.type : selectedPlan;
            const planCard = document.querySelector(`.plan-card[data-plan="${planType}"]`);
            if (planCard) selectPlan(planCard);
        }

        updateProgressBar();
        showStep(currentStep);

    } catch (e) {
        console.error('Erro ao carregar rascunho:', e);
    }
}

// Configurar event listeners do modal
function setupModalEventListeners() {
    console.log('🔧 Configurando event listeners do modal...');

    // Configurar botão de fechar
    const closeBtn = document.querySelector('#createAdModal .close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => closeModal('createAdModal');
    }

    // Configurar clique fora do modal para fechar
    const modal = document.getElementById('createAdModal');
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal('createAdModal');
            }
        };
    }

    // Configurar botões de navegação
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.onclick = (e) => {
            e.preventDefault();
            handleNextClick();
        };
    }
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            handlePrevClick();
        };
    }

    console.log('✅ Event listeners do modal configurados');
}

// Função para fechar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Função para resetar formulário
function resetAdForm() {
    console.log('🔄 Resetando formulário de anúncio...');

    try {
        // Resetar variáveis globais
        currentStep = 1;
        selectedPlan = null;
        adData = {
            title: '',
            city: '',
            age: '',
            price: '',
            category: '',
            whatsapp: '',
            description: '',
            services: [],
            availability: '24h',
            serviceType: 'motel',
            photos: []
        };

        // Limpar seleção de plano; manter rascunho até finalizar
        localStorage.removeItem('tempSelectedPlan');

        // Atualizar interface
        updateProgressBar();
        showStep(1);

        // Limpar campos do formulário
        const formFields = [
            'adTitle', 'adCity', 'adAge', 'adPrice', 'adCategory', 'adWhatsApp', 'adDescription'
        ];

        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                field.classList.remove('error', 'success');
                field.title = '';
            }
        });

        // Limpar checkboxes de serviços
        document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        // Limpar preview de fotos
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            photoPreview.innerHTML = '';
        }
        
        // Limpar vídeo
        const videoPreview = document.getElementById('videoPreview');
        if (videoPreview) videoPreview.innerHTML = '';
        const videoInput = document.getElementById('videoInput');
        if (videoInput) videoInput.value = '';

        // Limpar seleção de planos
        document.querySelectorAll('.plan-card').forEach(card => {
            card.classList.remove('selected');
            card.style.borderColor = '';
            card.style.backgroundColor = '';
            card.style.transform = '';
            card.style.boxShadow = '';
        });

        // Resetar botão próximo
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
            nextBtn.title = 'Selecione um plano para continuar';
            nextBtn.innerHTML = 'Próximo <i class="fas fa-arrow-right"></i>';
        }

        // Resetar botão anterior
        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.style.display = 'none';
        }

        console.log('✅ Formulário resetado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao resetar formulário:', error);
    }
}

// Função para atualizar barra de progresso
function updateProgressBar() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
        }
    });
}

// Função para mostrar step específico
function showStep(stepNumber) {
    console.log('📖 Mostrando step:', stepNumber);
    document.querySelectorAll('.step-content').forEach(content => content.classList.remove('active'));
    
    // Suporte para IDs de step flexíveis
    const target = document.getElementById(`step${stepNumber}`) || 
                   document.getElementById(`step${stepNumber}-details`) ||
                   (stepNumber === 1 ? document.getElementById('step1') : null);
                   
    if (target) {
        target.classList.add('active');
    }

    // Gerenciar botões de navegação no footer
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!prevBtn || !nextBtn) return;

    // Resetar botões
    prevBtn.style.display = stepNumber === 1 ? 'none' : 'inline-flex';
    
    if (stepNumber === 4) {
        nextBtn.innerHTML = 'Finalizar <i class="fas fa-check" style="margin-left:8px;"></i>';
        nextBtn.classList.add('btn-success');
    } else {
        nextBtn.innerHTML = 'Próximo <i class="fas fa-arrow-right" style="margin-left:8px;"></i>';
        nextBtn.classList.remove('btn-success');
    }
}

// Iniciar navegação por botões (chamado apenas uma vez no setup)
function handleNextClick() {
    if (currentStep === 4) {
        finishAdCreation();
    } else {
        nextStep();
    }
}

function handlePrevClick() {
    previousStep();
}

// Função para próximo step
function nextStep() {
    console.log('=== PRÓXIMO STEP === (De ' + currentStep + ' para ' + (currentStep + 1) + ')');

    try {
        if (currentStep < 4) {
            // Validação específica para cada step
            const validation = validateCurrentStep();

            if (validation.isValid) {
                // Avançar para o próximo step
                currentStep++;
                
                // Salvar rascunho no localStorage
                saveAdDraft();
                saveTemporaryData();

                // Atualizar interface
                updateProgressBar();
                showStep(currentStep);

                // Mostrar feedback de sucesso
                showStepSuccessFeedback();
            } else {
                console.log('❌ Validação falhou:', validation.message);
                showValidationError(validation.message);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao avançar step:', error);
    }
}

// Função para atualizar botões do step
function updateStepButtons() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (nextBtn) {
        if (currentStep === 4) {
            nextBtn.innerHTML = 'Finalizar <i class="fas fa-check"></i>';
            nextBtn.title = 'Finalizar criação do anúncio';
        } else {
            nextBtn.innerHTML = 'Próximo <i class="fas fa-arrow-right"></i>';
            nextBtn.title = 'Avançar para o próximo passo';
        }
    }

    if (prevBtn) {
        prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    }
}

// Função para mostrar feedback de sucesso do step
function showStepSuccessFeedback() {
    const stepNames = {
        1: 'Plano Selecionado',
        2: 'Informações Preenchidas',
        3: 'Fotos Adicionadas',
        4: 'Pronto para Finalizar'
    };

    const stepName = stepNames[currentStep] || 'Step Concluído';

    // Remover feedback anterior
    const existingFeedback = document.querySelector('.step-success-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Criar novo feedback
    const feedback = document.createElement('div');
    feedback.className = 'step-success-feedback';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: #28a745;
        color: white;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(40,167,69,0.3);
    `;

    feedback.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${stepName} com sucesso!
    `;

    document.body.appendChild(feedback);

    // Remover feedback após 3 segundos
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 3000);
}

// Função para step anterior
function previousStep() {
    console.log('=== STEP ANTERIOR === (De ' + currentStep + ' para ' + (currentStep - 1) + ')');
    if (currentStep > 1) {
        currentStep--;
        
        // Salvar rascunho
        saveAdDraft();
        
        updateProgressBar();
        showStep(currentStep);
    }
}

// Função para validar step atual
function validateCurrentStep() {
    console.log('=== VALIDANDO STEP ' + currentStep + ' ===');

    try {
        switch (currentStep) {
            case 1:
                // Validar seleção de plano
                console.log('=== VALIDAÇÃO PASSO 1 ===');
                console.log('Plano selecionado:', selectedPlan);

                const planValidation = validatePlanSelection();
                if (!planValidation.isValid) {
                    return { isValid: false, message: planValidation.message };
                }

                return { isValid: true, message: 'Plano selecionado com sucesso!' };

            case 2:
                // Validar informações básicas
                const title = document.getElementById('adTitle')?.value?.trim() || '';
                const city = document.getElementById('adCity')?.value || '';
                const age = document.getElementById('adAge')?.value || '';
                const price = document.getElementById('adPrice')?.value || '';
                const category = document.getElementById('adCategory')?.value || '';
                const whatsapp = document.getElementById('adWhatsApp')?.value?.trim() || '';
                // descrição será validada no passo 4

                const state = document.getElementById('adState')?.value?.trim() || '';

                console.log('=== VALIDAÇÃO PASSO 2 ===');
                console.log('Título:', title);
                console.log('Estado:', state);
                console.log('Cidade:', city);
                console.log('Idade:', age);
                console.log('Preço:', price);
                console.log('Categoria:', category);
                console.log('WhatsApp:', whatsapp);


                // Validação detalhada com mensagens específicas
                const missingFields = [];

                if (!title || title === '') missingFields.push('Título do Anúncio');
                if (!state || state === '') missingFields.push('Estado');
                if (!city || city === '') missingFields.push('Cidade');
                if (!age || age === '') missingFields.push('Idade');
                if (!price || price === '') missingFields.push('Valor por Hora');
                if (!category || category === '') missingFields.push('Categoria');
                if (!whatsapp || whatsapp === '') missingFields.push('WhatsApp');

                if (missingFields.length > 0) {
                    console.log('Campos faltando:', missingFields);
                    return {
                        isValid: false,
                        message: `Por favor, preencha os seguintes campos:\n\n${missingFields.join('\n')}`
                    };
                }

                // Validar se estado e cidade estão liberados pelo admin
                if (!validateStateAndCity(state, city)) {
                    return {
                        isValid: false,
                        message: 'O estado ou cidade selecionados não estão liberados para anúncios. Por favor, escolha opções disponíveis.'
                    };
                }

                // Salvar dados no adData
                adData.title = title;
                adData.state = state;
                adData.city = city;
                adData.age = parseInt(age);
                adData.price = parseFloat(price);
                adData.category = category;
                adData.whatsapp = whatsapp;

                console.log('Dados salvos no adData:', adData);
                return { isValid: true, message: 'Informações preenchidas com sucesso!' };

            case 3:
                // Validar fotos
                console.log('=== VALIDAÇÃO PASSO 3 ===');
                console.log('Fotos carregadas:', adData.photos.length);
                console.log('Fotos:', adData.photos);

                if (!adData.photos || adData.photos.length === 0) {
                    return { isValid: false, message: 'Por favor, adicione pelo menos uma foto.' };
                }

                return { isValid: true, message: 'Fotos adicionadas com sucesso!' };

            case 4:
                // Validar revisão final
                console.log('=== VALIDAÇÃO PASSO 4 ===');
                console.log('Dados finais:', adData);
                const description = document.getElementById('adDescription')?.value?.trim() || '';
                if (!description || description.length < 10) {
                    return { isValid: false, message: 'Descreva seu anúncio (mínimo 10 caracteres).' };
                }
                adData.description = description;
                // Coletar serviços marcados
                adData.services = [];
                document.querySelectorAll('.checkbox-item input[name="services"]:checked').forEach(cb => adData.services.push(cb.value));
                
                adData.availability = [];
                document.querySelectorAll('.checkbox-item input[name="availability"]:checked').forEach(cb => adData.availability.push(cb.value));
                
                adData.serviceType = [];
                document.querySelectorAll('.checkbox-item input[name="serviceType"]:checked').forEach(cb => adData.serviceType.push(cb.value));

                if (!selectedPlan) {
                    return { isValid: false, message: 'Plano não selecionado.' };
                }

                if (!adData.title || !adData.city || !adData.photos || adData.photos.length === 0) {
                    return { isValid: false, message: 'Dados incompletos para finalizar.' };
                }

                return { isValid: true, message: 'Tudo pronto para finalizar!' };

            default:
                return { isValid: false, message: 'Step inválido.' };
        }

    } catch (error) {
        console.error('❌ Erro na validação:', error);
        return { isValid: false, message: 'Erro interno na validação.' };
    }
}

// Função para salvar dados temporários
function saveTemporaryData() {
    console.log('💾 Salvando dados temporários...');
    try {
        // Não persistir blobs/base64 grandes no localStorage (quota ~5MB)
        const lightweightAdData = { ...adData };
        if (lightweightAdData.photos) {
            lightweightAdData.photosCount = lightweightAdData.photos.length;
            delete lightweightAdData.photos;
        }
        if (lightweightAdData.video) {
            lightweightAdData.hasVideo = true;
            delete lightweightAdData.video;
        }
        const tempData = {
            currentStep: currentStep,
            selectedPlan: selectedPlan && (typeof selectedPlan === 'string' ? selectedPlan : { type: selectedPlan.type }),
            adData: lightweightAdData,
            timestamp: Date.now()
        };
        localStorage.setItem('tempAdCreation', JSON.stringify(tempData));
        console.log('✅ Dados temporários salvos (leve)');
    } catch (e) {
        console.warn('⚠️ Falha ao salvar rascunho (ignorado):', e);
    }
}

// Função para mostrar erro de validação
function showValidationError(message) {
    // Remover feedback anterior
    const existingFeedback = document.querySelector('.validation-error');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Criar novo feedback
    const feedback = document.createElement('div');
    feedback.className = 'validation-error';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: #dc3545;
        color: white;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(220,53,69,0.3);
        max-width: 300px;
        word-wrap: break-word;
    `;

    feedback.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
    `;

    document.body.appendChild(feedback);

    // Remover feedback após 5 segundos
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 5000);
}


// Função para selecionar plano
function selectPlan(planCard) {
    console.log('=== SELECIONANDO PLANO ===');
    console.log('Plano clicado:', planCard);

    try {
        // Verificar se o elemento é válido
        if (!planCard || !planCard.getAttribute) {
            console.error('❌ Elemento de plano inválido');
            return;
        }

        // Remover seleção de todos os planos
        document.querySelectorAll('.plan-card').forEach(card => {
            card.classList.remove('selected');
            card.style.borderColor = '';
            card.style.backgroundColor = '';
            card.style.transform = '';
            card.style.boxShadow = '';
        });

        // Adicionar seleção ao plano clicado
        planCard.classList.add('selected');
        planCard.style.borderColor = '#007bff';
        planCard.style.backgroundColor = '#f8f9ff';
        planCard.style.transform = 'translateY(-2px)';
        planCard.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';

        // Definir plano selecionado
        const planType = planCard.getAttribute('data-plan');
        console.log('Tipo do plano:', planType);

        if (!planType) {
            console.error('❌ Tipo de plano não encontrado');
            return;
        }

        // Obter detalhes do plano do sistema centralizado (prioriza configuração de pagamentos)
        if (typeof window.PlansManager !== 'undefined') {
            const planDetails = window.PlansManager.getPlanDetails(planType);
            if (planDetails) {
                console.log('Detalhes do plano do PlansManager:', planDetails);
                selectedPlan = planDetails;
            } else {
                selectedPlan = buildPlanFromPricingStorage(planType);
            }
        } else {
            selectedPlan = buildPlanFromPricingStorage(planType);
        }

        // Armazenar plano selecionado no localStorage
        localStorage.setItem('tempSelectedPlan', JSON.stringify(selectedPlan));
        console.log('Plano salvo no localStorage:', selectedPlan);

        // Validar seleção
        const validation = validatePlanSelection();
        console.log('Validação:', validation);

        // Habilitar botão próximo se plano foi selecionado
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            if (validation.isValid) {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
                nextBtn.title = 'Clique para continuar';
                console.log('✅ Botão próximo habilitado');
            } else {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                nextBtn.style.cursor = 'not-allowed';
                nextBtn.title = validation.message;
                console.log('❌ Botão próximo desabilitado');
            }
        } else {
            console.warn('⚠️ Botão próximo não encontrado');
        }

        // Mostrar feedback visual
        showPlanSelectionFeedback(validation);

        // Atualizar progresso
        updateProgressBar();

        console.log('✅ Plano selecionado com sucesso:', selectedPlan);

    } catch (error) {
        console.error('❌ Erro ao selecionar plano:', error);
        showPlanSelectionFeedback({
            isValid: false,
            message: 'Erro ao selecionar plano. Tente novamente.'
        });
    }
}

// Montar objeto de plano a partir de pricingPlans (Config. Pagamentos)
function buildPlanFromPricingStorage(planType) {
    try {
        const plans = (JSON.parse(localStorage.getItem('pricingPlans')) || []).filter(p => p.status === 'active');
        const found = plans.find(p => p.type === planType);
        if (found) {
            return {
                type: found.type,
                name: found.name,
                price: found.price,
                duration: found.duration,
                features: found.features || []
            };
        }
    } catch (e) {
        console.warn('Falha ao ler pricingPlans:', e);
    }
    // fallback final
    return {
        type: planType,
        name: planType.toUpperCase(),
        price: getPlanPrice(planType),
        features: getPlanFeatures(planType)
    };
}

// Função para validar seleção de plano
function validatePlanSelection() {
    console.log('=== VALIDANDO SELEÇÃO DE PLANO ===');
    if (!selectedPlan) {
        console.log('❌ Nenhum plano selecionado');
        return { isValid: false, message: 'Por favor, selecione um plano antes de continuar.' };
    }
    const validPlans = ['basic', 'top', 'supervip', 'premium', 'vip'];
    const planType = typeof selectedPlan === 'string' ? selectedPlan : selectedPlan.type;
    if (!validPlans.includes(planType)) {
        console.log('❌ Plano inválido:', planType);
        return { isValid: false, message: 'Plano selecionado não é válido.' };
    }
    console.log('✅ Plano válido selecionado:', planType);
    return { isValid: true, message: 'Plano selecionado com sucesso!' };
}

// Função para obter preço do plano (fallback)
function getPlanPrice(planType) {
    const prices = {
        'basic': 99.99,
        'top': 149.99,
        'supervip': 199.99,
        'premium': 299.99,
        'vip': 399.99
    };
    return prices[planType] || 99.99;
}

// Função para obter features do plano (fallback)
function getPlanFeatures(planType) {
    const features = {
        'basic': ['Anúncio por 30 dias', 'Até 3 fotos', 'Suporte básico'],
        'top': ['Anúncio por 30 dias', 'Até 6 fotos', 'Destaque na busca', 'Suporte prioritário'],
        'supervip': ['Anúncio por 30 dias', 'Fotos ilimitadas', 'Topo da lista', 'Badge SUPERVIP', 'Suporte 24h'],
        'premium': ['Anúncio por 30 dias', 'Fotos ilimitadas', 'Topo da lista', 'Badge PREMIUM', 'Suporte VIP'],
        'vip': ['Anúncio por 30 dias', 'Fotos ilimitadas', 'Topo da lista', 'Badge VIP', 'Suporte exclusivo']
    };
    return features[planType] || ['Anúncio por 30 dias', 'Suporte básico'];
}

// Função para mostrar feedback de seleção de plano
function showPlanSelectionFeedback(validation) {
    // Remover feedback anterior
    const existingFeedback = document.querySelector('.plan-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Criar novo feedback
    const feedback = document.createElement('div');
    feedback.className = 'plan-feedback';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${validation.isValid ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(${validation.isValid ? '40,167,69' : '220,53,69'},0.3);
    `;

    feedback.innerHTML = `
        <i class="fas fa-${validation.isValid ? 'check-circle' : 'exclamation-triangle'}"></i>
        ${validation.message}
    `;

    document.body.appendChild(feedback);

    // Remover feedback após 3 segundos
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 3000);
}

// Função para finalizar criação do anúncio
function finishAdCreation() {
    console.log('=== FINALIZANDO CRIAÇÃO DO ANÚNCIO ===');
    console.log('Plano selecionado:', selectedPlan);
    console.log('Dados do anúncio:', adData);

    if (!selectedPlan) {
        alert('Por favor, selecione um plano.');
        return;
    }

    // Coletar dados diretamente dos campos do formulário
    const formData = {
        title: document.getElementById('adTitle')?.value?.trim() || adData.title || '',
        state: document.getElementById('adState')?.value || adData.state || '',
        city: document.getElementById('adCity')?.value || adData.city || '',
        age: document.getElementById('adAge')?.value || adData.age || '',
        price: document.getElementById('adPrice')?.value || adData.price || '',
        category: document.getElementById('adCategory')?.value || adData.category || '',
        whatsapp: document.getElementById('adWhatsApp')?.value?.trim() || adData.whatsapp || '',
        description: document.getElementById('adDescription')?.value?.trim() || adData.description || ''
    };

    console.log('Dados do formulário:', formData);

    // Verificar se todos os dados necessários estão preenchidos
    const requiredFields = ['title', 'age', 'city', 'description', 'price', 'whatsapp', 'category'];
    const missingFields = [];

    requiredFields.forEach(field => {
        if (!formData[field] || formData[field] === '') {
            missingFields.push(field);
        }
    });

    if (missingFields.length > 0) {
        console.log('Campos faltando:', missingFields);
        alert(`Por favor, preencha todos os campos obrigatórios.\n\nCampos faltando: ${missingFields.join(', ')}`);
        return;
    }

    // Validar se estado e cidade estão liberados
    if (!validateStateAndCity(formData.state, formData.city)) {
        alert('O estado ou cidade selecionados não estão liberados para anúncios. Por favor, escolha opções disponíveis.');
        return;
    }

    if (!adData.photos || adData.photos.length === 0) {
        alert('Por favor, adicione pelo menos uma foto.');
        return;
    }

    // Atualizar adData com os dados do formulário
    adData.title = formData.title;
    adData.state = formData.state;
    adData.city = formData.city;
    adData.age = parseInt(formData.age);
    adData.price = parseFloat(formData.price);
    adData.category = formData.category;
    adData.whatsapp = formData.whatsapp;
    adData.description = formData.description;

    console.log('adData atualizado:', adData);
    console.log('Todos os dados estão válidos. Prosseguindo...');

    // Fechar modal de criação
    closeModal('createAdModal');

    // Mostrar modal de pagamento
    showPaymentModal();
}

// Função para mostrar modal de pagamento
function showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.add('active');

    // Atualizar detalhes do plano
    updatePlanDetails();

    // Renderizar opções dinâmicas do Gateway (Mercadopago/Pix configurados no admin)
    renderPaymentGateways();

    // Configurar aplicação de cupom
    const applyBtn = document.getElementById('applyCouponBtn');
    const input = document.getElementById('couponInput');
    const msg = document.getElementById('couponMsg');
    if (applyBtn && input) {
        applyBtn.onclick = function () {
            applyCouponCode(input.value.trim().toUpperCase());
        };
        input.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); applyBtn.click(); } };
        if (msg) msg.textContent = '';
    }
}

// Função para renderizar gateways configurados
function renderPaymentGateways() {
    const gateways = JSON.parse(localStorage.getItem('paymentGateways')) || [];
    const activeGateways = gateways.filter(g => g.status === 'active');

    const tabsContainer = document.querySelector('.payment-tabs');
    const contentContainer = document.querySelector('.payment-content');

    if (!tabsContainer || !contentContainer) return;

    // Usar gateways padrão se nenhum estiver configurado
    const gatewaysToShow = activeGateways.length > 0 ? activeGateways : [
        { id: 'pix_default', type: 'pix', name: 'PIX', status: 'active', publicKey: 'Chave configurada pelo administrador' },
        { id: 'local_default', type: 'local', name: 'Pagamento no Ato', status: 'active', publicKey: '' }
    ];

    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    gatewaysToShow.forEach((gateway, index) => {
        const isActive = index === 0;

        const tab = document.createElement('button');
        tab.className = `tab-btn ${isActive ? 'active' : ''}`;
        tab.setAttribute('data-method', gateway.id);
        tab.setAttribute('onclick', `switchPaymentMethod(this)`);

        let icon = 'fa-credit-card';
        if (gateway.type === 'pix') icon = 'fa-qrcode';
        if (gateway.type === 'mercadopago') icon = 'fa-handshake';
        if (gateway.type === 'local') icon = 'fa-money-bill-wave';

        tab.innerHTML = `<i class="fas ${icon}"></i> ${gateway.name}`;
        tabsContainer.appendChild(tab);

        const content = document.createElement('div');
        content.className = `payment-method ${isActive ? 'active' : ''}`;
        content.id = `${gateway.id}-method`;

        let btnText = 'Finalizar e Aguardar Aprovação';
        let subTitle = 'Finalize a criação do anúncio. Um administrador entrará em contato com instruções de pagamento.';
        if (gateway.type === 'pix') {
            btnText = 'Confirmar e Aguardar PIX';
            subTitle = gateway.publicKey && gateway.publicKey !== 'Chave configurada pelo administrador'
                ? `Chave PIX: ${gateway.publicKey}`
                : 'O administrador irá informar a chave PIX para pagamento.';
        } else if (gateway.type === 'mercadopago') {
            btnText = 'Pagar com Mercado Pago';
            subTitle = 'Você será redirecionado para o Mercado Pago.';
        }

        content.innerHTML = `
            <div class="pix-info">
                <i class="fas ${icon}"></i>
                <h4>${gateway.name}</h4>
                <p>${subTitle}</p>
            </div>
            <button class="btn btn-primary" onclick="processDynamicPayment('${gateway.id}', this)" style="margin-top: 10px;">
                <i class="fas fa-check"></i> ${btnText}
            </button>
        `;
        contentContainer.appendChild(content);
    });
}


// Função para atualizar detalhes do plano
function updatePlanDetails() {
    const planDetails = document.getElementById('selectedPlanDetails');
    const subtotal = document.getElementById('subtotal');
    const total = document.getElementById('total');

    let planInfo = '';
    let priceNumber = 0;
    let features = [];

    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');

    // 1) Tentar usar pricingPlans (fonte de verdade)
    try {
        const storedPlans = JSON.parse(localStorage.getItem('pricingPlans')) || [];
        const activeOrAny = storedPlans.find(p => p.type === planType && p.status === 'active') || storedPlans.find(p => p.type === planType);
        if (activeOrAny) {
            const rawPrice = activeOrAny.price;
            priceNumber = Number(String(rawPrice).replace(',', '.')) || 0;
            planInfo = `${activeOrAny.name || planType.toUpperCase()} (${activeOrAny.duration || 30} dias)`;
            features = activeOrAny.features || [];
        }
    } catch (e) { }

    // 2) Se não veio, tentar planPrices
    if (!priceNumber) {
        try {
            const planPricesMap = JSON.parse(localStorage.getItem('planPrices')) || {};
            const mapped = planPricesMap[planType];
            if (mapped != null) {
                priceNumber = Number(String(mapped).replace(',', '.')) || 0;
            }
        } catch (e) { }
    }

    // 3) Se ainda não, usar selectedPlan
    if (!priceNumber && selectedPlan && typeof selectedPlan === 'object' && selectedPlan.price != null) {
        priceNumber = Number(String(selectedPlan.price).replace(',', '.')) || 0;
        if (!planInfo) {
            planInfo = `${selectedPlan.name || planType.toUpperCase()} (${selectedPlan.duration || 30} dias)`;
        }
        features = features.length ? features : (selectedPlan.features || []);
    }

    // 4) Fallback hardcoded
    if (!priceNumber) {
        switch (planType) {
            case 'basic':
                priceNumber = 149.90; planInfo = planInfo || 'Plano Básico (30 dias)'; features = features.length ? features : ['Anúncio ativo por 30 dias', 'Até 3 fotos', 'Suporte básico']; break;
            case 'top':
                priceNumber = 249.90; planInfo = planInfo || 'Plano Top (30 dias)'; features = features.length ? features : ['Anúncio ativo por 30 dias', 'Até 6 fotos', 'Suporte prioritário', 'Destaque na busca']; break;
            case 'supervip':
                priceNumber = 399.90; planInfo = planInfo || 'Plano SuperVIP (30 dias)'; features = features.length ? features : ['Anúncio ativo por 30 dias', 'Fotos ilimitadas', 'Suporte 24h', 'Destaque máximo', 'Badge SuperVIP']; break;
            default:
                priceNumber = 149.90; planInfo = planInfo || 'Plano Básico (30 dias)'; features = features.length ? features : ['Anúncio ativo por 30 dias', 'Até 3 fotos', 'Suporte básico'];
        }
    }

    const featuresHTML = features.map(feature => `<div>• ${feature}</div>`).join('');

    planDetails.innerHTML = `
        <div style="margin-bottom: 15px;">
            <strong>${planInfo}</strong>
        </div>
        <div style="color: #666; font-size: 14px;">
            ${featuresHTML}
        </div>
    `;

    subtotal.textContent = `R$ ${priceNumber.toFixed(2)}`;
    // Limpar desconto aplicado anterior
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    if (discountRow && discountAmount) {
        discountRow.style.display = 'none';
        discountAmount.textContent = '- R$ 0,00';
    }
    total.textContent = `R$ ${priceNumber.toFixed(2)}`;
}

// Aplicar cupom ao valor atual do plano
function applyCouponCode(code) {
    const msg = document.getElementById('couponMsg');
    const subtotal = document.getElementById('subtotal');
    const total = document.getElementById('total');
    const discountRow = document.getElementById('discountRow');
    const discountAmountEl = document.getElementById('discountAmount');
    if (!code) { if (msg) { msg.textContent = 'Informe um código de cupom.'; msg.className = 'coupon-error'; } return; }

    const allCoupons = JSON.parse(localStorage.getItem('coupons')) || [];
    const coupon = allCoupons.find(c => c.code === code);
    if (!coupon) { if (msg) { msg.textContent = 'Cupom não encontrado.'; msg.className = 'coupon-error'; } return; }

    // Validações básicas
    const now = Date.now();
    if (coupon.status && coupon.status !== 'active') { if (msg) { msg.textContent = 'Cupom inativo.'; msg.className = 'coupon-error'; } return; }
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) { if (msg) { msg.textContent = 'Cupom expirado.'; msg.className = 'coupon-error'; } return; }
    if (coupon.limit && coupon.used && coupon.used >= coupon.limit) { if (msg) { msg.textContent = 'Limite de uso atingido.'; msg.className = 'coupon-error'; } return; }

    // Resgatar preço atual
    const currentPrice = Number(String((subtotal.textContent || '').replace(/[^0-9,\.]/g, '').replace(',', '.'))) || 0;
    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
    if (coupon.plan && coupon.plan !== 'all' && coupon.plan !== planType) { if (msg) { msg.textContent = 'Cupom não válido para este plano.'; msg.className = 'coupon-error'; } return; }
    if (coupon.minValue && currentPrice < Number(coupon.minValue)) { if (msg) { msg.textContent = `Valor mínimo de R$ ${Number(coupon.minValue).toFixed(2)}`; msg.className = 'coupon-error'; } return; }

    // Calcular desconto percentual
    const discountPct = Number(coupon.discount) || 0;
    const discountValue = Math.min(currentPrice, currentPrice * (discountPct / 100));
    const finalValue = Math.max(0, currentPrice - discountValue);

    // Atualizar UI
    if (discountRow && discountAmountEl) {
        discountRow.style.display = 'flex';
        discountAmountEl.textContent = `- R$ ${discountValue.toFixed(2)}`;
    }
    total.textContent = `R$ ${finalValue.toFixed(2)}`;
    if (msg) { msg.textContent = `Cupom aplicado: ${discountPct}% de desconto.`; msg.className = 'coupon-success'; }

    // Guardar cupom aplicado para finalizar pagamento
    localStorage.setItem('appliedCoupon', JSON.stringify({ code: coupon.code, discount: discountPct, discountValue, finalValue, plan: planType }));
}

// Função para alternar método de pagamento
window.switchPaymentMethod = function (tabBtn) {
    document.querySelectorAll('.payment-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.payment-method').forEach(method => method.classList.remove('active'));

    tabBtn.classList.add('active');
    const method = tabBtn.getAttribute('data-method');
    const methodContainer = document.getElementById(`${method}-method`);
    if (methodContainer) {
        methodContainer.classList.add('active');
    }
};

// Função para gerar PIX REAL via Mercado Pago
async function generatePIX() {
    const pixQR = document.getElementById('pixQR');
    const userEmail = localStorage.getItem('userEmail') || 'usuario@desejosms.com';
    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');

    // Calcular valor do plano
    let amount = 149.90;
    try {
        const storedPlans = JSON.parse(localStorage.getItem('pricingPlans') || '[]');
        const planFound = storedPlans.find(p => p.type === planType && p.status === 'active') || storedPlans.find(p => p.type === planType);
        if (planFound && planFound.price != null) amount = Number(String(planFound.price).replace(',', '.')) || amount;
    } catch (e) { }

    // Aplicar desconto de cupom se houver
    const appliedCoupon = JSON.parse(localStorage.getItem('appliedCoupon') || 'null');
    if (appliedCoupon?.discountValue) {
        amount = Math.max(0.01, amount - appliedCoupon.discountValue);
    }

    // Mostrar loading
    pixQR.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block; text-align: center;">
            <div style="width: 200px; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #666;"></i>
            </div>
            <div style="font-size: 13px; color: #555;">Gerando QR Code PIX real...</div>
        </div>
    `;

    try {
        // Chamar API real (Vercel Function)
        const response = await fetch('/api/payment/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                planType,
                userEmail,
                amount: amount.toFixed(2),
                adData: { name: adData.name || '', city: adData.city || '' }
            })
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || 'Erro ao gerar PIX');
        }

        // Exibir QR Code real
        const qrImage = result.qr_code_base64 ? `data:image/png;base64,${result.qr_code_base64}` : null;
        pixQR.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block; text-align: center; max-width: 300px;">
                ${qrImage
                ? `<img src="${qrImage}" style="width: 220px; height: 220px; margin-bottom: 10px; border: 2px solid #eee; border-radius: 8px;" alt="QR Code PIX">`
                : `<div style="width:220px;height:220px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><i class="fas fa-qrcode" style="font-size:48px;color:#333;"></i></div>`
            }
                <div style="font-size: 13px; color: #333; margin-bottom: 8px;"><strong>R$ ${amount.toFixed(2)}</strong> — Plano ${planType.toUpperCase()}</div>
                ${result.qr_code ? `
                <div style="margin-top: 8px;">
                    <p style="font-size: 11px; color: #666; margin-bottom: 4px;">Ou copie o código PIX:</p>
                    <textarea style="width:100%;font-size:10px;padding:6px;border:1px solid #ddd;border-radius:4px;resize:none;height:60px;" readonly onclick="this.select()">${result.qr_code}</textarea>
                    <button onclick="navigator.clipboard.writeText('${result.qr_code}').then(()=>this.textContent='✅ Copiado!').catch(()=>{})" style="margin-top:4px;padding:6px 12px;background:#00a650;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                        <i class="fas fa-copy"></i> Copiar código PIX
                    </button>
                </div>` : ''}
                <div style="font-size: 11px; color: #888; margin-top: 10px;">
                    <i class="fas fa-clock"></i> Aguardando pagamento...
                </div>
            </div>
        `;

        // Polling: verificar status a cada 5 segundos (máximo 5 minutos)
        const paymentId = result.payment_id;
        if (paymentId) {
            let attempts = 0;
            const maxAttempts = 60;
            const pollInterval = setInterval(async () => {
                attempts++;
                if (attempts > maxAttempts) {
                    clearInterval(pollInterval);
                    return;
                }
                try {
                    const statusResponse = await fetch(`/api/payment/status?id=${paymentId}`);
                    const statusData = await statusResponse.json();
                    if (statusData.status === 'approved') {
                        clearInterval(pollInterval);
                        const applied = JSON.parse(localStorage.getItem('appliedCoupon') || 'null');
                        if (applied) adData.appliedCoupon = applied;
                        closeModal('paymentModal');
                        alert('✅ Pagamento PIX confirmado! Seu anúncio foi ativado automaticamente.');
                        createAd(true);
                    } else if (statusData.status === 'rejected' || statusData.status === 'cancelled') {
                        clearInterval(pollInterval);
                        pixQR.innerHTML += `<div style="color:red;margin-top:10px;">❌ Pagamento ${statusData.status}. Tente novamente.</div>`;
                    }
                } catch (e) { }
            }, 5000);
        }

    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        // Fallback amigável
        pixQR.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; text-align: center; max-width: 300px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: #856404; margin-bottom: 10px;"></i>
                <div style="font-size: 14px; color: #856404; margin-bottom: 8px;"><strong>Gateway não configurado</strong></div>
                <div style="font-size: 12px; color: #664d03;">
                    Configure as chaves do Mercado Pago em:<br>
                    <strong>Painel Admin → Config. Pagamentos → Adicionar Gateway</strong>
                </div>
                <div style="font-size: 11px; color: #999; margin-top: 8px;">${error.message}</div>
            </div>
        `;
    }
}


// Utilitário para gerar miniatura
function generateThumbnail(dataUrl, maxW = 320, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let w = img.width; let h = img.height;
            if (w > maxW) { const ratio = maxW / w; w = maxW; h = Math.round(h * ratio); }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            try { resolve(canvas.toDataURL('image/jpeg', quality)); } catch (_) { resolve(dataUrl); }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

// Função para criar anúncio
async function createAd(forceActive = false) {
    console.log('=== CRIANDO ANÚNCIO ===');
    console.log('Dados do anúncio:', adData);
    console.log('Plano selecionado:', selectedPlan);

    if (!selectedPlan) {
        alert('Por favor, selecione um plano.');
        return;
    }

    // Coletar dados diretamente dos campos do formulário
    const formData = {
        title: document.getElementById('adTitle')?.value?.trim() || adData.title || '',
        state: document.getElementById('adState')?.value || adData.state || '',
        city: document.getElementById('adCity')?.value || adData.city || '',
        age: document.getElementById('adAge')?.value || adData.age || '',
        price: document.getElementById('adPrice')?.value || adData.price || '',
        category: document.getElementById('adCategory')?.value || adData.category || '',
        whatsapp: document.getElementById('adWhatsApp')?.value?.trim() || adData.whatsapp || '',
        description: document.getElementById('adDescription')?.value?.trim() || adData.description || ''
    };

    console.log('Dados do formulário:', formData);

    // Verificar se todos os dados necessários estão preenchidos
    const requiredFields = ['title', 'age', 'city', 'description', 'price', 'whatsapp', 'category'];
    const missingFields = [];

    requiredFields.forEach(field => {
        if (!formData[field] || formData[field] === '') {
            missingFields.push(field);
        }
    });

    if (missingFields.length > 0) {
        console.log('Campos faltando:', missingFields);
        alert(`Por favor, preencha todos os campos obrigatórios.\n\nCampos faltando: ${missingFields.join(', ')}`);
        return;
    }

    // Validar se estado e cidade estão liberados
    if (!validateStateAndCity(formData.state, formData.city)) {
        alert('O estado ou cidade selecionados não estão liberados para anúncios. Por favor, escolha opções disponíveis.');
        return;
    }

    if (!adData.photos || adData.photos.length === 0) {
        alert('Por favor, adicione pelo menos uma foto.');
        return;
    }

    // Miniaturas leves para persistência
    let thumbs = [];
    try {
        thumbs = await Promise.all(adData.photos.map(p => generateThumbnail(p, 320, 0.8)));
    } catch (e) { thumbs = adData.photos.slice(0, 1); }

    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';

    // Verificar se é edição ou criação
    if (adData.isEditing && adData.originalId) {
        const adIndex = announcements.findIndex(a => a.id === adData.originalId);
        if (adIndex === -1) { alert('Anúncio não encontrado para edição!'); return; }
        announcements[adIndex] = {
            ...announcements[adIndex],
            name: formData.title,
            age: parseInt(formData.age),
            state: formData.state,
            city: formData.city,
            description: formData.description,
            price: `R$ ${parseFloat(formData.price).toFixed(2)}`,
            phone: formData.whatsapp,
            whatsapp: formData.whatsapp,
            category: formData.category,
            services: adData.services || [],
            availability: adData.availability || [],
            serviceType: adData.serviceType || [],
            photos: thumbs,
            video: adData.video || null,
            updatedAt: new Date().toISOString()
        };
        try { localStorage.setItem('announcements', JSON.stringify(announcements)); } catch (_) { }
        loadDashboardStats();
        loadUserAds();
        alert('Anúncio atualizado com sucesso!');
        adData.isEditing = false; adData.originalId = null; return;
    }

    const isVerified = localStorage.getItem('userVerified') === 'true';
    const adStatus = (isVerified || forceActive) ? 'active' : 'pending';
    const appliedCoupon = JSON.parse(localStorage.getItem('appliedCoupon') || 'null');

    const newAd = {
        id: Date.now(),
        userEmail,
        advertiserRef: localStorage.getItem('advertiserRef') || 'REF-N/A',
        name: formData.title,
        age: parseInt(formData.age),
        state: formData.state,
        city: formData.city,
        description: formData.description,
        price: `R$ ${parseFloat(formData.price).toFixed(2)}`,
        phone: formData.whatsapp,
        whatsapp: formData.whatsapp,
        category: formData.category,
        services: adData.services || [],
        availability: adData.availability || [],
        serviceType: adData.serviceType || [],
        status: adStatus,
        createdAt: new Date().toISOString(),
        isVip: selectedPlan !== 'basic',
        planType: typeof selectedPlan === 'object' ? selectedPlan.type : selectedPlan,
        paymentRequired: false,
        needsVerification: !isVerified,
        paidAmount: (function () {
            const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
            try { const storedPlans = JSON.parse(localStorage.getItem('pricingPlans')) || []; const found = storedPlans.find(p => p.type === planType && p.status === 'active') || storedPlans.find(p => p.type === planType); if (found && found.price != null) return Number(String(found.price).replace(',', '.')) || 0; } catch (e) { }
            try { const map = JSON.parse(localStorage.getItem('planPrices')) || {}; if (map[planType] != null) return Number(String(map[planType]).replace(',', '.')) || 0; } catch (e) { }
            if (selectedPlan && typeof selectedPlan === 'object' && selectedPlan.price != null) { return Number(String(selectedPlan.price).replace(',', '.')) || 0; }
            return planType === 'basic' ? 149.90 : planType === 'top' ? 249.90 : planType === 'supervip' ? 399.90 : 149.90;
        })() - (appliedCoupon?.discountValue || 0),
        views: 0,
        rating: 0,
        photos: thumbs,
        video: adData.video || null
    };
    if (appliedCoupon) {
        newAd.coupon = appliedCoupon;
        try {
            const allCoupons = JSON.parse(localStorage.getItem('coupons')) || [];
            const idx = allCoupons.findIndex(c => c.code === appliedCoupon.code);
            if (idx !== -1) {
                allCoupons[idx].used = (allCoupons[idx].used || 0) + 1;
                (allCoupons[idx].usageHistory = allCoupons[idx].usageHistory || []).push({ userEmail, usedAt: new Date().toISOString(), originalPrice: (appliedCoupon.discountValue + newAd.paidAmount), discountAmount: appliedCoupon.discountValue, finalPrice: newAd.paidAmount, plan: newAd.planType });
                localStorage.setItem('coupons', JSON.stringify(allCoupons));
            }
        } catch (e) { }
        localStorage.removeItem('appliedCoupon');
    }

    // Criar no Supabase se não estivermos simulando
    let insertedId = Date.now();
    if (window.createAdInSupabase) {
        try {
            const supaResult = await window.createAdInSupabase(newAd);
            if (supaResult && supaResult.id) {
                insertedId = supaResult.id;
            }
            // Limpar rascunho após criação bem-sucedida
            localStorage.removeItem('tempAdCreation');
            localStorage.removeItem('tempSelectedPlan');
        } catch (err) {
            console.error("Falha ao injetar no supabase:", err);
            // Fallback: salvar localmente se Supabase falhar
            const announcements2 = JSON.parse(localStorage.getItem('announcements')) || [];
            announcements2.push(newAd);
            try {
                localStorage.setItem('announcements', JSON.stringify(announcements2));
                localStorage.removeItem('tempAdCreation');
            } catch (e) { console.warn('Quota local também excedida', e); }
        }
    } else {
        // fallback se não tiver inicializado o script do DB
        const announcements2 = JSON.parse(localStorage.getItem('announcements')) || [];
        announcements2.push(newAd);
        try {
            localStorage.setItem('announcements', JSON.stringify(announcements2));
        } catch (e) {
            console.warn('Quota excedida ao salvar anúncio local');
            const slim = announcements2.map(a => ({ ...a, photos: [] }));
            try { localStorage.setItem('announcements', JSON.stringify(slim)); } catch (_) { }
        }
        localStorage.removeItem('tempAdCreation');
        localStorage.removeItem('adCreationDraft');
    }

    loadDashboardStats();
    loadUserAds();

    if (isVerified) {
        alert('Anúncio criado com sucesso! Seu anúncio está ATIVO e visível para todos os visitantes.');
    } else {
        alert('Anúncio criado com sucesso! Para ativar seu anúncio, você precisa verificar sua conta primeiro. Acesse a aba "Perfil" para fazer a verificação.');
    }
}

// Função para mostrar modal de verificação
function showVerificationModal() {
    const modal = document.getElementById('verificationModal');
    modal.classList.add('active');
}

// Função para gerar código de verificação
function generateVerificationCode() {
    const code = 'DESEJOS' + Math.floor(Math.random() * 9000 + 1000);
    document.getElementById('verificationCode').textContent = code;
    localStorage.setItem('verificationCode', code);
}

// Função para ativar anúncios pendentes quando conta for verificada
function activatePendingAds() {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';

    let activatedCount = 0;

    announcements.forEach(ad => {
        if (ad.userEmail === userEmail && ad.status === 'pending') {
            ad.status = 'active';
            ad.needsVerification = false;
            activatedCount++;
        }
    });

    if (activatedCount > 0) {
        localStorage.setItem('announcements', JSON.stringify(announcements));
        console.log(`${activatedCount} anúncios ativados automaticamente após verificação da conta`);

        // Recarregar dados
        loadDashboardStats();
        loadUserAds();
    }
}

// Função para mostrar lembrete de verificação
function showVerificationReminder(pendingCount) {
    const isVerified = localStorage.getItem('userVerified') === 'true';

    if (!isVerified && pendingCount > 0) {
        // Criar notificação visual
        const reminder = document.createElement('div');
        reminder.id = 'verificationReminder';
        reminder.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #FF6B35, #FF8C42);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
            z-index: 10000;
            max-width: 300px;
            font-family: 'Poppins', sans-serif;
            animation: slideInRight 0.5s ease;
        `;

        reminder.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 20px;"></i>
                <strong>Verificação Necessária</strong>
            </div>
            <p style="margin: 0; font-size: 14px;">
                Você tem ${pendingCount} anúncio${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''} que precisa${pendingCount > 1 ? 'm' : ''} de verificação da conta para ficar ativo${pendingCount > 1 ? 's' : ''}.
            </p>
            <button onclick="switchTab('profile')" style="
                background: white;
                color: #FF6B35;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                margin-top: 10px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
            ">Verificar Conta</button>
            <button onclick="this.parentElement.remove()" style="
                background: transparent;
                color: white;
                border: 1px solid white;
                padding: 8px 16px;
                border-radius: 20px;
                margin-top: 10px;
                margin-left: 10px;
                cursor: pointer;
                font-size: 12px;
            ">Fechar</button>
        `;

        document.body.appendChild(reminder);

        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (reminder.parentElement) {
                reminder.remove();
            }
        }, 10000);
    }
}

// IndexedDB helpers para armazenar documentos grandes
const idbConfig = { dbName: 'desejosms_db', store: 'docs' };
function idbOpen() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(idbConfig.dbName, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(idbConfig.store)) {
                db.createObjectStore(idbConfig.store, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
function idbPutDoc(record) {
    return idbOpen().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(idbConfig.store, 'readwrite');
        tx.objectStore(idbConfig.store).put(record);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    }));
}
function idbGetDoc(id) {
    return idbOpen().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(idbConfig.store, 'readonly');
        const req = tx.objectStore(idbConfig.store).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    }));
}

// Utilitário para reduzir para <= targetBytes (~5MB)
async function ensureUnderSizeBytes(dataUrl, targetBytes = 5 * 1024 * 1024) {
    let current = dataUrl;
    for (const dim of [1600, 1400, 1200, 1000, 900, 800]) {
        const blob = await (await fetch(current)).blob();
        if (blob.size <= targetBytes) return current;
        current = await compressDataURL(current, dim, 0.85);
    }
    // Reduzir qualidade se necessário
    for (const q of [0.75, 0.65, 0.55, 0.5]) {
        const reduced = await compressDataURL(current, 800, q);
        const blob = await (await fetch(reduced)).blob();
        if (blob.size <= targetBytes) return reduced;
        current = reduced;
    }
    return current;
}

// Função para enviar verificação
async function submitVerification() {
    try {
        console.log('=== ENVIANDO VERIFICAÇÃO ===');
        const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';
        console.log('Email do usuário:', userEmail);

        const modal = document.getElementById('verificationModal');
        if (!modal) { alert('Modal de verificação não encontrado!'); return; }

        const inputs = modal.querySelectorAll('input[type="file"]');
        const files = Array.from(inputs).map(i => i.files && i.files[0]).filter(Boolean);
        console.log('Arquivos selecionados:', files.length);
        if (files.length < 3) { alert('Envie os 3 arquivos solicitados.'); return; }

        // Pré-visualização simples
        const preview = document.getElementById('verificationPreview');
        if (preview) {
            preview.innerHTML = '';
            files.forEach(f => { const url = URL.createObjectURL(f); const wrap = document.createElement('div'); wrap.style.cssText = 'border:1px solid #eee;border-radius:8px;overflow:hidden;'; wrap.innerHTML = `<img src="${url}" style="width:100%;height:100px;object-fit:cover;"/>`; preview.appendChild(wrap); });
        }

        // Barra de progresso
        const progressWrap = document.getElementById('verificationProgress');
        const progressBar = document.getElementById('verificationProgressBar');
        if (progressWrap && progressBar) { progressWrap.style.display = 'block'; progressBar.style.width = '0%'; }

        // Salvar arquivos diretamente no IndexedDB
        const ids = ['documento', 'foto-codigo', 'selfie'].map(t => `verif-${userEmail}-${t}-${Date.now()}`);
        let count = 0;
        for (let i = 0; i < 3; i++) {
            await idbPutDoc({ id: ids[i], userEmail, type: i === 0 ? 'documento' : i === 1 ? 'foto-codigo' : 'selfie', blob: files[i], createdAt: Date.now() });
            count++; if (progressBar) progressBar.style.width = Math.round((count / 3) * 100) + '%';
        }
        if (progressBar) progressBar.style.width = '100%';

        // Guardar referências no localStorage (sem base64)
        const docs = [
            { userEmail, type: 'documento', url: null, docId: ids[0], submittedAt: new Date().toISOString(), status: 'pending' },
            { userEmail, type: 'foto-codigo', url: null, docId: ids[1], submittedAt: new Date().toISOString(), status: 'pending' },
            { userEmail, type: 'selfie', url: null, docId: ids[2], submittedAt: new Date().toISOString(), status: 'pending' }
        ];
        localStorage.setItem('pendingVerifications', JSON.stringify(docs));

        // Atualizar lista de verificações do admin imediatamente
        try {
            let verifs = JSON.parse(localStorage.getItem('verifications') || '[]');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const u = users.find(x => (x.email || '').toLowerCase() === userEmail.toLowerCase()) || { name: userEmail };
            const documents = {
                documento: { name: 'Documento de Identificação', uploaded: true, verified: false, url: null, docId: ids[0] },
                'foto-codigo': { name: 'Foto com Código', uploaded: true, verified: false, url: null, docId: ids[1] },
                selfie: { name: 'Selfie', uploaded: true, verified: false, url: null, docId: ids[2] }
            };
            // Se existir qualquer verificação anterior (aprovada/rejeitada/pendente), vamos substituir por uma PENDENTE nova
            const existingIdx = verifs.findIndex(v => (v.userEmail || '').toLowerCase() === userEmail.toLowerCase());
            const verificationObj = {
                id: existingIdx !== -1 ? verifs[existingIdx].id : Date.now() + Math.floor(Math.random() * 1000),
                userId: u.id || null,
                userName: u.name || userEmail,
                userEmail,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                documents,
                notes: 'Documentos enviados pelo anunciante',
                adminNotes: ''
            };
            if (existingIdx !== -1) verifs[existingIdx] = verificationObj; else verifs.push(verificationObj);
            localStorage.setItem('verifications', JSON.stringify(verifs));
        } catch (e) { console.warn('Falha ao atualizar verifications', e); }

        alert('Documentos enviados com sucesso! Aguarde aprovação do administrador.');
        // Notificar anunciante: em análise
        try {
            let notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
            notifications.push({
                id: Date.now(),
                userEmail,
                type: 'verification_submitted',
                title: 'Verificação enviada',
                message: 'Seus documentos foram enviados e estão em análise.',
                createdAt: new Date().toISOString(),
                read: false,
                actionUrl: 'painel-anunciante.html'
            });
            localStorage.setItem('userNotifications', JSON.stringify(notifications));
            if (typeof loadUserNotifications === 'function') loadUserNotifications();
        } catch (_) { }
        closeModal('verificationModal');
        inputs.forEach(input => input.value = '');
        syncVerificationStatus();
        if (progressWrap) setTimeout(() => progressWrap.style.display = 'none', 500);

    } catch (e) {
        console.error('Erro ao enviar documentos:', e);
        alert('Erro ao enviar documentos. Tente novamente.');
    }
}

// Funções para upload de fotos
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#8B0000';
    e.currentTarget.style.background = '#f8f9fa';
}

function handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFiles(files);
}

// Marca d'água nas imagens
function applyWatermarkToDataUrl(dataUrl, watermarkText = 'DesejosMS', logoUrl = null) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            
            // Redimensionar para no máximo 1000px (largura ou altura) para economizar localStorage
            let width = img.width;
            let height = img.height;
            const maxDimension = 1000;
            
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = (maxDimension / width) * height;
                    width = maxDimension;
                } else {
                    width = (maxDimension / height) * width;
                    height = maxDimension;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // Removido: não aplicar marca d'água preta embutida.
            // A marca branca é aplicada como overlay nas páginas de perfil.
            // Opcional: logo
            if (logoUrl) {
                try {
                    const logo = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = logoUrl; });
                    const w = Math.min(canvas.width * 0.25, 320); const h = w * (logo.height / logo.width);
                    ctx.globalAlpha = 0.25;
                    ctx.drawImage(logo, canvas.width - w - 16, canvas.height - h - 16, w, h);
                } catch (_) { }
            }
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

// Sobrescrever handleFiles para aplicar marca d'água e limitar
async function handleFiles(files) {
    console.log('🖼️ Processando arquivos...', files.length);
    // Garantir que photos seja um array
    if (!Array.isArray(adData.photos)) {
        adData.photos = [];
    }

    const preview = document.getElementById('photoPreview');
    if (preview) {
        const loading = document.createElement('div');
        loading.id = 'photoLoading';
        loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando fotos...';
        loading.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 10px; color: #8B0000; font-weight: bold; font-family: sans-serif;';
        preview.appendChild(loading);
    }

    const fileArray = Array.from(files);
    for (const file of fileArray) {
        if (file.type.startsWith('image/') && adData.photos.length < 6) {
            try {
                console.log('📄 Processando arquivo:', file.name);
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const watermarked = await applyWatermarkToDataUrl(String(dataUrl), 'DesejosMS');
                addPhoto(watermarked);
            } catch (error) {
                console.error('❌ Erro ao processar:', file.name, error);
            }
        }
    }

    const loadingEl = document.getElementById('photoLoading');
    if (loadingEl) loadingEl.remove();
    updatePhotoPreview();
}

function addPhoto(src) {
    if (!Array.isArray(adData.photos)) adData.photos = [];
    adData.photos.push(src);
    updatePhotoPreview();
    // Salvar rascunho com os novos dados (sem fotos binárias pesadas, mas marca que tem itens mudados)
    if (typeof saveAdDraft === 'function') saveAdDraft();
}

function updatePhotoPreview() {
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '';

    adData.photos.forEach((photo, index) => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-item';
        photoDiv.innerHTML = `
            <img src="${photo}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;">
            <button onclick="removePhoto(${index})" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        photoDiv.style.position = 'relative';
        preview.appendChild(photoDiv);
    });
}

function removePhoto(index) {
    adData.photos.splice(index, 1);
    updatePhotoPreview();
}

// Funções para ações de anúncios
function editAd(adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const ad = announcements.find(a => a.id === adId);

    if (!ad) {
        alert('Anúncio não encontrado!');
        return;
    }

    // Preencher o formulário com os dados do anúncio
    adData = { ...ad };

    // Preencher campos do formulário
    const titleEl = document.getElementById('adTitle') || document.getElementById('adName');
    if (titleEl) titleEl.value = ad.name || '';
    
    document.getElementById('adAge').value = ad.age || '';
    
    // Configurar estado e aguardar cidades para selecionar a correta
    const stateSelect = document.getElementById('adState');
    if (stateSelect && ad.state) {
        stateSelect.value = ad.state;
        loadCitiesForState();
    }
    document.getElementById('adCity').value = ad.city || '';
    
    document.getElementById('adDescription').value = ad.description || '';
    
    // Tratamento de preço
    const priceStr = String(ad.price || '').replace('R$', '').trim();
    document.getElementById('adPrice').value = priceStr;
    
    const whatsappEl = document.getElementById('adWhatsApp') || document.getElementById('adWhatsapp');
    if (whatsappEl) whatsappEl.value = ad.whatsapp || ad.phone || '';
    
    document.getElementById('adCategory').value = ad.category || '';

    // Selecionar serviços, disponibilidade, e tipo de atendimento
    const serviceCheckboxes = document.querySelectorAll('input[name="services"]');
    serviceCheckboxes.forEach(checkbox => {
        checkbox.checked = ad.services && ad.services.includes(checkbox.value);
    });

    const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');
    availabilityCheckboxes.forEach(checkbox => {
        checkbox.checked = ad.availability && ad.availability.includes(checkbox.value);
    });

    const serviceTypeCheckboxes = document.querySelectorAll('input[name="serviceType"]');
    serviceTypeCheckboxes.forEach(checkbox => {
        checkbox.checked = ad.serviceType && ad.serviceType.includes(checkbox.value);
    });

    // Carregar fotos
    if (ad.photos) {
        adData.photos = [...ad.photos];
        updatePhotoPreview();
    }
    
    // Carregar vídeo
    if (ad.video) {
        adData.video = ad.video;
        const videoPreview = document.getElementById('videoPreview');
        if (videoPreview) {
            videoPreview.innerHTML = `
                <video src="${ad.video}" controls style="width: 100%; max-height: 200px; border-radius: 8px; margin-top: 10px;"></video>
                <button type="button" onclick="document.getElementById('videoInput').value=''; document.getElementById('videoPreview').innerHTML=''; delete adData.video;" style="margin-top: 5px; background: red; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Remover Vídeo
                </button>
            `;
        }
    }

    // Mostrar modal de edição
    showCreateAdModal();

    // Mudar título do modal
    document.querySelector('.modal-title').textContent = 'Editar Anúncio';
    document.getElementById('createAdBtn').textContent = 'Atualizar Anúncio';

    // Marcar como modo edição
    adData.isEditing = true;
    adData.originalId = adId;
}

function pauseAd(adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const adIndex = announcements.findIndex(a => a.id === adId);

    if (adIndex === -1) {
        alert('Anúncio não encontrado!');
        return;
    }

    const newStatus = announcements[adIndex].status === 'active' ? 'paused' : 'active';
    announcements[adIndex].status = newStatus;

    localStorage.setItem('announcements', JSON.stringify(announcements));
    loadUserAds();

    const statusText = newStatus === 'active' ? 'ativado' : 'pausado';
    alert(`Anúncio ${statusText} com sucesso!`);
}

function promoteAd(adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const adIndex = announcements.findIndex(a => a.id === adId);

    if (adIndex === -1) {
        alert('Anúncio não encontrado!');
        return;
    }

    const ad = announcements[adIndex];

    // Verificar se já é SUPERVIP
    if (ad.planType === 'supervip') {
        alert('Este anúncio já está no plano máximo!');
        return;
    }

    // Mostrar modal de promoção
    showPromotionModal(ad);
}

function showPromotionModal(ad) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    let topOptionHtml = '';
    if (ad.planType !== 'top') {
        topOptionHtml = `
                    <div class="plan-card" onclick="selectPromotionPlan('top', ${ad.id})">
                        <h4>Plano TOP</h4>
                        <div class="price">R$ 149,99</div>
                        <ul>
                            <li>Destaque especial</li>
                            <li>3x mais visualizações</li>
                            <li>Suporte prioritário</li>
                        </ul>
                    </div>
        `;
    }

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Promover Anúncio</h3>
                <button onclick="this.closest('.modal').remove()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Escolha um plano para promover seu anúncio:</p>
                
                <div class="plan-options">
                    ${topOptionHtml}
                    <div class="plan-card" onclick="selectPromotionPlan('supervip', ${ad.id})">
                        <h4>Plano SUPERVIP</h4>
                        <div class="price">R$ 199,99</div>
                        <ul>
                            <li>Máximo destaque</li>
                            <li>10x mais visualizações</li>
                            <li>Suporte VIP 24/7</li>
                            <li>Anúncio fixo no topo</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function selectPromotionPlan(planType, adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const adIndex = announcements.findIndex(a => a.id === adId);

    if (adIndex === -1) {
        alert('Anúncio não encontrado!');
        return;
    }

    const price = planType === 'top' ? 149.99 : 199.99;

    // Atualizar anúncio
    announcements[adIndex].planType = planType;
    announcements[adIndex].isVip = planType === 'supervip';
    announcements[adIndex].paidAmount = price;

    localStorage.setItem('announcements', JSON.stringify(announcements));

    // Fechar modal
    document.querySelector('.modal').remove();

    // Recarregar anúncios
    loadUserAds();

    alert(`Anúncio promovido para ${planType.toUpperCase()} com sucesso!`);
}

// Fechar modais ao clicar fora
window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Função para obter configuração do estado atual
function getCurrentStateConfig() {
    // Verificar se o config.js está carregado
    if (typeof siteConfig !== 'undefined') {
        const currentState = siteConfig.currentState || 'MS';
        return siteConfig.states[currentState];
    }

    // Fallback para configuração padrão do MS
    return {
        cities: [
            { id: 'campo-grande', name: 'Campo Grande', active: true },
            { id: 'dourados', name: 'Dourados', active: true },
            { id: 'tres-lagoas', name: 'Três Lagoas', active: true },
            { id: 'corumba', name: 'Corumbá', active: true },
            { id: 'ponta-pora', name: 'Ponta Porã', active: true },
            { id: 'navirai', name: 'Naviraí', active: true },
            { id: 'aquidauana', name: 'Aquidauana', active: true },
            { id: 'sidrolandia', name: 'Sidrolândia', active: true }
        ]
    };
}

// Função para validar se estado e cidade estão liberados
function validateStateAndCity(selectedState, selectedCity) {
    console.log('🔍 Validando estado e cidade:', selectedState, selectedCity);

    // Verificar se o statesManager está disponível
    if (typeof statesManager !== 'undefined') {
        // Verificar se o estado está ativo
        const stateConfig = statesManager.getStateConfig(selectedState);

        if (!stateConfig || !stateConfig.enabled) {
            console.log('❌ Estado não encontrado ou inativo:', selectedState);
            return false;
        }

        // Verificar se a cidade está no estado
        if (stateConfig.cities && Array.isArray(stateConfig.cities)) {
            // Função auxiliar para normalizar strings (remover acentos)
            const normalize = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

            const cityFound = stateConfig.cities.find(cityName => {
                const citySlug = normalize(cityName);
                const selectedSlug = normalize(selectedCity);
                // Comparar slugs (sem acentos) ou valores diretos
                return citySlug === selectedSlug || cityName.toLowerCase() === selectedCity.toLowerCase();
            });

            if (cityFound) {
                console.log('✅ Estado e cidade válidos:', selectedState, cityFound);
                return true;
            }
        }

        console.log('❌ Cidade não encontrada no estado:', selectedCity, 'em', selectedState);
        return false;
    } else {
        console.log('⚠️ statesManager não disponível, usando validação de fallback');
        return false;
    }
}

// Função para validar cidade (mantida para compatibilidade)
function validateCity(selectedCity) {
    console.log('🔍 Validando cidade (modo compatibilidade):', selectedCity);

    // Tentar obter o estado selecionado
    const stateSelect = document.getElementById('adState');
    const selectedState = stateSelect ? stateSelect.value : null;

    if (selectedState) {
        return validateStateAndCity(selectedState, selectedCity);
    }

    // Fallback para validação antiga
    if (typeof statesManager !== 'undefined') {
        const activeStates = statesManager.getActiveStates();

        for (const [stateCode, stateConfig] of Object.entries(activeStates)) {
            if (stateConfig.cities && Array.isArray(stateConfig.cities)) {
                const cityFound = stateConfig.cities.find(cityName => {
                    const cityValue = cityName.toLowerCase().replace(/\s+/g, '-');
                    const selectedValue = selectedCity.toLowerCase();
                    return cityValue === selectedValue || cityName.toLowerCase() === selectedValue;
                });

                if (cityFound) {
                    console.log('✅ Cidade válida encontrada:', cityFound, 'no estado', stateCode);
                    return true;
                }
            }
        }
    }

    console.log('❌ Cidade não encontrada em estados ativos:', selectedCity);
    return false;
}

// Função para carregar estados disponíveis (liberados pelo admin)
function loadAvailableStates() {
    const stateSelect = document.getElementById('adState');
    if (!stateSelect) return;

    // Limpar opções existentes
    stateSelect.innerHTML = '<option value="">Selecione o estado</option>';

    console.log('🗺️ Carregando estados liberados pelo admin...');

    // Verificar se o statesManager está disponível
    if (typeof statesManager !== 'undefined') {
        // Obter apenas estados ativos (liberados pelo admin)
        const activeStates = statesManager.getActiveStates();
        console.log('Estados ativos liberados pelo admin:', Object.keys(activeStates));

        if (Object.keys(activeStates).length > 0) {
            // Ordenar estados alfabeticamente
            const sortedStates = Object.entries(activeStates).sort(([, a], [, b]) => a.name.localeCompare(b.name));

            // Adicionar estados ao select
            sortedStates.forEach(([stateCode, stateConfig]) => {
                const option = document.createElement('option');
                option.value = stateCode;
                option.textContent = `${stateConfig.name} (${stateCode})`;
                stateSelect.appendChild(option);
            });

            console.log('✅ Estados carregados no select:', Object.keys(activeStates).length);
        } else {
            // Nenhum estado disponível
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum estado liberado pelo admin';
            option.disabled = true;
            stateSelect.appendChild(option);

            console.log('⚠️ Nenhum estado ativo disponível');
        }
    } else {
        // Fallback para sistema antigo se statesManager não estiver disponível
        console.log('⚠️ statesManager não disponível, usando sistema de fallback');

        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Sistema de estados não disponível';
        option.disabled = true;
        stateSelect.appendChild(option);
    }

    console.log('Estados finais no select:', Array.from(stateSelect.options).map(opt => opt.textContent));
}

// Função para carregar cidades do estado selecionado
function loadCitiesForState() {
    const stateSelect = document.getElementById('adState');
    const citySelect = document.getElementById('adCity');

    if (!stateSelect || !citySelect) return;

    const selectedState = stateSelect.value;

    // Limpar cidades
    citySelect.innerHTML = '<option value="">Selecione a cidade</option>';

    if (!selectedState) {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">Primeiro selecione um estado</option>';
        return;
    }

    console.log('🏙️ Carregando cidades para o estado:', selectedState);

    // Verificar se o statesManager está disponível
    if (typeof statesManager !== 'undefined') {
        const stateConfig = statesManager.getStateConfig(selectedState);

        if (stateConfig && stateConfig.enabled && stateConfig.cities) {
            // Ordenar cidades alfabeticamente
            const sortedCities = [...stateConfig.cities].sort();

            // Adicionar cidades ao select
            const normalize = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

            sortedCities.forEach(cityName => {
                const option = document.createElement('option');
                option.value = normalize(cityName);
                option.textContent = cityName;
                option.setAttribute('data-state', selectedState);
                citySelect.appendChild(option);
            });

            // Habilitar o select de cidades
            citySelect.disabled = false;

            console.log('✅ Cidades carregadas para', selectedState, ':', sortedCities.length);
        } else {
            // Estado não tem cidades ou não está ativo
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhuma cidade disponível neste estado';
            option.disabled = true;
            citySelect.appendChild(option);
            citySelect.disabled = true;

            console.log('⚠️ Estado sem cidades ou inativo:', selectedState);
        }
    } else {
        // Fallback
        console.log('⚠️ statesManager não disponível');
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">Sistema não disponível</option>';
    }
}

// Função para carregar cidades disponíveis (mantida para compatibilidade)
function loadAvailableCities() {
    // Esta função agora apenas carrega os estados
    loadAvailableStates();
}

// Tornar função global para uso no HTML
window.loadCitiesForState = loadCitiesForState;

// Funções de debug
window.checkFormData = function () {
    console.log('=== VERIFICAÇÃO DO FORMULÁRIO ===');
    console.log('Dados do anúncio:', adData);
    console.log('Plano selecionado:', selectedPlan);
    console.log('Email do usuário:', localStorage.getItem('userEmail'));

    // Verificar campos do formulário
    const fields = {
        title: document.getElementById('adTitle')?.value,
        state: document.getElementById('adState')?.value,
        city: document.getElementById('adCity')?.value,
        age: document.getElementById('adAge')?.value,
        price: document.getElementById('adPrice')?.value,
        category: document.getElementById('adCategory')?.value,
        whatsapp: document.getElementById('adWhatsApp')?.value,
        description: document.getElementById('adDescription')?.value
    };

    console.log('Valores dos campos:', fields);

    // Verificar planos selecionados
    const selectedPlanCard = document.querySelector('.plan-card.selected');
    console.log('Plano selecionado visualmente:', selectedPlanCard);

    // Verificar fotos
    console.log('Fotos carregadas:', adData.photos?.length || 0);

    // Verificar se todos os campos estão preenchidos
    const requiredFields = ['title', 'city', 'age', 'price', 'category', 'whatsapp', 'description'];
    const missingFields = [];

    requiredFields.forEach(field => {
        if (!fields[field] || fields[field].trim() === '') {
            missingFields.push(field);
        }
    });

    console.log('Campos faltando:', missingFields);
    console.log('Todos os campos preenchidos:', missingFields.length === 0);
};

window.checkAnnouncements = function () {
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
            planType: ad.planType,
            userEmail: ad.userEmail
        });
    });
};

// Função para verificar cidades disponíveis
window.checkAvailableCities = function () {
    console.log('=== VERIFICAÇÃO DE CIDADES E ESTADOS DISPONÍVEIS ===');

    // Verificar estados ativos
    if (typeof statesManager !== 'undefined') {
        const activeStates = statesManager.getActiveStates();
        console.log('Estados ativos liberados pelo admin:', Object.keys(activeStates));

        // Listar cidades por estado
        Object.entries(activeStates).forEach(([stateCode, stateConfig]) => {
            console.log(`Estado ${stateCode} (${stateConfig.name}):`);
            console.log('- Cidades:', stateConfig.cities || []);
            console.log('- Marca:', stateConfig.brand);
            console.log('- Ativo desde:', stateConfig.enabledAt);
        });

        // Coletar todas as cidades disponíveis
        const allCities = [];
        Object.entries(activeStates).forEach(([stateCode, stateConfig]) => {
            if (stateConfig.cities) {
                stateConfig.cities.forEach(city => {
                    allCities.push(`${city} (${stateCode})`);
                });
            }
        });

        console.log('Todas as cidades disponíveis:', allCities);

        // Mostrar cidades no select
        const citySelect = document.getElementById('adCity');
        if (citySelect) {
            console.log('Cidades no select:', Array.from(citySelect.options).map(opt => opt.textContent));
        }

        alert(`Estados ativos: ${Object.keys(activeStates).join(', ')}\n\nCidades disponíveis: ${allCities.join(', ')}`);
    } else {
        console.log('⚠️ statesManager não disponível');

        // Fallback para sistema antigo
        const adminCities = JSON.parse(localStorage.getItem('cities')) || [];
        const activeCities = adminCities.filter(city => city.status === 'active');

        console.log('Cidades ativas (fallback):', activeCities.map(c => ({
            name: c.name,
            state: c.state,
            status: c.status
        })));

        alert(`Cidades disponíveis (fallback): ${activeCities.map(c => c.name).join(', ')}`);
    }
};

// Função para processar pagamento dinâmico (configurado pelo painel admin)
window.processDynamicPayment = async function (gatewayId, paymentBtn) {
    console.log('=== PROCESSANDO PAGAMENTO ' + gatewayId + ' ===');

    if (paymentBtn) {
        paymentBtn.disabled = true;
        const originalText = paymentBtn.innerHTML;
        paymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    }

    const gateways = JSON.parse(localStorage.getItem('paymentGateways')) || [];
    const gateway = gateways.find(g => g.id === gatewayId);

    // Simula uma resposta ou envia ao Webhook
    if (gateway && gateway.webhook) {
        try {
            const priceVal = document.getElementById('total').textContent.replace('R$ ', '').replace(',', '.').trim();
            const response = await fetch(gateway.webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'payment_request',
                    gateway: gateway.type,
                    plan: selectedPlan,
                    price: priceVal,
                    userEmail: localStorage.getItem('userEmail')
                })
            });
            const result = await response.json().catch(e => ({}));
            if (result.paymentUrl) {
                // Redirecionamento dinâmico se a API/Webhook responder com link
                alert('Você será redirecionado para o pagamento.');
                setTimeout(() => createAd(), 1000); // Já criamos e deixamos pendente caso o retorno do webhook atualize localstorage
                window.location.href = result.paymentUrl;
                return;
            }
        } catch (e) {
            console.warn('Erro ao chamar webhook, caindo para fallback', e);
        }
    }

    // Fallback: se não tiver webhook ou falhar, criamos em tela apenas informando o gateway (como mock para funcionamento final em modo manual)
    setTimeout(() => {
        alert(`Obrigado! Solicitação de pagamento via ${gateway ? gateway.name : 'Gateway'} recebida. O sistema processará o seu anúncio.`);
        closeModal('paymentModal');
        createAd();
    }, 2000);
};


// Função para testar verificação
window.testVerification = function () {
    console.log('=== TESTANDO VERIFICAÇÃO ===');
    const isVerified = localStorage.getItem('userVerified') === 'true';
    console.log('Status atual:', isVerified ? 'Verificada' : 'Não Verificada');

    // Alternar status para teste
    const newStatus = !isVerified;
    localStorage.setItem('userVerified', newStatus.toString());

    console.log('Novo status:', newStatus ? 'Verificada' : 'Não Verificada');

    // Sincronizar em todo o sistema
    syncVerificationStatus();

    alert(`Status alterado para: ${newStatus ? 'Verificada' : 'Não Verificada'}`);
};

// Função para forçar criação de anúncio (para teste)
window.forceCreateAd = function () {
    console.log('=== FORÇANDO CRIAÇÃO DE ANÚNCIO ===');

    // Preencher dados de teste
    adData = {
        title: 'Anúncio de Teste',
        city: 'Campo Grande',
        age: 25,
        price: 200,
        category: 'mulher',
        whatsapp: '(67) 99999-9999',
        description: 'Descrição de teste para o anúncio',
        services: ['massagem-relaxante', 'atendimento-vip'],
        availability: '24h',
        serviceType: 'motel',
        photos: ['https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Teste']
    };

    selectedPlan = 'basic';

    console.log('Dados de teste preenchidos:', adData);
    console.log('Plano selecionado:', selectedPlan);

    // Criar anúncio diretamente
    createAd();
};

// Função para verificar campo de descrição
window.checkDescriptionField = function () {
    console.log('=== VERIFICANDO CAMPO DE DESCRIÇÃO ===');

    const descriptionElement = document.getElementById('adDescription');
    console.log('Elemento encontrado:', descriptionElement);

    if (descriptionElement) {
        console.log('Valor atual:', descriptionElement.value);
        console.log('Valor trim:', descriptionElement.value.trim());
        console.log('Length:', descriptionElement.value.length);

        // Testar preenchimento
        descriptionElement.value = 'Descrição de teste para verificar se o campo funciona corretamente';
        console.log('Valor após preenchimento:', descriptionElement.value);

        alert('Campo de descrição preenchido com texto de teste. Verifique se aparece no campo.');
    } else {
        alert('ERRO: Campo de descrição não encontrado!');
    }
};

// Função para testar verificação (DEBUG)
function testVerification() {
    console.log('=== TESTE DE VERIFICAÇÃO ===');

    // 1. Verificar se o modal existe
    const modal = document.getElementById('verificationModal');
    console.log('Modal encontrado:', !!modal);

    // 2. Verificar inputs de arquivo
    const inputs = modal ? modal.querySelectorAll('input[type="file"]') : [];
    console.log('Inputs de arquivo encontrados:', inputs.length);

    // 3. Verificar localStorage atual
    const pendingDocs = JSON.parse(localStorage.getItem('pendingVerifications') || '[]');
    console.log('Documentos pendentes atuais:', pendingDocs.length);

    // 4. Verificar usuário atual
    const userEmail = localStorage.getItem('userEmail') || 'teste@desejosms.com';
    console.log('Email do usuário:', userEmail);

    // 5. Simular envio de documentos
    console.log('Simulando envio de documentos...');
    const mockDocs = [
        { userEmail, type: 'documento', url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', submittedAt: new Date().toISOString(), status: 'pending' },
        { userEmail, type: 'foto-codigo', url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', submittedAt: new Date().toISOString(), status: 'pending' },
        { userEmail, type: 'selfie', url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', submittedAt: new Date().toISOString(), status: 'pending' }
    ];

    // 6. Salvar documentos simulados
    const filtered = pendingDocs.filter(v => v.userEmail !== userEmail);
    const newPendingDocs = [...filtered, ...mockDocs];
    localStorage.setItem('pendingVerifications', JSON.stringify(newPendingDocs));

    console.log('Documentos simulados salvos!');
    console.log('Total de documentos pendentes:', newPendingDocs.length);

    // 7. Verificar se foram salvos corretamente
    const savedDocs = JSON.parse(localStorage.getItem('pendingVerifications') || '[]');
    console.log('Documentos salvos verificados:', savedDocs.length);

    alert('Teste de verificação concluído! Verifique o console para detalhes.');
}

// Notificações (sino)
function loadUserNotifications() {
    try {
        const email = (localStorage.getItem('userEmail') || '').toLowerCase();
        const all = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        const mine = all.filter(n => String(n.userEmail || '').toLowerCase() === email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const unread = mine.filter(n => !n.read).length;
        const badge = document.getElementById('notifCount');
        if (badge) {
            badge.style.display = unread > 0 ? 'inline-block' : 'none';
            badge.textContent = String(unread);
        }
        const list = document.getElementById('notifList');
        if (list) {
            list.innerHTML = mine.length ? '' : '<div style="padding:10px; color:#666;">Sem notificações.</div>';
            mine.forEach(n => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:10px; border-bottom:1px solid #eee;';
                item.innerHTML = `<div style="font-weight:700;">${n.title || 'Notificação'}</div>
					<div style="font-size:12px; color:#666;">${new Date(n.createdAt).toLocaleString('pt-BR')}</div>
					<div style="margin-top:6px;">${n.message || ''}</div>
					${n.actionUrl ? `<div style="margin-top:8px;"><a class="btn btn-primary" href="${n.actionUrl}">Abrir</a></div>` : ''}`;
                list.appendChild(item);
            });
        }
    } catch (e) { console.warn('Falha notificações', e); }
}
function toggleNotifications() {
    const dd = document.getElementById('notifDropdown');
    if (!dd) return;
    const isOpen = dd.style.display === 'block';
    dd.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        // marcar como lidas
        const email = (localStorage.getItem('userEmail') || '').toLowerCase();
        let all = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        let changed = false;
        all = all.map(n => {
            if (String(n.userEmail || '').toLowerCase() === email) { if (!n.read) { n.read = true; changed = true; } }
            return n;
        });
        if (changed) localStorage.setItem('userNotifications', JSON.stringify(all));
        loadUserNotifications();
    }
}
window.addEventListener('storage', function (e) { if (e.key === 'userNotifications') { loadUserNotifications(); } });