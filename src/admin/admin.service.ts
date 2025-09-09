import { prisma } from "../utils/db.sever";
import { NextFunction, Request, Response } from "express"
import { generateHash, compareHash } from "../utils/password";
import Authentication from "../utils/auth";
import { sendDepositConfirmationEmail, sendWithdrawalConfirmationEmail } from "../template/emailTemplate";
import { User } from "../users/users.service";
import { checkAdminPermissions, validateUserId } from "../utils/input_validation";


// USER

//create a user 
export const createUser = async (req: Request, res: Response) => {
    const { userName, fullName, email, password }: User = req.body
    const hashedPassword = await generateHash(password);
    try {
        const user = await prisma.user.create({
            data: {
                userName,
                fullName,
                email,
                password: hashedPassword,
                role: 'USER'
            }
        })
        res.status(201).json({
            message: "Created successfully",
            data: { userName, fullName, email, password }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Sever error",
            message: "Error creating user please wait"
        })
    }
};

//get a user with email and not ID

export const getUser = async (req: Request, res: Response) => {
    const { email, fullName } = req.body
    try {
        const user = await prisma.user.findUnique({
            where: {
                email
            },
            select: {
                fullName: true
            }
        })
        res.status(200).json({
            data: user
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Sever error",
            message: `${email} does not exist`
        })
    }
};

// get  all users that are registered 
export const getUsers = async (req: Request, res: Response) => {
    const { fullName, userName, email } = req.body
    try {
        const user = await prisma.user.findMany({
            where: {
                role: "USER"
            },
        })
        res.status(200).json({
            data: user
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Server error"
        })
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const email = req.body
    try {
        if (!email) {
            throw new Error("Email does not exist")
        }
        const deleteUser = await prisma.user.delete({
            where: {
                email
            }
        })
        res.status(204).json({
            message: "User deleted successfully"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Server error"
        })
    }
}


//DEPOSIT
// export const deposit = async (req: Request, res: Response) => {
//     const { transactionId, amount, userId, plan }: Deposit = req.body;
//     try {
//         const payment = await prisma.deposit.create({
//             data: {
//                 transactionId,
//                 amount,
//                 userId,
//                 plan,
//                 isVerified: true
//             }
//         });
//         res.status(201).json(payment)
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             error: "Sever error",
//             message: "Error making payment please wait"
//         })
//     }
// }

//get all deposits that are not verified
export const getAllDeposit = async (req: Request, res: Response) => {
    try {
        const deposit = await prisma.deposit.findMany({
            where: {
                isVerified: true
            },
            include: { // Use include instead of select for relations
                user: {
                    select: {
                        userName: true,
                        email: true // Add more fields if needed
                    }
                }
            }
        });
        // res.render('admin', { deposit: deposit })
        res.status(200).json({
            data: deposit
        })
    } catch (error: any) {
        console.error('Error fetching data from the database:', error.message);
        res.status(500).send('Internal Sever Error');
    }
}

//get all deposits that are verified
export const getAllDeposits = async (req: Request, res: Response) => {
    try {
        const deposit = await prisma.deposit.findMany({
            where: {
                isVerified: true
            },
            include: { // Use include instead of select for relations
                user: {
                    select: {
                        userName: true,
                        email: true // Add more fields if needed
                    }
                }
            }
        });
        res.status(200).json({
            data: deposit
        })
    } catch (error: any) {
        console.error('Error fetching data from the database:', error.message);
        res.status(500).send('Internal Sever Error');
    }
}

//ADMIN

// create an admin
export const createAdmin = async (req: Request, res: Response) => {
    const { userName, fullName, email, password }: User = req.body
    const hashedPassword = await generateHash(password);
    try {
        const user = await prisma.user.create({
            data: {
                userName,
                fullName,
                email,
                password: hashedPassword,
                role: 'ADMIN'
            }
        })
        res.status(201).json({
            message: "Created successfully",
            data: user
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Sever error",
            message: "Error creating user please wait"
        })
    }
};

//login an admin 
export const logAdmin = async (req: Request, res: Response) => {
    const { userName, password } = req.body;

    try {
        const admin = await prisma.user.findUnique({
            where: {
                userName
            },
        });

        if (!admin) {
            throw new Error("userName is not correct!");
        }

        if (admin.role !== 'ADMIN') {
            return res.status(403).json({ message: "User is not an admin!" });
        }

        const passwordMatch = await compareHash(password, admin.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Password is not correct!" });
        }
        const accessToken = Authentication.generateToken(
            admin.id,
            admin.role,
        );

        res.cookie("jwt", accessToken, { httpOnly: true });

        return res.status(200).json({
            accessToken
        })
    } catch (error) {
        console.log(error)
        throw error
    }
};


// get a single admin
export const getAdmin = async (req: Request, res: Response) => {
    const { id } = req.params
    const { userName, email } = req.body

    try {
        const admin = await prisma.user.findUnique({
            where: {
                id: parseInt(id)
            },
            select: {
                userName: true,
                email: true
            }
        });
        res.status(200).json({
            message: "Admin found",
            data: admin
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Sever error",
            message: `Admin ${id} does not exist`
        })
    }
};

//get all admins
export const getAdmins = async (req: Request, res: Response) => {
    const { userName, email } = req.body
    try {
        const admin = await prisma.user.findMany({
            where: {
                role: "ADMIN"
            },
            select: {
                userName: true,
                email: true
            }
        })
        res.status(200).json({
            data: admin
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: "Server error"
        })
    }
};

//delete an Admin
export const deleteAdmin = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    try {
        if (!id) {
            throw new Error('id does not exist')
        }
        const deleteAdmin = await prisma.user.delete({
            where: {
                id: id
            },
        })
        return res.status(200).json({
            message: `${deleteAdmin} deleted successfully`
        })
    }
    catch (err: any) {
        res.status(500).json({
            error: err.message,
        })
    }
}

