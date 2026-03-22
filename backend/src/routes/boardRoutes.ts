import express from 'express';
import { getBoards, createBoard, updateBoard, deleteBoard, addMember, removeMember } from '../controllers/boardController';
import { requireBoardMember, requireBoardAdmin } from '../middleware/roleAuth'; 

const router = express.Router();

router.post('/', createBoard);
router.get('/', getBoards);

// Everyone on the board can do these:
router.put('/:id', requireBoardMember, updateBoard);

// ⚡ ONLY ADMINS AND OWNERS CAN DO THESE:
router.delete('/:id', requireBoardAdmin, deleteBoard); // Editors can't delete boards!
router.post('/:id/members', requireBoardAdmin, addMember); // Editors can't invite!
router.delete('/:id/members/:userId', requireBoardAdmin, removeMember); // The Kick Route!

export default router;