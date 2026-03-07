const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configurações
const PORTA = 3000; // Mudando para a porta 3000
const DIRETORIO = path.resolve('./Ambiente_Trabalho');

// Tipos MIME básicos
const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif'
};

// Criar servidor HTTP
const servidor = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  
  // Tratar a URL raiz
  let caminhoArquivo = req.url === '/' ? '/index.html' : req.url;
  caminhoArquivo = path.join(DIRETORIO, caminhoArquivo);
  
  // Determinar o tipo de conteúdo
  const extensao = path.extname(caminhoArquivo).toLowerCase();
  const tipoConteudo = TIPOS_MIME[extensao] || 'application/octet-stream';
  
  // Ler e enviar o arquivo
  fs.readFile(caminhoArquivo, (erro, conteudo) => {
    if (erro) {
      if (erro.code === 'ENOENT') {
        // Arquivo não encontrado
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <head>
              <title>404 - Arquivo não encontrado</title>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #d9534f; }
              </style>
            </head>
            <body>
              <h1>404 - Arquivo não encontrado</h1>
              <p>O arquivo solicitado "${req.url}" não existe no servidor.</p>
              <a href="/">Voltar para a página inicial</a>
            </body>
          </html>
        `);
      } else {
        // Outros erros do servidor
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <head>
              <title>500 - Erro interno</title>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #d9534f; }
              </style>
            </head>
            <body>
              <h1>500 - Erro interno do servidor</h1>
              <p>Ocorreu um erro ao processar sua solicitação.</p>
            </body>
          </html>
        `);
      }
    } else {
      // Sucesso - enviar o arquivo
      res.writeHead(200, { 'Content-Type': tipoConteudo });
      res.end(conteudo);
    }
  });
});

// Iniciar o servidor
servidor.listen(PORTA, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(` Servidor rodando em: http://localhost:${PORTA}`);
  console.log(` Servindo arquivos de: ${DIRETORIO}`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Abrir o navegador automaticamente
  const url = `http://localhost:${PORTA}`;
  const start = process.platform === 'darwin' ? 'open' :
               process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${start} ${url}`);
  
  console.log('Pressione Ctrl+C para encerrar o servidor.\n');
});

