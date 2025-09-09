import rateLimit from 'express-rate-limit';

// Rate limiting configurations
export const depositRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each user to 5 deposit requests per windowMs
    message: {
        success: false,
        message: 'Too many deposit attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const planPurchaseRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // Limit each user to 3 plan purchases per windowMs
    message: {
        success: false,
        message: 'Too many plan purchase attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const adminRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // Higher limit for admin operations
    message: {
        success: false,
        message: 'Too many admin requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
