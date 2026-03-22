import { Request, Response } from 'express';
import Message from '../models/Message';

// 1. Fetch chat history
export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { boardId } = req.params;
        
        // ⚡ If the frontend asks for 'global', we search for messages where boardId is null
        // Otherwise, we get the messages for this specific board
        const query = boardId === 'global' ? { boardId: null } : { boardId };

        // Fetch the last 100 messages and attach the sender's username and email
        const messages = await Message.find(query)
            .populate('sender', 'username email')
            .sort({ createdAt: 1 }) // Oldest first, so chat scrolls down naturally
            .limit(100);

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};

// 2. Save a new message
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, boardId } = req.body;
        // The 'protect' middleware adds the user object to req
        const senderId = (req as any).user.id; 

        if (!content) {
            res.status(400).json({ message: 'Message content is required' });
            return;
        }

        // Create the message in the database
        const message = await Message.create({
            content,
            sender: senderId,
            boardId: boardId === 'global' ? null : boardId
        });

        // We populate it immediately so the frontend knows exactly who just sent it
        // and can display their name in the chat UI
        const populatedMessage = await message.populate('sender', 'username email');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: 'Server error sending message' });
    }
};