import express from 'express';
import { getAllAvailablePlans } from "./payment.helpers";


export const PlanPriceMap: Record<string, number> = {
    "PRIME": 1500,
    "STANDARD": 5000,
    "GOLD": 10000,
    "PLATINUM": 10100,
    "ETF": 10000,
    "RealEstate": 30000,
    "MERGER": 50000,
    "INSURANCE": 30000,
};

export interface PlanConfig {
    returnRate: number;
    durationInMs: number;
    price: {
        min: number;
        max?: number;
    }
}

// Define the plan configurations
export const PlanConfigs: Record<string, PlanConfig> = {
    PRIME: {
        returnRate: 0.2,
        durationInMs: 48 * 60 * 60 * 1000, //48hours
        price: {
            min: 600,
            max: 1500,
        },
    },
    STANDARD: {
        returnRate: 0.25,
        durationInMs: 48 * 60 * 60 * 1000, //48days 
        price: {
            min: 1600,
            max: 5000,
        }
    },

    GOLD: {
        returnRate: 0.4,
        durationInMs: 48 * 60 * 60 * 1000, //1 week
        price: {
            min: 5100,
            max: 10000,
        }
    },
    PLATINUM: {
        returnRate: 0.52,
        durationInMs: 48 * 60 * 60 * 1000, //48days
        price: {
            min: 10100,
        }
    },
    INSURANCE: {
        returnRate: 0.25,
        durationInMs: 7 * 24 * 60 * 60 * 1000, //1 week
        price: {
            min: 30000,
        }
    },
    REALESTATE: {
        returnRate: 0.75,
        durationInMs: 14 * 24 * 60 * 60 * 1000, //1 week
        price: {
            min: 30000,
        }
    },
    MERGER: {
        returnRate: 0.9,
        durationInMs: 14 * 24 * 60 * 60 * 1000, //1 week
        price: {
            min: 50000,
        }
    },
    IMMIGRATION: {
        returnRate: 0.75,
        durationInMs: 14 * 24 * 60 * 60 * 1000, //1 week
        price: {
            min: 25000,
        }
    },
    ETF: {
        returnRate: 0.55,
        durationInMs: 14 * 24 * 60 * 60 * 1000, //1 week
        price: {
            min: 10000,
        }
    },
};


export const planConfigs = express.Router();

planConfigs.get('/planConstants', (req, res) => {
    try {
        res.json({
            success: true,
            plans: PlanConfigs,
            availablePlans: getAllAvailablePlans()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plan configurations',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});