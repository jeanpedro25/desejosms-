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

    if (window.syncUsersFromSupabase) {
        await window.syncUsersFromSupabase();
    }

    if (window.syncVerificationsFromSupabase) {
        await window.syncVerificationsFromSupabase();
    }

    if (window.syncSettingsFromSupabase) {
        await window.syncSettingsFromSupabase();
    }

    // RESET INICIAL: não apagar rascunho; apenas normalizar se corrompido
    console.log('🧹 Executando reset inicial...');
    localStorage.removeItem('tempPlan');
    localStorage.removeItem('tempSelectedPlan');
    // preservar 'tempAdCreation' como rascunho para continuar depois
    sessionStorage.removeItem('formStep');

    // Limpar cache de gateways antigos (remove LivePix, força apenas Stripe)
    localStorage.removeItem('paymentGateways');
    console.log('🔄 Cache de gateways limpo — será recarregado com Stripe.');

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


    // Garantir que o usuário está logado (sem fallback inseguro)
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        // Se não há email, redirecionar para login
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html?loginRequired=1';
        return;
    }

    // Verificar se usuário está bloqueado
    try {
        const usersList = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = usersList.find(u => u.email === userEmail);
        if (currentUser && currentUser.blocked) {
            // Conta bloqueada: exibir mensagem e travar interações
            document.body.innerHTML = `
                <div style="background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', sans-serif; color: white; text-align: center; padding: 20px;">
                    <div style="background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px); border-radius: 20px; padding: 40px; max-width: 500px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);">
                        <i class="fas fa-user-slash" style="font-size: 64px; color: #FFD700; margin-bottom: 20px;"></i>
                        <h2 style="font-size: 28px; font-family: 'Playfair Display', serif; margin-bottom: 15px;">Conta Bloqueada</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.9); margin-bottom: 25px;">
                            Prezado anunciante, sua conta foi temporariamente suspensa por violação dos nossos Termos de Uso e Regras da Plataforma.
                        </p>
                        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; font-size: 14px; margin-bottom: 25px; text-align: left;">
                            <strong>Como proceder?</strong><br>
                            Se você acredita que houve um equívoco ou deseja esclarecimentos, entre em contato direto com a nossa equipe de Suporte Técnico. Seus dados e anúncios continuam preservados no sistema aguardando análise.
                        </div>
                        <a href="index.html" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #8B0000; font-weight: bold; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 15px rgba(255,215,0,0.3); transition: transform 0.2s;">
                            <i class="fas fa-arrow-left"></i> Voltar ao Site
                        </a>
                    </div>
                </div>
            `;
            return;
        }
    } catch (e) { console.error('Erro ao verificar bloqueio:', e); }

    if (!localStorage.getItem('userName')) {
        localStorage.setItem('userName', '');
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

    // ── Renovação via e-mail/WhatsApp ──
    const renewId = urlParams.get('renew');
    if (renewId) {
        console.log(`⏳ Link de renovação detectado para o ID: ${renewId}`);
        setTimeout(() => triggerRenewalProtocol(renewId), 1500);
    }

    // ── Retorno do Stripe: cancelado ou sucesso ──
    const payStatus = urlParams.get('status');
    if (payStatus) {
        // Limpar a URL sem recarregar a página
        window.history.replaceState({}, document.title, window.location.pathname);

        if (payStatus === 'success') {
            // Pagamento confirmado — anúncio deve ser ativado via webhook
            // Mostrar mensagem de sucesso e recarregar anúncios
            setTimeout(() => {
                const msg = document.createElement('div');
                msg.style.cssText = 'position:fixed; top:20px; right:20px; background:linear-gradient(135deg,#28a745,#20c997); color:white; padding:20px 28px; border-radius:14px; z-index:99999; font-size:16px; font-weight:600; box-shadow:0 8px 30px rgba(40,167,69,0.4); animation:slideIn 0.4s ease;';
                msg.innerHTML = '<i class="fas fa-check-circle" style="margin-right:8px;"></i> Pagamento confirmado! Seu anúncio será ativado em breve.';
                document.body.appendChild(msg);
                setTimeout(() => msg.remove(), 6000);
                loadUserAds();
                loadDashboardStats();
            }, 800);

        } else if (payStatus === 'cancel') {
            // Pagamento cancelado — verificar se é upgrade ou criação nova
            const pendingUpgradeAdId = localStorage.getItem('upgradeAdId');
            const pendingPlan = localStorage.getItem('upgradePlanType');

            setTimeout(() => {
                if (pendingUpgradeAdId && pendingPlan) {
                    // Era um upgrade — reabrir modal de pagamento diretamente
                    console.log('🔄 Retomando upgrade cancelado do anúncio:', pendingUpgradeAdId);
                    selectedPlan = pendingPlan;
                    showPaymentModal();
                } else {
                    // Era criação nova — abrir rascunho se existir
                    const savedDraft = JSON.parse(localStorage.getItem('tempAdCreation') || 'null');
                    if (savedDraft && savedDraft.adData && savedDraft.adData.title) {
                        console.log('🔄 Retomando criação de anúncio cancelada...');
                        // Mostrar opção de retomar
                        const resumeBanner = document.createElement('div');
                        resumeBanner.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1a1a2e; color:white; padding:16px 24px; border-radius:14px; z-index:99999; font-size:15px; box-shadow:0 8px 30px rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; gap:16px;';
                        resumeBanner.innerHTML = `
                            <span><i class="fas fa-file-alt" style="color:#ffc107;"></i> Você tem um anúncio incompleto: <strong>${savedDraft.adData.title || 'sem título'}</strong></span>
                            <button onclick="showCreateAdModal(); this.closest('div').remove();" style="background:#dc3545; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:600;">Continuar</button>
                            <button onclick="localStorage.removeItem('tempAdCreation'); this.closest('div').remove();" style="background:rgba(255,255,255,0.1); color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;">Descartar</button>
                        `;
                        document.body.appendChild(resumeBanner);
                    }
                }
            }, 800);
        }
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
            console.log('➡️ Botão de navegação clicado');
            handleNextClick();
        });

        // Garantir que o onclick seja preservado
        newNextBtn.onclick = handleNextClick;

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
        } else if (latestVerification && latestVerification.status === 'pending') {
            dashboardStatus.textContent = 'Em análise';
            dashboardStatus.className = 'stat-number status-pending';
            dashboardStatus.style.color = '#fff';
            if (dashboardNotice) {
                dashboardNotice.innerHTML = '<i class="fas fa-hourglass-half"></i> Seus documentos estão sendo analisados.';
                dashboardNotice.style.color = '#fff';
            }
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
        } else if (latestVerification && latestVerification.status === 'pending') {
            profileStatus.innerHTML = '<i class="fas fa-hourglass-half"></i> Em análise';
            profileStatus.className = 'status-pending-analysis';
            profileStatus.style.background = '#fff3cd';
            profileStatus.style.color = '#856404';
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
        // Só diminui os dias se o anúncio já foi ativado
        let daysRemaining = 30;
        let daysUsed = 0;
        if (ad.status === 'active' || ad.status === 'paused') {
            const startDate = ad.approvedAt ? new Date(ad.approvedAt) : new Date(ad.createdAt);
            daysUsed = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24));
            daysRemaining = Math.max(0, 30 - daysUsed);
        }

        const performance = Math.floor((ad.views || 0) / 1000 * 100);

        // Usar primeira foto do anúncio ou placeholder
        const photoSrc = ad.photos && ad.photos.length > 0 ? ad.photos[0] : `https://via.placeholder.com/50x50/FFB6C1/FFFFFF?text=${encodeURIComponent(ad.name.charAt(0))}`;

        let expInfo = '';
        if (ad.status === 'pending' || ad.status === 'pending_payment') {
            expInfo = `
                <div style="color: #f59e0b; font-weight: 500;"><i class="fas fa-clock"></i> Aguardando</div>
                <div style="font-size: 12px; color: #666;">Inicia após pgto</div>
            `;
        } else {
            expInfo = `
                <div>${daysRemaining} dias restantes</div>
                <div style="font-size: 12px; color: #666;">${daysUsed}/30 dias usados</div>
            `;
        }

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
                    ${expInfo}
                </td>
                <td>
                    <span class="plan-badge ${ad.planType}">${ad.planType.toUpperCase()}</span>
                </td>
                <td>
                    <div style="display:flex; gap:5px; flex-wrap:wrap;">

                        ${(ad.status === 'pending' || ad.status === 'pending_payment') ? `
                            <button class="action-btn" onclick="resumePayment(${ad.id})" title="Concluir Pagamento"
                                style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">
                                <i class="fas fa-credit-card"></i> Pagar
                            </button>
                        ` : `
                            <button class="action-btn" onclick="editAd(${ad.id})" title="${(ad.planType||'').toLowerCase()==='supervip' ? 'Editar Anúncio' : 'Edição exclusiva SuperVIP'}">
                                <i class="fas fa-edit"></i>
                            </button>
                        `}

                        ${(ad.status === 'active' || ad.status === 'paused') ? `
                            <button class="action-btn" onclick="pauseAd(${ad.id})" title="${ad.status === 'paused' ? 'Retomar Anúncio' : 'Pausar Anúncio'}">
                                <i class="fas ${ad.status === 'paused' ? 'fa-play' : 'fa-pause'}"></i>
                            </button>
                        ` : ''}

                        ${(ad.planType || '').toLowerCase() !== 'supervip' ? `
                            <button class="action-btn" onclick="promoteAd(${ad.id})" title="Fazer Upgrade de Plano"
                                style="color:#f59e0b;">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                        ` : ''}

                        <button class="action-btn" onclick="deleteAd(${ad.id})" title="Excluir Anúncio"
                            style="color:#dc3545;">
                            <i class="fas fa-trash"></i>
                        </button>

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
        let modal = document.getElementById('createAdModal');
        if (!modal) {
            console.warn('❌ Modal não encontrado. Forçando atualização da página...');
            window.location.reload();
            return;
        }

        // Sempre carregar estados e limpar o que for básico
        loadAvailableStates();
        
        // Sempre resetar para novo anúncio limpo
        localStorage.removeItem('adCreationDraft');
        localStorage.removeItem('tempAdCreation');
        resetAdForm();

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
    console.log('=== NAVEGANDO PARA O PRÓXIMO PASSO === (De ' + currentStep + ' para ' + (currentStep + 1) + ')');

    try {
        if (currentStep >= 4) {
            console.log('🏁 Já estamos no último passo, finalizando...');
            finishAdCreation();
            return;
        }
        
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
        } else {
            // Fallback para segurança
            finishAdCreation();
        }
    } catch (error) {
        console.error('❌ Erro ao avançar step:', error);
    }
}

