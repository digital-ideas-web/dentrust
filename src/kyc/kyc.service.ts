// // Import the database configuration and validation helpers
// import { prisma } from "../utils/db.sever";
// import {
//     validateUserId,
//     validateTransactionId,
//     checkAdminPermissions
// } from "../utils/input_validation";
// import { v4 as uuidv4 } from 'uuid';
// import path from 'path';
// import fs from 'fs';
// import {
//     validateIdNumber,
//     validateIdType,
//     validatePhoneNumber,
//     PhoneNumberResult,
//     KYCResult,
//     UserKYCInfo,
//     ImageUploadResult
// } from "./kyc.interface"



// /**
//  * Alternative local storage upload (for development or when cloud storage isn't available)
//  */
// const uploadImageLocally = async (
//     file: Buffer,
//     fileName: string,
//     userId: number
// ): Promise<ImageUploadResult> => {
//     try {
//         const uploadsDir = path.join(process.cwd(), 'uploads', 'kyc', userId.toString());

//         // Create directory if it doesn't exist
//         if (!fs.existsSync(uploadsDir)) {
//             fs.mkdirSync(uploadsDir, { recursive: true });
//         }

//         const fileExtension = path.extname(fileName);
//         const uniqueFileName = `${uuidv4()}${fileExtension}`;
//         const filePath = path.join(uploadsDir, uniqueFileName);

//         fs.writeFileSync(filePath, file);

//         return {
//             success: true,
//             imageUrl: `/uploads/kyc/${userId}/${uniqueFileName}`,
//             fileName: uniqueFileName
//         };
//     } catch (error) {
//         console.error('Error uploading locally:', error);
//         return {
//             success: false,
//             message: error instanceof Error ? error.message : 'Failed to upload image'
//         };
//     }
// };

// /**
//  * Creates or updates phone number information for a user
//  * @param userId - The ID of the user
//  * @param phoneNumber - The phone number
//  * @param idNumber - The ID number associated with the phone
//  * @returns Promise<PhoneNumberResult>
//  */
// export const createOrUpdatePhoneNumber = async ({
//     userId,
//     phoneNumber,
//     idNumber
// }: {
//     userId: number;
//     phoneNumber: string;
//     idNumber: string;
// }): Promise<PhoneNumberResult> => {
//     try {
//         // Input validation
//         validateUserId(userId);
//         validatePhoneNumber(phoneNumber);
//         validateIdNumber(idNumber);

//         // Check if user exists
//         const userExists = await prisma.user.findUnique({
//             where: { id: userId },
//             select: { id: true }
//         });

//         if (!userExists) {
//             throw new Error("User not found");
//         }

//         // Check if phone number record already exists for this user
//         const existingPhoneNumber = await prisma.phoneNumber.findUnique({
//             where: { userId }
//         });

//         let phoneNumberRecord;

//         if (existingPhoneNumber) {
//             // Update existing record
//             phoneNumberRecord = await prisma.phoneNumber.update({
//                 where: { userId },
//                 data: {
//                     phoneNumber: phoneNumber.trim(),
//                     id_number: idNumber.trim()
//                 }
//             });
//         } else {
//             // Create new record
//             phoneNumberRecord = await prisma.phoneNumber.create({
//                 data: {
//                     userId,
//                     phoneNumber: phoneNumber.trim(),
//                     id_number: idNumber.trim()
//                 }
//             });
//         }

//         return {
//             success: true,
//             message: existingPhoneNumber
//                 ? "Phone number information updated successfully"
//                 : "Phone number information created successfully",
//             phoneNumberData: {
//                 id: phoneNumberRecord.id,
//                 userId: phoneNumberRecord.userId,
//                 phoneNumber: phoneNumberRecord.phoneNumber,
//                 id_number: phoneNumberRecord.id_number
//             }
//         };

//     } catch (error) {
//         console.error('Error creating/updating phone number:', error);

//         return {
//             success: false,
//             message: error instanceof Error ? error.message : "Failed to process phone number"
//         };
//     }
// };

// /**
//  * Creates or updates KYC information for a user
//  * @param userId - The ID of the user
//  * @param idType - Type of ID (drivers licence, passport, voters card)
//  * @param imageFile - The image file buffer
//  * @param originalFileName - Original filename of the uploaded image
//  * @returns Promise<KYCResult>
//  */
// export const createOrUpdateKYC = async ({
//     userId,
//     idType,
//     imageFile,
//     originalFileName
// }: {
//     userId: number;
//     idType: string;
//     imageFile: Buffer;
//     originalFileName: string;
// }): Promise<KYCResult> => {
//     try {
//         // Input validation
//         validateUserId(userId);
//         validateIdType(idType);

