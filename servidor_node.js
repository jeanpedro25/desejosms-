const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');

const PORT = 8080;
const DIRETORIO = path.resolve('./Ambiente_Trabalho');
const DATA_DIR = path.join(DIRETORIO, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Garantir estrutura de dados
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return `${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split('$');
  const check = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return check === hash;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Mapeamento de extensões de arquivo para tipos MIME
const TIPOS_MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const servidor = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // API simples de autenticação
  if (req.url === '/api/register' && req.method === 'POST') {
    const body = await parseBody(req);
    const { name, email, password } = body;
    if (!name || !email || !password) {
      return sendJson(res, 400, { success: false, error: 'Dados inválidos.' });
    }
    const users = readUsers();
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return sendJson(res, 409, { success: false, error: 'E-mail já cadastrado.' });
    }
    const id = Date.now().toString();
    const passwordHash = hashPassword(password);
    const user = { id, name, email, passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    writeUsers(users);
    const token = crypto.randomBytes(16).toString('hex');
    return sendJson(res, 201, { success: true, data: { id, name, email, token } });
  }

  if (req.url === '/api/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const { email, password } = body;
    if (!email || !password) {
      return sendJson(res, 400, { success: false, error: 'Dados inválidos.' });
    }
    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return sendJson(res, 401, { success: false, error: 'E-mail ou senha incorretos.' });
    }
    const token = crypto.randomBytes(16).toString('hex');
    return sendJson(res, 200, { success: true, data: { id: user.id, name: user.name, email: user.email, token } });
  }
  
  // Normalizar URL e criar caminho absoluto para o arquivo solicitado
  let filePath = path.join(DIRETORIO, req.url === '/' ? 'index.html' : req.url);
  
  // Verificar se o arquivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Arquivo não encontrado
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>404 - Arquivo não encontrado</h1>');
      return;
    }
    
    // Verificar se é um diretório
    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>500 - Erro interno do servidor</h1>');
        return;
      }
      
      if (stats.isDirectory()) {
        // Se for um diretório, tentar servir index.html desse diretório
        filePath = path.join(filePath, 'index.html');
      }
      
      // Ler e enviar o arquivo
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/html');
          res.end('<h1>500 - Erro interno do servidor</h1>');
          return;
        }
        
        // Definir o tipo de conteúdo com base na extensão do arquivo
        const extensao = path.extname(filePath);
        const tipoConteudo = TIPOS_MIME[extensao] || 'application/octet-stream';
        
        res.statusCode = 200;
        res.setHeader('Content-Type', tipoConteudo);
        res.end(data);
      });
    });
  });
});

servidor.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(` Servidor iniciado em: http://localhost:${PORT}`);
  console.log(` Servindo arquivos de: ${DIRETORIO}`);
  console.log('='.repeat(60) + '\n');
  
  // Abrir o navegador automaticamente
  const url = `http://localhost:${PORT}`;
  const start = process.platform === 'darwin' ? 'open' :
               process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${start} ${url}`);
});

console.log('Pressione Ctrl+C para encerrar o servidor.');