// Função para exibir erros de validação na tela (toast visual, nunca bloqueado)
function showValidationError(message) {
    // Remover toast anterior se existir
    const existing = document.getElementById('validationToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'validationToast';
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #dc3545, #c0392b); color: white;
        padding: 16px 28px; border-radius: 12px; z-index: 999999;
        font-size: 15px; font-weight: 600; max-width: 90%; text-align: center;
        box-shadow: 0 8px 32px rgba(220,53,69,0.4); animation: slideDown 0.3s ease;
        white-space: pre-line; line-height: 1.5;
    `;
    toast.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>${message.replace(/\n/g, '<br>')}`;

    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = '@keyframes slideDown { from { top: -60px; opacity: 0; } to { top: 20px; opacity: 1; } }';
    if (!document.getElementById('toastAnimStyle')) { style.id = 'toastAnimStyle'; document.head.appendChild(style); }

    document.body.appendChild(toast);

    // Botão de fechar
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = ' ✕';
    closeBtn.style.cssText = 'cursor:pointer; margin-left:12px; opacity:0.8;';
    closeBtn.onclick = () => toast.remove();
    toast.appendChild(closeBtn);

    // Auto-dismiss após 5 segundos
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);

    console.log('❌ Validação:', message);
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

                if (!adData.photos || adData.photos.length === 0) {
                    return { isValid: false, message: 'Suas fotos foram perdidas (talvez você tenha recarregado a página). Por favor, clique em "Anterior" e adicione pelo menos uma foto novamente.' };
                }

                if (!adData.title || !adData.city) {
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
        'basic': 5.00,
        'top': 5.25,
        'supervip': 5.50,
        'premium': 299.99,
        'vip': 399.99
    };
    return prices[planType] || 5.00;
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

    // Limpar estado do cupom anterior ao abrir o modal
    localStorage.removeItem('appliedCoupon');
    const couponInput = document.getElementById('couponInput');
    if (couponInput) couponInput.value = '';

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

// Função para renderizar gateways configurados - VERSÃO CORRIGIDA
function renderPaymentGateways() {
    // Usar os novos IDs do HTML refatorado
    const tabsContainer = document.getElementById('gatewayTabs') || document.querySelector('.payment-tabs');
    const contentContainer = document.getElementById('gatewayContent') || document.querySelector('.payment-content');

    if (!tabsContainer || !contentContainer) {
        console.error('❌ Containers de gateway não encontrados no DOM!');
        return;
    }

    let gateways = JSON.parse(localStorage.getItem('paymentGateways') || '[]');
    
    // ───── APENAS STRIPE (CARTÃO) ─────
    let stripeGateway = gateways.find(g => g.type === 'stripe');
    if (!stripeGateway) {
        gateways.push({
            id: 'auto_stripe',
            type: 'stripe',
            name: 'Cartão de Crédito',
            status: 'active',
            publicKey: 'pk_live_51T722i2L1IcRtzrKowBa5Aky602z3c3wA2amAoN4egh0YFaJyumd534L1yPh1clz50c7y1mHPP5edTXYtBVHDoAz00JIBKKX6s',
            environment: 'production'
        });
        localStorage.setItem('paymentGateways', JSON.stringify(gateways));
    } else {
        stripeGateway.status = 'active';
        stripeGateway.name = 'Cartão de Crédito';
        localStorage.setItem('paymentGateways', JSON.stringify(gateways));
    }

    // Exibir APENAS Stripe
    const activeGateways = gateways.filter(g => g.type === 'stripe');

    console.log('🔧 Gateway ativo:', activeGateways.map(g => `${g.name}(${g.type})`).join(', '));

    // Fallback se não houver gateways configurados
    const gatewaysToShow = activeGateways.length > 0 ? activeGateways : [
        {
            id: 'admin_contact_default',
            type: 'local',
            name: 'Contato com Admin',
            status: 'active',
            publicKey: ''
        }
    ];

    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    gatewaysToShow.forEach((gateway, index) => {
        const isActive = index === 0;
        const gwId = String(gateway.id);

        // ── CRIAR TAB ──────────────────────────────────────────
        const tab = document.createElement('button');
        tab.className = `tab-btn${isActive ? ' active' : ''}`;
        tab.setAttribute('data-gateway-id', gwId);
        tab.setAttribute('data-gateway-type', gateway.type);

        let icon = 'fa-credit-card';
        if (gateway.type === 'cakto')      icon = 'fa-shopping-cart';
        if (gateway.type === 'stripe')     icon = 'fa-stripe-s';
        if (gateway.type === 'mercadopago') icon = 'fa-handshake';
        if (gateway.type === 'efi')        icon = 'fa-university';
        if (gateway.type === 'pix')        icon = 'fa-qrcode';
        if (gateway.type === 'abacatepay') icon = 'fa-leaf';
        if (gateway.type === 'kiwify')     icon = 'fa-kiwi-bird';
        if (gateway.type === 'local')      icon = 'fa-phone';

        tab.innerHTML = `<i class="fas ${icon}"></i> ${gateway.name}`;

        tab.addEventListener('click', function () {
            const clickedGwId = this.getAttribute('data-gateway-id');
            // Desativar todas as tabs
            tabsContainer.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            // Esconder todos os painéis
            contentContainer.querySelectorAll('.gateway-panel').forEach(p => {
                p.style.display = 'none';
                p.classList.remove('active');
            });
            // Ativar tab clicada
            this.classList.add('active');
            // Mostrar painel correspondente
            const targetPanel = document.getElementById(`gw-panel-${clickedGwId}`);
            if (targetPanel) {
                targetPanel.style.display = 'block';
                targetPanel.classList.add('active');
            }

        });

        tabsContainer.appendChild(tab);

        // ── CRIAR PAINEL DE CONTEÚDO ────────────────────────────
        const panel = document.createElement('div');
        panel.className = `gateway-panel${isActive ? ' active' : ''}`;
        panel.id = `gw-panel-${gwId}`;
        panel.style.cssText = 'display:none; padding: 20px 0;';
        if (isActive) panel.style.display = 'block';

        // Montar conteúdo conforme o tipo de gateway
        let panelHTML = '';

        if (gateway.type === 'cakto') {
            panelHTML = `
                <div style="text-align:center; padding: 10px 0 20px;">
                    <div style="width:64px; height:64px; background:linear-gradient(135deg,#6f42c1,#e83e8c); border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 16px;">
                        <i class="fas fa-shopping-cart" style="color:white; font-size:28px;"></i>
                    </div>
                    <h4 style="margin:0 0 8px; color:#333;">Pagar via Cakto</h4>
                    <p style="color:#666; font-size:14px; margin:0 0 20px;">
                        Você será redirecionado para o checkout seguro da Cakto. Aceita PIX, cartão de crédito e boleto.
                    </p>
                    <button
                        class="btn btn-primary"
                        style="width:100%; padding:14px; font-size:16px; background:linear-gradient(135deg,#6f42c1,#e83e8c); color:white; border:none; border-radius:10px; cursor:pointer;"
                        onclick="window.processDynamicPayment('${gwId}', this)">
                        <i class="fas fa-shopping-cart"></i> Pagar com Cakto — <span id="cakto-price-${gwId}">carregando...</span>
                    </button>
                </div>`;
        } else if (gateway.type === 'stripe') {
            panelHTML = `
                <div style="text-align:center; padding:10px 0 10px;">
                    <div style="width:72px; height:72px; background:linear-gradient(135deg,#635bff,#4f46e5); border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 16px; box-shadow: 0 8px 24px rgba(99,91,255,0.4);">
                        <i class="fas fa-credit-card" style="color:white; font-size:30px;"></i>
                    </div>
                    <h4 style="margin:0 0 6px; color:#333; font-size:18px;">Pagar com Cartão de Crédito</h4>
                    <p style="color:#666; font-size:13px; margin:0 0 20px;">Pagamento 100% seguro via Stripe. Seus dados são protegidos.</p>
                    <button
                        class="btn btn-primary"
                        style="width:100%; padding:15px; font-size:16px; background:linear-gradient(135deg,#635bff,#4f46e5); color:white; border:none; border-radius:10px; cursor:pointer; font-weight:700; letter-spacing:0.5px;"
                        onclick="window.processStripePayment('${gwId}', this)">
                        <i class="fas fa-lock"></i> Pagar com Cartão
                    </button>
                    <p style="font-size:11px; color:#aaa; margin-top:12px;"><i class="fas fa-shield-alt" style="color:#635bff;"></i> Criptografia SSL 256-bit · Powered by Stripe</p>
                </div>`;
        } else if (gateway.type === 'abacatepay') {
            panelHTML = `
                <div style="text-align:center; padding:10px 0 10px;">
                    <div style="width:64px; height:64px; background:linear-gradient(135deg,#65a30d,#84cc16); border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 16px;">
                        <i class="fas fa-leaf" style="color:white; font-size:28px;"></i>
                    </div>
                    <h4 style="margin:0 0 8px; color:#333;">Pagar via AbacatePay</h4>
                    <p style="color:#666; font-size:14px; margin:0 0 16px;">
                        Checkout super rápido. Escolha Pix ou Cartão:
                    </p>
                    <div style="display:flex; gap:10px; margin-bottom:16px;">
                        <label style="flex:1; border:2px solid #65a30d; border-radius:8px; padding:12px; cursor:pointer; display:flex; align-items:center; gap:8px; font-size:14px;">
                            <input type="radio" name="abacate-method-${gwId}" value="PIX" checked style="accent-color:#65a30d;">
                            <i class="fas fa-qrcode" style="color:#65a30d;"></i> PIX
                        </label>
                        <label style="flex:1; border:2px solid #65a30d; border-radius:8px; padding:12px; cursor:pointer; display:flex; align-items:center; gap:8px; font-size:14px;">
                            <input type="radio" name="abacate-method-${gwId}" value="CREDIT_CARD" style="accent-color:#65a30d;">
                            <i class="fas fa-credit-card" style="color:#65a30d;"></i> Cartão
                        </label>
                    </div>
                    <button
                        class="btn btn-primary"
                        style="width:100%; padding:14px; font-size:16px; background:linear-gradient(135deg,#65a30d,#84cc16); color:white; border:none; border-radius:10px; cursor:pointer;"
                        onclick="window.processAbacatePayment('${gwId}', this)">
                        <i class="fas fa-leaf"></i> Gerar Pagamento Seguro
                    </button>
                </div>`;
        } else if (gateway.type === 'kiwify') {
            panelHTML = `
                <div style="text-align:center; padding:10px 0 10px;">
                    <div style="width:64px; height:64px; background:linear-gradient(135deg,#1f2937,#4b5563); border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 16px;">
                        <i class="fas fa-kiwi-bird" style="color:white; font-size:28px;"></i>
                    </div>
                    <h4 style="margin:0 0 8px; color:#333;">Pagar via Kiwify</h4>
                    <p style="color:#666; font-size:14px; margin:0 0 20px;">
                        Checkout seguro via Kiwify. Aceita PIX e Cartão de Crédito com aprovação imediata.
                    </p>
                    <button
                        class="btn btn-primary"
                        style="width:100%; padding:14px; font-size:16px; background:linear-gradient(135deg,#111827,#374151); color:white; border:none; border-radius:10px; cursor:pointer;"
                        onclick="window.processKiwifyPayment('${gwId}', this)">
                        <i class="fas fa-shopping-cart"></i> Pagar Agora na Kiwify
                    </button>
                </div>`;
        } else if (gateway.type === 'efi') {
            panelHTML = `
                <div style="text-align:center; padding:10px 0 20px;">
                    <div style="width:64px; height:64px; background:linear-gradient(135deg,#F37021,#FF8C00); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
                        <i class="fas fa-university" style="color:white; font-size:28px;"></i>
                    </div>
                    <h4 style="margin:0 0 8px; color:#333;">Pagar via Efí Bank (PIX)</h4>
                    <p style="color:#666; font-size:14px; margin:0 0 10px;">Gere um PIX dinâmico com compensação imediata via Efí Bank (Gerencianet).</p>
                    
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="efi-cpf-${gwId}" placeholder="Digite seu CPF ou CNPJ" maxlength="18" 
                            style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; text-align: center; font-size: 15px;"
                            oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                    </div>

                    <button
                        class="btn btn-primary"
                        style="width:100%; padding:14px; font-size:16px; background:linear-gradient(135deg,#F37021,#FF8C00); color:white; border:none; border-radius:10px; cursor:pointer;"
                        onclick="window.processEfiPayment('${gwId}', this)">
                        <i class="fas fa-qrcode"></i> Gerar PIX Agora
                    </button>
                    <!-- Área para o QR Code -->
                    <div id="efi-qr-container-${gwId}" style="display:none; margin-top:20px; text-align:center;">
                        <img id="efi-qr-image-${gwId}" src="" alt="QR Code PIX" style="width:200px; height:200px; margin:0 auto;">
                        <input type="text" id="efi-pix-copy-${gwId}" readonly style="width:100%; padding:10px; margin-top:10px; text-align:center; font-size:12px; border:1px solid #ddd; border-radius:5px;" onclick="this.select(); document.execCommand('copy'); alert('Código PIX Copiado!');">
                        <p style="font-size:13px; color:#666; margin-top:10px;">Aguardando pagamento... O anúncio será ativado automaticamente após o pagamento.</p>
                    </div>
                </div>`;
        } else if (gateway.type === 'livepix') {
            panelHTML = `
                <div style="text-align:center; padding:10px 0 20px;">
                    <div style="width:64px; height:64px; background:linear-gradient(135deg,#673ab7,#9c27b0); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
                        <i class="fas fa-heart" style="color:white; font-size:28px;"></i>
                    </div>
                    <h4 style="margin:0 0 8px; color:#333;">Pagar via LivePix</h4>
                    <p style="color:#666; font-size:14px; margin:0 0 20px;">Pagamento via LivePix (PIX). Ideal para manter o sigilo do seu nome.</p>
                    <button
                        class="btn btn-primary"
                        style="width:100%; padding:14px; font-size:16px; background:linear-gradient(135deg,#673ab7,#9c27b0); color:white; border:none; border-radius:10px; cursor:pointer;"
                        onclick="window.processLivePixPayment('${gwId}', this)">
                        <i class="fas fa-external-link-alt"></i> Ir para o LivePix
                    </button>
                    <p style="font-size:12px; color:#999; margin-top:15px;">
                        <i class="fas fa-info-circle"></i> Após o pagamento, envie o comprovante no chat para ativação rápida.
                    </p>
                </div>`;
        } else if (gateway.type === 'mercadopago') {
            panelHTML = `
                <div style="text-align:center; padding:10px 0 20px;">
                    <div style="width:64px; height:64px; background:linear-gradient(135deg,#00a650,#009ee3); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
                        <i class="fas fa-handshake" style="color:white; font-size:28px;"></i>
                    </div>
                    <h4 style="margin:0 0 8px; color:#333;">Pagar via Mercado Pago</h4>
                    <p style="color:#666; font-size:14px; margin:0 0 20px;">PIX, cartão ou boleto via Mercado Pago.</p>
                    <button
                        class="btn btn-primary"
                        style="width:100%; padding:14px; font-size:16px; background:linear-gradient(135deg,#00a650,#009ee3); color:white; border:none; border-radius:10px; cursor:pointer;"
                        onclick="window.processDynamicPayment('${gwId}', this)">
                        <i class="fas fa-handshake"></i> Pagar com Mercado Pago
                    </button>
                </div>`;
        } else {
            // Gateway genérico / contato admin
            panelHTML = `
                <div style="text-align:center; padding:10px 0 20px;">
                    <div style="width:64px; height:64px; background:linear-gradient(135deg,#6c757d,#495057); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
                        <i class="fas fa-phone" style="color:white; font-size:28px;"></i>
                    </div>
                    <h4 style="margin:0 0 8px; color:#333;">${gateway.name}</h4>
                    <p style="color:#666; font-size:14px; margin:0 0 20px;">
                        Clique abaixo para registrar seu anúncio. Nossa equipe entrará em contato para concluir o pagamento.
                    </p>
                    <button
                        class="btn btn-primary"
                        style="width:100%; padding:14px; font-size:16px;"
                        onclick="window.processDynamicPayment('${gwId}', this)">
                        <i class="fas fa-check"></i> Finalizar e Aguardar Contato
                    </button>
                </div>`;
        }

        panel.innerHTML = panelHTML;
        contentContainer.appendChild(panel);
    });

    // Atualizar preços nos botões Cakto após render
    setTimeout(() => {
        gatewaysToShow.forEach(gw => {
            if (gw.type === 'cakto') {
                const priceEl = document.getElementById(`cakto-price-${gw.id}`);
                if (priceEl) {
                    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
                    const priceMap = { basic: 'R$ 79,90', top: 'R$ 249,90', supervip: 'R$ 499,90' };
                    priceEl.textContent = priceMap[planType] || 'ver valor acima';
                }
            }
        });
    }, 100);

    // Adicionar CSS de ativação para painéis se não existir
    if (!document.getElementById('gateway-panel-style')) {
        const style = document.createElement('style');
        style.id = 'gateway-panel-style';
        style.textContent = `
            .gateway-panel { display: none; }
            .gateway-panel.active { display: block; }
            .tab-btn[data-gateway-id] { flex: 1; }
        `;
        document.head.appendChild(style);
    }
}


// Processar pagamento dinâmico baseado no gateway
window.processDynamicPayment = async function(gatewayId, button) {
    console.log('🔄 Processando pagamento dinâmico para:', gatewayId);
    
    // Obter dados salvos dos gateways
    const gateways = JSON.parse(localStorage.getItem('paymentGateways')) || [];
    const gateway = gateways.find(g => g.id.toString() === gatewayId.toString() || g.type === gatewayId);
    
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    
    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
    const userEmail = localStorage.getItem('userEmail') || 'usuario@desejosms.com';
    
    try {
        if (!gateway) {
            throw new Error('Gateway não encontrado.');
        }
        
        const gatewayTypeLower = (gateway.type || '').toLowerCase();
        
        if (gatewayTypeLower === 'mercadopago') {
            // Chamar a função existente do mercado pago/pix
            if (typeof generatePIX === 'function') {
                await generatePIX();
            } else {
                alert('Mecanismo de PIX não carregado. Tente novamente.');
            }
            button.disabled = false;
            button.innerHTML = originalText;
            return;
        }
        
        if (gatewayTypeLower === 'paghiper') {
            console.log('💳 Iniciando fluxo real da PagHiper...');
            if (typeof generatePagHiper === 'function') {
                await generatePagHiper();
            } else {
                alert('Mecanismo de PagHiper não carregado. Tente novamente.');
            }
            button.disabled = false;
            button.innerHTML = originalText;
            return;
        }
        
        if (gatewayTypeLower === 'cakto') {
            console.log('💳 Iniciando fluxo real da Cakto...');
            
            try {
                const response = await fetch('/api/payment/cakto', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planType: planType,
                        userEmail: localStorage.getItem('userEmail') || 'usuario@desejosms.com'
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Não foi possível gerar o link de pagamento Cakto.');
                }
                
                // Salvar anúncio como PENDENTE DE PAGAMENTO (não ativa!)
                await createAd(false, 'pending_payment');
                
                // Abrir checkout da Cakto dentro do site (iframe embutido)
                showEmbeddedCheckout(data.checkout_url, data.product_name, 'Cakto');
                
                button.disabled = false;
                button.innerHTML = originalText;
                return;
            } catch (err) {
                console.error('Falha na Cakto:', err);
                alert('Erro na integração Cakto: ' + err.message);
                button.disabled = false;
                button.innerHTML = originalText;
                return;
            }
        }

        if (gatewayTypeLower === 'stripe') {
            console.log('💳 Iniciando fluxo Stripe...');
            
            // Verificar se o usuário quer PIX ou Cartão
            const activeTab = document.querySelector('.tab-btn.active');
            const selectedMethod = activeTab ? activeTab.getAttribute('data-method') : 'card';
            
            try {
                const response = await fetch('/api/payment/stripe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planType: planType,
                        userEmail: localStorage.getItem('userEmail') || 'usuario@desejosms.com',
                        method: selectedMethod
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Não foi possível gerar o pagamento Stripe.');
                }
                
                // Salvar anúncio como PENDENTE DE PAGAMENTO
                await createAd(false, 'pending_payment');
                
                if (selectedMethod === 'pix') {
                    // Abrir Checkout Personalizado PIX (Manual)
                    showStripePixCheckout(data);
                } else {
                    // Abrir checkout do Stripe embutido (Padrão)
                    showEmbeddedCheckout(data.checkout_url, data.product_name, 'Stripe');
                }
                
                button.disabled = false;
                button.innerHTML = originalText;
                return;
            } catch (err) {
                console.error('Falha no Stripe:', err);
                alert('Erro na integração Stripe: ' + err.message + '\n\nCertifique-se de configurar as chaves API do Stripe!');
                button.disabled = false;
                button.innerHTML = originalText;
                return;
            }
        }
        
        // Outros Gateways (PIX local, Pagamento no Ato)
        alert('Instrução de Pagamento: Registrado com sucesso! Aguarde o contato da administração para conclusão.');
        await createAd(false);
        closeModal('paymentModal');
        
    } catch (error) {
        console.error('Erro no pagamento dinâmico:', error);
        alert('Erro ao processar: ' + error.message);
        button.disabled = false;
        button.innerHTML = originalText;
    }
};

// ──────────────────────────────────────────────────────────────
// ABACATEPAY — Processamento
// ──────────────────────────────────────────────────────────────
window.processAbacatePayment = async function(gwId, button) {
    console.log('🥑 Iniciando pagamento AbacatePay, gwId:', gwId);

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
    const userEmail = localStorage.getItem('userEmail') || 'usuario@desejosms.com';

    try {
        const panel = document.getElementById(`gw-panel-${gwId}`);
        const radioSelected = panel ? panel.querySelector(`input[name="abacate-method-${gwId}"]:checked`) : null;
        const selectedMethod = radioSelected ? radioSelected.value : 'PIX';

        console.log('🥑 AbacatePay método selecionado:', selectedMethod);

        const response = await fetch('/api/payment/abacatepay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planType, userEmail, method: selectedMethod })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Erro ao gerar pagamento AbacatePay.');
        }

        // Salvar anúncio como PENDENTE DE PAGAMENTO
        await createAd(false, 'pending_payment');

        // Mostrar o link de pagamento
        showEmbeddedCheckout(data.checkout_url, data.product_name, 'AbacatePay');

        button.disabled = false;
        button.innerHTML = originalText;

    } catch (err) {
        console.error('❌ Falha no AbacatePay:', err);
        button.disabled = false;
        button.innerHTML = originalText;
        const panel = document.getElementById(`gw-panel-${gwId}`);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:12px; margin-top:12px; color:#856404; font-size:14px; text-align:center;';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Erro AbacatePay:</strong> ${err.message}<br>
            Verifique as chaves e configuração do AbacatePay no Painel Admin.`;
        if (panel) {
            const existing = panel.querySelector('.abacate-error-msg');
            if (existing) existing.remove();
            errorDiv.className = 'abacate-error-msg';
            panel.appendChild(errorDiv);
        }
    }
};

// ──────────────────────────────────────────────────────────────
// STRIPE — Processamento isolado (PIX ou Cartão)
// Chamada pelo botão gerado em renderPaymentGateways() para o
// gateway do tipo 'stripe'. Lê o radio do painel correto.
// ──────────────────────────────────────────────────────────────
window.processStripePayment = async function(gwId, button) {
    console.log('⚡ Iniciando pagamento Stripe, gwId:', gwId);

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
    const userEmail = localStorage.getItem('userEmail') || 'usuario@desejosms.com';

    try {
        // Método FIXO: apenas cartão (segurança: não permitir alteração pelo frontend)
        const selectedMethod = 'card';

        // Verificar se tem cupom aplicado
        let couponCode = null;
        try {
            const appliedCoupon = JSON.parse(localStorage.getItem('appliedCoupon') || 'null');
            if (appliedCoupon && appliedCoupon.code && appliedCoupon.plan === planType) {
                couponCode = appliedCoupon.code;
            }
        } catch(e) {}

        console.log('⚡ Stripe método: cartão', couponCode ? `| Cupom: ${couponCode}` : '');

        const response = await fetch('/api/payment/stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planType, userEmail, method: selectedMethod, couponCode })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Erro ao gerar pagamento Stripe.');
        }

        // Salvar anúncio como PENDENTE DE PAGAMENTO
        await createAd(false, 'pending_payment');

        // ── Redirecionar direto para o Stripe Checkout (iframe é bloqueado pelo Stripe)
        if (data.checkout_url) {
            console.log('🔀 Redirecionando para Stripe Checkout:', data.checkout_url);
            window.location.href = data.checkout_url;
        } else {
            throw new Error('URL de checkout não retornada pelo servidor.');
        }

        button.disabled = false;
        button.innerHTML = originalText;

    } catch (err) {
        console.error('❌ Falha no Stripe:', err);
        button.disabled = false;
        button.innerHTML = originalText;
        // Mostrar erro amigável
        const panel = document.getElementById(`gw-panel-${gwId}`);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:12px; margin-top:12px; color:#856404; font-size:14px; text-align:center;';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Stripe não configurado.</strong><br>
            Configure as chaves da Stripe no <a href="/payment-config.html" style="color:#856404;">Painel Admin → Configuração de Pagamentos</a>.`;
        if (panel) {
            const existing = panel.querySelector('.stripe-error-msg');
            if (existing) existing.remove();
            errorDiv.className = 'stripe-error-msg';
            panel.appendChild(errorDiv);
        }
    }
};

