// routes/installment.router.ts
import express from 'express';
import {
    createDeposit,
    verifyDepositByAdmin,
    getUserWalletBalance,
    getPendingDeposits,
    getUserTransactions

} from './transaction.service';
import { verifyToken, authorization } from '../utils/auth';
import { depositRateLimit, adminRateLimit } from "../utils/rate_limiting";
import { AuthenticatedRequest, DepositRequest } from "../utils/interface";
import { validateDepositInput, requireAdmin } from '../utils/input_validation';
import { Response } from "express";


export const transactions = express.Router();

/**
 * POST /api/wallet/deposit
 * Create a new deposit (pending admin confirmation)
 */
transactions.post('/wallet/deposit',
    depositRateLimit,
    verifyToken,
    // authorization("USER"),
    validateDepositInput,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { amount, transactionId } = req.body as DepositRequest;

            // Add this debugging line
            console.log('Debug - req.userId:', req.user, 'type:', typeof req.user);

            // Type guard to narrow down the type
            if (typeof req.user !== 'number') {
                return res.status(403).json({ message: 'User ID not found in token' });
            }

            const result = await createDeposit({
                userId: req.user,
                amount,
                transactionId
            });

            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error creating deposit:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while creating deposit'
            });
        }
    }
);

/**
 * GET /api/wallet/balance
 * Get user's wallet balance and transaction history
 */
transactions.get('/wallet/balance',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Type guard to narrow down the type
            if (typeof req.user !== 'number') {
                return res.status(403).json({ message: 'User ID not found in token' });
            }

            const balance = await getUserWalletBalance(req.user);

            res.json({
                success: true,
                data: balance
            });
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch wallet balance'
            });
        }
    }
);


/**
 * GET /api/wallet/balance
 * Get user's wallet balance and transaction history
 */
transactions.get('/transaction/history',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Type guard to narrow down the type
            if (typeof req.user !== 'number') {
                return res.status(403).json({ message: 'User ID not found in token' });
            }

            const balance = await getUserTransactions(req.user);

            res.json({
                success: true,
                data: balance
            });
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transaction history'
            });
        }
    }
);


/**
 * POST /api/admin/deposits/verify
 * Verify (confirm/reject) a deposit
 */
transactions.post('/admin/deposits/verify',
    adminRateLimit,
    verifyToken,
    authorization("ADMIN"),
    // requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { transactionId, shouldConfirm = true } = req.body;

            if (!transactionId || typeof transactionId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Valid transaction ID is required'
                });
            }

            // Type guard to narrow down the type
            if (typeof req.user !== 'number') {
                return res.status(403).json({ message: 'User ID not found in token' });
            }

            const result = await verifyDepositByAdmin({
                transactionId,
                adminId: req.user,
                shouldConfirm
            });

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error verifying deposit:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while verifying deposit'
            });
        }
    }
);


/**
 * GET /api/admin/deposits/pending
 * Get all pending deposits for admin verification
 */
transactions.get('/admin/deposits/pending',
    adminRateLimit,
    verifyToken,
    authorization("ADMIN"),
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            // Type guard to narrow down the type
            if (typeof req.user !== 'number') {
                return res.status(403).json({ message: 'User ID not found in token' });
            }

            const result = await getPendingDeposits({
                adminId: req.user,
                limit,
                offset
            });

            res.json({
                ...result,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(result.totalCount / limit),
                    hasNext: result.hasMore,
                    hasPrevious: page > 1
                }
            });
        } catch (error) {
            console.error('Error fetching pending deposits:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending deposits'
            });
        }
    }
);
