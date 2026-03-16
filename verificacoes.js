// Variáveis globais
let verifications = [];
let filteredVerifications = [];
let selectedVerification = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== INICIALIZANDO PÁGINA DE VERIFICAÇÕES ===');
    
    // Tentar sincronizar com Supabase primeiro
    if (window.syncVerificationsFromSupabase) {
        console.log('🔄 Sincronizando com Supabase...');
        await window.syncVerificationsFromSupabase();
        if (window.syncUsersFromSupabase) await window.syncUsersFromSupabase();
    }

    loadVerifications();
    setupEventListeners();
    
    // Forçar mesclagem na inicialização
    console.log('Forçando mesclagem na inicialização...');
    mergePendingFromAdvertiser();
    
    // Recarregar após mesclagem
    loadVerifications();
    updateStats();
    const statusSel = document.getElementById('statusFilter');
    if (statusSel) {
        statusSel.addEventListener('change', () => {
            filterVerifications();
            updateStats();
        });
    }
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

// Função para carregar verificações
function loadVerifications() {
    console.log('=== CARREGANDO VERIFICAÇÕES ===');
    
    // Ler verificações existentes
    verifications = JSON.parse(localStorage.getItem('verifications')) || [];
    console.log('Verificações existentes:', verifications.length);
    
    // Mesclar entradas enviadas pelo painel do anunciante (pendingVerifications)
    mergePendingFromAdvertiser();
    
    // Recarregar verificações após mesclagem
    verifications = JSON.parse(localStorage.getItem('verifications')) || [];
    console.log('Verificações após mesclagem:', verifications.length);
    
    filteredVerifications = [...verifications];
    console.log('Verificações filtradas:', filteredVerifications.length);
    
    renderVerifications();
    updateStats();
}

// IndexedDB helpers (ler blobs de documentos armazenados no painel do anunciante)
const idbCfg = { dbName: 'desejosms_db', store: 'docs' };
function idbOpenRO(){
	return new Promise((resolve, reject)=>{
		const req = indexedDB.open(idbCfg.dbName, 1);
		req.onupgradeneeded = () => { const db=req.result; if(!db.objectStoreNames.contains(idbCfg.store)){ db.createObjectStore(idbCfg.store, { keyPath:'id' }); } };
		req.onsuccess = ()=> resolve(req.result);
		req.onerror = ()=> reject(req.error);
	});
}
function idbGetBlob(id){
	return idbOpenRO().then(db=> new Promise((resolve,reject)=>{
		const tx = db.transaction(idbCfg.store, 'readonly');
		const req = tx.objectStore(idbCfg.store).get(id);
		req.onsuccess = ()=> resolve(req.result ? req.result.blob : null);
		req.onerror = ()=> reject(req.error);
	}));
}
async function getDocumentUrlSafe(doc){
	if (doc && doc.url) return doc.url;
    if (doc && doc.data) return doc.data; // Suporte para Base64 direto
	if (doc && doc.docId){
		try {
			const blob = await idbGetBlob(doc.docId);
			if (blob) {
                try {
                    return URL.createObjectURL(blob);
                } catch(urlErr) {
                    console.error('Falha ao criar URL do Blob:', urlErr);
                }
            }
		} catch(e){ console.warn('IDB read failed', e); }
	}
	return null;
}

// Agregar documentos enviados pelo anunciante (localStorage.pendingVerifications)
function mergePendingFromAdvertiser(){
    console.log('=== MESCLANDO DOCUMENTOS PENDENTES ===');
    
    const pendingDocs = JSON.parse(localStorage.getItem('pendingVerifications')||'[]');
    console.log('Documentos pendentes encontrados:', pendingDocs.length);
    
    if (!pendingDocs.length) {
        console.log('Nenhum documento pendente para mesclar');
        return;
    }
    
    const nameMap = {
        'documento': 'Documento de Identificação',
        'foto-codigo': 'Foto com Código',
        'selfie': 'Selfie'
    };
    
    const grouped = {};
    pendingDocs.forEach(d => {
        if (!grouped[d.userEmail]) grouped[d.userEmail] = [];
        grouped[d.userEmail].push(d);
    });
    
    console.log('Documentos agrupados por usuário:', Object.keys(grouped));
    
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    console.log('Usuários encontrados:', users.length);
    
    Object.entries(grouped).forEach(([email, docs]) => {
        console.log(`Processando documentos para: ${email}`);
        console.log('Documentos:', docs.length);
        
        const user = users.find(u => u.email === email) || { name: email };
        const documents = {};
        
        docs.forEach(dd => {
            documents[dd.type || 'documento'] = { 
                name: nameMap[dd.type] || 'Documento', 
                uploaded: true, 
                verified: false, 
                url: dd.url || null,
                docId: dd.docId || null
            };
        });
        
        const submittedAt = docs[0]?.submittedAt || new Date().toISOString();
        
        // Ver se já existe registro deste usuário
        const existingIdx = verifications.findIndex(v => v.userEmail === email && v.status === 'pending');
        
        const verificationObj = {
            id: existingIdx !== -1 ? verifications[existingIdx].id : Date.now() + Math.floor(Math.random() * 1000),
            userId: user.id || null,
            userName: user.name || email,
            userEmail: email,
            status: 'pending',
            submittedAt,
            documents,
            notes: 'Documentos enviados pelo anunciante',
            adminNotes: ''
        };
        
        if (existingIdx !== -1) {
            console.log(`Atualizando verificação existente para: ${email}`);
            verifications[existingIdx] = verificationObj;
        } else {
            console.log(`Criando nova verificação para: ${email}`);
            verifications.push(verificationObj);
        }
    });
    
    localStorage.setItem('verifications', JSON.stringify(verifications));
    console.log('Verificações salvas no localStorage:', verifications.length);
    
    // Limpar fila bruta de documentos
    localStorage.removeItem('pendingVerifications');
    console.log('Fila de documentos pendentes limpa');
}