// ──────────────────────────────────────────────────────────────
// ABACATE PAY — Processamento
// ──────────────────────────────────────────────────────────────
window.processAbacatePayment = async function(gwId, button) {
    console.log('🥑 Iniciando pagamento AbacatePay, gwId:', gwId);

    const methodRadio = document.querySelector(`input[name="abacate-method-${gwId}"]:checked`);
    const selectedMethod = methodRadio ? methodRadio.value : 'PIX';

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';

    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
    
    // Buscar preço atualizado do pricingPlans ou fallback
    const pricingPlans = JSON.parse(localStorage.getItem('pricingPlans') || '[]');
    const currentPlan = pricingPlans.find(p => p.type === planType);
    const planPrice = currentPlan ? currentPlan.price : (selectedPlan?.price || 1.50);
    const userEmail = localStorage.getItem('userEmail') || 'usuario@desejosms.com';

    try {
        const response = await fetch('/api/payment/abacatepay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                planType: planType, 
                userEmail: userEmail, 
                method: selectedMethod,
                amount: planPrice
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Erro ao gerar pagamento AbacatePay.');
        }

        // Salvar anúncio como PENDENTE DE PAGAMENTO
        await createAd(false, 'pending_payment');

        // Redirecionar para o checkout gerado (que oculta os dados pessoais)
        window.location.href = data.checkout_url;

    } catch (err) {
        console.error('❌ Falha no AbacatePay:', err);
        button.disabled = false;
        button.innerHTML = originalText;
        alert("Erro no AbacatePay: " + err.message);
    }
};

