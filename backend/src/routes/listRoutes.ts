import express from 'express';
import { getLists, createList, updateList, deleteList } from '../controllers/listController';

const router = express.Router();

router.post('/', createList);
router.get('/:boardId', getLists);
router.put('/:id', updateList);    // ⚡ NEW
router.delete('/:id', deleteList); // ⚡ NEW

export default router;