// Função para criar verificações de exemplo
function createSampleVerifications() {
    return [
        {
            id: 1,
            userId: 1,
            userName: "Maria Silva",
            userEmail: "maria.silva@email.com",
            status: "pending",
            submittedAt: "2024-01-15T10:30:00",
            documents: {
                rg: {
                    name: "RG Frente",
                    uploaded: true,
                    verified: false,
                    url: "https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=RG+Frente"
                },
                rgBack: {
                    name: "RG Verso",
                    uploaded: true,
                    verified: false,
                    url: "https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=RG+Verso"
                },
                selfie: {
                    name: "Selfie com RG",
                    uploaded: true,
                    verified: false,
                    url: "https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Selfie+RG"
                }
            },
            notes: "Documentos enviados corretamente",
            adminNotes: ""
        },
        {
            id: 2,
            userId: 2,
            userName: "Ana Costa",
            userEmail: "ana.costa@email.com",
            status: "approved",
            submittedAt: "2024-01-14T14:20:00",
            approvedAt: "2024-01-15T09:15:00",
            documents: {
                rg: {
                    name: "RG Frente",
                    uploaded: true,
                    verified: true,
                    url: "https://via.placeholder.com/300x200/90EE90/FFFFFF?text=RG+Frente"
                },
                rgBack: {
                    name: "RG Verso",
                    uploaded: true,
                    verified: true,
                    url: "https://via.placeholder.com/300x200/90EE90/FFFFFF?text=RG+Verso"
                },
                selfie: {
                    name: "Selfie com RG",
                    uploaded: true,
                    verified: true,
                    url: "https://via.placeholder.com/300x200/90EE90/FFFFFF?text=Selfie+RG"
                }
            },
            notes: "Verificação aprovada - documentos legítimos",
            adminNotes: "Documentos verificados e aprovados"
        },
        {
            id: 3,
            userId: 3,
            userName: "Joana Santos",
            userEmail: "joana.santos@email.com",
            status: "rejected",
            submittedAt: "2024-01-13T16:45:00",
            rejectedAt: "2024-01-14T11:30:00",
            documents: {
                rg: {
                    name: "RG Frente",
                    uploaded: true,
                    verified: false,
                    url: "https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=RG+Frente"
                },
                rgBack: {
                    name: "RG Verso",
                    uploaded: false,
                    verified: false,
                    url: null
                },
                selfie: {
                    name: "Selfie com RG",
                    uploaded: false,
                    verified: false,
                    url: null
                }
            },
            notes: "Documentos incompletos - RG verso e selfie não enviados",
            adminNotes: "Rejeitado - documentos incompletos"
        }
    ];
}

