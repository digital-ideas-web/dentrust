// Import the plan configuration helpers
import {
    getPlanConfig,
    validatePlanAmount,
    normalizePlanName,
} from "../utils/payment.helpers";
import { prisma } from "../utils/db.sever";
import { PlanConfigs } from "../utils/payment.constants";
import { checkAdminPermissions, validateUserId, } from "../utils/input_validation";
import { getUserWalletBalance } from "../transactions/transaction.service";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
    PrismaUniqueConstraintErrorMeta,
    PlanPurchaseResult,
    PlanUpdateResult,
    Deposit,
    DepositMade
} from "./payment.interface";


/**
 * Purchase a plan using available wallet balance
 * Checks if user has sufficient confirmed balance before purchase
 * 
 * @param userId - The user making the purchase
 * @param planName - Name of the plan to purchase
 * @param customAmount - Optional custom amount (must be within plan limits)
 * @returns Promise<PlanPurchaseResult>
 */
export const purchasePlan = async ({
    userId,
    planName,
    customAmount
}: {
    userId: number;
    planName: string;
    customAmount?: number;
}): Promise<PlanPurchaseResult> => {
    try {
        validateUserId(userId);

        // Normalize and validate plan name
        const { name: normalizePlanName, config } = getPlanConfig(planName);

        // Determine purchase amount
        let purchaseAmount: number;
        if (customAmount) {
            // Validate custom amount against plan limits
            validatePlanAmount(planName, customAmount);
            purchaseAmount = customAmount;
        } else {
            // Use minimum plan amount as default
            purchaseAmount = config.price.min;
        }

        // Check user's wallet balance
        const walletBalance = await getUserWalletBalance(userId);

        if (walletBalance.availableBalance < purchaseAmount) {
            return {
                success: false,
                message: `Insufficient balance. Available: $${walletBalance.availableBalance}, Required: $${purchaseAmount}`,
                remainingBalance: walletBalance.availableBalance
            };
        }

        // Check if user already has an active plan of this type
        const existingPlan = await prisma.deposit.findFirst({
            where: {
                userId,
                plan: normalizePlanName,
                isVerified: true // Only check verified plans
            }
        });

        if (existingPlan) {
            return {
                success: false,
                message: `You already have an active ${normalizePlanName} plan`,
                remainingBalance: walletBalance.availableBalance
            };
        }

        // Generate unique transaction ID for the plan purchase
        const planTransactionId = `txn{normalizePlanName}${Date.now()}`;

        // Create the plan purchase
        const newPlan = await prisma.deposit.create({
            data: {
                userId,
                amount: purchaseAmount,
                transactionId: planTransactionId,
                isVerified: true, // Auto-verify plan purchases (they're paid from confirmed balance)
                plan: normalizePlanName,
                isUpdated: false
            }
        });

        // Calculate expected return
        const expectedReturn = purchaseAmount + (purchaseAmount * config.returnRate);

        // Get updated wallet balance
        const updatedBalance = await getUserWalletBalance(userId);

        return {
            success: true,
            message: `Successfully purchased ${normalizePlanName} plan for $${purchaseAmount}`,
            plan: {
                id: newPlan.id,
                planName: normalizePlanName,
                amount: purchaseAmount,
                transactionId: planTransactionId,
                duration: config.durationInMs,
                returnRate: config.returnRate,
                expectedReturn
            },
            remainingBalance: updatedBalance.availableBalance
        };

    } catch (error: any) {
        console.error('Error purchasing plan:', error);

        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const meta = error.meta as unknown as PrismaUniqueConstraintErrorMeta; // Type assertion
                const targetField = meta.target[0];
                throw new Error(`${targetField} is already in use`);
            }
        }
        throw error; // Re-throw the error if it's not handled
    }
};

/**
 * Get all plans purchased by a user
 * 
 * @param userId - The user ID to fetch plans for
 * @returns Promise with user's plans
 */
