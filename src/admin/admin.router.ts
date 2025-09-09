import { Router } from "express";
import {
    getUser,
    getUsers,
    createUser,
    deleteUser,
    //getTransaction,
    getSystemAnalytics,
    createAdmin,
    getAdmin,
    getAdmins,
    logAdmin,
    deleteAdmin,
    getAllDeposit,
    verifyDeposit,
    getAllDeposits,
    updateWithdraw,
    // getUnverifiedDeposits,
} from "./admin.service";
import { authorization } from "../utils/auth";
import { requireAdmin } from '../utils/input_validation';
import { adminRateLimit } from "../utils/rate_limiting";
import { AuthenticatedRequest } from "../utils/interface";
import { Response } from "express";

export const adminRouter = Router();

adminRouter.post("/user", createUser);
adminRouter.get("/getUser", getUser);
adminRouter.get("/users", getUsers);
adminRouter.delete("/user:id", deleteUser);


// adminRouter.get("/transaction", getTransaction);


adminRouter.get("/getDeposit", getAllDeposit)
adminRouter.get("/deposits", getAllDeposits)


adminRouter.post("/admin", createAdmin);
adminRouter.get("/admin/:id", getAdmin);
adminRouter.get("/admins", getAdmins);
adminRouter.post("/login", logAdmin);
adminRouter.delete("/admin:id", deleteAdmin);

// API endpoint to get unverified deposits
adminRouter.get('/unverified-deposits', authorization('ADMIN'));

// API endpoint to verify a deposit
adminRouter.post('/verify-deposit', authorization('ADMIN'), verifyDeposit);

//Endpoint for withdraw
adminRouter.put('/withdrawUpdate', authorization('ADMIN'), updateWithdraw);



/**
 * GET /api/admin/analytics
 * Get system analytics and statistics
 */
adminRouter.get('/admin/analytics',
    adminRateLimit,
    authorization("ADMIN"),
    requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const analytics = await getSystemAnalytics(req.userId!);
            res.json(analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch system analytics'
            });
        }
    }
);