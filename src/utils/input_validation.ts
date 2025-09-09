import { prisma } from "../utils/db.sever";
import { AuthenticatedRequest, DepositRequest, PlanPurchaseRequest } from "../utils/interface";
import express, { Request, Response, NextFunction } from 'express';

// Input validation helper functions
export const validateUserId = (userId: any): void => {
    const numUserId = Number(userId);

    if (!userId || isNaN(numUserId) || numUserId <= 0 || !Number.isInteger(numUserId)) {
        throw new Error("Invalid user ID provided");
    }
};

export const validateAmount = (amount: number): void => {
    if (!amount || amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }
    if (amount > 1000000) { // Set reasonable upper limit
        throw new Error("Amount exceeds maximum allowed limit");
    }
};

export const validateTransactionId = (transactionId: string): void => {
    if (!transactionId || transactionId.trim().length === 0) {
        throw new Error("Transaction ID is required");
    }
    if (transactionId.length > 100) {
        throw new Error("Transaction ID is too long");
    }
};

// Helper functions to check for admin permissions
export async function checkAdminPermissions(userId: number): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true // Assuming you have a role field
            }
        });

        return user?.role === 'ADMIN'
    } catch (error) {
        console.error('Error checking admin permissions:', error);
        return false;
    }
}


export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.Role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Admin privileges required'
        });
    }
    next();
};

// Input validation middleware
export const validateDepositInput = (req: Request<{}, {}, DepositRequest>, res: Response, next: NextFunction) => {
    const { amount, transactionId } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid amount is required (must be greater than 0)'
        });
    }

    if (amount > 1000000) {
        return res.status(400).json({
            success: false,
            message: 'Amount exceeds maximum allowed limit ($1,000,000)'
        });
    }

    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid transaction ID is required'
        });
    }

    if (transactionId.length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Transaction ID is too long (max 100 characters)'
        });
    }

    next();
};

export const validatePlanPurchaseInput = (req: Request<{}, {}, PlanPurchaseRequest>, res: Response, next: NextFunction) => {
    const { planName, customAmount } = req.body;

    if (!planName || typeof planName !== 'string' || planName.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid plan name is required'
        });
    }

    if (customAmount !== undefined) {
        if (typeof customAmount !== 'number' || customAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Custom amount must be a valid positive number'
            });
        }

        if (customAmount > 1000000) {
            return res.status(400).json({
                success: false,
                message: 'Custom amount exceeds maximum allowed limit ($1,000,000)'
            });
        }
    }

    next();
};