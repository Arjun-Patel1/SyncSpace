import express from 'express';
// ⚡ FIX: Import the exact names we exported from the controller
import { registerUser, loginUser } from '../controllers/authController';

const router = express.Router();

// ⚡ FIX: Use the new function names in the routes
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;