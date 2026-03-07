// Sistema de Notificações Moderno para DesejosMS
class NotificationSystem {
    constructor() {
        this.init();
    }

    init() {
        // Criar o overlay de notificação se não existir
        if (!document.getElementById('notification-overlay')) {
            this.createNotificationOverlay();
        }
        
        // Substituir o alert nativo
        this.replaceNativeAlert();
    }

    createNotificationOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'notification-overlay';
        overlay.className = 'notification-overlay';
        overlay.innerHTML = `
            <div class="notification-container">
                <div class="notification-header">
                    <span class="notification-icon"></span>
                    <h3 class="notification-title"></h3>
                </div>
                <div class="notification-body">
                    <div class="notification-message"></div>
                    <div class="notification-buttons"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    replaceNativeAlert() {
        // Substituir o alert nativo por nossa notificação
        window.originalAlert = window.alert;
        window.alert = (message, type = 'info') => {
            this.show(message, type);
        };
        
        // Substituir o confirm nativo por nossa notificação
        window.originalConfirm = window.confirm;
        window.confirm = (message) => {
            return this.confirm(message);
        };
    }

    show(message, type = 'info', options = {}) {
        const overlay = document.getElementById('notification-overlay');
        const container = overlay.querySelector('.notification-container');
        const header = overlay.querySelector('.notification-header');
        const icon = overlay.querySelector('.notification-icon');
        const title = overlay.querySelector('.notification-title');
        const messageEl = overlay.querySelector('.notification-message');
        const buttonsContainer = overlay.querySelector('.notification-buttons');

        // Configurar tipo
        this.setNotificationType(header, icon, title, type, options.title);

        // Configurar mensagem
        messageEl.textContent = message;

        // Configurar botões
        this.setupButtons(buttonsContainer, options);

        // Mostrar notificação
        overlay.classList.add('show');

        // Auto-fechar se não for confirmação
        if (!options.confirm && !options.buttons) {
            setTimeout(() => {
                this.hide();
            }, options.duration || 3000);
        }

        return new Promise((resolve) => {
            this.currentResolve = resolve;
        });
    }

    setNotificationType(header, icon, title, type, customTitle) {
        // Remover classes anteriores
        header.className = 'notification-header';
        
        // Configurar baseado no tipo
        switch (type) {
            case 'success':
                header.classList.add('success');
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                title.textContent = customTitle || 'Sucesso!';
                break;
            case 'error':
                header.classList.add('error');
                icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                title.textContent = customTitle || 'Erro!';
                break;
            case 'warning':
                header.classList.add('warning');
                icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
                title.textContent = customTitle || 'Atenção!';
                break;
            case 'info':
            default:
                header.classList.add('info');
                icon.innerHTML = '<i class="fas fa-info-circle"></i>';
                title.textContent = customTitle || 'Informação';
                break;
        }
    }

    setupButtons(container, options) {
        container.innerHTML = '';

        if (options.buttons) {
            // Botões customizados
            options.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = `notification-btn notification-btn-${button.type || 'secondary'}`;
                btn.textContent = button.text;
                btn.onclick = () => {
                    this.hide();
                    if (button.onClick) button.onClick();
                    if (this.currentResolve) this.currentResolve(button.value);
                };
                container.appendChild(btn);
            });
        } else if (options.confirm) {
            // Botões de confirmação
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'notification-btn notification-btn-primary';
            confirmBtn.textContent = options.confirmText || 'Confirmar';
            confirmBtn.onclick = () => {
                this.hide();
                if (this.currentResolve) this.currentResolve(true);
            };

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'notification-btn notification-btn-secondary';
            cancelBtn.textContent = options.cancelText || 'Cancelar';
            cancelBtn.onclick = () => {
                this.hide();
                if (this.currentResolve) this.currentResolve(false);
            };

            container.appendChild(confirmBtn);
            container.appendChild(cancelBtn);
        } else {
            // Botão OK padrão
            const okBtn = document.createElement('button');
            okBtn.className = 'notification-btn notification-btn-primary';
            okBtn.textContent = 'OK';
            okBtn.onclick = () => {
                this.hide();
                if (this.currentResolve) this.currentResolve();
            };
            container.appendChild(okBtn);
        }
    }

    hide() {
        const overlay = document.getElementById('notification-overlay');
        overlay.classList.remove('show');
        
        if (this.currentResolve) {
            this.currentResolve();
            this.currentResolve = null;
        }
    }

    // Métodos de conveniência
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    confirm(message, options = {}) {
        return this.show(message, 'warning', { ...options, confirm: true });
    }

    // Notificação com lista
    showList(title, items, type = 'info', options = {}) {
        const message = `
            ${title}
            <div class="notification-list">
                <ul>
                    ${items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
        return this.show(message, type, { ...options, html: true });
    }

