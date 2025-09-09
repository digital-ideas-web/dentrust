import express from "express";
import type { Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { verifyToken, authorization } from "../utils/auth";
import { planPurchaseRateLimit } from "../utils/rate_limiting";
import { validatePlanPurchaseInput } from "../utils/input_validation"
import { AuthenticatedRequest, DepositRequest, PlanPurchaseRequest } from "../utils/interface";
import { adminRateLimit } from "../utils/rate_limiting";

import * as PaymentService from "./payment.service";
import { createSecretKey } from "crypto";

export const paymentRouter = express.Router();

const user = function userId() {
    return (req: Request, res: Response) => {
        // Type guard to narrow down the type
        if (typeof req.user !== 'number') {
            return res.status(403).json({ message: 'Invalid user ID' });
        }
    }
}

//GET: List for the payment
// paymentRouter.get("/user", verifyToken, async (req: Request, res: Response) => {

//     try {
//         // Type guard to narrow down the type
//         if (typeof req.user !== 'number') {
//             return res.status(403).json({ message: 'Invalid user ID' });
//         }
//         const user = req.user
//         const id: number = parseInt(user, 10);
//         const deposits = await PaymentService.listDeposit(id)
//         // Render the EJS template and pass the data
//         res.render('deposits', { deposits });
//         return res.status(200).json({ data: deposits })
//     } catch (error: any) {
//         return res.status(500).json(error.message);
//     };
// });

// paymentRouter.get("/:id", async (req: Request, res: Response) => {
//     const id: number = parseInt(req.params.id, 10);

//     try {
//         const deposit = await PaymentService.getDeposit(id)
//         if (deposit) {
//             return res.status(200).json({ data: deposit })
//         }
//     } catch (error: any) {
//         return res.status(500).json(error.message);
//     }
// });


/**
 * POST /api/plans/purchase
 * Purchase a plan using wallet balance
 */
paymentRouter.post('/plans/purchase',
    planPurchaseRateLimit,
    verifyToken,
    authorization("USER"),
    validatePlanPurchaseInput,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { planName, customAmount } = req.body as PlanPurchaseRequest;

            // Type guard to narrow down the type
            if (typeof req.user !== 'number') {
                return res.status(403).json({ message: 'User ID not found in token' });
            }

            const result = await PaymentService.purchasePlan({
                userId: req.user,
                planName,
                customAmount
            });

            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error purchasing plan:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while purchasing plan'
            });
        }
    }
);


/**
 * GET /api/plans/my-plans
 * Get all plans purchased by the authenticated user
 */
paymentRouter.get('/plans/my-plans',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // Type guard to narrow down the type
            if (typeof req.user !== 'number') {
                return res.status(403).json({ message: 'User ID not found in token' });
            }
            const userPlans = await PaymentService.getUserPlans(req.user);
            res.json(userPlans);
        } catch (error) {
            console.error('Error fetching user plans:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user plans'
            });
        }
    }
);



// paymentRouter.delete("/:id", async (req: Request, res: Response) => {
//     const id: number = parseInt(req.params.id, 10);
//     try {
//         await PaymentService.deletePayment(id)
//         return res.status(204).json("User has been deleted successfully!!")
//     } catch (error: any) {
//         return res.status(500).json(error.message);
//     }
// })



// paymentRouter.delete("/", async (req: Request, res: Response) => {
//     try {
//         await PaymentService.deleteAllPayments()
//         return res.status(204).json("No existing payment left");
//     } catch (error: any) {
//         console.log("error:", error)
//         return res.status(500).json({ message: "Error deleting transaction numbers" });
//     }
// })



paymentRouter.get("/", async (req: Request, res: Response) => {
    try {
        const deposit = await PaymentService.listDeposits()
        return res.status(200).json(deposit);
    } catch (error: any) {
        return res.status(500).json(error.message);
    }
})

//GET: List for the payment
paymentRouter.get("/balance", verifyToken, async (req: Request, res: Response) => {

    try {
        // Type guard to narrow down the type
        if (typeof req.user !== 'number') {
            return res.status(403).json({ message: 'Invalid user ID' });
        }
        const user = req.user
        const id: number = parseInt(user, 10);
        const listDeposit = await PaymentService.getAvailableBalance(id)
        // Render the EJS template and pass the data
        return res.status(200).json({ data: listDeposit })
    } catch (error: any) {
        console.error(error)
        return res.status(500).json(error.message);
    };
})

paymentRouter.get("/roi", verifyToken, async (req: Request, res: Response) => {
    try {
        // Type guard to narrow down the type
        if (typeof req.user !== 'number') {
            return res.status(403).json({ message: 'Invalid user ID' });
        }
        const user = req.user
        const id: number = parseInt(user, 10);
        const listDeposit = await PaymentService.calROI(id)
        // Render the EJS template and pass the data
        return res.status(200).json({ data: listDeposit })
    } catch (error: any) {
        console.error(error)
        return res.status(500).json(error.message);
    };

})


/**
 * PUT /api/admin/plans/update-amount
 * Admin route to update a user's plan amount
 */
paymentRouter.put('/admin/plans/update-amount',
    adminRateLimit, // Rate limiting for admin actions
    verifyToken, // JWT token verification
    authorization("ADMIN"), // Admin role authorization
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { userName, transactionId, newAmount, planName } = req.body;

            // Type guard to narrow down the type
            if (typeof req.user !== 'number') {
                return res.status(403).json({ message: 'User ID not found in token' });
            }

            const result = await PaymentService.adminUpdatePlanAmount({
                userName,
                transactionId,
                newAmount,
                planName,
                adminId: req.user // Admin performing the action
            });

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error updating plan amount:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating plan amount'
            });
        }
    }
);


// Route for getting active investment
paymentRouter.get("/active-investment", verifyToken, async (req: Request, res: Response) => {
    try {
        // Type guard to narrow down the type
        if (typeof req.user !== 'number') {
            return res.status(403).json({ message: 'Invalid user ID' });
        }
        const user = req.user;
        const id: number = parseInt(user, 10);

        // Call the activeInvestment function to get current active investment
        const activeInvestmentAmount = await PaymentService.activeInvestment(id);

        // Return the active investment amount
        return res.status(200).json({
            data: activeInvestmentAmount,
            message: "Active investment amount retrieved successfully"
        });
    } catch (error: any) {
        console.error('Error retrieving active investment:', error);
        return res.status(500).json({
            message: "Error retrieving active investment",
            error: error.message
        });
    }
});