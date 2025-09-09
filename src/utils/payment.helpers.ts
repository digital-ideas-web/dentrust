import { PlanConfigs, PlanConfig } from './payment.constants';

// Helper function to get plan price from configuration
export function getPlanPrice(planName: string): { min: number; max?: number } {
    const normalized = normalizePlanName(planName);
    const config = PlanConfigs[normalized];
    if (!config) {
        throw new Error(`Plan configuration not found for: ${planName}`);
    }
    return config.price;
}

// FIXED: Validation functions
export function validatePlanAmount(planName: string, amount: number): void {
    const { min, max } = getPlanPrice(planName);

    if (amount < min) {
        throw new Error(`Amount $${amount} is below the minimum required for ${planName} plan: $${min}`);
    }

    if (typeof max === 'number' && amount > max) {
        throw new Error(`Amount $${amount} exceeds the maximum for ${planName} plan: $${max}`);
    }
}

export function validateTargetAmount(planName: string, targetAmount: number): void {
    validatePlanAmount(planName, targetAmount); // Same validation
}

export function normalizePlanName(planName: string): keyof typeof PlanConfigs {
    const normalized = planName.trim().toUpperCase();
    if (!(normalized in PlanConfigs)) {
        throw new Error(`Invalid plan name: "${planName}". Available plans: ${Object.keys(PlanConfigs).join(', ')}`);
    }
    return normalized as keyof typeof PlanConfigs;
}

export function getPlanConfig(planName: string): { name: string; config: PlanConfig } {
    const name = normalizePlanName(planName);
    return { name, config: PlanConfigs[name] };
}

export function getPlanDuration(planName: string): number {
    const { config } = getPlanConfig(planName);
    return config.durationInMs;
}

export function getPlanReturnRate(planName: string): number {
    const { config } = getPlanConfig(planName);
    return config.returnRate;
}

// ADDED: Helper function to calculate expected return
export function calculateExpectedReturn(planName: string, amount: number): number {
    const { config } = getPlanConfig(planName);
    return amount + (amount * config.returnRate);
}

// ADDED: Helper function to check if plan has matured
export function isPlanMatured(planName: string, purchaseDate: Date): boolean {
    const { config } = getPlanConfig(planName);
    const maturityDate = new Date(purchaseDate.getTime() + config.durationInMs);
    return new Date() >= maturityDate;
}

// ADDED: Get all available plans for frontend
export function getAllAvailablePlans() {
    return Object.entries(PlanConfigs).map(([name, config]) => ({
        name,
        returnRate: config.returnRate,
        duration: config.durationInMs,
        durationDays: Math.ceil(config.durationInMs / (24 * 60 * 60 * 1000)),
        minAmount: config.price.min,
        maxAmount: config.price.max,
        expectedReturn: (amount: number) => calculateExpectedReturn(name, amount)
    }));
}