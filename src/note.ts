import express, { Request, Response, NextFunction } from 'express';


// Create router
const router = express.Router();

// ============================================================================
// USER ROUTES - Wallet & Deposit Management
// ============================================================================


// ============================================================================
// PLAN ROUTES - Plan Management & Purchase
// ============================================================================

/**
 * GET /api/plans/available
 * Get all available plans with their configurations
 */
router.get('/plans/available', (req: Request, res: Response) => {
  try {
    const availablePlans = getAllAvailablePlans();

    res.json({
      success: true,
      data: availablePlans
    });
  } catch (error) {
    console.error('Error fetching available plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available plans'
    });
  }
});





// ============================================================================
// ADMIN ROUTES - Administration & Analytics
// ============================================================================



// ============================================================================
// UTILITY ROUTES - Health Check & Documentation
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Wallet & Plan API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /api/docs
 * API documentation endpoint
 */
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    documentation: {
      endpoints: {
        user: {
          'POST /api/wallet/deposit': 'Create a new deposit (requires auth)',
          'GET /api/wallet/balance': 'Get wallet balance (requires auth)',
          'GET /api/plans/available': 'Get all available plans',
          'POST /api/plans/purchase': 'Purchase a plan (requires auth)',
          'GET /api/plans/my-plans': 'Get user\'s plans (requires auth)'
        },
        admin: {
          'GET /api/admin/deposits/pending': 'Get pending deposits (admin only)',
          'POST /api/admin/deposits/verify': 'Verify deposits (admin only)',
          'GET /api/admin/analytics': 'Get system analytics (admin only)'
        },
        utility: {
          'GET /api/health': 'Health check',
          'GET /api/docs': 'This documentation'
        }
      },
      authentication: {
        header: 'Authorization: Bearer <token>',
        note: 'All protected endpoints require a valid JWT token'
      },
      rateLimit: {
        deposits: '5 requests per 15 minutes per user',
        planPurchases: '3 requests per 10 minutes per user',
        admin: '50 requests per 5 minutes per admin'
      }
    }
  });
});

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error in wallet routes:', error);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// 404 handler for undefined routes
router.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'POST /api/wallet/deposit',
      'GET /api/wallet/balance',
      'GET /api/plans/available',
      'POST /api/plans/purchase',
      'GET /api/plans/my-plans',
      'GET /api/admin/deposits/pending',
      'POST /api/admin/deposits/verify',
      'GET /api/admin/analytics',
      'GET /api/health',
      'GET /api/docs'
    ]
  });
});

// Placeholder JWT verification function - implement based on your auth system
function verifyJwtToken(token: string): { userId: number; role: string } | null {
  // TODO: Implement your actual JWT verification logic here
  // This is just a placeholder
  try {
    // Example using jsonwebtoken library:
    // const jwt = require('jsonwebtoken');
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // return decoded;

    // Placeholder implementation - REPLACE THIS
    console.warn('Using placeholder JWT verification - implement actual logic');
    return { userId: 1, role: 'user' }; // This is unsafe for production!
  } catch (error) {
    return null;
  }
}

export default router;