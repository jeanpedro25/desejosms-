const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    console.log(`Requisição recebida: ${req.method} ${req.url}`);
    
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(`Erro ao ler arquivo: ${filePath}`);
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end('<h1>Arquivo não encontrado</h1>');
        } else {
            console.log(`Arquivo servido: ${filePath}`);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        }
    });
});

server.listen(3000, '127.0.0.1', () => {
    console.log('🚀 Servidor rodando em http://localhost:3000');
    console.log('📁 Diretório atual:', __dirname);
});


