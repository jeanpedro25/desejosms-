const http = require('http');
const fs = require('fs');
const path = require('path');

const url = require('url');

const PORT = process.env.PORT || 3025;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`🌐 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    // Remover parâmetros da query string (ex: ?id=10)
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname || '/';
    
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const filePath = '.' + pathname;

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`❌ Arquivo não encontrado: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Arquivo não encontrado</h1>');
            } else {
                console.log(`❌ Erro interno: ${error.code}`);
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Erro interno do servidor</h1>');
            }
        } else {
            console.log(`✅ Arquivo servido: ${filePath}`);
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🚀 SERVIDOR RODANDO COM SUCESSO!');
    console.log(`📁 Diretório: ${__dirname}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('');
    console.log('🔗 LINKS ÚTEIS:');
    console.log(`   • Página Principal: http://localhost:${PORT}`);
    console.log(`   • Index.html: http://localhost:${PORT}/index.html`);
    console.log(`   • Painel Anunciante: http://localhost:${PORT}/painel-anunciante.html`);
    console.log(`   • Verificações: http://localhost:${PORT}/verificacoes.html`);
    console.log(`   • Admin Panel: http://localhost:${PORT}/admin-panel.html`);
    console.log('');
    console.log('💡 Para parar o servidor: Ctrl+C');
    console.log('='.repeat(50));
});

