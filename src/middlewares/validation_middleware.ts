
import { verifyToken } from "../utils/auth"

// Authentication middleware (implement based on your auth system)
// const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//     try {
//         const token = req.headers.authorization?.replace('Bearer ', '');

//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Authentication token required'
//             });
//         }

//         // TODO: Implement your JWT verification logic here
//         // This is a placeholder - replace with your actual auth logic
//         const decoded = verifyToken(token); // You need to implement this

//         if (!decoded || !decoded.userId) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid or expired token'
//             });
//         }

//         req.userId = decoded.userId;
//         req.userRole = decoded.role;
//         next();
//     } catch (error) {
//         console.error('Authentication error:', error);
//         return res.status(401).json({
//             success: false,
//             message: 'Authentication failed'
//         });
//     }
// };

// Admin authorization middleware