// ──────────────────────────────────────────────────────────────
// KIWIFY — Processamento
// ──────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
// PAGAMENTO — Retomada de Fluxo
// ──────────────────────────────────────────────────────────────
window.resumePayment = function(adId) {
    console.log('🔄 Retomando pagamento para o anúncio:', adId);
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const ad = announcements.find(a => String(a.id) === String(adId));

    if (!ad) {
        alert('Anúncio não encontrado!');
        return;
    }

    // Preencher adData com os dados do anúncio existente para evitar erros de validação
    adData = {
        ...ad,
        id: ad.id,
        isUpgrade: true,
        upgradeAdId: String(adId)
    };
    
    // Sincronizar título e outros campos para fallback
    if (!adData.title && ad.name) adData.title = ad.name;
    if (!adData.whatsapp && ad.phone) adData.whatsapp = ad.phone;

    selectedPlan = ad.planType || ad.plan_type || 'basic';
    
    // Guardar contexto
    localStorage.setItem('upgradeAdId', String(adId));
    localStorage.setItem('upgradePlanType', selectedPlan);

    showPaymentModal();
};

window.processKiwifyPayment = async function(gwId, button) {
    console.log('🥝 Iniciando pagamento Kiwify, gwId:', gwId);

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecionando...';

    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
    
    // Mapeamento de links de checkout Kiwify criados dinamicamente pelo bot
    const kiwifyLinks = {
        'basic': 'https://pay.kiwify.com.br/gFfSerS',
        'top': 'https://pay.kiwify.com.br/r0n2HLa',
        'supervip': 'https://pay.kiwify.com.br/5SGKOuI'
    };

    const checkoutUrl = kiwifyLinks[planType.toLowerCase()] || kiwifyLinks['basic'];

    try {
        // Salvar anúncio como PENDENTE DE PAGAMENTO antes de sair
        const adId = await createAd(false, 'pending_payment');

        if (!adId) {
            throw new Error('Falha ao salvar rascunho do anúncio.');
        }

        // Buscar dados do anunciante no localStorage para autopreencher a Kiwify
        const storedEmail = localStorage.getItem('userEmail') || '';
        const storedName = localStorage.getItem('userName') || '';
        const storedPhone = localStorage.getItem('userPhone') || '';

        // Adicionar o ID do anúncio e os dados do usuário como parâmetros na Kiwify
        // O custom=adId permite que o Webhook saiba qual anúncio ativar!
        let finalCheckoutUrl = `${checkoutUrl}?custom=${adId}`;
        
        if (storedEmail && storedEmail !== 'teste@desejosms.com') {
            finalCheckoutUrl += `&email=${encodeURIComponent(storedEmail)}`;
        }
        if (storedName) {
            finalCheckoutUrl += `&name=${encodeURIComponent(storedName)}`;
        }
        if (storedPhone) {
            const cleanPhone = storedPhone.replace(/\D/g, ''); // apenas números
            if (cleanPhone) finalCheckoutUrl += `&phone=${cleanPhone}`;
        }

        // Redirecionar diretamente para a Kiwify
        window.location.href = finalCheckoutUrl;

    } catch (err) {
        console.error('❌ Falha ao processar Kiwify:', err);
        button.disabled = false;
        button.innerHTML = originalText;
        alert("Erro ao preparar pagamento: " + err.message);
    }
};

