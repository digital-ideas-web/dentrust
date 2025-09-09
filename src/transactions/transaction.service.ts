// Import the plan configuration helpers
import { prisma } from "../utils/db.sever";
import {
    validateUserId,
    validateAmount,
    validateTransactionId,
    checkAdminPermissions
} from "../utils/input_validation";
import {
    DepositResult,
    WalletBalance,
    AdminVerificationResult,
    WalletResult
} from "./transaction.interface"

/**
 * Creates a new deposit transaction for a user
 * The deposit starts with status = false (pending admin confirmation)
 * 
 * @param userId - The ID of the user making the deposit
 * @param amount - The amount being deposited (must be > 0)
 * @param transactionId - Unique transaction reference from payment provider
 * @returns Promise<DepositResult>
 */
export const createDeposit = async ({
    userId,
    amount,
    transactionId
}: {
    userId: number;
    amount: number;
    transactionId: string;
}): Promise<DepositResult> => {
    try {
        // Input validation
        validateUserId(userId);
        validateAmount(amount);
        validateTransactionId(transactionId);

        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });

        if (!userExists) {
            throw new Error("User not found");
        }

        // Check for duplicate transaction ID
        const existingTransaction = await prisma.transactions.findUnique({
            where: { transactionId }
        });

        if (existingTransaction) {
            throw new Error("Transaction ID already exists");
        }

        // Create the deposit transaction with status = false (pending)
        const transaction = await prisma.transactions.create({
            data: {
                userId,
                amount: amount,
                transactionId,
                status: false // Always starts as pending admin confirmation
            }
        });

        return {
            success: true,
            message: `Deposit of $${amount} successful. Awaiting admin confirmation.`,
            transaction: {
                id: transaction.id,
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                status: transaction.status,
                createdAt: transaction.createdAt
            }
        };

    } catch (error) {
        console.error('Error creating deposit:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to create deposit"
        };
    }
};


/**
 * Get user's wallet balance from confirmed deposits
 * This calculates available balance for plan purchases
 * 
 * @param userId - The user ID to check balance for
 * @returns Promise<WalletBalance>
 */
export const getUserWalletBalance = async (userId: number): Promise<WalletBalance> => {
    try {
        validateUserId(userId);

        // Get all user transactions
        const transactions = await prisma.transactions.findMany({
            where: { userId },
            select: {
                amount: true,
                status: true
            }
        });

        // Get all user plan purchases to subtract from balance
        const planPurchases = await prisma.deposit.findMany({
            where: { userId },
            select: {
                amount: true
            }
        });

        // Calculate balances - FIXED: Using correct property names and initial values
        const totalDeposited = transactions.reduce((sum: number, t: { amount: number; status: boolean }) => sum + t.amount, 0);

        const confirmedBalance = transactions
            .filter((t: { status: boolean }) => t.status === true)
            .reduce((sum: number, t: { amount: number; status: boolean }) => sum + t.amount, 0);

        const pendingBalance = transactions
            .filter((t: { status: boolean }) => t.status === false)
            .reduce((sum: number, t: { amount: number; status: boolean }) => sum + t.amount, 0);

        // Calculate spent amount on plans
        const totalSpentOnPlans = planPurchases.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

        // Available balance = confirmed deposits - spent on plans
        const availableBalance = Math.max(0, confirmedBalance - totalSpentOnPlans);

        return {
            userId,
            totalDeposited,
            confirmedBalance,
            pendingBalance,
            availableBalance,
        };

    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        throw error;
    }
};


/**
 * Admin function to confirm or reject a deposit
 * When confirmed, the amount becomes available in user's wallet
 * 
 * @param transactionId - The transaction ID to verify
 * @param adminId - ID of the admin performing the action
 * @param shouldConfirm - true to confirm, false to reject
 * @returns Promise<AdminVerificationResult>
 */
export const verifyDepositByAdmin = async ({
    transactionId,
    adminId,
    shouldConfirm = true
}: {
    transactionId: string;
    adminId: number;
    shouldConfirm?: boolean;
}): Promise<AdminVerificationResult> => {
    try {
        validateTransactionId(transactionId);
        validateUserId(adminId);

        // Verify admin permissions
        const isAdmin = await checkAdminPermissions(adminId);
        if (!isAdmin) {
            throw new Error("Insufficient permissions. Admin access required.");
        }

        // Find the transaction
        const transaction = await prisma.transactions.findUnique({
            where: { transactionId },
            include: {
                user: {
                    select: { id: true, userName: true }
                }
            }
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        // Check if already in desired state
        if (transaction.status === shouldConfirm) {
            const statusText = shouldConfirm ? "confirmed" : "rejected";
            return {
                success: false,
                message: `Transaction is already ${statusText}`,
                transactionId,
                newStatus: transaction.status
            };
        }

        // Update the transaction status
        const updatedTransaction = await prisma.transactions.update({
            where: { transactionId },
            data: {
                status: shouldConfirm,
                updatedAt: new Date()
            }
        });


        const actionText = shouldConfirm ? "confirmed" : "rejected";

        return {
            success: true,
            message: `Transaction ${transactionId} has been ${actionText} successfully`,
            transactionId,
            newStatus: updatedTransaction.status,
            affectedUserId: transaction.userId
        };

    } catch (error) {
        console.error('Error verifying deposit:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to verify deposit",
            transactionId,
            newStatus: false
        };
    }
};


/**
 * Admin function to get pending deposits for verification
 * 
 * @param adminId - ID of the admin requesting the data
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 */
export const getPendingDeposits = async ({
    adminId,
    limit = 50,
    offset = 0
}: {
    adminId: number;
    limit?: number;
    offset?: number;
}) => {
    try {
        validateUserId(adminId);

        const isAdmin = await checkAdminPermissions(adminId);
        if (!isAdmin) {
            throw new Error("Insufficient permissions. Admin access required.");
        }

        const pendingTransactions = await prisma.transactions.findMany({
            where: { status: false },
            include: {
                user: {
                    select: {
                        id: true,
                        userName: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
            skip: offset
        });

        const totalPending = await prisma.transactions.count({
            where: { status: false }
        });

        return {
            success: true,
            transactions: pendingTransactions,
            totalCount: totalPending,
            hasMore: (offset + limit) < totalPending
        };

    } catch (error) {
        console.error('Error fetching pending deposits:', error);
        throw error;
    }
};

export const getUserTransactions = async (userId: number): Promise<WalletResult[] | null> => {
    try {
        validateUserId(userId);

        // Get all user transactions
        return prisma.transactions.findMany({
            where: {
                userId
            },
            select: {
                id: true,
                transactionId: true,
                amount: true,
                status: true,
                createdAt: true
            }

        });

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        throw error;
    }
};