//         if (!imageFile || imageFile.length === 0) {
//             throw new Error("Valid image file is required");
//         }

//         // Validate image file type
//         const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
//         const fileExtension = path.extname(originalFileName).toLowerCase();
//         if (!allowedExtensions.includes(fileExtension)) {
//             throw new Error("Only JPG, JPEG, PNG, and PDF files are allowed");
//         }

//         // Check file size (5MB limit)
//         const maxSize = 5 * 1024 * 1024; // 5MB
//         if (imageFile.length > maxSize) {
//             throw new Error("File size must be less than 5MB");
//         }

//         // Check if user exists
//         const userExists = await prisma.user.findUnique({
//             where: { id: userId },
//             select: { id: true }
//         });

//         if (!userExists) {
//             throw new Error("User not found");
//         }

//         // Upload image (use S3 in production, local storage for development)
//         const uploadResult = process.env.NODE_ENV === 'production'
//             // ? await uploadImageToS3(imageFile, originalFileName, userId)
//             : await uploadImageLocally(imageFile, originalFileName, userId);

// if (!uploadResult.success) {
//     throw new Error(uploadResult.message || "Failed to upload image");
// }

// // Check if KYC record already exists for this user
// const existingKYC = await prisma.kYC.findUnique({
//     where: { userId }
// });

// let kycRecord;

// if (existingKYC) {
//     // Update existing record
//     kycRecord = await prisma.kYC.update({
//         where: { userId },
//         data: {
//             Id_type: idType.toLowerCase(),
//             Id_image: uploadResult.imageUrl!
//         }
//     });
// } else {
//     // Create new record
//     kycRecord = await prisma.kYC.create({
//         data: {
//             userId,
//             Id_type: idType.toLowerCase(),
//             Id_image: uploadResult.imageUrl!
//         }
//     });
// }

// return {
//     success: true,
//     message: existingKYC
//         ? "KYC information updated successfully"
//         : "KYC information created successfully",
//     kycData: {
//         id: kycRecord.id,
//         userId: kycRecord.userId,
//         Id_type: kycRecord.Id_type,
//         Id_image: kycRecord.Id_image
//     }
// };

//     } catch (error) {
//     console.error('Error creating/updating KYC:', error);

//     return {
//         success: false,
//         message: error instanceof Error ? error.message : "Failed to process KYC information"
//     };
// }
// };

// /**
//  * Get phone number information for a user
//  * @param userId - The user ID
//  * @returns Promise<PhoneNumberResult>
//  */
// export const getUserPhoneNumber = async (userId: number): Promise<PhoneNumberResult> => {
//     try {
//         validateUserId(userId);

//         const phoneNumberRecord = await prisma.phoneNumber.findUnique({
//             where: { userId }
//         });

//         if (!phoneNumberRecord) {
//             return {
//                 success: false,
//                 message: "Phone number information not found"
//             };
//         }

//         return {
//             success: true,
//             message: "Phone number information retrieved successfully",
//             phoneNumberData: {
//                 id: phoneNumberRecord.id,
//                 userId: phoneNumberRecord.userId,
//                 phoneNumber: phoneNumberRecord.phoneNumber,
//                 id_number: phoneNumberRecord.id_number
//             }
//         };

//     } catch (error) {
//         console.error('Error fetching phone number:', error);
//         throw error;
//     }
// };

// /**
//  * Get KYC information for a user
//  * @param userId - The user ID
//  * @returns Promise<KYCResult>
//  */
// export const getUserKYC = async (userId: number): Promise<KYCResult> => {
//     try {
//         validateUserId(userId);

//         const kycRecord = await prisma.kYC.findUnique({
//             where: { userId }
//         });

//         if (!kycRecord) {
//             return {
//                 success: false,
//                 message: "KYC information not found"
//             };
//         }

//         return {
//             success: true,
//             message: "KYC information retrieved successfully",
//             kycData: {
//                 id: kycRecord.id,
//                 userId: kycRecord.userId,
//                 Id_type: kycRecord.Id_type,
//                 Id_image: kycRecord.Id_image
//             }
//         };

//     } catch (error) {
//         console.error('Error fetching KYC:', error);
//         throw error;
//     }
// };

// /**
//  * Admin function to get complete KYC information for a user
//  * @param adminId - ID of the admin making the request
//  * @param userId - ID of the user to get KYC info for
//  * @returns Promise<UserKYCInfo>
//  */
// export const getCompleteKYCInfoByAdmin = async ({
//     adminId,
//     userId
// }: {
//     adminId: number;
//     userId: number;
// }): Promise<UserKYCInfo> => {
//     try {
//         validateUserId(adminId);
//         validateUserId(userId);