// ──────────────────────────────────────────────────────────────
// EFÍ BANK — Processamento
// ──────────────────────────────────────────────────────────────
window.processEfiPayment = async function(gwId, button) {
    console.log('🟠 Iniciando pagamento Efí Bank, gwId:', gwId);

    const inputCpf = document.getElementById(`efi-cpf-${gwId}`);
    const cpfOuCnpj = inputCpf ? inputCpf.value : '';
    
    // Limpa a string de não numéricos
    const docLimpo = cpfOuCnpj.replace(/\D/g, '');

    // Valida se tem 11 ou 14 digitos
    if (!docLimpo || (docLimpo.length !== 11 && docLimpo.length !== 14)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Atenção', 'Digite o CPF/CNPJ completo no campo acima para gerar o PIX.', 'warning');
        } else {
            alert("Digite o CPF/CNPJ completo no campo antes de clicar em Gerar PIX.");
        }
        if (inputCpf) inputCpf.focus();
        return;
    }

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando PIX...';

    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
    const planPrice = selectedPlan?.price || 1.50; // Pega o preço de R$ 1,50 ou o valor que estiver na tela
    const userEmail = localStorage.getItem('userEmail') || 'usuario@desejosms.com';

    try {
        const response = await fetch('/api/payment/efi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                planType: planType, 
                userEmail: userEmail, 
                cpf: docLimpo,
                amount: planPrice
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Erro ao gerar PIX no Efí Bank.');
        }

        // Salvar anúncio como PENDENTE DE PAGAMENTO
        await createAd(false, 'pending_payment');

        // Mostrar o QR Code na tela
        const qrContainer = document.getElementById(`efi-qr-container-${gwId}`);
        const qrImg = document.getElementById(`efi-qr-image-${gwId}`);
        const qrCopy = document.getElementById(`efi-pix-copy-${gwId}`);

        if (qrContainer && qrImg && qrCopy) {
            qrImg.src = data.qr_code_image;
            qrCopy.value = data.pix_copy_paste;
            qrContainer.style.display = 'block';
            button.style.display = 'none'; // Esconde botão de gerar
        }

        button.disabled = false;
        button.innerHTML = originalText;
        
        // Polling para verificar se foi pago (Opcional)
        // setInterval(() => checkPaymentStatus(data.txid), 5000);

    } catch (err) {
        console.error('❌ Falha no Efí Bank:', err);
        button.disabled = false;
        button.innerHTML = originalText;
        const panel = document.getElementById(`gw-panel-${gwId}`);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:12px; margin-top:12px; color:#856404; font-size:14px; text-align:center;';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Erro Efí Bank:</strong> ${err.message}<br>
            Verifique as configurações e o Certificado PIX no Painel Admin.`;
        if (panel) {
            const existing = panel.querySelector('.efi-error-msg');
            if (existing) existing.remove();
            errorDiv.className = 'efi-error-msg';
            panel.appendChild(errorDiv);
        }
    }
};

// ──────────────────────────────────────────────────────────────
// LIVEPIX — Integração via API ( Checkout Sigiloso )
// ──────────────────────────────────────────────────────────────
window.processLivePixPayment = async function(gwId, button) {
    console.log('💜 Iniciando pagamento LivePix via API, gwId:', gwId);

    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando link seguro...';

    const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
    const userEmail = localStorage.getItem('userEmail') || 'usuario@desejosms.com';

    try {
        // 1. Salvar rascunho do anúncio se for novo, ou garantir que adData tem ID
        if (!adData.id) {
            const newId = await createAd(false, 'pending_payment');
            if (!newId) return; // createAd já mostra o alert de erro
            adData.id = newId;
        }

        // 2. Chamar nosso backend para criar o pagamento via API LivePix
        const response = await fetch('/api/payment/livepix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                planType: planType,
                userEmail: userEmail,
                adId: adData.id
            })
        });

        const result = await response.json();

        if (result.success && result.checkout_url) {
            // 3. Redirecionar para o checkout oficial (transparente/sigiloso)
            window.location.href = result.checkout_url;
        } else {
            throw new Error(result.error || 'Falha ao gerar link de pagamento.');
        }

    } catch (err) {
        console.error('❌ Erro no LivePix API:', err);
        button.disabled = false;
        button.innerHTML = originalText;
        alert("Erro ao iniciar pagamento LivePix: " + err.message);
    }
};

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


// Função para gerar PIX REAL via PagHiper
async function generatePagHiper() {
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
            <div style="font-size: 13px; color: #555;">Gerando cobrança PagHiper...</div>
        </div>
    `;

    try {
        // Chamar API real PagHiper (Vercel Function)
        const response = await fetch('/api/payment/paghiper', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                planType,
                userEmail,
                amount: amount.toFixed(2)
            })
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || 'Erro ao gerar PIX na PagHiper');
        }

        // Exibir QR Code real
        const qrImage = result.qr_code_base64 ? `data:image/png;base64,${result.qr_code_base64}` : null;
        pixQR.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block; text-align: center; max-width: 300px;">
                ${qrImage
                ? `<img src="${qrImage}" style="width: 220px; height: 220px; margin-bottom: 10px; border: 2px solid #eee; border-radius: 8px;" alt="QR Code PIX PagHiper">`
                : `<div style="width:220px;height:220px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><i class="fas fa-qrcode" style="font-size:48px;color:#333;"></i></div>`
            }
                <div style="font-size: 13px; color: #333; margin-bottom: 8px;"><strong>R$ ${amount.toFixed(2)}</strong> — Plano ${planType.toUpperCase()}</div>
                ${result.qr_code ? `
                <div style="margin-top: 8px;">
                    <p style="font-size: 11px; color: #666; margin-bottom: 4px;">Ou use o código PIX:</p>
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

        // Ativa o anúncio como pendente de aprovação
        await createAd(false);

    } catch (error) {
        console.error('Erro ao gerar PIX PagHiper:', error);
        pixQR.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; text-align: center; max-width: 300px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: #856404; margin-bottom: 10px;"></i>
                <div style="font-size: 14px; font-weight: bold; color: #856404; margin-bottom: 5px;">Não foi possível gerar o PIX</div>
                <p style="font-size: 12px; color: #6c757d; margin-bottom: 10px;">${error.message}</p>
                <button onclick="generatePagHiper()" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">Tentar Novamente</button>
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

// Função para editar anúncio
function editAd(adId) {
    console.log(`✏️ Tentativa de edição do anúncio ID: ${adId}`);
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const ad = announcements.find(a => String(a.id) === String(adId));

    if (!ad) {
        alert('Anúncio não encontrado!');
        return;
    }

    // ── Apenas SuperVIP pode editar ──────────────────────────
    const plan = (ad.planType || ad.plan_type || 'basic').toLowerCase();
    if (plan !== 'supervip') {
        // Mostrar bloqueio com opção de upgrade
        const block = document.createElement('div');
        block.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200000;display:flex;align-items:center;justify-content:center;';
        block.innerHTML = `
            <div style="background:#1a1a2e;border-radius:20px;padding:40px;max-width:440px;text-align:center;color:white;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);">
                <i class="fas fa-lock" style="font-size:48px;color:#f59e0b;margin-bottom:16px;"></i>
                <h3 style="margin:0 0 12px;font-size:20px;">Edição Exclusiva SuperVIP</h3>
                <p style="color:#adb5bd;font-size:14px;line-height:1.6;margin-bottom:24px;">
                    Somente anunciantes com o plano <strong style="color:#8b5cf6;">SuperVIP</strong> podem editar título, fotos e informações do anúncio.<br><br>
                    Seu plano atual: <strong style="color:#ffc107;text-transform:uppercase;">${plan}</strong>
                </p>
                <div style="display:flex;gap:12px;justify-content:center;">
                    <button onclick="this.closest('div[style]').remove()" style="padding:10px 20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:8px;cursor:pointer;">Fechar</button>
                    <button onclick="this.closest('div[style]').remove(); promoteAd(${ad.id});" style="padding:10px 20px;background:linear-gradient(135deg,#8b5cf6,#ec4899);border:none;color:white;border-radius:8px;cursor:pointer;font-weight:700;">
                        <i class="fas fa-crown"></i> Fazer Upgrade para SuperVIP
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(block);
        return;
    }

    // SuperVIP → abrir formulário de edição
    adData = {
        isEditing: true,
        originalId: ad.id,
        title: ad.name || '',
        state: ad.state || '',
        city: ad.city || '',
        age: String(ad.age || ''),
        price: String(ad.price || '').replace('R$ ', '').trim(),
        category: ad.category || '',
        whatsapp: ad.whatsapp || ad.phone || '',
        description: ad.description || '',
        services: ad.services || [],
        availability: ad.availability || '24h',
        serviceType: ad.serviceType || 'motel',
        photos: ad.photos || []
    };

    selectedPlan = ad.planType || 'basic';
    currentStep = 2;

    setTimeout(() => {
        if (document.getElementById('adTitle')) document.getElementById('adTitle').value = adData.title;
        if (document.getElementById('adState')) document.getElementById('adState').value = adData.state;
        if (document.getElementById('adCity')) document.getElementById('adCity').value = adData.city;
        if (document.getElementById('adAge')) document.getElementById('adAge').value = adData.age;
        if (document.getElementById('adPrice')) document.getElementById('adPrice').value = adData.price;
        if (document.getElementById('adCategory')) document.getElementById('adCategory').value = adData.category;
        if (document.getElementById('adWhatsApp')) document.getElementById('adWhatsApp').value = adData.whatsapp;
        if (document.getElementById('adDescription')) document.getElementById('adDescription').value = adData.description;

        document.querySelectorAll('input[name="services"]').forEach(cb => { cb.checked = adData.services.includes(cb.value); });
        document.querySelectorAll('input[name="availability"]').forEach(cb => { cb.checked = adData.availability.includes(cb.value); });
        document.querySelectorAll('input[name="serviceType"]').forEach(cb => { cb.checked = adData.serviceType.includes(cb.value); });

        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview && adData.photos) {
            photoPreview.innerHTML = adData.photos.map((p, i) => `
                <div class="photo-item" style="position:relative;">
                    <img src="${p}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;">
                    <button type="button" onclick="removePhoto(${i})" style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;">×</button>
                </div>
            `).join('');
        }
        updateProgressBar();
        showStep(2);
        updateStepButtons();
    }, 200);

    showCreateAdModal();
    const modalTitle = document.querySelector('#createAdModal .modal-header h2');
    if (modalTitle) modalTitle.textContent = 'Editar Anúncio';
}