export const getUserPlans = async (userId: number) => {
    try {
        validateUserId(userId);

        const userPlans = await prisma.deposit.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        // Enrich plans with configuration details
        const enrichedPlans = userPlans.map((plan: { plan: string; amount: number; id: any; transactionId: any; isVerified: any; isUpdated: any; createdAt: { getTime: () => number; }; }) => {
            try {
                const { config } = getPlanConfig(plan.plan);
                const expectedReturn = plan.amount + (plan.amount * config.returnRate);

                return {
                    id: plan.id,
                    planName: plan.plan,
                    amount: plan.amount,
                    transactionId: plan.transactionId,
                    isVerified: plan.isVerified,
                    isUpdated: plan.isUpdated,
                    createdAt: plan.createdAt,
                    duration: config.durationInMs,
                    returnRate: config.returnRate,
                    expectedReturn,
                    // Calculate if plan has matured
                    isMatured: new Date().getTime() > (plan.createdAt.getTime() + config.durationInMs)
                };
            } catch (error) {
                // Handle case where plan config might not exist
                console.error(`Error enriching plan ${plan.id}:`, error);
                return {
                    id: plan.id,
                    planName: plan.plan,
                    amount: plan.amount,
                    transactionId: plan.transactionId,
                    isVerified: plan.isVerified,
                    isUpdated: plan.isUpdated,
                    createdAt: plan.createdAt,
                    error: 'Plan configuration not found'
                };
            }
        });

        return {
            success: true,
            plans: enrichedPlans
        };

    } catch (error) {
        console.error('Error fetching user plans:', error);
        throw error;
    }
};


/**
 * Admin function to update the amount on a plan a user has purchased
 * Checks for user existence, validates plan ownership, and updates the plan amount
 * 
 * @param userName - The username to identify the user
 * @param planId - The plan ID (depositId) for the particular plan to update
 * @param newAmount - The new amount to update the current plan to
 * @param planName - The name of the plan you want to update
 * @param adminId - The admin performing this action
 * @returns Promise<PlanUpdateResult>
 */
export const adminUpdatePlanAmount = async ({
    userName,
    transactionId,
    newAmount,
    planName,
    adminId
}: {
    userName: string;
    transactionId: string;
    newAmount: number;
    planName: string;
    adminId: number;
}): Promise<PlanUpdateResult> => {
    try {
        // Validate admin permissions (assuming you have this function)
        checkAdminPermissions(adminId);

        // Check for user by their userName
        const user = await prisma.user.findFirst({
            where: {
                userName: userName
            }
        });

        if (!user) {
            return {
                success: false,
                message: `User with username '${userName}' not found`
            };
        }

        const userId = user.id;

        // Check if the user has any existing plans
        const existingPlans = await prisma.deposit.findMany({
            where: {
                userId: userId,
                isVerified: true,
                plan: {
                    not: undefined // Only get records that have a plan (not regular deposits)
                }
            }
        });

        if (!existingPlans || existingPlans.length === 0) {
            return {
                success: false,
                message: `No existing plans found for user '${userName}'`
            };
        }

        // Normalize and validate plan name
        const { name: normalizedPlanName, config } = getPlanConfig(planName);

        // Select the specific plan by ID and validate ownership
        const targetPlan = await prisma.deposit.findFirst({
            where: {
                transactionId: transactionId,
                userId: userId,
                plan: normalizedPlanName,
                isVerified: true
            }
        });

        if (!targetPlan) {
            return {
                success: false,
                message: `Plan with ID ${transactionId} not found for user '${userName}' or plan name mismatch`
            };
        }

        // Validate new amount against plan limits
        validatePlanAmount(planName, newAmount);

        // Calculate the difference for balance adjustment
        const amountDifference = newAmount - targetPlan.amount;

        // Check if user has sufficient balance for increase (if applicable)
        if (amountDifference > 0) {
            const walletBalance = await getUserWalletBalance(userId);
            if (walletBalance.availableBalance < amountDifference) {
                return {
                    success: false,
                    message: `Insufficient balance to increase plan amount. Available: $${walletBalance.availableBalance}, Required: $${amountDifference}`,
                    currentAmount: targetPlan.amount,
                    requestedAmount: newAmount
                };
            }
        }

        // Update the plan amount
        const updatedPlan = await prisma.deposit.update({
            where: {
                transactionId: transactionId
            },
            data: {
                amount: newAmount,
                isUpdated: true // Mark as updated by admin
            }
        });

        // Calculate new expected return
        const newExpectedReturn = newAmount + (newAmount * config.returnRate);

        // Get updated wallet balance
        const updatedBalance = await getUserWalletBalance(userId);

        return {
            success: true,
            message: `Successfully updated ${normalizedPlanName} plan amount from $${targetPlan.amount} to $${newAmount}`,
            updatedPlan: {
                id: updatedPlan.id,
                planName: normalizedPlanName,
                previousAmount: targetPlan.amount,
                newAmount: newAmount,
                amountDifference: amountDifference,
                transactionId: targetPlan.transactionId,
                duration: config.durationInMs,
                returnRate: config.returnRate,
                newExpectedReturn: newExpectedReturn,
                updatedAt: new Date()
            },
            userBalance: updatedBalance.availableBalance,
            userName: userName
        };

    } catch (error) {
        console.error('Error updating plan amount:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to update plan amount"
        };
    }
};



