const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
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
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Resolver caminho SEM querystring e com fallback para .html
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname || '/';
    if (pathname === '/') {
        pathname = '/index.html';
    }
    // Se veio sem extensão, assumir .html
    if (!path.extname(pathname)) {
        pathname = pathname + '.html';
    }

    // Normalizar e evitar path traversal
    const filePath = '.' + path.normalize(pathname).replace(/^([.][.][/\\])+/, '');

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 - Arquivo não encontrado');
            } else {
                res.writeHead(500);
                res.end('500 - Erro interno do servidor');
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📁 Diretório: ${__dirname}`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`\n🔗 Links úteis:`);
    console.log(`   • Página Principal: http://localhost:${PORT}/index.html`);
    console.log(`   • Painel Anunciante: http://localhost:${PORT}/painel-anunciante.html`);
    console.log(`   • Verificações: http://localhost:${PORT}/verificacoes.html`);
    console.log(`   • Admin Panel: http://localhost:${PORT}/admin-panel.html`);
    console.log(`\n💡 Para parar o servidor: Ctrl+C`);
});