// Função para criar anúncio
async function createAd(forceActive = false, forceStatus = null) {
    console.log('=== CRIANDO/ATUALIZANDO ANÚNCIO ===');

    if (!selectedPlan) {
        alert('Por favor, selecione um plano.');
        return;
    }

    // ────────────────────────────────────────────────────────
    // FLUXO DE UPGRADE: anúncio já existe, apenas atualizar plano
    // ────────────────────────────────────────────────────────
    if (adData.isUpgrade && adData.upgradeAdId) {
        const upgradeId = String(adData.upgradeAdId);
        const planType = typeof selectedPlan === 'string' ? selectedPlan : (selectedPlan?.type || 'basic');
        console.log(`🚀 Upgrade detectado: anúncio ${upgradeId} → plano ${planType}`);

        const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
        const idx = announcements.findIndex(a => String(a.id) === upgradeId);

        if (idx !== -1) {
            announcements[idx].planType = planType;
            announcements[idx].isVip = planType === 'supervip';
            announcements[idx].status = forceStatus || (forceActive ? 'active' : 'pending');
            announcements[idx].updatedAt = new Date().toISOString();
            localStorage.setItem('announcements', JSON.stringify(announcements));
        }

        // Atualizar no Supabase também
        if (window.updateAdInSupabase) {
            try {
                await window.updateAdInSupabase(upgradeId, {
                    plan_type: planType,
                    is_vip: planType === 'supervip',
                    status: forceStatus || (forceActive ? 'active' : 'pending')
                });
            } catch (e) {
                console.warn('Supabase update falhou (upgrade):', e.message);
            }
        }

        // Limpar intenção de upgrade depois de concluir
        localStorage.removeItem('upgradeAdId');
        localStorage.removeItem('upgradePlanType');

        console.log('✅ Upgrade registrado.');
        return upgradeId;
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

    // Usar as fotos carregadas diretamente (já otimizadas e com marca d'água)
    const photosToSave = adData.photos || [];

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
            photos: photosToSave,
            video: adData.video || null,
            updatedAt: new Date().toISOString()
        };
        const updatedAd = announcements[adIndex];
        try { 
            localStorage.setItem('announcements', JSON.stringify(announcements)); 
            
            // SINCRONIZAR COM SUPABASE
            if (window.updateAdInSupabase) {
                console.log('☁️ Sincronizando edição com Supabase...');
                window.updateAdInSupabase(updatedAd.id, updatedAd).catch(err => console.error('Erro ao atualizar no Supabase:', err));
            }
        } catch (_) { }
        loadDashboardStats();
        loadUserAds();
        alert('Anúncio atualizado com sucesso!');
        const editedId = adData.originalId;
        adData.isEditing = false; adData.originalId = null; 
        return editedId;
    }

    const isVerified = localStorage.getItem('userVerified') === 'true';
    // Se forceStatus foi passado (ex: 'pending_payment'), usar ele
    // Se não, usar lógica normal de verificação
    const adStatus = forceStatus || ((isVerified || forceActive) ? 'active' : 'pending');
    const isPendingPayment = forceStatus === 'pending_payment';
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
        paymentRequired: isPendingPayment,
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
        photos: photosToSave,
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

    if (forceStatus !== 'pending_payment') {
        if (isVerified) {
            alert('Anúncio criado com sucesso! Seu anúncio está ATIVO e visível para todos os visitantes.');
        } else {
            alert('Anúncio criado com sucesso! Para ativar seu anúncio, você precisa verificar sua conta primeiro. Acesse a aba "Perfil" para fazer a verificação.');
        }
    }

    return insertedId;
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

// Função para comprimir DataURL
function compressDataURL(dataUrl, maxWidth, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    });
}

// Calcula tamanho de dataURL em bytes sem fetch (compatível com CSP)
function dataUrlSizeBytes(dataUrl) {
    if (!dataUrl) return 0;
    const base64 = dataUrl.split(',')[1] || '';
    const padding = (base64.match(/=+$/) || [''])[0].length;
    return Math.floor((base64.length * 3) / 4) - padding;
}

// Reduzir dataURL para <= targetBytes sem usar fetch (evita violação CSP)
async function ensureUnderSizeBytes(dataUrl, targetBytes = 5 * 1024 * 1024) {
    let current = dataUrl;
    if (dataUrlSizeBytes(current) <= targetBytes) return current;
    for (const dim of [1600, 1400, 1200, 1000, 900, 800]) {
        current = await compressDataURL(current, dim, 0.85);
        if (dataUrlSizeBytes(current) <= targetBytes) return current;
    }
    for (const q of [0.75, 0.65, 0.55, 0.5, 0.4]) {
        current = await compressDataURL(current, 800, q);
        if (dataUrlSizeBytes(current) <= targetBytes) return current;
    }
    return current;
}

