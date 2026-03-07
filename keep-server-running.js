const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 INICIADOR DE SERVIDOR DESEJOSMS');
console.log('=====================================');
console.log('Porta: 3025');
console.log('URL: http://localhost:3025');
console.log('O servidor será reiniciado automaticamente se cair');
console.log('Pressione Ctrl+C para parar completamente');
console.log('=====================================');
console.log('');

function startServer() {
    console.log(`⏰ ${new Date().toLocaleString('pt-BR')} - Iniciando servidor...`);
    
    const server = spawn('node', ['server-fixed.js'], {
        stdio: 'inherit',
        cwd: __dirname
    });
    
    server.on('close', (code) => {
        console.log(`❌ Servidor parou com código: ${code}`);
        console.log('🔄 Reiniciando em 3 segundos...');
        
        setTimeout(() => {
            startServer();
        }, 3000);
    });
    
    server.on('error', (err) => {
        console.log(`❌ Erro no servidor: ${err.message}`);
        console.log('🔄 Reiniciando em 5 segundos...');
        
        setTimeout(() => {
            startServer();
        }, 5000);
    });
}

// Capturar Ctrl+C para parar completamente
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    process.exit(0);
});

// Iniciar o servidor
startServer();

