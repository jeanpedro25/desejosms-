/**
 * ============================================================
 * DESEJOSMS - SECURITY.JS
 * Biblioteca Central de Segurança
 * ============================================================
 * Inclui:
 *   - Sanitização XSS (escapamento de HTML)
 *   - Hash de senhas (SHA-256 via SubtleCrypto)
 *   - Rate Limiting (proteção brute-force)
 *   - Validação de entrada
 *   - Content Security
 * ============================================================
 */

(function (window) {
    'use strict';

    // ============================================================
    // 1. SANITIZAÇÃO XSS
    // Escapa caracteres HTML especiais para evitar injeção de código
    // ============================================================
    function sanitizeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/`/g, '&#x60;')
            .replace(/=/g, '&#x3D;');
    }

    // Sanitizar atributo HTML (mais restrito que sanitizeHTML)
    function sanitizeAttr(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[^a-zA-Z0-9\-_.,:;@\s]/g, '');
    }

    // Sanitizar número de telefone
    function sanitizePhone(phone) {
        if (!phone) return '';
        return String(phone).replace(/[^\d\s()\-+]/g, '').substring(0, 20);
    }

    // Sanitizar Email (só permite formato email válido)
    function sanitizeEmail(email) {
        if (!email) return '';
        const e = String(email).toLowerCase().trim();
        // Remove chars inválidos - mantém apenas o que um email pode ter
        const cleaned = e.replace(/[^a-z0-9@._\-+]/g, '');
        return cleaned.substring(0, 254);
    }

    // Sanitizar URL (permite apenas http/https e URLs relativas)
    function sanitizeURL(url) {
        if (!url) return '';
        const s = String(url).trim();
        // Permite data: para imagens base64, https:, http:, e paths relativos
        if (s.startsWith('data:image/') || s.startsWith('https://') || s.startsWith('http://') || s.startsWith('/') || s.startsWith('./')) {
            return s;
        }
        return '';
    }

    // ============================================================
    // 2. HASH DE SENHA (SHA-256 via Web Crypto API)
    // ============================================================
    async function hashPassword(password) {
        if (!password) return '';
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Comparar password com hash (assíncrono)
    async function verifyPassword(password, hash) {
        if (!password || !hash) return false;
        const newHash = await hashPassword(password);
        return newHash === hash;
    }

    // ============================================================
    // 3. RATE LIMITING (Proteção Brute-Force / Flood)
    // Armazenado em sessionStorage para persistir por sessão
    // ============================================================
    const RATE_LIMITS = {
        login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },       // 5 tentativas a cada 15min
        signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },       // 3 por hora
        verification: { maxAttempts: 3, windowMs: 30 * 60 * 1000 }, // 3 por 30min
        general: { maxAttempts: 20, windowMs: 60 * 1000 }           // 20 por minuto
    };

    function getRateLimitKey(action) {
        return `rl_${action}`;
    }

    function checkRateLimit(action) {
        const config = RATE_LIMITS[action] || RATE_LIMITS.general;
        const key = getRateLimitKey(action);
        const now = Date.now();

        let record;
        try {
            record = JSON.parse(sessionStorage.getItem(key) || 'null');
        } catch (e) {
            record = null;
        }

        if (!record || (now - record.windowStart) > config.windowMs) {
            // Nova janela de tempo
            record = { count: 0, windowStart: now };
        }

        if (record.count >= config.maxAttempts) {
            const remaining = Math.ceil((config.windowMs - (now - record.windowStart)) / 1000 / 60);
            return {
                allowed: false,
                remainingMinutes: remaining,
                message: `Muitas tentativas. Tente novamente em ${remaining} minuto(s).`
            };
        }

        // Incrementar contador
        record.count++;
        sessionStorage.setItem(key, JSON.stringify(record));
        return { allowed: true };
    }

    function resetRateLimit(action) {
        sessionStorage.removeItem(getRateLimitKey(action));
    }

    // ============================================================
    // 4. VALIDAÇÃO DE DADOS DE ENTRADA
    // ============================================================
    function validateEmail(email) {
        if (!email) return false;
        const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase()) && email.length <= 254;
    }

    function validatePassword(password) {
        if (!password) return { valid: false, message: 'Senha obrigatória.' };
        if (password.length < 6) return { valid: false, message: 'Senha deve ter pelo menos 6 caracteres.' };
        if (password.length > 128) return { valid: false, message: 'Senha muito longa.' };
        return { valid: true };
    }

    function validateAge(age) {
        const n = parseInt(age, 10);
        return !isNaN(n) && n >= 18 && n <= 80;
    }

    function validatePhone(phone) {
        if (!phone) return false;
        const digits = phone.replace(/\D/g, '');
        // Aceitar números com 8 a 13 dígitos (fixo, celular, WhatsApp)
        return digits.length >= 8 && digits.length <= 13;
    }

    function validateName(name) {
        if (!name) return false;
        const clean = String(name).trim();
        return clean.length >= 2 && clean.length <= 100 && !/[<>'"&]/.test(clean);
    }

    // Validar URL de imagem (apenas base64 ou HTTPS)
    function validateImageURL(url) {
        if (!url) return false;
        return url.startsWith('data:image/') || url.startsWith('https://');
    }

    // ============================================================
    // 5. DETECÇÃO DE INJEÇÃO SQL / SCRIPT
    // ============================================================
    const DANGEROUS_PATTERNS = [
        /<script/i, /javascript:/i, /on\w+\s*=/i,
        /eval\s*\(/i, /document\.cookie/i,
        /window\.location/i, /<iframe/i, /<object/i,
        /DROP\s+TABLE/i, /SELECT\s+\*/i, /INSERT\s+INTO/i,
        /--\s*$/m, /;\s*DROP/i, /UNION\s+SELECT/i,
        /\x00/, /\x1a/
    ];

    function containsMaliciousContent(str) {
        if (!str) return false;
        return DANGEROUS_PATTERNS.some(p => p.test(str));
    }

    function validateUserInput(value, fieldName) {
        if (containsMaliciousContent(value)) {
            console.warn(`[SECURITY] Conteúdo suspeito detectado no campo: ${fieldName}`);
            return {
                valid: false,
                message: `O campo "${fieldName}" contém caracteres não permitidos.`
            };
        }
        return { valid: true };
    }

    // ============================================================
    // 6. SESSÃO DO ADMIN - Verificação segura
    // ============================================================
    function isAdminLoggedIn() {
        try {
            const admin = JSON.parse(localStorage.getItem('adminSession') || 'null');
            if (!admin) return false;
            // Sessão expira após 4 horas
            const SESSION_DURATION = 4 * 60 * 60 * 1000;
            if (!admin.loginTime || (Date.now() - new Date(admin.loginTime).getTime()) > SESSION_DURATION) {
                localStorage.removeItem('adminSession');
                return false;
            }
            return admin.role === 'admin' && admin.authenticated === true;
        } catch (e) {
            return false;
        }
    }

    function requireAdmin() {
        if (!isAdminLoggedIn()) {
            localStorage.removeItem('adminSession');
            window.location.href = 'admin-login.html';
            return false;
        }
        return true;
    }

    // Criar sessão de admin (chamado após autenticação bem-sucedida)
    function createAdminSession(email) {
        const session = {
            email: sanitizeEmail(email),
            role: 'admin',
            authenticated: true,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('adminSession', JSON.stringify(session));
    }

    // Destruir sessão de admin (chamado no logout)
    function clearAdminSession() {
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('_adminSession');
    }

    // ============================================================
    // 7. PROTEÇÃO CSRF (Token simples para formulários)
    // ============================================================
    function generateCSRFToken() {
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        const token = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
        sessionStorage.setItem('csrfToken', token);
        return token;
    }

    function validateCSRFToken(token) {
        const stored = sessionStorage.getItem('csrfToken');
        return stored && stored === token;
    }

    // ============================================================
    // 8. LOGGING SEGURO (não exibe dados sensíveis em produção)
    // ============================================================
    const isProduction = window.location.hostname !== 'localhost' &&
        !window.location.hostname.includes('127.0.0.1') &&
        window.location.protocol !== 'file:';

    const secureLog = {
        log: function (...args) { if (!isProduction) console.log(...args); },
        warn: function (...args) { console.warn(...args); },
        error: function (...args) { console.error(...args); }
    };

    // ============================================================
    // EXPORTAR GLOBALMENTE
    // ============================================================
    window.Security = {
        sanitizeHTML,
        sanitizeAttr,
        sanitizePhone,
        sanitizeEmail,
        sanitizeURL,
        hashPassword,
        verifyPassword,
        checkRateLimit,
        resetRateLimit,
        validateEmail,
        validatePassword,
        validateAge,
        validatePhone,
        validateName,
        validateImageURL,
        containsMaliciousContent,
        validateUserInput,
        isAdminLoggedIn,
        requireAdmin,
        createAdminSession,
        clearAdminSession,
        generateCSRFToken,
        validateCSRFToken,
        isProduction,
        log: secureLog
    };

    // Atalhos globais para conveniência
    window.sanitizeHTML = sanitizeHTML;
    window.sanitizePhone = sanitizePhone;

    console.log('🔐 [Security] Módulo de segurança carregado.');

})(window);
