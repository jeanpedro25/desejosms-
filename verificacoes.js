// Variáveis globais
let verifications = [];
let filteredVerifications = [];
let selectedVerification = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIALIZANDO PÁGINA DE VERIFICAÇÕES ===');
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
async function getDocumentUrlSafe(document){
	if (document && document.url) return document.url;
	if (document && document.docId){
		try {
			const blob = await idbGetBlob(document.docId);
			if (blob) return URL.createObjectURL(blob);
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
                    <div class="document-item" onclick="event.stopPropagation(); viewDocument('${key}', ${verification.id})">
                        <i class="fas ${doc.uploaded ? 'fa-file-alt' : 'fa-times-circle'}"></i>
                        <span>${doc.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${verification.status === 'pending' ? `
            <div class="verification-actions">
                <button class="btn btn-success" onclick="event.stopPropagation(); approveVerification(${verification.id})">
                    <i class="fas fa-check"></i>
                    Aprovar
                </button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); rejectVerification(${verification.id})">
                    <i class="fas fa-times"></i>
                    Rejeitar
                </button>
            </div>
        ` : verification.status === 'approved' ? `
            <div class="verification-actions">
                <button class="btn btn-warning" onclick="event.stopPropagation(); rejectVerification(${verification.id})">
                    <i class="fas fa-times"></i>
                    Reverter Aprovação
                </button>
                <div class="verification-status-approved" style="margin-top: 10px; color: #28a745; font-weight: bold;">
                    <i class="fas fa-check-circle"></i> Aprovado em ${new Date(verification.approvedAt).toLocaleDateString()}
                </div>
            </div>
        ` : verification.status === 'rejected' ? `
            <div class="verification-actions">
                <button class="btn btn-success" onclick="event.stopPropagation(); approveVerification(${verification.id})">
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
                                <button class="btn btn-sm btn-info" onclick="viewDocument('${key}', ${verification.id})">
                                    <i class="fas fa-eye"></i> Visualizar
                                </button>
                                <button class="btn btn-sm btn-success" onclick="downloadDocument('${key}', ${verification.id})">
                                    <i class="fas fa-download"></i> Baixar
                                </button>
                            </div>
                        </div>
                        <div class="document-content">
                            ${doc.uploaded ? `
                                <img src="${doc.url}" alt="${doc.name}" style="max-width: 100%; height: 200px; object-fit: cover; border-radius: 8px; cursor: pointer;" onclick="viewDocument('${key}', ${verification.id})">
                            ` : `
                                <div class="document-missing">
                                    <i class="fas fa-times-circle"></i>
                                    <p>Documento não enviado</p>
                                </div>
                            `}
                        </div>
                    </div>
                            ${doc.uploaded ? `
                                <img src="${doc.url}" alt="${doc.name}" />
                            ` : `
                                <div class="placeholder">
                                    <i class="fas fa-times"></i>
                                </div>
                            `}
                            <h4>${doc.name}</h4>
                            <p>${doc.uploaded ? 'Enviado' : 'Não enviado'}</p>
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
    
    const verification = verifications.find(v => v.id === verificationId);
    if (!verification) {
        console.error('Verificação não encontrada:', verificationId);
        alert('Verificação não encontrada.');
        return;
    }
    
    const document = verification.documents[documentKey];
    if (!document) {
        console.error('Documento não encontrado:', documentKey);
        alert('Documento não encontrado.');
        return;
    }
    
    // Verificar se o documento tem URL ou dados base64
    getDocumentUrlSafe(document).then(documentUrl => {
        if (!document.uploaded || !documentUrl) {
            console.error('Documento não foi enviado ou URL inválida');
            console.log('Documento:', document);
            alert('Documento não foi enviado ou está indisponível.');
            return;
        }
        
        console.log('Documento encontrado:', document);
        console.log('URL do documento:', documentUrl);
        
        // Criar modal para visualização
        const modal = document.createElement('div');
        modal.className = 'document-viewer-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="document-viewer-content" style="
                background: white;
                padding: 20px;
                border-radius: 10px;
                max-width: 95%;
                max-height: 95%;
                overflow: auto;
                position: relative;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <button onclick="this.parentElement.parentElement.remove()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    font-size: 16px;
                    z-index: 10001;
                ">×</button>
                <h3 style="margin-bottom: 20px; color: #8B0000; text-align: center;">${document.name}</h3>
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${documentUrl}" alt="${document.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display: none; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #666;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2em; color: #ffc107; margin-bottom: 10px;"></i>
                        <p>Documento não pode ser exibido</p>
                        <p>Use o botão "Baixar" para salvar o arquivo</p>
                    </div>
                </div>
                <div style="text-align: center;">
                    <button class="btn btn-sm btn-success" id="downloadBtnTemp">
                        <i class="fas fa-download"></i> Baixar Documento
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const btn = modal.querySelector('#downloadBtnTemp');
        btn.onclick = () => downloadDocument(documentKey, verificationId);
    }).catch(()=> alert('Falha ao carregar documento.'));
}

// Função para baixar documento
function downloadDocument(documentKey, verificationId) {
    const verification = verifications.find(v => v.id === verificationId);
    if (!verification) return;
    
    const document = verification.documents[documentKey];
    if (!document || !document.uploaded) {
        alert('Documento não foi enviado.');
        return;
    }
    
    getDocumentUrlSafe(document).then(documentUrl => {
        if (!documentUrl) { alert('Documento indisponível.'); return; }
        try {
            const link = document.createElement('a');
            link.href = documentUrl;
            link.download = `${verification.userName}_${document.name}_${verificationId}.png`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log(`Documento ${document.name} baixado com sucesso`);
        } catch (error) {
            console.error('Erro ao baixar documento:', error);
            alert('Erro ao baixar documento. Tente novamente.');
        }
    });
}

// Função para aprovar verificação
function approveVerification(verificationId = null) {
    const id = verificationId || (selectedVerification ? selectedVerification.id : null);
    if (!id) return;
    
    const verification = verifications.find(v => v.id === id);
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
    // Persistir verificações
    localStorage.setItem('verifications', JSON.stringify(verifications));
    
    // Atualizar interface
    loadVerifications(); updateStats();
    closeModal('verificationModal');
    
    alert('Verificação aprovada com sucesso!');
}

// Função para rejeitar verificação
function rejectVerification(verificationId = null) {
    const id = verificationId || (selectedVerification ? selectedVerification.id : null);
    if (!id) return;
    
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    
    const verification = verifications.find(v => v.id === id);
    if (!verification) return;
    
    verification.status = 'rejected';
    verification.rejectedAt = new Date().toISOString();
    delete verification.approvedAt;
    verification.adminNotes = reason;
    
    // Garantir que o usuário permaneça não verificado
    const users = JSON.parse(localStorage.getItem('users')||'[]');
    const idx = users.findIndex(u=>u.email===verification.userEmail);
    if (idx!==-1){ 
        users[idx].verified = false; 
        users[idx].verificationStatus = 'rejected'; // Adicionar status de rejeição
        localStorage.setItem('users', JSON.stringify(users)); 
    }
    
    // Criar notificação de rejeição para o anunciante
    const rejectionNotification = {
        id: Date.now(),
        userEmail: verification.userEmail,
        type: 'verification_rejected',
        title: 'Verificação Rejeitada',
        message: `Sua verificação foi rejeitada pelo motivo: "${reason}". Clique aqui para enviar nova verificação.`,
        createdAt: new Date().toISOString(),
        read: false,
        actionUrl: 'painel-anunciante.html',
        requiresAction: true
    };
    
    // Salvar notificação
    let notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notifications.push(rejectionNotification);
    localStorage.setItem('userNotifications', JSON.stringify(notifications));
    
    // Persistir verificações
    localStorage.setItem('verifications', JSON.stringify(verifications));
    
    // Atualizar interface
    loadVerifications(); updateStats();
    closeModal('verificationModal');
    
    alert('Verificação rejeitada. O anunciante será notificado e poderá enviar nova verificação.');
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