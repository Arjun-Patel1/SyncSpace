import express from 'express';
import { getCards, createCard, updateCard, deleteCard, reorderCards } from '../controllers/cardController';

const router = express.Router();

router.post('/', createCard);
router.put('/reorder', reorderCards); // Must go BEFORE /:id
router.get('/:listId', getCards);
router.put('/:id', updateCard);    // ⚡ NEW
router.delete('/:id', deleteCard); // ⚡ NEW

export default router;