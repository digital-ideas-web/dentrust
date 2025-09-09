// import { Prisma } from "@prisma/client";
import Authentication from "../utils/auth";
import { prisma } from "../utils/db.sever";
import { generateHash, compareHash } from "../utils/password";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

export type User = {
    id: number;
    fullName: string;
    userName: string;
    email: string;
    password: string;
    role: any,
};

type logUser = {
    userName: string;
    password: string;
};

interface PrismaUniqueConstraintErrorMeta {
    target: string[];
}


export const listUsers = async (): Promise<User[]> => {
    const defaultRole = 'USER';
    return prisma.user.findMany({
        select: {
            id: true,
            fullName: true,
            userName: true,
            email: true,
            password: true,
            role: true,
        },
    });
};

export const getUser = async (id: number): Promise<User | null> => {
    return prisma.user.findUnique({
        where: {
            id,
        }, select: {
            id: true,
            fullName: true,
            userName: true,
            email: true,
            password: true,
            role: true
        }
    });
};

export const createUser = async (user: Omit<User, "id">): Promise<User> => {
    const { fullName, userName, email, password } = user;

    const hashedPassword = await generateHash(password);
    const defaultRole = 'USER';
    try {
        return await prisma.user.create({
            data: {
                fullName,
                userName,
                email,
                password: hashedPassword,
                role: defaultRole
            },
            select: {
                id: true,
                fullName: true,
                userName: true,
                email: true,
                password: true,
                role: true
            },
        });
    } catch (error: any) {
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

export const updateUser = async (
    user: Omit<User, "id">,
    id: number
): Promise<User> => {
    try {
        return prisma.user.update({
            where: {
                id,
            },
            data: {
                ...user,
            },
            select: {
                id: true,
                fullName: true,
                userName: true,
                email: true,
                password: true,
                role: true
            },
        });
    } catch (error: any) {
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

export const deleteUser = async (id: number): Promise<void> => {
    await prisma.user.delete({
        where: {
            id,
        },
    });
};

//DELETE MANY transaction numbers
export const deleteAllUsers = async (): Promise<void> => {
    await prisma.user.deleteMany()
}

// Login an existing user 
export async function logUser(
    userName: string,
    password: string
): Promise<string | null> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                userName: userName,
            },
        });

        if (!user) {
            throw new Error("Username is not correct!");
        }

        const passwordMatch = await compareHash(password, user.password);
        if (passwordMatch) {

            return Authentication.generateToken(
                user.id,
                user.role,
            );
        }
        // return "";
        else {
            throw new Error('Password is not correct!')
        }
    } catch (error) {
        throw error;
    }
}


// function to authenticate user with just username or email
export async function findUser(
    email: string
): Promise<string | null> {
    try {
        // Find the Username
        const user = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });
        // If userName does not exist return error else authenticate the user after search
        if (!user) {
            throw new Error("Email is not correct!");
        }
        else {
            return Authentication.generateToken(
                user.id,
                user.role,
            );
        }

    } catch (error) {
        throw error;
    }
}

//update the password
export const updatePassword = async (userId: number, newPassword: string): Promise<void> => {
    // Hash the new password
    const hashedPassword = generateHash(newPassword);
    console.log(`Hashed password  for user ${userId}: ${hashedPassword}`)

    // Update the user's password in the database 
    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            password: hashedPassword
        },
        select: {
            id: true,
            fullName: true,
            userName: true,
            email: true,
            password: true,
            role: true
        },
    });
};