// Function to get unverified deposits
export async function getUnverifiedDeposits(res: Response, req: Request): Promise<void> {
    try {
        const unverifiedDeposits = await prisma.deposit.findMany({
            where: {
                isVerified: false,
            }, select: {
                id: true,
                amount: true,
                transactionId: true,
                plan: true
            },
            orderBy: {
                id: 'asc'
            }
        });

        res.status(200).json({ data: unverifiedDeposits });
    } catch (error) {
        console.error('Error notifying admin:', error);
        throw new Error('Failed to notify admin');
    }
}


//to verify a deposit 
export async function verifyDeposit(req: Request, res: Response): Promise<void> {
    console.log('Received request body:', req.body)
    try {
        const { transactionId } = req.body;
        console.log('Extracted depositId:', transactionId)
        if (!transactionId) {
            console.error('Transaction ID is missing in request')
            res.status(400).json({ error: 'Deposit ID is required' })
            return
        }

        //get the user deposit details 
        const depositDetails = await prisma.deposit.findUnique({
            where: {
                transactionId: transactionId,
                isVerified: false
            },
            include: {
                user: true,
            }
        })

        if (!depositDetails) {
            res.status(404).json({ error: 'No unverified deposit found for the user' })
            return;
        }

        // Verify the deposit
        await prisma.deposit.update({
            where: {
                transactionId: transactionId,
            },
            data: {
                isVerified: true,
            },
        });

        // Send email to the user
        await sendDepositConfirmationEmail(depositDetails);


        res.status(200).json({ message: 'Deposit verified successfully' });
    } catch (error) {
        console.error('Error in verifyDeposit:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


//Withdrawal 
//trying to update the withdrawal amount and batch id 

export const updateWithdraw = async (req: Request, res: Response) => {

    const { userName, amount, batch_id } = req.body
    try {
        const user = await prisma.user.findUnique({
            where: { userName: userName },
            include: { Withdrawal: true }
        });

        if (!user) {
            throw new Error(`${userName} has no request`);
        }

        //Find a verified withdrawal for the user
        const verifiedWithdrawal = user.Withdrawal.find((withdrawal: { isVerified: any; }) => withdrawal.isVerified);

        if (!verifiedWithdrawal) {
            throw new Error('No verified withdrawal request by this user');
        }

        //Update the amount and batchId  of the verified withdrawal
        const updateWithdrawal = await prisma.withdrawal.update({
            where: {
                id: verifiedWithdrawal.id
            },
            data: {
                amount: amount,
                batch_id: batch_id
            },
            include: {
                user: true // Include the user details in the updated withdrawal
            }
        });
        // res.status(200).json({
        //     data: updateWithdrawal
        // })

        await sendWithdrawalConfirmationEmail(updateWithdrawal)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "An error has occured, please wait." })
    }
}



//TRANSACTIONS

/**
 * Get system analytics for admin dashboard
 * 
 * @param adminId - ID of the admin requesting analytics
 */
export const getSystemAnalytics = async (adminId: number) => {
    try {
        validateUserId(adminId);

        const isAdmin = await checkAdminPermissions(adminId);
        if (!isAdmin) {
            throw new Error("Insufficient permissions. Admin access required.");
        }

        const [
            totalDeposits,
            confirmedDeposits,
            pendingDeposits,
            totalDepositAmount,
            totalPlanPurchases,
            totalPlanRevenue
        ] = await Promise.all([
            prisma.transactions.count(),
            prisma.transactions.count({ where: { status: true } }),
            prisma.transactions.count({ where: { status: false } }),
            prisma.transactions.aggregate({
                where: { status: true },
                _sum: { amount: true }
            }),
            prisma.deposit.count(),
            prisma.deposit.aggregate({
                _sum: { amount: true }
            })
        ]);

        // Plan breakdown analytics
        const planBreakdown = await prisma.deposit.groupBy({
            by: ['plan'],
            _count: true,
            _sum: {
                amount: true
            }
        });

        return {
            success: true,
            analytics: {
                deposits: {
                    total: totalDeposits,
                    confirmed: confirmedDeposits,
                    pending: pendingDeposits,
                    totalAmount: totalDepositAmount._sum.amount || 0
                },
                plans: {
                    totalPurchases: totalPlanPurchases,
                    totalRevenue: totalPlanRevenue._sum.amount || 0,
                    breakdown: planBreakdown
                },
                conversionRate: totalDeposits > 0
                    ? ((totalPlanPurchases / confirmedDeposits) * 100).toFixed(2) + '%'
                    : '0%'
            }
        };

    } catch (error) {
        console.error('Error fetching system analytics:', error);
        throw error;
    }
};



// export async function logAdminAction({
//     adminId,
//     action,
//     transactionId,
//     userId,
//     amount
// }: {
//     adminId: number;
//     action: string;
//     transactionId: string;
//     userId: number;
//     amount: number;
// }): Promise<void> {
//     try {
//         // Log to console for now - implement proper audit logging in production
//         console.log(`[AUDIT] ${action} by User ${adminId} on Transaction ${transactionId} for User ${userId} Amount: $${amount}`);

//         // Example implementation with audit table:
//         /*
//         await prisma.auditLog.create({
//           data: {
//             adminId,
//             action,
//             transactionId,
//             targetUserId: userId,
//             amount,
//             timestamp: new Date()
//           }
//         });
//         */
//     } catch (error) {
//         console.error('Error logging admin action:', error);
//     }
// }