const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// ============================================================
// MIME TYPES PERMITIDOS (whitelist)
// ============================================================
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.pdf': 'application/pdf'
};

// ============================================================
// RATE LIMITING SIMPLES (In-memory, por IP)
// ============================================================
const rateLimitStore = new Map();
const RATE_LIMIT_MAX = 100;       // máximo de requisições
const RATE_LIMIT_WINDOW = 60000;  // por janela de 60 segundos

function getRateLimitKey(ip) {
    return ip;
}

function checkRateLimit(ip) {
    const key = getRateLimitKey(ip);
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || (now - record.windowStart) > RATE_LIMIT_WINDOW) {
        rateLimitStore.set(key, { count: 1, windowStart: now });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }

    record.count++;
    return true;
}

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if ((now - record.windowStart) > RATE_LIMIT_WINDOW) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// ============================================================
// HEADERS DE SEGURANÇA
// ============================================================
function setSecurityHeaders(res, mimeType) {
    // Evitar MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Evitar clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // XSS protection (legado, mas útil p/ IE)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Não enviar Referrer para sites externos
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Remover assinatura do servidor
    res.removeHeader('Server');

    // Content Security Policy (apenas para HTML)
    if (mimeType && mimeType.startsWith('text/html')) {
        res.setHeader('Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
            "img-src 'self' data: https://images.unsplash.com https://*.supabase.co blob:; " +
            "connect-src 'self' https://*.supabase.co https://api.mercadopago.com; " +
            "frame-ancestors 'none';"
        );
    }
}

// ============================================================
// PATH TRAVERSAL PROTECTION
// ============================================================
function safePath(reqUrl) {
    const parsedUrl = url.parse(reqUrl);
    let pathname = parsedUrl.pathname || '/';

    // Fallback para index
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Extensão ausente → assume .html
    if (!path.extname(pathname)) {
        pathname = pathname + '.html';
    }

    // Normalizar e bloquear path traversal (..)
    const normalized = path.normalize(pathname);

    // Garantir que o path não saia do diretório corrente
    const resolved = path.resolve(__dirname, '.' + normalized);
    if (!resolved.startsWith(__dirname)) {
        return null; // Path traversal detectado!
    }

    // Verificar extensão contra whitelist
    const ext = path.extname(resolved).toLowerCase();
    if (!mimeTypes[ext]) {
        return null; // Extensão não permitida
    }

    return { filePath: '.' + normalized, ext };
}

// ============================================================
// SERVIDOR
// ============================================================
const server = http.createServer((req, res) => {
    const ip = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

    // Rate Limiting
    if (!checkRateLimit(ip)) {
        res.writeHead(429, { 'Retry-After': '60', 'Content-Type': 'text/plain' });
        res.end('429 - Muitas requisições. Aguarde 1 minuto.');
        return;
    }

    // Apenas GET/HEAD permitidos para servidor de arquivos estáticos
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('405 - Method Not Allowed');
        return;
    }

    // Log simplificado (sem URL completa para evitar log de dados sensíveis)
    const logPath = url.parse(req.url).pathname;
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${logPath}`);
    }

    // Resolver caminho seguro
    const safe = safePath(req.url);
    if (!safe) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 - Acesso negado');
        return;
    }

    const { filePath, ext } = safe;
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Definir headers de segurança antes de servir
    setSecurityHeaders(res, mimeType);

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Página não encontrada</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>500 - Erro interno do servidor</h1>');
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('🚀 DesejosMS - Servidor iniciado!');
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📁 Dir: ${__dirname}`);
    console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`);
    console.log('');
    console.log('🔗 Acesso rápido:');
    console.log(`   • Início:      http://localhost:${PORT}/index.html`);
    console.log(`   • Anunciante:  http://localhost:${PORT}/painel-anunciante.html`);
    console.log(`   • Admin:       http://localhost:${PORT}/admin-panel.html`);
    console.log(`   • Verificações: http://localhost:${PORT}/verificacoes.html`);
    console.log('');
    console.log('🛡️  Rate limiting: 100 req/min por IP');
    console.log('🛡️  Headers de segurança ativos (CSP, X-Frame-Options, etc)');
    console.log('');
    console.log('💡 Para parar: Ctrl+C');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} já está em uso. Mude a variável PORT.`);
    } else {
        console.error('❌ Erro no servidor:', err.message);
    }
    process.exit(1);
});
