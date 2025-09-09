// Type definitions for better type safety
export interface DepositResult {
    success: boolean;
    message: string;
    transaction?: {
        id: number;
        transactionId: string;
        amount: number;
        status: boolean;
        createdAt: Date;
    };
}

export interface WalletBalance {
    userId: number;
    totalDeposited: number;
    confirmedBalance: number;
    pendingBalance: number;
    availableBalance: number; // Only confirmed deposits
}

export interface AdminVerificationResult {
    success: boolean;
    message: string;
    transactionId: string;
    newStatus: boolean;
    affectedUserId?: number;
}


export interface WalletResult {
    id: number;
    transactionId: string;
    amount: number;
    status: boolean;
    createdAt: Date;
}