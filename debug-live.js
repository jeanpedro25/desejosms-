// 🎥 SISTEMA DE DEBUG EM TEMPO REAL
// Para acompanhar o desenvolvimento passo a passo

class LiveDebugger {
    constructor() {
        this.logs = [];
        this.isActive = true;
        this.createDebugPanel();
    }

    // Criar painel de debug visível
    createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'live-debug-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 400px;
            max-height: 300px;
            background: rgba(0,0,0,0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            overflow-y: auto;
            border: 2px solid #00ff00;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #00ff00;">🎥 DEBUG EM TEMPO REAL</h4>
                <button onclick="liveDebugger.toggle()" style="background: #00ff00; color: black; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">PAUSAR</button>
            </div>
            <div id="debug-logs" style="max-height: 250px; overflow-y: auto;"></div>
        `;

        document.body.appendChild(panel);
    }

    // Adicionar log
    log(message, type = 'info') {
        if (!this.isActive) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type
        };

        this.logs.push(logEntry);
        this.updateDisplay();

        // Também logar no console
        console.log(`[${timestamp}] ${message}`);
    }

    // Atualizar display
    updateDisplay() {
        const logsContainer = document.getElementById('debug-logs');
        if (!logsContainer) return;

        const recentLogs = this.logs.slice(-20); // Últimas 20 entradas
        logsContainer.innerHTML = recentLogs.map(log => `
            <div style="margin-bottom: 5px; padding: 2px;">
                <span style="color: #888;">[${log.timestamp}]</span>
                <span style="color: ${this.getColorForType(log.type)};">${log.message}</span>
            </div>
        `).join('');

        // Auto-scroll para o final
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Cores por tipo
    getColorForType(type) {
        switch(type) {
            case 'success': return '#00ff00';
            case 'error': return '#ff0000';
            case 'warning': return '#ffff00';
            case 'info': return '#00ffff';
            default: return '#ffffff';
        }
    }

    // Pausar/Retomar
    toggle() {
        this.isActive = !this.isActive;
        const button = document.querySelector('#live-debug-panel button');
        if (button) {
            button.textContent = this.isActive ? 'PAUSAR' : 'RETOMAR';
        }
    }

    // Logs específicos para desenvolvimento
    logFunctionCall(functionName, params = {}) {
        this.log(`🔧 Chamando: ${functionName}`, 'info');
        if (Object.keys(params).length > 0) {
            this.log(`   📝 Parâmetros: ${JSON.stringify(params)}`, 'info');
        }
    }

    logFunctionResult(functionName, result) {
        this.log(`✅ Resultado de ${functionName}: ${result}`, 'success');
    }

    logError(functionName, error) {
        this.log(`❌ Erro em ${functionName}: ${error}`, 'error');
    }

    logDataChange(key, oldValue, newValue) {
        this.log(`🔄 Dados alterados: ${key}`, 'warning');
        this.log(`   📤 Antes: ${oldValue}`, 'info');
        this.log(`   📥 Depois: ${newValue}`, 'info');
    }
}

// Instanciar debugger global
window.liveDebugger = new LiveDebugger();

// Funções de conveniência
window.debugLog = (msg, type) => liveDebugger.log(msg, type);
window.debugFunction = (name, params) => liveDebugger.logFunctionCall(name, params);
window.debugResult = (name, result) => liveDebugger.logFunctionResult(name, result);
window.debugError = (name, error) => liveDebugger.logError(name, error);
window.debugData = (key, oldVal, newVal) => liveDebugger.logDataChange(key, oldVal, newVal);

// Log inicial
liveDebugger.log('🎥 Sistema de Debug em Tempo Real Ativado!', 'success');
liveDebugger.log('📱 Painel visível no canto superior esquerdo', 'info');
liveDebugger.log('🔧 Use debugLog(), debugFunction(), etc. para logs', 'info');


