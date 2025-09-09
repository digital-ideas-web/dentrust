// Additional validation functions
export const validatePhoneNumber = (phoneNumber: string): void => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new Error("Valid phone number is required");
    }
    // Basic phone number validation (adjust regex as needed for your region)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error("Invalid phone number format");
    }
};

export const validateIdNumber = (idNumber: string): void => {
    if (!idNumber || typeof idNumber !== 'string' || idNumber.trim().length === 0) {
        throw new Error("Valid ID number is required");
    }
    if (idNumber.length < 5 || idNumber.length > 50) {
        throw new Error("ID number must be between 5 and 50 characters");
    }
};

export const validateIdType = (idType: string): void => {
    const validIdTypes = ['drivers licence', 'passport', 'voters card'];
    if (!validIdTypes.includes(idType.toLowerCase())) {
        throw new Error("ID type must be one of: drivers licence, passport, voters card");
    }
};

// Interface definitions
export interface PhoneNumberResult {
    success: boolean;
    message: string;
    phoneNumberData?: {
        id: number;
        userId: number;
        phoneNumber: string;
        id_number: string;
    };
}

export interface KYCResult {
    success: boolean;
    message: string;
    kycData?: {
        id: number;
        userId: number;
        Id_type: string;
        Id_image: string;
    };
}

export interface UserKYCInfo {
    userId: number;
    phoneNumber?: {
        phoneNumber: string;
        id_number: string;
    };
    kyc?: {
        Id_type: string;
        Id_image: string;
    };
    user?: {
        id: number;
        userName: string;
    };
}

export interface ImageUploadResult {
    success: boolean;
    imageUrl?: string;
    fileName?: string;
    message?: string;
}
