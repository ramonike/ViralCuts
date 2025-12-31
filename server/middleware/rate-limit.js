/**
 * Rate Limiting Middleware
 * Implementa rate limiting em memória com sliding window
 * Para produção, considere usar Redis para rate limiting distribuído
 */

// Store para rate limiting em memória
const rateLimitStore = new Map();

// Configurações padrão
const DEFAULT_CONFIG = {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 requests por minuto
    message: 'Too many requests, please try again later.',
    statusCode: 429,
    keyGenerator: (c) => {
        // Usar IP do cliente como chave
        return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
               c.req.header('x-real-ip') ||
               'unknown';
    },
};

// Configurações específicas por rota
const ROUTE_CONFIGS = {
    // Auth routes - mais restritivo para prevenir brute force
    '/api/auth/sign-in': {
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 5, // 5 tentativas
        message: 'Too many login attempts. Please try again in 15 minutes.',
    },
    '/api/auth/sign-up': {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 3, // 3 cadastros por hora
        message: 'Too many registration attempts. Please try again later.',
    },
    '/api/auth/forgot-password': {
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 3, // 3 tentativas por hora
        message: 'Too many password reset requests. Please try again later.',
    },
    // YouTube API - cuidado com quota
    '/api/youtube': {
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 30, // 30 requests por minuto
        message: 'Too many YouTube API requests. Please slow down.',
    },
    // Upload routes
    '/api/uploads': {
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 10, // 10 uploads por minuto
        message: 'Too many upload requests. Please wait.',
    },
};

/**
 * Limpar entradas expiradas periodicamente
 */
function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.windowStart > data.windowMs * 2) {
            rateLimitStore.delete(key);
        }
    }
}

// Limpar a cada 5 minutos
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Obter configuração para uma rota específica
 */
function getConfigForRoute(path) {
    // Verificar configurações específicas
    for (const [route, config] of Object.entries(ROUTE_CONFIGS)) {
        if (path.startsWith(route)) {
            return { ...DEFAULT_CONFIG, ...config };
        }
    }
    return DEFAULT_CONFIG;
}

/**
 * Middleware de Rate Limiting
 */
export function rateLimiter(customConfig = {}) {
    return async (c, next) => {
        const path = c.req.path;
        const config = { ...getConfigForRoute(path), ...customConfig };
        
        const key = config.keyGenerator(c);
        const now = Date.now();
        const storeKey = `${key}:${path}`;
        
        let data = rateLimitStore.get(storeKey);
        
        // Inicializar ou resetar janela
        if (!data || now - data.windowStart > config.windowMs) {
            data = {
                count: 0,
                windowStart: now,
                windowMs: config.windowMs,
            };
        }
        
        data.count++;
        rateLimitStore.set(storeKey, data);
        
        // Calcular headers
        const remaining = Math.max(0, config.maxRequests - data.count);
        const resetTime = Math.ceil((data.windowStart + config.windowMs - now) / 1000);
        
        // Adicionar headers de rate limit
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', remaining.toString());
        c.header('X-RateLimit-Reset', resetTime.toString());
        
        // Verificar se excedeu o limite
        if (data.count > config.maxRequests) {
            c.header('Retry-After', resetTime.toString());
            
            return c.json({
                error: 'Rate limit exceeded',
                message: config.message,
                retryAfter: resetTime,
            }, config.statusCode);
        }
        
        await next();
    };
}

/**
 * Rate limiter específico para autenticação
 * Mais restritivo e com tracking por IP + email
 * NOTA: Não lê o body para evitar conflito com Better Auth
 */
export function authRateLimiter() {
    return async (c, next) => {
        const path = c.req.path;
        const ip = DEFAULT_CONFIG.keyGenerator(c);
        
        // Usar apenas IP como chave para evitar ler o body
        // Better Auth precisa ler o body, então não podemos lê-lo aqui
        const key = ip;
        
        const config = getConfigForRoute(path);
        const now = Date.now();
        const storeKey = `auth:${key}:${path}`;
        
        let data = rateLimitStore.get(storeKey);
        
        if (!data || now - data.windowStart > config.windowMs) {
            data = {
                count: 0,
                windowStart: now,
                windowMs: config.windowMs,
            };
        }
        
        data.count++;
        rateLimitStore.set(storeKey, data);
        
        const remaining = Math.max(0, config.maxRequests - data.count);
        const resetTime = Math.ceil((data.windowStart + config.windowMs - now) / 1000);
        
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', remaining.toString());
        c.header('X-RateLimit-Reset', resetTime.toString());
        
        if (data.count > config.maxRequests) {
            c.header('Retry-After', resetTime.toString());
            
            // Log tentativa suspeita
            console.warn(`[Rate Limit] Auth rate limit exceeded for ${key} on ${path}`);
            
            return c.json({
                error: 'Too many attempts',
                message: config.message,
                retryAfter: resetTime,
            }, 429);
        }
        
        await next();
    };
}

/**
 * Reset rate limit para um usuário específico (útil após login bem-sucedido)
 */
export function resetRateLimit(key, path) {
    const storeKey = `auth:${key}:${path}`;
    rateLimitStore.delete(storeKey);
}

export default rateLimiter;
