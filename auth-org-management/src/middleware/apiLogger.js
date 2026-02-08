const { v4: uuidv4 } = require('uuid');
const ApiLog = require('../models/ApiLog');

// Sensitive fields to exclude from logging
const SENSITIVE_FIELDS = ['password', 'token', 'refreshToken', 'otp', 'secret', 'authorization'];

// Endpoints to exclude from logging
const EXCLUDED_ENDPOINTS = ['/health', '/api-docs', '/favicon.ico'];

// Sanitize request body by removing sensitive fields
const sanitizeBody = (body) => {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };

    for (const field of SENSITIVE_FIELDS) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
};

// Get client IP address
const getClientIp = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown';
};

// API Logger Middleware
const apiLogger = (options = {}) => {
    const {
        logResponseBody = false,
        excludeEndpoints = EXCLUDED_ENDPOINTS,
        maxBodyLength = 10000
    } = options;

    return async (req, res, next) => {
        // Skip excluded endpoints
        if (excludeEndpoints.some(ep => req.path.startsWith(ep))) {
            return next();
        }

        const requestId = uuidv4();
        const startTime = Date.now();

        // Attach request ID to request for correlation
        req.requestId = requestId;

        // Capture original response methods
        const originalSend = res.send;
        const originalJson = res.json;
        let responseBody = null;

        // Intercept res.send
        res.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };

        // Intercept res.json
        res.json = function (body) {
            responseBody = body;
            return originalJson.call(this, body);
        };

        // Log when response finishes
        res.on('finish', async () => {
            const responseTime = Date.now() - startTime;

            try {
                // Prepare log data
                const logData = {
                    requestId,
                    method: req.method,
                    endpoint: req.originalUrl || req.url,
                    statusCode: res.statusCode,
                    responseTime,
                    userId: req.user?.UserId || null,
                    userEmail: req.user?.Email || null,
                    ipAddress: getClientIp(req),
                    userAgent: req.headers['user-agent']?.substring(0, 500) || null,
                    requestBody: Object.keys(req.body || {}).length > 0
                        ? sanitizeBody(req.body)
                        : null,
                    responseBody: null,
                    errorMessage: res.statusCode >= 400 && responseBody
                        ? (typeof responseBody === 'string'
                            ? responseBody.substring(0, 1000)
                            : JSON.stringify(responseBody)?.substring(0, 1000))
                        : null
                };

                // Optionally log response body
                if (logResponseBody && responseBody) {
                    const bodyStr = typeof responseBody === 'string'
                        ? responseBody
                        : JSON.stringify(responseBody);
                    logData.responseBody = bodyStr.length > maxBodyLength
                        ? { truncated: true, length: bodyStr.length }
                        : (typeof responseBody === 'string' ? responseBody : responseBody);
                }

                // Save log asynchronously (don't block response)
                await ApiLog.create(logData);
            } catch (error) {
                // Don't let logging errors affect the response
                console.error('API logging error:', error.message);
            }
        });

        next();
    };
};

module.exports = apiLogger;