// Função para renderizar verificações
function renderVerifications() {
    const grid = document.getElementById('verificationsGrid');
    
    if (filteredVerifications.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhuma verificação encontrada</h3>
                <p>Não há verificações que correspondam aos filtros aplicados.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    filteredVerifications.forEach(verification => {
        const card = createVerificationCard(verification);
        grid.appendChild(card);
    });
}

// Função para criar card de verificação
function createVerificationCard(verification) {
    const card = document.createElement('div');
    card.className = 'verification-card';
    card.onclick = () => openVerificationDetails(verification);
    
    const submittedDate = new Date(verification.submittedAt).toLocaleDateString('pt-BR');
    const statusText = {
        'pending': 'Pendente',
        'approved': 'Aprovada',
        'rejected': 'Rejeitada'
    };
    
    const documentsCount = Object.values(verification.documents).filter(doc => doc.uploaded).length;
    const totalDocuments = Object.keys(verification.documents).length;
    
    card.innerHTML = `
        <div class="verification-header">
            <div class="verification-user">
                <div class="user-avatar">
                    ${verification.userName.charAt(0).toUpperCase()}
                </div>
                <div class="user-info">
                    <h3>${verification.userName}</h3>
                    <p>${verification.userEmail}</p>
                    <p class="user-phone">📞 ${verification.userPhone || '(11) 99999-0000'}</p>
                </div>
            </div>
            <span class="verification-status ${verification.status}">
                ${statusText[verification.status]}
            </span>
        </div>
        
        <div class="verification-details">
            <div class="detail-item">
                <span class="detail-label">Enviado em:</span>
                <span class="detail-value">${submittedDate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Documentos:</span>
                <span class="detail-value">${documentsCount}/${totalDocuments}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Notas:</span>
                <span class="detail-value">${verification.notes}</span>
            </div>
        </div>
        
        <div class="verification-documents">
            <div class="documents-title">Documentos Enviados</div>
            <div class="documents-grid">
                ${Object.entries(verification.documents).map(([key, doc]) => `
                    <div class="document-item" onclick="event.stopPropagation(); viewDocument('${key}', '${verification.id}')">
                        <i class="fas ${doc.uploaded ? 'fa-file-alt' : 'fa-times-circle'}"></i>
                        <span>${doc.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${verification.status === 'pending' ? `
            <div class="verification-actions">
                <button class="btn btn-success" onclick="event.stopPropagation(); approveVerification('${verification.id}')">
                    <i class="fas fa-check"></i>
                    Aprovar
                </button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); rejectVerification('${verification.id}')">
                    <i class="fas fa-times"></i>
                    Rejeitar
                </button>
            </div>
        ` : verification.status === 'approved' ? `
            <div class="verification-actions">
                <button class="btn btn-warning" onclick="event.stopPropagation(); rejectVerification('${verification.id}')">
                    <i class="fas fa-times"></i>
                    Reverter Aprovação
                </button>
                <div class="verification-status-approved" style="margin-top: 10px; color: #28a745; font-weight: bold;">
                    <i class="fas fa-check-circle"></i> Aprovado em ${new Date(verification.approvedAt).toLocaleDateString()}
                </div>
            </div>
        ` : verification.status === 'rejected' ? `
            <div class="verification-actions">
                <button class="btn btn-success" onclick="event.stopPropagation(); approveVerification('${verification.id}')">
                    <i class="fas fa-check"></i>
                    Aprovar
                </button>
                <div class="verification-status-rejected" style="margin-top: 10px; color: #dc3545; font-weight: bold;">
                    <i class="fas fa-times-circle"></i> Rejeitado em ${new Date(verification.rejectedAt).toLocaleDateString()}
                    ${verification.adminNotes ? `<br><small style="color: #666;">Motivo: ${verification.adminNotes}</small>` : ''}
                </div>
            </div>
        ` : ''}
    `;
    
    return card;
}

// Função para abrir detalhes da verificação
function openVerificationDetails(verification) {
    selectedVerification = verification;
    
    const modal = document.getElementById('verificationModal');
    const details = document.getElementById('verificationDetails');
    
    const submittedDate = new Date(verification.submittedAt).toLocaleDateString('pt-BR');
    const statusText = {
        'pending': 'Pendente',
        'approved': 'Aprovada',
        'rejected': 'Rejeitada'
    };
    
    details.innerHTML = `
        <div class="verification-details-full">
            <div class="details-section">
                <h3>Informações do Usuário</h3>
                <div class="detail-row">
                    <span class="label">Nome:</span>
                    <span class="value">${verification.userName}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Email:</span>
                    <span class="value">${verification.userEmail}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Telefone:</span>
                    <span class="value">${verification.userPhone || '(11) 99999-0000'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">
                        <span class="verification-status ${verification.status}">
                            ${statusText[verification.status]}
                        </span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="label">Enviado em:</span>
                    <span class="value">${submittedDate}</span>
                </div>
                ${verification.approvedAt ? `
                    <div class="detail-row">
                        <span class="label">Aprovado em:</span>
                        <span class="value">${new Date(verification.approvedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                ` : ''}
                ${verification.rejectedAt ? `
                    <div class="detail-row">
                        <span class="label">Rejeitado em:</span>
                        <span class="value">${new Date(verification.rejectedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="details-section">
                <h3>Detalhes da Verificação</h3>
                <div class="detail-row">
                    <span class="label">Notas do Sistema:</span>
                    <span class="value">${verification.notes}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Notas do Admin:</span>
                    <span class="value">${verification.adminNotes || 'Nenhuma nota'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">ID da Verificação:</span>
                    <span class="value">#${verification.id}</span>
                </div>
            </div>
            
            <div class="documents-section">
                <h3>Documentos Enviados</h3>
                <div class="documents-grid-full">
                    ${Object.entries(verification.documents).map(([key, doc]) => `
                        <div class="document-preview">
                            <div class="document-header">
                                <h4>${doc.name}</h4>
                                <div class="document-actions">
                                    <button class="btn btn-sm btn-info" onclick="viewDocument('${key}', '${verification.id}')">
                                        <i class="fas fa-eye"></i> Visualizar
                                    </button>
                                    <button class="btn btn-sm btn-success" onclick="downloadDocument('${key}', '${verification.id}')">
                                        <i class="fas fa-download"></i> Baixar
                                    </button>
                                </div>
                            </div>
                            <div class="document-content" style="text-align: center; margin-top: 10px;">
                                ${doc.uploaded ? `
                                    <div class="doc-success-badge" style="color: #28a745; margin-bottom: 10px;">
                                        <i class="fas fa-check-circle"></i> Documento carregado
                                    </div>
                                    <p style="font-size: 11px; color: #666;">Clique em visualizar para abrir em tamanho real</p>
                                ` : `
                                    <div class="document-missing" style="color: #dc3545;">
                                        <i class="fas fa-times-circle"></i>
                                        <p>Documento não enviado</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Mostrar/esconder botões baseado no status
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    if (verification.status === 'pending') {
        approveBtn.style.display = 'inline-flex';
        rejectBtn.style.display = 'inline-flex';
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
    
    modal.classList.add('active');
}

// Função para visualizar documento
function viewDocument(documentKey, verificationId) {
    console.log('Visualizando documento:', documentKey, 'da verificação:', verificationId);
    
    const verification = verifications.find(v => String(v.id) === String(verificationId));
    if (!verification) {
        console.error('Verificação não encontrada:', verificationId);
        alert('Verificação não encontrada.');
        return;
    }
    
    const doc = verification.documents[documentKey];
    if (!doc) {
        console.error('Documento não encontrado:', documentKey);
        alert('Documento não encontrado.');
        return;
    }
    
    // Verificar se o documento tem URL ou dados base64
    getDocumentUrlSafe(doc).then(documentUrl => {
        if (!doc.uploaded || !documentUrl) {
            console.error('Documento não foi enviado ou URL inválida');
            console.log('Documento:', doc);
            alert('Atenção: O arquivo deste documento não foi encontrado no armazenamento local deste navegador.');
            return;
        }
        
        console.log('Documento carregado com sucesso:', doc.name);
        
        // Criar modal para visualização
        const modal = document.createElement('div');
        modal.className = 'document-viewer-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.92);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div class="document-viewer-content" style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 90%;
                max-height: 90%;
                overflow: auto;
                position: relative;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            ">
                <button onclick="this.parentElement.parentElement.remove()" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    cursor: pointer;
                    font-size: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                ">×</button>
                <h3 style="margin-bottom: 20px; color: #810816; text-align: center; font-family: 'Cinzel', serif;">Visualização: ${doc.name}</h3>
                <div style="text-align: center; margin-bottom: 25px; background: #f0f0f0; padding: 10px; border-radius: 10px;">
                    <img src="${documentUrl}" alt="${doc.name}" style="max-width: 100%; height: auto; border-radius: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" onerror="this.src='https://via.placeholder.com/600x400?text=Erro+ao+exibir+imagem';">
                </div>
                <div style="text-align: center; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-success" id="downloadBtnTemp" style="padding: 10px 20px;">
                        <i class="fas fa-download"></i> Baixar Original
                    </button>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #6c757d;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const btn = modal.querySelector('#downloadBtnTemp');
        btn.onclick = () => downloadDocument(documentKey, verificationId);
    }).catch(err => {
        console.error('Erro ao processar visualização:', err);
        alert('Ocorreu um erro ao tentar processar o arquivo para visualização: ' + err.message);
    });
}

// Função para baixar documento
function downloadDocument(documentKey, verificationId) {
    const verification = verifications.find(v => String(v.id) === String(verificationId));
    if (!verification) return;
    
    const doc = verification.documents[documentKey];
    if (!doc || !doc.uploaded) {
        alert('Documento não foi enviado.');
        return;
    }
    
    getDocumentUrlSafe(doc).then(documentUrl => {
        if (!documentUrl) { alert('Documento indisponível.'); return; }
        
        // Se já é base64, converter para JPEG usando canvas
        const doDownload = (url) => {
            const safeName = (verification.userName || 'documento').replace(/[^a-zA-Z0-9]/g, '_');
            const docName = (doc.name || 'documento').replace(/[^a-zA-Z0-9]/g, '_');
            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeName}_${docName}.jpg`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => document.body.removeChild(link), 100);
            console.log('Download iniciado:', link.download);
        };
        
        if (documentUrl.startsWith('data:image/')) {
            // Usar canvas para converter para JPG
            const img = new Image();
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width || 800;
                    canvas.height = img.naturalHeight || img.height || 600;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    doDownload(canvas.toDataURL('image/jpeg', 0.92));
                } catch(e) {
                    console.warn('Canvas falhou, baixando original:', e);
                    doDownload(documentUrl);
                }
            };
            img.onerror = function() { doDownload(documentUrl); };
            img.src = documentUrl;
        } else {
            doDownload(documentUrl);
        }
    });
}


