export interface PrismaUniqueConstraintErrorMeta {
    target: string[];
}

export interface PlanPurchaseResult {
    success: boolean;
    message: string;
    plan?: {
        id: number;
        planName: string;
        amount: number;
        transactionId: string;
        duration: number;
        returnRate: number;
        expectedReturn: number;
    };
    remainingBalance?: number;
}

// Type definition for the return result
export interface PlanUpdateResult {
    success: boolean;
    message: string;
    updatedPlan?: {
        id: number;
        planName: string;
        previousAmount: number;
        newAmount: number;
        amountDifference: number;
        transactionId: string | null;
        duration: number;
        returnRate: number;
        newExpectedReturn: number;
        updatedAt: Date;
    };
    userBalance?: number;
    userName?: string;
    currentAmount?: number;
    requestedAmount?: number;
}


export interface Deposit {
    id: number;
    amount: number;
    transactionId: string;
    plan: string
};


export type DepositMade = {
    transactionId: string;
    amount: number;
    createdAt: Date;
    userId: number;
    plan: string
    isVerified?: boolean;
};