// Função para enviar verificação
async function submitVerification() {
    try {
        console.log('=== ENVIANDO VERIFICAÇÃO ===');
        const userEmail = localStorage.getItem('userEmail') || '';
        if (!userEmail) { alert('Você precisa estar logado para enviar documentos.'); return; }
        console.log('Email do usuário: (omitido por segurança)');

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

        // Salvar arquivos no IndexedDB E converter para Base64 (para que o admin remoto veja)
        const ids = ['documento', 'foto-codigo', 'selfie'].map(t => `verif-${userEmail}-${t}-${Date.now()}`);
        const base64Docs = [];
        let count = 0;
        for (let i = 0; i < 3; i++) {
            // Salvar no IDB local (não critico - pode falhar)
            try {
                await idbPutDoc({ id: ids[i], userEmail, type: i === 0 ? 'documento' : i === 1 ? 'foto-codigo' : 'selfie', blob: files[i], createdAt: Date.now() });
            } catch (idbErr) {
                console.warn('IDB save falhou (não crítico):', idbErr.message || idbErr);
            }

            // Converter para Base64 comprimido para o Admin
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(files[i]);
            });
            const compressed = await ensureUnderSizeBytes(dataUrl, 700 * 1024); // ~700KB por doc para economizar DB
            base64Docs.push(compressed);

            count++; if (progressBar) progressBar.style.width = Math.round((count / 3) * 100) + '%';
        }
        if (progressBar) progressBar.style.width = '100%';

        // Guardar referências no localStorage (COM base64 para o admin)
        const docs = [
            { userEmail, type: 'documento', url: base64Docs[0], docId: ids[0], submittedAt: new Date().toISOString(), status: 'pending' },
            { userEmail, type: 'foto-codigo', url: base64Docs[1], docId: ids[1], submittedAt: new Date().toISOString(), status: 'pending' },
            { userEmail, type: 'selfie', url: base64Docs[2], docId: ids[2], submittedAt: new Date().toISOString(), status: 'pending' }
        ];
        localStorage.setItem('pendingVerifications', JSON.stringify(docs));

        // Atualizar lista de verificações do admin imediatamente
        try {
            let verifs = JSON.parse(localStorage.getItem('verifications') || '[]');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const u = users.find(x => (x.email || '').toLowerCase() === userEmail.toLowerCase()) || { name: userEmail };
            const documents = {
                documento: { name: 'Documento de Identificação', uploaded: true, verified: false, url: base64Docs[0], docId: ids[0] },
                'foto-codigo': { name: 'Foto com Código', uploaded: true, verified: false, url: base64Docs[1], docId: ids[1] },
                selfie: { name: 'Selfie', uploaded: true, verified: false, url: base64Docs[2], docId: ids[2] }
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

            // SINCRONIZAR COM SUPABASE (opcional - não bloquear se falhar)
            if (window.upsertVerificationInSupabase) {
                try {
                    console.log('☁️ Enviando verificação para Supabase...');
                    await window.upsertVerificationInSupabase(verificationObj);
                    console.log('✅ Verificação salva no Supabase.');
                } catch (sbErr) {
                    console.warn('⚠️ Falha ao salvar no Supabase (não crítico):', sbErr.message || sbErr);
                    // Continua mesmo sem Supabase - dado local é suficiente para o admin ver
                }
            }
        } catch (e) { console.warn('Falha ao atualizar verifications no localStorage:', e); }

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
function applyWatermarkToDataUrl(dataUrl, watermarkText = 'DESEJOS MS', logoUrl = null) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            const canvas = document.createElement('canvas');

            // Redimensionar para no máximo 1000px para economizar localStorage
            let width = img.width;
            let height = img.height;
            const maxDimension = 1000;
            if (width > maxDimension || height > maxDimension) {
                if (width > height) { height = (maxDimension / width) * height; width = maxDimension; }
                else { width = (maxDimension / height) * width; height = maxDimension; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // ── MARCA D'ÁGUA DIAGONAL ELEGANTE (FRACA E INCLINADA) ───────────
            // Tamanho proporcional à imagem
            const fontSize = Math.max(28, Math.round(width * 0.085)); 
            ctx.save();
            // Fonte moderna e menos espessa (peso 400 ou 500)
            ctx.font = `500 ${fontSize}px 'Montserrat', 'Helvetica Neue', Arial, sans-serif`;
            
            // Cores sutis, fracas e translúcidas (branco com 18% de opacidade)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            
            // Borda extremamente fina e fraca para dar um leve destaque elegante
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const centerX = width / 2;
            const centerY = height / 2;

            // Inclinar "meio vertical" (ex: -35 graus)
            ctx.translate(centerX, centerY);
            ctx.rotate(-35 * Math.PI / 180);

            // Adicionar um espalhamento para a fonte ficar elegante
            ctx.strokeText(watermarkText, 0, 0);
            ctx.fillText(watermarkText, 0, 0);
            ctx.restore();
            // ────────────────────────────────────────────────────────────

            // Logo opcional
            if (logoUrl) {
                try {
                    const logo = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = logoUrl; });
                    const w = Math.min(canvas.width * 0.25, 320);
                    const h = w * (logo.height / logo.width);
                    ctx.globalAlpha = 0.25;
                    ctx.drawImage(logo, canvas.width - w - 16, canvas.height - h - 16, w, h);
                } catch (_) { }
            }
            resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

// Mapeia sigla de estado para sufixo da marca d'água em CAIXA ALTA
function getWatermarkBrand() {
    // Tenta pegar estado selecionado no formulário
    const stateEl = document.getElementById('adState');
    const stateVal = (stateEl ? stateEl.value : '') ||
                     (adData && adData.state) || '';

    const stateMap = {
        AC:'AC', AL:'AL', AP:'AP', AM:'AM', BA:'BA', CE:'CE', DF:'DF',
        ES:'ES', GO:'GO', MA:'MA', MT:'MT', MS:'MS', MG:'MG', PA:'PA',
        PB:'PB', PR:'PR', PE:'PE', PI:'PI', RJ:'RJ', RN:'RN', RS:'RS',
        RO:'RO', RR:'RR', SC:'SC', SP:'SP', SE:'SE', TO:'TO'
    };
    const suffix = stateMap[stateVal.toUpperCase()] || 'MS';
    return 'DESEJOS ' + suffix;
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

                const brand = getWatermarkBrand();
                const watermarked = await applyWatermarkToDataUrl(String(dataUrl), brand);
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
// editAd() unificada — segunda definição removida (usar a de linha ~2875)

function pauseAd(adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const adIndex = announcements.findIndex(a => String(a.id) === String(adId));

    if (adIndex === -1) { alert('Anúncio não encontrado!'); return; }

    const currentStatus = announcements[adIndex].status;

    // NUNCA aprovar um anúncio pendente pelo botão pausar/retomar
    // Só alternar entre active ↔ paused
    if (currentStatus === 'pending' || currentStatus === 'pending_payment') {
        alert('⚠️ Este anúncio ainda está pendente de pagamento. Use o botão "Pagar" para concluir.');
        return;
    }

    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    announcements[adIndex].status = newStatus;
    localStorage.setItem('announcements', JSON.stringify(announcements));

    if (window.updateAdInSupabase) {
        window.updateAdInSupabase(adId, { status: newStatus }).catch(e => console.error('Erro Supabase pauseAd:', e));
    }

    loadUserAds();
    const txt = newStatus === 'active' ? '▶️ retomado' : '⏸️ pausado';
    // Toast leve em vez de alert bloqueante
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#333;color:white;padding:12px 20px;border-radius:10px;z-index:99999;font-size:14px;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
    toast.textContent = `Anúncio ${txt} com sucesso!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ─── Excluir anúncio com dupla confirmação ───────────────────
function deleteAd(adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const ad = announcements.find(a => String(a.id) === String(adId));
    if (!ad) { alert('Anúncio não encontrado!'); return; }

    const adName = ad.name || ad.title || 'este anúncio';

    // Criação do Modal Customizado
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);';
    
    overlay.innerHTML = `
        <div style="background:#1a1a2e;border:1px solid #dc3545;border-radius:16px;padding:30px;max-width:450px;width:90%;text-align:center;box-shadow:0 15px 50px rgba(220,53,69,0.3);font-family:'Montserrat',sans-serif;">
            <i class="fas fa-exclamation-triangle" style="font-size:50px;color:#dc3545;margin-bottom:15px;"></i>
            <h3 style="color:#fff;font-size:22px;margin:0 0 10px;font-weight:800;">CONFIRMAÇÃO DE EXCLUSÃO</h3>
            <p style="color:#bbb;font-size:15px;line-height:1.5;margin-bottom:20px;">
                Você está prestes a excluir permanentemente o anúncio:<br>
                <strong style="color:#fff;font-size:18px;">"${adName}"</strong><br><br>
                Esta ação <span style="color:#dc3545;font-weight:bold;">NÃO PODE SER DESFEITA</span>.
            </p>
            <div style="display:flex;gap:15px;justify-content:center;">
                <button id="btnCancelDelete" style="padding:12px 20px;background:rgba(255,255,255,0.1);border:none;color:#fff;border-radius:8px;font-weight:700;cursor:pointer;flex:1;transition:background 0.2s;">
                    Cancelar
                </button>
                <button id="btnConfirmDelete" style="padding:12px 20px;background:#dc3545;border:none;color:#fff;border-radius:8px;font-weight:700;cursor:pointer;flex:1;box-shadow:0 4px 15px rgba(220,53,69,0.4);transition:background 0.2s;">
                    <i class="fas fa-trash"></i> Sim, Excluir!
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btnCancelDelete').onclick = () => {
        overlay.remove();
    };

    document.getElementById('btnConfirmDelete').onclick = () => {
        overlay.remove();
        
        // Remover do localStorage
        const updated = announcements.filter(a => String(a.id) !== String(adId));
        localStorage.setItem('announcements', JSON.stringify(updated));

        // Remover do Supabase
        if (window.supabaseClient) {
            window.supabaseClient.from('announcements').delete().eq('id', adId)
                .then(({ error }) => { if (error) console.error('Erro Supabase deleteAd:', error.message); })
                .catch(e => console.error('Exceção deleteAd:', e));
        }

        loadUserAds();
        loadDashboardStats();

        // Toast de Sucesso
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#dc3545,#c82333);color:white;padding:14px 22px;border-radius:12px;z-index:99999;font-size:14px;font-weight:600;box-shadow:0 6px 20px rgba(220,53,69,0.4);';
        toast.innerHTML = '<i class="fas fa-trash" style="margin-right:8px;"></i>Anúncio excluído com sucesso.';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    };
}

// ─── Retomar pagamento de anúncio pendente (Redirecionado para o global acima) ───────────────────
function resumePayment(adId) {
    if (window.resumePayment) window.resumePayment(adId);
}

function promoteAd(adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    // Aceitar id numérico ou string
    const adIndex = announcements.findIndex(a => String(a.id) === String(adId));

    if (adIndex === -1) {
        alert('Anúncio não encontrado!');
        return;
    }

    const ad = announcements[adIndex];

    // Verificar se já é SUPERVIP
    const currentPlan = (ad.planType || ad.plan_type || '').toLowerCase();
    if (currentPlan === 'supervip') {
        alert('✅ Este anúncio já está no plano máximo (SuperVIP)!');
        return;
    }

    // Mostrar modal de escolha de plano upgrade
    showPromotionModal(ad);
}

function showPromotionModal(ad) {
    // Remover modal existente se houver
    const existingModal = document.getElementById('upgradeModal');
    if (existingModal) existingModal.remove();

    const currentPlan = (ad.planType || ad.plan_type || 'basic').toLowerCase();

    // ── Ler preços DINÂMICOS do localStorage (sincronizado com admin) ──
    let storedPlans = [];
    try { storedPlans = JSON.parse(localStorage.getItem('pricingPlans')) || []; } catch(e) {}

    function getDynamicPrice(type) {
        const found = storedPlans.find(p => p.type === type && p.status === 'active') || storedPlans.find(p => p.type === type);
        return found ? Number(String(found.price).replace(',', '.')) || 0 : 0;
    }
    function getDynamicFeatures(type) {
        const found = storedPlans.find(p => p.type === type);
        return found?.features || [];
    }

    const topPrice = getDynamicPrice('top') || 249.90;
    const supervipPrice = getDynamicPrice('supervip') || 499.90;
    const topFeatures = getDynamicFeatures('top');
    const supervipFeatures = getDynamicFeatures('supervip');

    const plans = [
        {
            id: 'top',
            label: 'Plano TOP',
            price: `R$ ${topPrice.toFixed(2).replace('.', ',')}`,
            color: '#f59e0b',
            gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            icon: 'fa-star',
            features: topFeatures.length > 0 ? topFeatures : ['Destaque especial na página', '3x mais visualizações', 'Suporte prioritário', 'Estatísticas avançadas']
        },
        {
            id: 'supervip',
            label: 'Plano SUPER VIP',
            price: `R$ ${supervipPrice.toFixed(2).replace('.', ',')}`,
            color: '#8b5cf6',
            gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            icon: 'fa-crown',
            features: supervipFeatures.length > 0 ? supervipFeatures : ['Máximo destaque — topo da página', '10x mais visualizações', 'Suporte VIP 24/7', 'Foto de capa em destaque', 'Perfil verificado exclusivo']
        }
    ];

    // Mostrar apenas planos superiores ao atual
    const planOrder = ['basic', 'top', 'supervip'];
    const currentIdx = planOrder.indexOf(currentPlan);
    const availablePlans = plans.filter(p => planOrder.indexOf(p.id) > currentIdx);

    if (availablePlans.length === 0) {
        alert('✅ Este anúncio já está no plano máximo (SuperVIP)!');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'upgradeModal';
    modal.className = 'modal active';
    modal.style.cssText = 'z-index: 100001;';

    const cardsHTML = availablePlans.map(plan => `
        <div onclick="selectPromotionPlan('${plan.id}', '${ad.id}')" style="
            background: ${plan.gradient};
            border-radius: 16px;
            padding: 24px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            color: white;
            flex: 1;
            min-width: 200px;
        " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 30px rgba(0,0,0,0.3)'"
           onmouseout="this.style.transform=''; this.style.boxShadow=''">
            <div style="text-align:center; margin-bottom:16px;">
                <i class="fas ${plan.icon}" style="font-size:32px; margin-bottom:8px; display:block;"></i>
                <h4 style="margin:0 0 4px; font-size:18px; font-weight:700;">${plan.label}</h4>
                <div style="font-size:26px; font-weight:800; margin:8px 0;">${plan.price}</div>
                <small style="opacity:0.85;">por 30 dias</small>
            </div>
            <ul style="list-style:none; padding:0; margin:0; font-size:13px;">
                ${plan.features.map(f => `<li style="padding:4px 0;"><i class="fas fa-check" style="margin-right:6px; opacity:0.9;"></i>${f}</li>`).join('')}
            </ul>
            <button style="width:100%; margin-top:16px; padding:12px; background:rgba(255,255,255,0.2); border:2px solid rgba(255,255,255,0.5); color:white; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; backdrop-filter:blur(4px);">
                <i class="fas fa-bolt"></i> Fazer Upgrade Agora
            </button>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="modal-content" style="max-width:700px;">
            <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.1);">
                <h3 style="margin:0;"><i class="fas fa-rocket" style="color:#f59e0b; margin-right:8px;"></i> Upgrade do Anúncio: <em>${ad.title || ad.name || 'Seu Anúncio'}</em></h3>
                <button onclick="this.closest('.modal').remove()" class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p style="color:#adb5bd; margin-bottom:20px; text-align:center;">
                    Plano atual: <strong style="color:#ffc107; text-transform:uppercase;">${currentPlan}</strong> → Escolha um plano superior:
                </p>
                <div style="display:flex; gap:16px; flex-wrap:wrap;">
                    ${cardsHTML}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}


function selectPromotionPlan(planType, adId) {
    const announcements = JSON.parse(localStorage.getItem('announcements')) || [];
    const adIndex = announcements.findIndex(a => String(a.id) === String(adId));

    if (adIndex === -1) {
        alert('Anúncio não encontrado!');
        return;
    }

    const ad = announcements[adIndex];

    // Guardar intenção de upgrade no localStorage para retomar se cancelado
    localStorage.setItem('upgradeAdId', String(adId));
    localStorage.setItem('upgradePlanType', planType);

    // Fechar modal de seleção de plano
    const openModal = document.querySelector('.modal.active');
    if (openModal) openModal.remove();

    // Definir o plano selecionado globalmente
    selectedPlan = planType;

    // Preencher dados do anúncio existente (para não precisar recriar)
    adData = {
        id: ad.id,
        title: ad.title || ad.name || '',
        city: ad.city || '',
        state: ad.state || 'MS',
        age: ad.age || '',
        price: ad.price || '',
        category: ad.category || '',
        whatsapp: ad.whatsapp || '',
        description: ad.description || '',
        photos: ad.photos || [],
        isUpgrade: true,
        upgradeAdId: String(adId)
    };

    console.log(`🚀 Upgrade do anúncio ${adId} para plano ${planType} — abrindo pagamento diretamente`);

    // Abrir diretamente o modal de pagamento (SEM criar anúncio de novo)
    showPaymentModal();
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

    // Preservar estado selecionado atual se houver
    const currentSelection = stateSelect.value;

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
            
            // Restaurar seleção se ela ainda estiver disponível
            if (currentSelection) {
                stateSelect.value = currentSelection;
                console.log('🔄 Estado selecionado restaurado:', currentSelection);
                // Carregar cidades correspondentes ao estado restaurado
                loadCitiesForState();
            }
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
    
    // Sincronizar com adData imediatamente
    adData.state = selectedState;

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

// A função redundante window.processDynamicPayment foi removida para evitar conflitos com a implementação principal de Gateways.


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

// ============================================================
// MODAL DE CHECKOUT EMBUTIDO (IFRAME) - GENÉRICO
// ============================================================
function showEmbeddedCheckout(checkoutUrl, productName, gatewayName = 'Cakto') {
    console.log(`💳 Abrindo checkout ${gatewayName} embutido:`, checkoutUrl);
    
    // Fechar modal de pagamento anterior
    closeModal('paymentModal');
    
    // Remover modal antigo se existir
    const existingModal = document.getElementById('embeddedCheckoutModal');
    if (existingModal) existingModal.remove();
    
    // Criar modal overlay com iframe
    const modal = document.createElement('div');
    modal.id = 'embeddedCheckoutModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 100000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    modal.innerHTML = `
        <div style="
            width: 100%;
            max-width: 600px;
            background: #1a1a2e;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            max-height: 95vh;
        ">
            <!-- Header -->
            <div style="
                padding: 16px 20px;
                background: linear-gradient(135deg, #16213e, #0f3460);
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            ">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fas fa-lock" style="color:#28a745; font-size:16px;"></i>
                    <span style="color:white; font-weight:bold; font-size:16px;">
                        Pagamento Seguro via ${gatewayName} - ${productName || 'Plano'}
                    </span>
                </div>
                <div style="display:flex; gap:8px;">
                    <button onclick="window.open('${checkoutUrl}', '_blank')" style="
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        <i class="fas fa-external-link-alt"></i> Abrir em nova aba
                    </button>
                    <button onclick="closeEmbeddedCheckout()" style="
                        background: rgba(255,45,85,0.2);
                        border: 1px solid rgba(255,45,85,0.3);
                        color: #ff2d55;
                        padding: 6px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">
                        ✕
                    </button>
                </div>
            </div>
            
            <!-- Loading -->
            <div id="checkoutLoading" style="
                padding: 40px;
                text-align: center;
                color: #aaa;
            ">
                <i class="fas fa-spinner fa-spin" style="font-size:32px; color:#28a745;"></i>
                <p style="margin-top:12px;">Carregando checkout seguro...</p>
            </div>
            
            <!-- Iframe -->
            <iframe 
                id="checkoutIframe"
                src="${checkoutUrl}" 
                style="
                    width: 100%;
                    height: 75vh;
                    border: none;
                    display: none;
                "
                onload="document.getElementById('checkoutLoading').style.display='none'; this.style.display='block';"
                allow="payment"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            ></iframe>
            
            <!-- Footer -->
            <div style="
                padding: 10px 20px;
                background: #0f0f23;
                text-align: center;
                border-top: 1px solid rgba(255,255,255,0.05);
            ">
                <span style="color:#666; font-size:11px;">
                    <i class="fas fa-shield-alt" style="color:#28a745;"></i>
                    Pagamento 100% seguro e criptografado via ${gatewayName}
                </span>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar com ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeEmbeddedCheckout();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeEmbeddedCheckout() {
    const modal = document.getElementById('embeddedCheckoutModal');
    if (modal) {
        modal.remove();
    }
    // Recarregar anúncios para refletir o status atualizado
    if (typeof loadUserAds === 'function') loadUserAds();
    if (typeof loadDashboardStats === 'function') loadDashboardStats();
}

// ============================================================
// CHECKOUT PERSONALIZADO STRIPE PIX (ESTILO NIVELX)
// ============================================================
function showStripePixCheckout(data) {
    console.log('💳 Abrindo Checkout Personalizado Stripe PIX:', data);
    
    // Fechar modais anteriores
    closeModal('paymentModal');
    
    // Remover se já existir
    const existing = document.getElementById('customStripeCheckout');
    if (existing) existing.remove();
    
    // Criar overlay principal
    const overlay = document.createElement('div');
    overlay.id = 'customStripeCheckout';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #0f0f1a;
        z-index: 200000;
        overflow-y: auto;
        font-family: 'Inter', sans-serif;
        color: #fff;
    `;
    
    const userEmail = localStorage.getItem('userEmail') || 'usuario@exemplo.com';
    const userName = localStorage.getItem('userName') || userEmail.split('@')[0];
    const planName = data.product_name || 'Plano Premium';
    const price = data.price || 0;
    
    overlay.innerHTML = `
        <!-- Barra de Urgência -->
        <div style="background: #a8cf45; color: #000; padding: 12px; text-align: center; font-weight: bold; position: sticky; top: 0; z-index: 10;">
            Finalize seu pagamento para garantir a oferta. 
            <span id="pixTimer" style="margin-left: 10px;"><i class="far fa-clock"></i> 14:59</span>
        </div>

        <div style="max-width: 1200px; margin: 40px auto; padding: 0 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            
            <!-- Coluna 1: Identificação -->
            <div style="background: #161625; border-radius: 12px; padding: 25px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                    <div style="background: #a8cf45; color: #000; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
                    <h3 style="margin:0; font-size: 18px;">Identificação confirmada</h3>
                </div>
                <p style="color: #888; font-size: 13px; margin-bottom: 25px;">Confira os dados que usaremos para liberar seu acesso.</p>
                
                <div style="margin-bottom: 20px;">
                    <label style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">NOME</label>
                    <div style="font-weight: bold; margin-top: 5px; text-transform: uppercase;">${userName}</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">E-MAIL</label>
                    <div style="font-weight: bold; margin-top: 5px;">${userEmail}</div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">PEDIDO</label>
                    <div style="font-weight: bold; margin-top: 5px; color: #a8cf45;">#${Math.floor(Math.random() * 10000)}</div>
                </div>
            </div>

            <!-- Coluna 2: Pagamento PIX -->
            <div style="background: #161625; border-radius: 12px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px; text-align: left;">
                    <div style="background: #a8cf45; color: #000; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
                    <h3 style="margin:0; font-size: 18px;">Pagamento via PIX</h3>
                </div>
                <p style="color: #888; font-size: 13px; margin-bottom: 25px;">Escaneie o QR Code ou copie o código para pagar.</p>
                
                <div style="background: #fff; padding: 15px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
                    <img src="${data.qr_code_url || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(data.qr_code)}" 
                         style="width: 250px; height: 250px; display: block;" alt="QR Code PIX">
                </div>

                <div style="margin-top: 10px;">
                    <p style="font-size: 12px; color: #888; margin-bottom: 10px;">Ou copie e cole:</p>
                    <div style="position: relative; margin-bottom: 20px;">
                        <textarea readonly id="pixCodeText" style="
                            width: 100%;
                            background: #0f0f1a;
                            border: 1px solid #2a2a3a;
                            border-radius: 8px;
                            color: #fff;
                            padding: 12px;
                            font-size: 11px;
                            height: 60px;
                            resize: none;
                        ">${data.qr_code}</textarea>
                        <button onclick="copyPixCode()" style="
                            width: 100%;
                            background: #1e1e2f;
                            border: none;
                            color: #fff;
                            padding: 12px;
                            border-radius: 8px;
                            margin-top: 10px;
                            cursor: pointer;
                            font-weight: bold;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='#2a2a3a'" onmouseout="this.style.background='#1e1e2f'">
                            Copiar código PIX
                        </button>
                    </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #a8cf45; font-size: 13px;">
                    <i class="fas fa-spinner fa-spin"></i>
                    Aguardando confirmação...
                </div>
            </div>

            <!-- Coluna 3: Resumo -->
            <div style="background: #161625; border-radius: 12px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); height: fit-content;">
                <h3 style="font-size: 18px; margin-bottom: 25px;">Resumo</h3>
                
                <div style="display: flex; gap: 15px; margin-bottom: 25px; align-items: center;">
                    <div style="width: 60px; height: 60px; background: #0f0f1a; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-star" style="color: #a8cf45; font-size: 24px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${planName}</div>
                        <div style="color: #666; font-size: 12px;">Qtd: 1</div>
                    </div>
                    <div style="font-weight: bold;">R$ ${price.toFixed(2).replace('.', ',')}</div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 18px;">
                    <span style="color: #a8cf45;">Total</span>
                    <span style="font-weight: bold; color: #a8cf45;">R$ ${price.toFixed(2).replace('.', ',')}</span>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <button onclick="closeCustomStripeCheckout()" style="background: none; border: none; color: #666; cursor: pointer; font-size: 13px; text-decoration: underline;">
                        Cancelar e voltar
                    </button>
                </div>
            </div>

        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Iniciar Timer
    startPixTimer(15 * 60);

    // Iniciar Polling de Verificação de Pagamento
    startPaymentStatusPolling(data.payment_intent_id);
}

function startPixTimer(duration) {
    let timer = duration, minutes, seconds;
    const display = document.getElementById('pixTimer');
    
    const interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        if (display) display.innerHTML = `<i class="far fa-clock"></i> ${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(interval);
            closeCustomStripeCheckout();
            alert('Tempo expirado! Por favor, gere um novo PIX.');
        }
    }, 1000);
    
    window.pixTimerInterval = interval;
}

function copyPixCode() {
    const text = document.getElementById('pixCodeText');
    text.select();
    document.execCommand('copy');
    alert('Código PIX copiado!');
}

function closeCustomStripeCheckout() {
    const el = document.getElementById('customStripeCheckout');
    if (el) el.remove();
    if (window.pixTimerInterval) clearInterval(window.pixTimerInterval);
    if (window.paymentPollingInterval) clearInterval(window.paymentPollingInterval);
}

async function startPaymentStatusPolling(paymentIntentId) {
    console.log('🔄 Iniciando polling para:', paymentIntentId);
    
    if (window.paymentPollingInterval) clearInterval(window.paymentPollingInterval);
    
    window.paymentPollingInterval = setInterval(async () => {
        try {
            // Aqui você chamaria um endpoint que verifica o status no banco ou na Stripe
            // Para simplificar, vamos verificar na tabela 'payments' do Supabase
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from('payments')
                    .select('status')
                    .eq('mp_payment_id', paymentIntentId)
                    .single();
                
                if (data && data.status === 'approved') {
                    clearInterval(window.paymentPollingInterval);
                    alert('🎉 Pagamento confirmado com sucesso!');
                    window.location.reload(); // Recarregar para mostrar anúncio ativo
                }
            }
        } catch (e) {
            console.warn('Erro no polling:', e);
        }
    }, 5000); // Verifica a cada 5 segundos
}

// Compatibilidade
window.showCaktoCheckoutModal = function(url, name) {
    showEmbeddedCheckout(url, name, 'Cakto');
};
window.closeCaktoCheckout = closeEmbeddedCheckout;