import { Request, Response } from 'express';
import Card from '../models/Card';

// 1. Get all cards for a specific list
export const getCards = async (req: Request, res: Response): Promise<void> => {
    try {
        const { listId } = req.params;
        const cards = await Card.find({ listId }).sort('position');
        res.status(200).json(cards);
    } catch (error) {
        console.error("Error fetching cards:", error);
        res.status(500).json({ message: 'Server error while fetching cards' });
    }
};

// 2. Create a new card
export const createCard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, listId } = req.body;
        
        if (!title || !listId) {
            res.status(400).json({ message: 'Title and listId are required' });
            return;
        }

        // Get the current number of cards to append the new one at the bottom
        const count = await Card.countDocuments({ listId });
        
        const card = await Card.create({ 
            title, 
            listId, 
            position: count 
        });
        
        res.status(201).json(card);
    } catch (error) {
        console.error("Error creating card:", error);
        res.status(500).json({ message: 'Server error while creating card' });
    }
};
// 3. Update card details (title, description, color, and Enterprise Fields)
export const updateCard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // ⚡ NEW: We must explicitly tell Mongoose to save status, urgency, and dueDate
        const { title, description, color, status, urgency, dueDate } = req.body;
        
        const card = await Card.findByIdAndUpdate(
            id,
            { title, description, color, status, urgency, dueDate },
            { new: true }
        );

        if (!card) {
            res.status(404).json({ message: 'Card not found' });
            return;
        }

        res.status(200).json(card);
    } catch (error) {
        console.error("Error updating card:", error);
        res.status(500).json({ message: 'Server error while updating card' });
    }
};

// 4. Delete a card
export const deleteCard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const card = await Card.findByIdAndDelete(id);
        
        if (!card) {
            res.status(404).json({ message: 'Card not found' });
            return;
        }

        res.status(200).json({ message: 'Card deleted successfully' });
    } catch (error) {
        console.error("Error deleting card:", error);
        res.status(500).json({ message: 'Server error while deleting card' });
    }
};

// 5. Reorder cards (Used by Drag-and-Drop)
export const reorderCards = async (req: Request, res: Response): Promise<void> => {
    try {
        const { items } = req.body; // Expects an array of { _id, position, listId }
        
        if (!items || !Array.isArray(items)) {
            res.status(400).json({ message: 'Items array is required for reordering' });
            return;
        }

        // Execute all database updates concurrently for maximum speed
        await Promise.all(
            items.map((item: any) =>
                Card.findByIdAndUpdate(item._id, { 
                    position: item.position, 
                    listId: item.listId 
                })
            )
        );

        res.status(200).json({ message: 'Cards reordered successfully' });
    } catch (error) {
        console.error("Error reordering cards:", error);
        res.status(500).json({ message: 'Server error while reordering cards' });
    }
};