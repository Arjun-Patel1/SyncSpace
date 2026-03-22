import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Tell TypeScript that our Request might have a 'user' attached to it now
export interface AuthRequest extends Request {
    user?: any;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token;

    // Check if the header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (looks like "Bearer eyJhbGci...")
            token = req.headers.authorization.split(' ')[1];

            // Verify token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

            // Attach the decoded user ID to the request
            req.user = decoded;
            next(); // Let the request continue to the controller!
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};