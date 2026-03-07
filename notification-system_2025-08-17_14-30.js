/**
 * Sistema de Notificações - DesejosMS
 * Versão: 1.0
 * Data: 2025-08-17
 * 
 * Sistema completo de notificações em tempo real para o projeto DesejosMS
 * Inclui notificações push, persistência, configurações e integração com localStorage
 */

class NotificationSystem {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'top-right', // top-right, top-left, bottom-right, bottom-left
            maxNotifications: options.maxNotifications || 5,
            autoClose: options.autoClose !== false,
            autoCloseDelay: options.autoCloseDelay || 5000,
            showProgress: options.showProgress !== false,
            containerClass: options.containerClass || 'notification-container',
            notificationClass: options.notificationClass || 'notification',
            ...options
        };

        this.notifications = [];
        this.container = null;
        this.init();
    }

    /**
     * Inicializa o sistema de notificações
     */
    init() {
        this.createContainer();
        this.loadSettings();
        this.setupEventListeners();
    }

    /**
     * Cria o container de notificações
     */
    createContainer() {
        // Verificar se já existe um container
        this.container = document.getElementById(this.options.containerClass);
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = this.options.containerClass;
            this.container.className = this.options.containerClass;
            
            // Aplicar estilos baseados na posição
            this.applyPositionStyles();
            
            document.body.appendChild(this.container);
        }
    }

    /**
     * Aplica estilos baseados na posição configurada
     */
    applyPositionStyles() {
        const styles = {
            position: 'fixed',
            zIndex: '10000',
            maxWidth: '400px',
            pointerEvents: 'none'
        };

        switch (this.options.position) {
            case 'top-right':
                styles.top = '20px';
                styles.right = '20px';
                break;
            case 'top-left':
                styles.top = '20px';
                styles.left = '20px';
                break;
            case 'bottom-right':
                styles.bottom = '20px';
                styles.right = '20px';
                break;
            case 'bottom-left':
                styles.bottom = '20px';
                styles.left = '20px';
                break;
            default:
                styles.top = '20px';
                styles.right = '20px';
        }

        Object.assign(this.container.style, styles);
    }

    /**
     * Carrega configurações salvas
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('notificationSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.options = { ...this.options, ...settings };
            }
        } catch (error) {
            console.warn('Erro ao carregar configurações de notificação:', error);
        }
    }

    /**
     * Salva configurações
     */
    saveSettings() {
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(this.options));
        } catch (error) {
            console.warn('Erro ao salvar configurações de notificação:', error);
        }
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Listener para notificações do sistema
        if ('Notification' in window) {
            Notification.requestPermission();
        }

        // Listener para visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseNotifications();
            } else {
                this.resumeNotifications();
            }
        });
    }

    /**
     * Exibe uma notificação
     * @param {string} type - Tipo da notificação (success, error, warning, info)
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     * @param {object} options - Opções adicionais
     */
    show(type, title, message, options = {}) {
        const notification = this.createNotification(type, title, message, options);
        
        // Adicionar ao container
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Limitar número de notificações
        this.limitNotifications();

        // Auto-close se habilitado
        if (this.options.autoClose && options.autoClose !== false) {
            this.autoClose(notification, options.duration || this.options.autoCloseDelay);
        }

        // Animar entrada
        this.animateIn(notification);

        // Log da notificação
        this.logNotification(type, title, message);

        return notification;
    }

    /**
     * Cria o elemento da notificação
     */
    createNotification(type, title, message, options) {
        const notification = document.createElement('div');
        notification.className = `${this.options.notificationClass} ${type}`;
        notification.style.pointerEvents = 'auto';

        // Adicionar atributos de dados
        notification.dataset.type = type;
        notification.dataset.timestamp = Date.now();

        // Criar estrutura HTML
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-icon">
                    ${this.getIcon(type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
                <div class="notification-actions">
                    ${options.showClose !== false ? '<button class="notification-close" title="Fechar">×</button>' : ''}
                </div>
            </div>
            ${this.options.showProgress ? '<div class="notification-progress"></div>' : ''}
            ${options.actions ? this.createActions(options.actions) : ''}
        `;

        // Adicionar event listeners
        this.addNotificationListeners(notification, options);

        return notification;
    }

    /**
     * Obtém o ícone baseado no tipo
     */
    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Cria botões de ação
     */
    createActions(actions) {
        if (!Array.isArray(actions)) return '';
        
        const actionsHtml = actions.map(action => 
            `<button class="notification-action" data-action="${action.name}">${action.label}</button>`
        ).join('');
        
        return `<div class="notification-actions-bar">${actionsHtml}</div>`;
    }

    /**
     * Adiciona event listeners à notificação
     */
    addNotificationListeners(notification, options) {
        // Botão de fechar
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.remove(notification));
        }

        // Ações customizadas
        const actionBtns = notification.querySelectorAll('.notification-action');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionName = e.target.dataset.action;
                const action = options.actions?.find(a => a.name === actionName);
                if (action && action.callback) {
                    action.callback();
                }
                this.remove(notification);
            });
        });

        // Click na notificação
        if (options.onClick) {
            notification.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-actions')) {
                    options.onClick();
                }
            });
        }
    }

    /**
     * Anima a entrada da notificação
     */
    animateIn(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        requestAnimationFrame(() => {
            notification.style.transition = 'all 0.3s ease-out';
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
    }

    /**
     * Anima a saída da notificação
     */
    animateOut(notification, callback) {
        notification.style.transition = 'all 0.3s ease-in';
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    /**
     * Remove uma notificação
     */
    remove(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }

        this.animateOut(notification, () => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        });
    }

    /**
     * Remove todas as notificações
     */
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }

    /**
     * Remove notificações por tipo
     */
    clearByType(type) {
        this.notifications
            .filter(notification => notification.dataset.type === type)
            .forEach(notification => this.remove(notification));
    }

    /**
     * Auto-close da notificação
     */
    autoClose(notification, duration) {
        if (this.options.showProgress) {
            this.showProgress(notification, duration);
        }

        setTimeout(() => {
            if (this.notifications.includes(notification)) {
                this.remove(notification);
            }
        }, duration);
    }

    /**
     * Mostra barra de progresso
     */
    showProgress(notification, duration) {
        const progressBar = notification.querySelector('.notification-progress');
        if (!progressBar) return;

        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '0%';
        
        requestAnimationFrame(() => {
            progressBar.style.width = '100%';
        });
    }

    /**
     * Limita o número de notificações
     */
    limitNotifications() {
        while (this.notifications.length > this.options.maxNotifications) {
            this.remove(this.notifications[0]);
        }
    }

    /**
     * Pausa notificações
     */
    pauseNotifications() {
        this.container.style.opacity = '0.5';
    }

    /**
     * Resume notificações
     */
    resumeNotifications() {
        this.container.style.opacity = '1';
    }

    /**
     * Log da notificação
     */
    logNotification(type, title, message) {
        const log = {
            timestamp: new Date().toISOString(),
            type,
            title,
            message
        };

        // Salvar no localStorage
        try {
            const logs = JSON.parse(localStorage.getItem('notificationLogs') || '[]');
            logs.push(log);
            
            // Manter apenas os últimos 100 logs
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            localStorage.setItem('notificationLogs', JSON.stringify(logs));
        } catch (error) {
            console.warn('Erro ao salvar log de notificação:', error);
        }

        // Log no console em desenvolvimento
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`[Notification] ${type.toUpperCase()}: ${title} - ${message}`);
        }
    }

    /**
     * Obtém logs de notificações
     */
    getLogs(limit = 50) {
        try {
            const logs = JSON.parse(localStorage.getItem('notificationLogs') || '[]');
            return logs.slice(-limit);
        } catch (error) {
            console.warn('Erro ao obter logs de notificação:', error);
            return [];
        }
    }

    /**
     * Limpa logs de notificações
     */
    clearLogs() {
        localStorage.removeItem('notificationLogs');
    }

    /**
     * Atualiza configurações
     */
    updateSettings(newSettings) {
        this.options = { ...this.options, ...newSettings };
        this.saveSettings();
        
        // Reaplicar estilos se a posição mudou
        if (newSettings.position) {
            this.applyPositionStyles();
        }
    }

    /**
     * Obtém estatísticas
     */
    getStats() {
        const logs = this.getLogs();
        const stats = {
            total: logs.length,
            byType: {},
            recent: logs.slice(-10)
        };

        logs.forEach(log => {
            stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
        });

        return stats;
    }
}

// Estilos CSS para o sistema de notificações
const notificationStyles = `
    .notification-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .notification {
        background: white;
        border-left: 4px solid #8B0000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        border-radius: 8px;
        overflow: hidden;
        min-width: 300px;
        max-width: 400px;
    }

    .notification.success { border-left-color: #28a745; }
    .notification.error { border-left-color: #dc3545; }
    .notification.warning { border-left-color: #ffc107; }
    .notification.info { border-left-color: #17a2b8; }

    .notification-header {
        display: flex;
        align-items: flex-start;
        padding: 15px;
        gap: 12px;
    }

    .notification-icon {
        flex-shrink: 0;
        font-size: 20px;
        margin-top: 2px;
    }

    .notification.success .notification-icon { color: #28a745; }
    .notification.error .notification-icon { color: #dc3545; }
    .notification.warning .notification-icon { color: #ffc107; }
    .notification.info .notification-icon { color: #17a2b8; }

    .notification-content {
        flex: 1;
        min-width: 0;
    }

    .notification-title {
        font-weight: bold;
        color: #333;
        margin-bottom: 4px;
        font-size: 14px;
    }

    .notification-message {
        color: #666;
        font-size: 13px;
        line-height: 1.4;
    }

    .notification-actions {
        flex-shrink: 0;
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }

    .notification-close:hover {
        background: #f0f0f0;
        color: #666;
    }

    .notification-progress {
        height: 3px;
        background: #e0e0e0;
        width: 100%;
    }

    .notification.success .notification-progress { background: #28a745; }
    .notification.error .notification-progress { background: #dc3545; }
    .notification.warning .notification-progress { background: #ffc107; }
    .notification.info .notification-progress { background: #17a2b8; }

    .notification-actions-bar {
        display: flex;
        gap: 8px;
        padding: 10px 15px;
        border-top: 1px solid #f0f0f0;
        background: #fafafa;
    }

    .notification-action {
        background: #8B0000;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .notification-action:hover {
        background: #6B0000;
        transform: translateY(-1px);
    }

    @media (max-width: 768px) {
        .notification-container {
            max-width: calc(100vw - 40px) !important;
        }
        
        .notification {
            min-width: auto;
            max-width: none;
        }
    }
`;

// Função para injetar estilos
function injectNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = notificationStyles;
        document.head.appendChild(style);
    }
}

// Função para criar instância global
function createNotificationSystem(options = {}) {
    injectNotificationStyles();
    return new NotificationSystem(options);
}

// Funções de conveniência
const NotificationHelper = {
    success: (title, message, options = {}) => {
        if (window.notificationSystem) {
            return window.notificationSystem.show('success', title, message, options);
        }
    },
    
    error: (title, message, options = {}) => {
        if (window.notificationSystem) {
            return window.notificationSystem.show('error', title, message, options);
        }
    },
    
    warning: (title, message, options = {}) => {
        if (window.notificationSystem) {
            return window.notificationSystem.show('warning', title, message, options);
        }
    },
    
    info: (title, message, options = {}) => {
        if (window.notificationSystem) {
            return window.notificationSystem.show('info', title, message, options);
        }
    },
    
    clear: () => {
        if (window.notificationSystem) {
            window.notificationSystem.clear();
        }
    }
};

// Auto-inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Criar instância global
    window.notificationSystem = createNotificationSystem({
        position: 'top-right',
        maxNotifications: 5,
        autoClose: true,
        autoCloseDelay: 5000,
        showProgress: true
    });

    // Expor helper globalmente
    window.Notify = NotificationHelper;
    
    console.log('✅ Sistema de notificações carregado com sucesso!');
});

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationSystem, NotificationHelper, createNotificationSystem };
}
