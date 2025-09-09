import jwt, { Secret, JwtPayload, SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getUser } from '../users/users.service';


interface Payload {
    userId: number,
    role: "USER" | "ADMIN",
}

declare global {
    namespace Express {
        interface Request {
            user?: Payload; // Extend the Request object to include 'payload' property
        }
    }
}

class Authentication {
    public static generateToken(id: number, role: any): string {
        const secretKey: string = process.env.JWT_SECRET_KEY || "richmond-ekezie-richard-031";
        const payload: Payload = { userId: id, role: role };
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        const option: SignOptions = { expiresIn: expiresIn as any };

        return jwt.sign(payload, secretKey, option)
    }

    public static validationToken(token: string): Payload | null {
        try {
            const secretKey: string = process.env.JWT_SECRET_KEY || "richmond-ekezie-richard-031"
            return jwt.verify(token, secretKey) as Payload;
        } catch (error) {
            return null;
        }
    }
}



// function to verify a users token
export function verifyToken(req: Request, res: Response, next: NextFunction) {
    // console.log('Cookies:', req.cookies);
    const token = req.cookies.jwt;
    let secretKey = process.env.JWT_SECRET_KEY || "richmond-ekezie-richard-031";

    if (!token) {
        // res.status(401).json({ message: 'Authentication required' });
        res.render('login')
    }


    jwt.verify(token, secretKey, (err: any, payload: any) => {
        if (err) {
            //send JSON response for invalid token
            // return res.status(401).json({ message: 'Invalid token' })
            res.render('home')
        } else {
            //JWT is valid; you can access the decoded payload
            const userId = payload.userId
            req.user = userId; // Attach user data to the request object
            next();
        }
    });

}



// Middleware for authorization 
export function authorization(role: any) {
    return (req: Request, res: Response, next: NextFunction) => {
        const accessToken = req.cookies.jwt;

        if (!accessToken) {
            res.render('/login')
            //return res.status(401).json({ message: 'Access token required' });
        }

        //token verification 
        const user = Authentication.validationToken(accessToken);

        if (!user) {
            return res.status(403).json({ message: 'Invalid access token' });
        }

        //To check if the user has the required role
        if (user.role !== role) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        next();
    };
}

export default Authentication