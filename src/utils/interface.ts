import { Request } from "express"

// Types for request bodies and authentication
//user interface
export interface AuthenticatedRequest extends Request {
    userId?: number;
    Role?: string;
}

//deposit interface
export interface DepositRequest {
    amount: number;
    transactionId: string;
}


//plan purchase interface
export interface PlanPurchaseRequest {
    planName: string;
    customAmount?: number;
}

//admin interface
export interface AdminVerifyRequest {
    transactionId: string;
    shouldConfirm?: boolean;
}