    // Notificação com progresso
    showProgress(title, progress = 0, options = {}) {
        const message = `
            ${title}
            <div class="notification-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
        return this.show(message, 'info', { ...options, html: true });
    }
}

// Inicializar o sistema de notificações
const notifications = new NotificationSystem();

// Funções globais para facilitar o uso
window.showNotification = (message, type, options) => notifications.show(message, type, options);
window.showSuccess = (message, options) => notifications.success(message, options);
window.showError = (message, options) => notifications.error(message, options);
window.showWarning = (message, options) => notifications.warning(message, options);
window.showInfo = (message, options) => notifications.info(message, options);
window.showConfirm = (message, options) => notifications.confirm(message, options);

// Função para substituir todos os alerts existentes
function replaceAllAlerts() {
    // Substituir alerts em funções específicas
    const alertReplacements = {
        'Anúncio aprovado com sucesso!': () => notifications.success('Anúncio aprovado com sucesso!'),
        'Anúncio rejeitado.': () => notifications.error('Anúncio rejeitado.'),
        'Todos os anúncios pendentes foram aprovados!': () => notifications.success('Todos os anúncios pendentes foram aprovados!'),
        'Usuário verificado com sucesso!': () => notifications.success('Usuário verificado com sucesso!'),
        'Usuário bloqueado com sucesso!': () => notifications.success('Usuário bloqueado com sucesso!'),
        'Preços atualizados com sucesso!': () => notifications.success('Preços atualizados com sucesso!'),
        'Cidades atualizadas com sucesso!': () => notifications.success('Cidades atualizadas com sucesso!'),
        'Por favor, preencha todos os campos.': () => notifications.warning('Por favor, preencha todos os campos.'),
        'Cupom criado com sucesso!': () => notifications.success('Cupom criado com sucesso!'),
        'Cupom excluído com sucesso!': () => notifications.success('Cupom excluído com sucesso!'),
        'Cupom ativado com sucesso!': () => notifications.success('Cupom ativado com sucesso!'),
        'Cupom desativado com sucesso!': () => notifications.success('Cupom desativado com sucesso!'),
        'Verificação aprovada com sucesso!': () => notifications.success('Verificação aprovada com sucesso!'),
        'Verificação rejeitada.': () => notifications.error('Verificação rejeitada.'),
        'Cidade atualizada com sucesso!': () => notifications.success('Cidade atualizada com sucesso!'),
        'Cidade adicionada com sucesso!': () => notifications.success('Cidade adicionada com sucesso!'),
        'Cidade ativada com sucesso!': () => notifications.success('Cidade ativada com sucesso!'),
        'Cidade desativada com sucesso!': () => notifications.success('Cidade desativada com sucesso!'),
        'Cidade excluída com sucesso!': () => notifications.success('Cidade excluída com sucesso!'),
        'Pagamento processado com sucesso! Seu anúncio será ativado em breve.': () => notifications.success('Pagamento processado com sucesso! Seu anúncio será ativado em breve.'),
        'Anúncio atualizado com sucesso!': () => notifications.success('Anúncio atualizado com sucesso!'),
        'Anúncio criado com sucesso! Aguardando aprovação do administrador.': () => notifications.success('Anúncio criado com sucesso! Aguardando aprovação do administrador.'),
        'Documentos enviados com sucesso! Aguardando verificação do administrador.': () => notifications.success('Documentos enviados com sucesso! Aguardando verificação do administrador.'),
        'Sua conta foi verificada com sucesso! Agora você pode criar anúncios.': () => notifications.success('Sua conta foi verificada com sucesso! Agora você pode criar anúncios.'),
        'Avaliação enviada com sucesso! Obrigado por seu feedback.': () => notifications.success('Avaliação enviada com sucesso! Obrigado por seu feedback.'),
        'Por favor, selecione uma avaliação antes de enviar.': () => notifications.warning('Por favor, selecione uma avaliação antes de enviar.'),
        'Transações atualizadas com sucesso!': () => notifications.success('Transações atualizadas com sucesso!')
    };

    // Substituir alerts específicos
    Object.keys(alertReplacements).forEach(alertMessage => {
        // Esta função será chamada quando encontrarmos um alert com essa mensagem
        window[`alert_${alertMessage.replace(/[^a-zA-Z0-9]/g, '_')}`] = alertReplacements[alertMessage];
    });
}

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    replaceAllAlerts();
});

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
