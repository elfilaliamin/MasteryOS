import { Router } from 'express';
import { register, login, getMe, changePassword, updateProfile, resetUserData } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyJWT, getMe);
router.put('/change-password', verifyJWT, changePassword);
router.put('/profile', verifyJWT, updateProfile);
router.post('/reset-data', verifyJWT, resetUserData);

export default router;