// Function for active investment
// check if the user has bought any plan 
// check if the roi of that plan has been added to the balance
// if the time for the plan has been met then the active investment should return to 0 
// if not the amount should remain the same till the roi has been added  

export const activeInvestment = async (userId: number): Promise<number> => {
    const deposits = await prisma.deposit.findMany({
        where: {
            userId: userId,
            isVerified: true,
            plan: {
                in: Object.keys(PlanConfigs)
            }
        },
        include: {
            user: true
        }
    });

    const currentDate = new Date();

    const calculateActiveInvestment = (deposit: any) => {
        const planConfig = PlanConfigs[deposit.plan];
        const depositDate = new Date(deposit.createdAt);
        const timeElapsed = currentDate.getTime() - depositDate.getTime();
        const totalDuration = planConfig.durationInMs;
        const totalReturnRate = planConfig.returnRate;

        // If investment period is complete
        if (timeElapsed >= totalDuration) {
            return 0;
        }

        // Calculate hourly ROI accumulation
        const hoursElapsed = Math.floor(timeElapsed / (60 * 60 * 1000));
        const hourlyReturnRate = totalReturnRate / (totalDuration / (60 * 60 * 1000));
        const accumulatedROI = deposit.amount * (hoursElapsed * hourlyReturnRate);

        // Return deposit amount plus accumulated ROI
        return deposit.amount + accumulatedROI;
    };

    // Calculate total active investment with gradual ROI
    const totalActiveInvestment = deposits.reduce((total: any, deposit: any) => {
        return total + calculateActiveInvestment(deposit);
    }, 0);

    return Math.round(totalActiveInvestment * 10) / 10;
};


export const calROI = async (userId: number): Promise<number> => {
    const newDeposit = await prisma.deposit.findMany({
        where: {
            userId: userId,
            isVerified: true,
            plan: {
                in: Object.keys(PlanConfigs)
            },
        },
    });

    const currentDate = new Date();

    const calculateNewBalance = (deposit: any) => {
        const PlanConfig = PlanConfigs[deposit.plan];
        const depositDate = new Date(deposit.createdAt)
        let currentBalance = deposit.amount;
        let timeElapsed = currentDate.getTime() - depositDate.getTime();

        const returnDuration = PlanConfig.durationInMs;

        if (timeElapsed < returnDuration) {
            return currentBalance;
        }

        const numberOfPeriods = Math.floor(returnDuration / PlanConfig.durationInMs)
        const returnAmount = deposit.amount * PlanConfig.returnRate * numberOfPeriods;

        //Reset the deposit date to the current date 
        deposit.createdAt = currentDate.toISOString();

        return deposit.amount + returnAmount
    };

    const newBalance = newDeposit.reduce((total: any, deposit: any) => total + calculateNewBalance(deposit), 0);
    const roundedBalance = Math.round(newBalance * 10) / 10;

    return roundedBalance;
};


// calculate new balance with the collected rio and total balance withdrawn

export const totalWithdraws = async (userId: number): Promise<number> => {
    const withdraws = await prisma.withdrawal.findMany({
        where: {
            userId: userId,
            isVerified: true
        }
    });

    const totalWithdrawals = withdraws.reduce((total: number, withdrawal: { amount: any; }) => total + Number(withdrawal.amount), 0);
    return totalWithdrawals
}


//Function to get final balance
export const getFinalBalance = async (userId: number): Promise<number> => {
    const roiBalance = await calROI(userId);
    const totalWithdrawals = await totalWithdraws(userId);

    const finalBalance = roiBalance - totalWithdrawals;
    return Math.round(finalBalance * 10) / 10;
}


//list of deposit made by one user 
export const getAvailableBalance = async (userId: number): Promise<number> => {

    const deposits = await prisma.deposit.findMany({
        where: {
            userId: userId,
            isVerified: true
        },
    });
    const availableBalance = deposits.reduce((total: any, deposit: { amount: any; }) => total + deposit.amount, 0);
    return availableBalance
};


//to list all deposit done by all user 
export const listDeposits = async (): Promise<Deposit[]> => {
    return prisma.deposit.findMany({
        where: {
            isVerified: true,
        },
        include: {
            user: {
                select: {
                    id: true,
                    userName: true
                }
            }
        },
        orderBy: { createdAt: 'asc' },
    });
}

//to list all verified payments made by a user 
export const listDeposit = async (userId: number): Promise<DepositMade[] | null> => {

    return prisma.deposit.findMany({
        where: {
            userId: userId,
            isVerified: true
        },
        select: {
            transactionId: true,
            amount: true,
            createdAt: true,
            userId: true,
            plan: true
        },
    });
};