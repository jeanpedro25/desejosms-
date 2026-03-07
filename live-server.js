// 🎥 SERVIDOR LOCAL PARA DESENVOLVIMENTO EM TEMPO REAL
// Execute: node live-server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// Mapeamento de tipos MIME
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    
    // Parse URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Get file path
    const filePath = path.join(__dirname, pathname);
    const extname = path.extname(filePath).toLowerCase();
    
    // Set content type
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Read file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 - Arquivo não encontrado</title></head>
                        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                            <h1>404 - Arquivo não encontrado</h1>
                            <p>O arquivo <strong>${pathname}</strong> não foi encontrado.</p>
                            <p><a href="/">Voltar ao início</a></p>
                        </body>
                    </html>
                `);
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Erro do servidor: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🎥 Servidor de desenvolvimento rodando em:`);
    console.log(`   📱 Local: http://localhost:${PORT}`);
    console.log(`   🌐 Rede: http://0.0.0.0:${PORT}`);
    console.log(`   📁 Diretório: ${__dirname}`);
    console.log(`\n📋 Arquivos disponíveis:`);
    console.log(`   • http://localhost:${PORT}/index.html - Página principal`);
    console.log(`   • http://localhost:${PORT}/verificacoes.html - Página de verificações`);
    console.log(`   • http://localhost:${PORT}/painel-anunciante.html - Painel do anunciante`);
    console.log(`   • http://localhost:${PORT}/dev-dashboard.html - Dashboard de desenvolvimento`);
    console.log(`   • http://localhost:${PORT}/teste-verificacao.html - Teste de verificação`);
    console.log(`\n🔄 Para parar o servidor: Ctrl+C`);
    console.log(`🎯 Para ver mudanças em tempo real: Atualize a página no navegador`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    server.close(() => {
        console.log('✅ Servidor parado com sucesso!');
        process.exit(0);
    });
});