// Função para aprovar verificação
function approveVerification(verificationId = null) {
    const id = verificationId || (selectedVerification ? selectedVerification.id : null);
    if (!id) return;
    
    const verification = verifications.find(v => String(v.id) === String(id));
    if (!verification) return;
    
    verification.status = 'approved';
    verification.approvedAt = new Date().toISOString();
    delete verification.rejectedAt;
    verification.adminNotes = verification.adminNotes || 'Verificação aprovada pelo administrador';
    
    // Atualizar usuário como verificado
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    const idx = users.findIndex(u=>u.email===verification.userEmail);
    if (idx!==-1){ 
        users[idx].verified = true; 
        users[idx].blocked = false; 
        users[idx].verificationStatus = 'approved';
        localStorage.setItem('users', JSON.stringify(users)); 
    }
    // Ativar anúncios pendentes do usuário
    const anns = JSON.parse(localStorage.getItem('announcements')||'[]');
    let changed = false;
    anns.forEach(a=>{ if (a.userEmail===verification.userEmail && a.status==='pending'){ a.status='active'; changed = true; } });
    if (changed) localStorage.setItem('announcements', JSON.stringify(anns));
    // Criar notificação de aprovação para o anunciante
    const approvalNotification = {
        id: Date.now(),
        userEmail: verification.userEmail,
        type: 'verification_approved',
        title: 'Conta Verificada!',
        message: 'Sua identidade foi verificada com sucesso. Seus anúncios agora estão ativos e visíveis.',
        createdAt: new Date().toISOString(),
        read: false,
        actionUrl: 'painel-anunciante.html'
    };
    
    let notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notifications.push(approvalNotification);
    localStorage.setItem('userNotifications', JSON.stringify(notifications));

    // Persistir verificações
    localStorage.setItem('verifications', JSON.stringify(verifications));
    
    // SINCRONIZAR COM SUPABASE
    if (window.upsertVerificationInSupabase) {
        window.upsertVerificationInSupabase(verification).catch(err => console.error('Erro ao salvar verificação no Supabase:', err));
        
        // Atualizar usuário no Supabase
        if (window.upsertUserInSupabase) {
            const user = users.find(u => u.email === verification.userEmail);
            if (user) window.upsertUserInSupabase(user).catch(err => console.error('Erro ao atualizar usuário no Supabase:', err));
        }

        // Atualizar anúncios ativos no Supabase
        if (changed && window.updateAdInSupabase) {
            const userAds = anns.filter(a => a.userEmail === verification.userEmail && a.status === 'active');
            userAds.forEach(ad => window.updateAdInSupabase(ad.id, { status: 'active' }).catch(err => console.error('Erro ao ativar anúncio no Supabase:', err)));
        }
    }
    
    // Atualizar interface
    loadVerifications(); updateStats();
    closeModal('verificationModal');
    
    alert('Verificação aprovada com sucesso!');
}

