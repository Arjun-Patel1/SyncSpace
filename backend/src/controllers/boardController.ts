import { Request, Response } from 'express';
import Board from '../models/Board';
import List from '../models/List';
import Card from '../models/Card';
import User from '../models/User'; 

// 1. Get all boards where the user is a member
export const getBoards = async (req: Request, res: Response): Promise<void> => {
    try {
        // ⚡ UPGRADED: Added .populate() to send usernames and emails to the frontend!
        const boards = await Board.find({ 'members.user': (req as any).user.id })
                                  .populate('members.user', 'username email');
        res.status(200).json(boards);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching boards' });
    }
};

// 2. Create a board and make the creator the "Owner"
export const createBoard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title } = req.body;
        if (!title) {
            res.status(400).json({ message: 'Board title is required' });
            return;
        }
        
        // Create the board with the creator as the first member (owner)
        const board = await Board.create({ 
            title, 
            members: [{ 
                user: (req as any).user.id, 
                role: 'owner' 
            }] 
        });
        
        res.status(201).json(board);
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating board' });
    }
};

// 3. Invite a new member
export const addMember = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; 
        const { email, role } = req.body; 

        // Security: Prevent anyone from inviting an "Owner"
        if (role === 'owner') {
            res.status(403).json({ message: 'Cannot assign Owner role via invite.' });
            return;
        }

        const userToInvite = await User.findOne({ email });
        if (!userToInvite) {
            res.status(404).json({ message: 'User with this email not found' });
            return;
        }

        const board = await Board.findById(id);
        if (!board) return;

        const isAlreadyMember = board.members.some(member => member.user.toString() === userToInvite._id.toString());
        if (isAlreadyMember) {
            res.status(400).json({ message: 'User is already a member of this board' });
            return;
        }

        board.members.push({ user: userToInvite._id, role: role || 'editor' });
        await board.save();

        res.status(200).json(board);
    } catch (error) {
        res.status(500).json({ message: 'Server error while adding member' });
    }
};

// 4. KICK A USER FROM THE BOARD
export const removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, userId } = req.params; // Board ID and User ID to kick

        const board = await Board.findById(id);
        if (!board) {
            res.status(404).json({ message: 'Board not found' });
            return;
        }

        // Prevent kicking the owner
        const targetMember = board.members.find(m => m.user.toString() === userId);
        if (targetMember && targetMember.role === 'owner') {
            res.status(403).json({ message: 'Cannot remove the board owner.' });
            return;
        }

        // Tell MongoDB to directly pull (remove) the member from the database
        await Board.findByIdAndUpdate(id, {
            $pull: { members: { user: userId } }
        });

        res.status(200).json({ message: 'User removed from board successfully' });
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ message: 'Server error while removing member' });
    }
};

// 5. Update Board Title
export const updateBoard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const board = await Board.findByIdAndUpdate(id, { title }, { new: true });
        res.status(200).json(board);
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating board' });
    }
};

// 6. Delete Board (Cascade)
export const deleteBoard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await Board.findByIdAndDelete(id);
        
        const lists = await List.find({ boardId: id });
        const listIds = lists.map(list => list._id);
        
        if (listIds.length > 0) {
            await Card.deleteMany({ listId: { $in: listIds } });
        }
        await List.deleteMany({ boardId: id });

        res.status(200).json({ message: 'Board deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting board' });
    }
};