//         // Verify admin permissions
//         const isAdmin = await checkAdminPermissions(adminId);
//         if (!isAdmin) {
//             throw new Error("Insufficient permissions. Admin access required.");
//         }

//         // Get user information with KYC and phone number data
//         const userInfo = await prisma.user.findUnique({
//             where: { id: userId },
//             select: {
//                 id: true,
//                 userName: true
//             }
//         });

//         if (!userInfo) {
//             throw new Error("User not found");
//         }

//         const phoneNumberInfo = await prisma.phoneNumber.findUnique({
//             where: { userId },
//             select: {
//                 phoneNumber: true,
//                 id_number: true
//             }
//         });

//         const kycInfo = await prisma.kYC.findUnique({
//             where: { userId },
//             select: {
//                 Id_type: true,
//                 Id_image: true
//             }
//         });

//         return {
//             userId,
//             user: userInfo,
//             phoneNumber: phoneNumberInfo || undefined,
//             kyc: kycInfo || undefined
//         };

//     } catch (error) {
//         console.error('Error fetching complete KYC info:', error);
//         throw error;
//     }
// };

// /**
//  * Admin function to get all users with KYC status
//  * @param adminId - ID of the admin making the request
//  * @param limit - Optional limit for pagination
//  * @param offset - Optional offset for pagination
//  */
// export const getAllUsersKYCStatus = async ({
//     adminId,
//     limit = 50,
//     offset = 0
// }: {
//     adminId: number;
//     limit?: number;
//     offset?: number;
// }) => {
//     try {
//         validateUserId(adminId);

//         const isAdmin = await checkAdminPermissions(adminId);
//         if (!isAdmin) {
//             throw new Error("Insufficient permissions. Admin access required.");
//         }

//         const users = await prisma.user.findMany({
//             select: {
//                 id: true,
//                 userName: true,
//                 phoneNumber: {
//                     select: {
//                         phoneNumber: true,
//                         id_number: true
//                     }
//                 },
//                 kyc: {
//                     select: {
//                         Id_type: true,
//                         Id_image: true
//                     }
//                 }
//             },
//             take: limit,
//             skip: offset
//         });

//         const totalUsers = await prisma.user.count();

//         // Transform data to show KYC completion status
//         const usersWithKYCStatus = users.map(user => ({
//             ...user,
//             kycStatus: {
//                 phoneNumberComplete: !!user.phoneNumber,
//                 kycComplete: !!user.kyc,
//                 fullyComplete: !!(user.phoneNumber && user.kyc)
//             }
//         }));

//         return {
//             success: true,
//             users: usersWithKYCStatus,
//             totalCount: totalUsers,
//             hasMore: (offset + limit) < totalUsers
//         };

//     } catch (error) {
//         console.error('Error fetching users KYC status:', error);
//         throw error;
//     }
// };

// /**
//  * Delete phone number information for a user
//  * @param userId - The user ID
//  * @returns Promise<PhoneNumberResult>
//  */
// export const deleteUserPhoneNumber = async (userId: number): Promise<PhoneNumberResult> => {
//     try {
//         validateUserId(userId);

//         const phoneNumberRecord = await prisma.phoneNumber.findUnique({
//             where: { userId }
//         });

//         if (!phoneNumberRecord) {
//             return {
//                 success: false,
//                 message: "Phone number information not found"
//             };
//         }

//         await prisma.phoneNumber.delete({
//             where: { userId }
//         });

//         return {
//             success: true,
//             message: "Phone number information deleted successfully"
//         };

//     } catch (error) {
//         console.error('Error deleting phone number:', error);
//         throw error;
//     }
// };

// /**
//  * Delete KYC information for a user
//  * @param userId - The user ID
//  * @returns Promise<KYCResult>
//  */
// export const deleteUserKYC = async (userId: number): Promise<KYCResult> => {
//     try {
//         validateUserId(userId);

//         const kycRecord = await prisma.kYC.findUnique({
//             where: { userId }
//         });

//         if (!kycRecord) {
//             return {
//                 success: false,
//                 message: "KYC information not found"
//             };
//         }

//         await prisma.kYC.delete({
//             where: { userId }
//         });

//         return {
//             success: true,
//             message: "KYC information deleted successfully"
//         };

//     } catch (error) {
//         console.error('Error deleting KYC:', error);
//         throw error;
//     }
// };