// Modal personalizado para coletar motivo de rejeição
function showRejectModal(onConfirm, isReverting) {
    const existing = document.getElementById('rejectReasonModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'rejectReasonModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;';
    
    const title = isReverting ? 'Reverter Aprovação' : 'Rejeitar Verificação';
    const placeholder = isReverting ? 'Motivo da reversão...' : 'Motivo da rejeição...';
    const defaultReason = isReverting ? 'Aprovação revertida pelo administrador' : 'Documentos insuficientes ou inválidos';
    
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;padding:30px;max-width:450px;width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.3);">
            <h3 style="margin:0 0 15px;color:#810816;font-size:18px;"><i class="fas fa-times-circle"></i> ${title}</h3>
            <p style="margin:0 0 15px;color:#555;font-size:14px;">Informe o motivo (opcional):</p>
            <textarea id="rejectReasonInput" rows="4" style="width:100%;box-sizing:border-box;border:2px solid #ddd;border-radius:8px;padding:10px;font-size:14px;resize:vertical;outline:none;" placeholder="${placeholder}"></textarea>
            <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
                <button onclick="document.getElementById('rejectReasonModal').remove()" style="padding:10px 20px;background:#6c757d;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Cancelar</button>
                <button id="confirmRejectBtn" style="padding:10px 25px;background:#dc3545;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">Confirmar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focar no textarea
    setTimeout(() => { const ta = document.getElementById('rejectReasonInput'); if(ta) ta.focus(); }, 100);
    
    document.getElementById('confirmRejectBtn').onclick = function() {
        const ta = document.getElementById('rejectReasonInput');
        const reason = (ta ? ta.value.trim() : '') || defaultReason;
        overlay.remove();
        onConfirm(reason);
    };
    
    // Fechar ao clicar fora
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

// Função para rejeitar verificação
function rejectVerification(verificationId = null) {
    const id = verificationId || (selectedVerification ? selectedVerification.id : null);
    if (!id) return;
    
    const verification = verifications.find(v => String(v.id) === String(id));
    if (!verification) { alert('Verificação não encontrada.'); return; }
    
    const isReverting = verification.status === 'approved';
    
    showRejectModal(function(finalReason) {
        verification.status = 'rejected';
        verification.rejectedAt = new Date().toISOString();
        delete verification.approvedAt;
        verification.adminNotes = finalReason;
        
        // Usuário fica como não-verificado
        const users = JSON.parse(localStorage.getItem('users')||'[]');
        const idx = users.findIndex(u => u.email === verification.userEmail);
        if (idx !== -1) { 
            users[idx].verified = false; 
            users[idx].verificationStatus = 'rejected';
            localStorage.setItem('users', JSON.stringify(users)); 
        }
        
        // Notificação para o anunciante
        const rejectionNotification = {
            id: Date.now(),
            userEmail: verification.userEmail,
            type: 'verification_rejected',
            title: isReverting ? 'Aprovação Revertida' : 'Verificação Rejeitada',
            message: isReverting ? 
                `Sua aprovação foi revertida. Motivo: "${finalReason}". Envie novos documentos.` :
                `Sua verificação foi rejeitada. Motivo: "${finalReason}". Clique aqui para enviar nova verificação.`,
            createdAt: new Date().toISOString(),
            read: false,
            actionUrl: 'painel-anunciante.html',
            requiresAction: true
        };
        
        let notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
        notifications.push(rejectionNotification);
        localStorage.setItem('userNotifications', JSON.stringify(notifications));
        
        localStorage.setItem('verifications', JSON.stringify(verifications));
        
        // SINCRONIZAR COM SUPABASE
        if (window.upsertVerificationInSupabase) {
            window.upsertVerificationInSupabase(verification).catch(err => console.error('Erro Supabase:', err));
            if (window.upsertUserInSupabase) {
                const user = users.find(u => u.email === verification.userEmail);
                if (user) window.upsertUserInSupabase(user).catch(err => console.error('Erro Supabase user:', err));
            }
        }
        
        loadVerifications();
        updateStats();
        closeModal('verificationModal');
        alert(isReverting ? 'Aprovação revertida! Anunciante foi notificado.' : 'Verificação rejeitada! Anunciante foi notificado.');
    }, isReverting);
}

// Função para aprovar todas as verificações pendentes
function approveAllPending() {
    if (!confirm('Tem certeza que deseja aprovar todas as verificações pendentes?')) {
        return;
    }
    
    const pendingVerifications = verifications.filter(v => v.status === 'pending');
    
    pendingVerifications.forEach(verification => {
        verification.status = 'approved';
        verification.approvedAt = new Date().toISOString();
        verification.adminNotes = 'Aprovado em lote pelo administrador';
    });
    
    // Atualizar localStorage
    localStorage.setItem('verifications', JSON.stringify(verifications));
    
    // Atualizar interface
    loadVerifications();
    
    alert(`${pendingVerifications.length} verificações foram aprovadas!`);
}

// Função para filtrar verificações
function filterVerifications() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredVerifications = verifications.filter(verification => {
        const statusMatch = statusFilter === 'all' || verification.status === statusFilter;
        const searchMatch = verification.userName.toLowerCase().includes(searchTerm) ||
                           verification.userEmail.toLowerCase().includes(searchTerm);
        
        return statusMatch && searchMatch;
    });
    
    renderVerifications();
}

