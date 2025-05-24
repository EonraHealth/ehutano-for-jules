import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';
import { storage } from './storage';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

// JWT authentication middleware
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Set user info in request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

// Role-based authorization middleware
export function authorizeRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  };
}

// Check if user is active middleware
export async function checkUserActive(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get user from database
    const user = await storage.getUser(req.user.id);
    
    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'Account is inactive or suspended' });
    }
    
    next();
  } catch (error) {
    console.error('Check user active error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
}
