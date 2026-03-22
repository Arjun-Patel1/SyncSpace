import { Request, Response } from 'express';
import List from '../models/List';
import Card from '../models/Card';

export const getLists = async (req: Request, res: Response) => {
    try {
        const lists = await List.find({ boardId: req.params.boardId });
        res.json(lists);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

export const createList = async (req: Request, res: Response) => {
    try {
        const list = await List.create({ title: req.body.title, boardId: req.body.boardId });
        res.json(list);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

// ⚡ NEW: Edit List
export const updateList = async (req: Request, res: Response) => {
    try {
        const list = await List.findByIdAndUpdate(req.params.id, { title: req.body.title }, { new: true });
        res.json(list);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

// ⚡ NEW: Delete List (and its cards)
export const deleteList = async (req: Request, res: Response) => {
    try {
        await List.findByIdAndDelete(req.params.id);
        await Card.deleteMany({ listId: req.params.id });
        res.json({ message: 'List deleted' });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};