// Função para ordenar verificações
function sortVerifications() {
    const sortBy = document.getElementById('sortFilter').value;
    
    filteredVerifications.sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return new Date(b.submittedAt) - new Date(a.submittedAt);
            case 'name':
                return a.userName.localeCompare(b.userName);
            case 'email':
                return a.userEmail.localeCompare(b.userEmail);
            default:
                return 0;
        }
    });
    
    renderVerifications();
}

// Função para buscar verificações
function searchVerifications() {
    filterVerifications();
}

// Função para atualizar estatísticas
function updateStats() {
    const data = JSON.parse(localStorage.getItem('verifications')||'[]');
    const pendingCount = data.filter(v => v.status === 'pending').length;
    const approvedCount = data.filter(v => v.status === 'approved').length;
    const rejectedCount = data.filter(v => v.status === 'rejected').length;
    
    const p = document.getElementById('pendingCount'); if (p) p.textContent = pendingCount;
    const a = document.getElementById('approvedCount'); if (a) a.textContent = approvedCount;
    const r = document.getElementById('rejectedCount'); if (r) r.textContent = rejectedCount;
}

// Função para exportar verificações
function exportVerifications() {
    // Organizar dados por data (mais recente primeiro)
    const organizedData = verifications
        .map(verification => {
            const submittedDate = new Date(verification.submittedAt);
            return {
                ...verification,
                submittedDate: submittedDate
            };
        })
        .sort((a, b) => b.submittedDate - a.submittedDate);
    
    // Criar dados para Excel no padrão dos anúncios
    const csvData = [
        ['ID', 'Verificação', 'Email', 'Status', 'Data de Envio', 'Motivo']
    ];
    
    // Adicionar dados organizados
    organizedData.forEach((verification, index) => {
        const statusText = {
            'pending': 'Pendente',
            'approved': 'Aprovada',
            'rejected': 'Rejeitada'
        };
        
        const submittedDate = verification.submittedDate.toLocaleDateString('pt-BR');
        
        csvData.push([
            verification.id || (index + 1),
            verification.userName || 'N/A',
            verification.userEmail || 'N/A',
            statusText[verification.status] || 'N/A',
            submittedDate,
            verification.adminNotes || ''
        ]);
    });
    
    // Converter para CSV com separação correta
    const csvContent = csvData.map(row => {
        return row.map(cell => {
            // Limpar o conteúdo e escapar aspas
            const cleanCell = String(cell).replace(/"/g, '""');
            return `"${cleanCell}"`;
        }).join(';'); // Usar ponto e vírgula para separar colunas
    }).join('\r\n'); // Usar \r\n para quebra de linha no Windows
    
    // Criar arquivo para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `verificacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    const total = verifications.length;
    const pending = verifications.filter(v => v.status === 'pending').length;
    const approved = verifications.filter(v => v.status === 'approved').length;
    const rejected = verifications.filter(v => v.status === 'rejected').length;
    
    alert(`✅ Relatório exportado com sucesso!\n\n📊 Estatísticas:\n- Total: ${total}\n- Pendentes: ${pending}\n- Aprovadas: ${approved}\n- Rejeitadas: ${rejected}\n\n📁 Arquivo: verificacoes_${new Date().toISOString().split('T')[0]}.csv\n\n📋 Dados organizados em colunas separadas!`);
}

// Função para fechar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Função de debug para testar verificações
function debugVerifications() {
    console.log('=== DEBUG VERIFICAÇÕES ===');
    
    // 1. Verificar localStorage
    const pendingDocs = JSON.parse(localStorage.getItem('pendingVerifications') || '[]');
    console.log('Documentos pendentes:', pendingDocs.length);
    pendingDocs.forEach((doc, index) => {
        console.log(`Doc ${index + 1}:`, {
            userEmail: doc.userEmail,
            type: doc.type,
            submittedAt: doc.submittedAt,
            status: doc.status
        });
    });
    
    // 2. Verificar verificações existentes
    const existingVerifications = JSON.parse(localStorage.getItem('verifications') || '[]');
    console.log('Verificações existentes:', existingVerifications.length);
    existingVerifications.forEach((ver, index) => {
        console.log(`Verificação ${index + 1}:`, {
            userEmail: ver.userEmail,
            userName: ver.userName,
            status: ver.status,
            submittedAt: ver.submittedAt,
            documentsCount: Object.keys(ver.documents || {}).length
        });
    });
    
    // 3. Verificar usuários
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('Usuários:', users.length);
    users.forEach((user, index) => {
        console.log(`Usuário ${index + 1}:`, {
            email: user.email,
            name: user.name,
            verified: user.verified,
            blocked: user.blocked
        });
    });
    
    // 4. Forçar mesclagem
    console.log('Forçando mesclagem...');
    mergePendingFromAdvertiser();
    
    // 5. Verificar resultado
    const finalVerifications = JSON.parse(localStorage.getItem('verifications') || '[]');
    console.log('Verificações após mesclagem:', finalVerifications.length);
    
    alert('Debug concluído! Verifique o console para detalhes.');
}

// Função para forçar atualização
function forceRefresh() {
    console.log('=== FORÇANDO ATUALIZAÇÃO ===');
    
    // 1. Verificar documentos pendentes
    const pendingDocs = JSON.parse(localStorage.getItem('pendingVerifications') || '[]');
    console.log('Documentos pendentes:', pendingDocs.length);
    
    // 2. Forçar mesclagem
    mergePendingFromAdvertiser();
    
    // 3. Recarregar verificações
    loadVerifications();
    
    // 4. Forçar renderização
    renderVerifications();
    updateStats();
    
    alert('Atualização forçada concluída! Verifique o console para detalhes.');
}

// Função para criar verificação de teste
function createTestVerification() {
    console.log('=== CRIANDO VERIFICAÇÃO DE TESTE ===');
    
    // Criar múltiplos usuários de teste
    const testUsers = [
        {
            id: Date.now() + 1,
            email: 'maria@teste.com',
            name: 'Maria Silva',
            phone: '(11) 99999-1111'
        },
        {
            id: Date.now() + 2,
            email: 'joao@teste.com',
            name: 'João Santos',
            phone: '(11) 99999-2222'
        },
        {
            id: Date.now() + 3,
            email: 'ana@teste.com',
            name: 'Ana Costa',
            phone: '(11) 99999-3333'
        }
    ];
    
    // Adicionar usuários se não existirem
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    testUsers.forEach(user => {
        if (!users.find(u => u.email === user.email)) {
            users.push(user);
        }
    });
    localStorage.setItem('users', JSON.stringify(users));
    
    // Criar documentos de teste para cada usuário
    const allTestDocs = [];
    
    testUsers.forEach(user => {
        const testDocs = [
            { 
                userEmail: user.email, 
                type: 'documento', 
                url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 
                submittedAt: new Date().toISOString(), 
                status: 'pending' 
            },
            { 
                userEmail: user.email, 
                type: 'foto-codigo', 
                url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 
                submittedAt: new Date().toISOString(), 
                status: 'pending' 
            },
            { 
                userEmail: user.email, 
                type: 'selfie', 
                url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 
                submittedAt: new Date().toISOString(), 
                status: 'pending' 
            }
        ];
        allTestDocs.push(...testDocs);
    });
    
    // Salvar documentos pendentes
    localStorage.setItem('pendingVerifications', JSON.stringify(allTestDocs));
    console.log('Documentos de teste criados:', allTestDocs.length);
    
    // Recarregar verificações
    loadVerifications();
    
    alert(`✅ ${testUsers.length} verificações de teste criadas!\n\n- ${testUsers.length} usuários\n- ${allTestDocs.length} documentos\n\nAgora você deve ver os documentos na lista.`);
}

// Função para criar verificações diretamente (sem mesclagem)
function createDirectVerifications() {
    console.log('=== CRIANDO VERIFICAÇÕES DIRETAS ===');
    
    // Criar uma imagem de teste mais realista
    const createTestImage = (text) => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Fundo branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 200);
        
        // Borda
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 280, 180);
        
        // Texto
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, 150, 100);
        
        // Data
        ctx.font = '12px Arial';
        ctx.fillText(new Date().toLocaleDateString(), 150, 130);
        
        return canvas.toDataURL('image/png');
    };
    
    const testUsers = [
        {
            id: Date.now() + 1,
            email: 'maria@teste.com',
            name: 'Maria Silva',
            phone: '(11) 99999-1111'
        },
        {
            id: Date.now() + 2,
            email: 'joao@teste.com',
            name: 'João Santos',
            phone: '(11) 99999-2222'
        },
        {
            id: Date.now() + 3,
            email: 'ana@teste.com',
            name: 'Ana Costa',
            phone: '(11) 99999-3333'
        }
    ];
    
    // Adicionar usuários
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    testUsers.forEach(user => {
        if (!users.find(u => u.email === user.email)) {
            users.push(user);
        }
    });
    localStorage.setItem('users', JSON.stringify(users));
    
    // Criar verificações diretamente
    let verifications = JSON.parse(localStorage.getItem('verifications') || '[]');
    
    testUsers.forEach(user => {
        const verificationObj = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            documents: {
                documento: {
                    name: 'Documento de Identificação',
                    uploaded: true,
                    verified: false,
                    url: createTestImage('Documento de Identificação'),
                    data: createTestImage('Documento de Identificação')
                },
                'foto-codigo': {
                    name: 'Foto com Código',
                    uploaded: true,
                    verified: false,
                    url: createTestImage('Foto com Código'),
                    data: createTestImage('Foto com Código')
                },
                selfie: {
                    name: 'Selfie',
                    uploaded: true,
                    verified: false,
                    url: createTestImage('Selfie'),
                    data: createTestImage('Selfie')
                }
            },
            notes: 'Verificação criada para teste',
            adminNotes: ''
        };
        
        verifications.push(verificationObj);
    });
    
    localStorage.setItem('verifications', JSON.stringify(verifications));
    
    // Recarregar verificações
    loadVerifications();
    
    alert(`✅ ${testUsers.length} verificações criadas diretamente!\n\nAgora você deve ver os documentos na lista.`);
}