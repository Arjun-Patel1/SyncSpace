import { Request, Response, NextFunction } from 'express';
import Board from '../models/Board';

// 1. SYSTEM ADMIN CHECK: Only allows Super Admins to pass
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    // ⚡ Tell TypeScript to expect our custom 'user' object from the JWT token
    const currentUser = (req as any).user;

    if (currentUser && currentUser.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Super Admins only.' });
    }
};

// 2. BOARD PERMISSION CHECK: Ensures the user is actually a member of the board
export const requireBoardMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const currentUser = (req as any).user;
        const boardId = req.params.id || req.params.boardId || req.body.boardId;
        
        if (!boardId) {
            res.status(400).json({ message: 'Board ID is required for permission check' });
            return;
        }

        const board = await Board.findById(boardId);
        if (!board) {
            res.status(404).json({ message: 'Board not found' });
            return;
        }

        // Check if the logged-in user exists in the board's members array
        const isMember = board.members.some((member: any) => 
            member.user.toString() === currentUser.id
        );

        if (!isMember && currentUser.role !== 'admin') {
            res.status(403).json({ message: 'Access denied. You are not a member of this board.' });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error during permission check' });
    }
};
// 3. ⚡ NEW: STRICT ADMIN CHECK (Discord-Style Permissions)
// Only allows 'admin' or 'owner' to manage members and board settings
export const requireBoardAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const currentUser = (req as any).user;
        const boardId = req.params.id || req.params.boardId || req.body.boardId;
        
        if (!boardId) {
            res.status(400).json({ message: 'Board ID is required' });
            return;
        }

        const board = await Board.findById(boardId);
        if (!board) {
            res.status(404).json({ message: 'Board not found' });
            return;
        }

        // Find the logged-in user's role in this specific board
        const memberData = board.members.find((member: any) => 
            member.user.toString() === currentUser.id
        );

        // If they aren't on the board, or their role is just 'editor' or 'viewer', kick them out!
        if (!memberData || (memberData.role !== 'admin' && memberData.role !== 'owner')) {
            if (currentUser.role !== 'admin') { // System super-admins bypass this
                res.status(403).json({ message: 'Access denied. Only Board Admins can do this.' });
                return;
            }
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error during admin check' });
    }
};