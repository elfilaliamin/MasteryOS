import { Router } from 'express';
import { register, login, logout, getMe, changePassword, updateProfile, updateSettings, resetUserData } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { authLimiter, passwordChangeLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', verifyJWT, getMe);
router.post('/change-password', verifyJWT, passwordChangeLimiter, validate({ body: changePasswordSchema }), changePassword);
router.put('/change-password', verifyJWT, passwordChangeLimiter, validate({ body: changePasswordSchema }), changePassword);
router.put('/profile', verifyJWT, validate({ body: updateProfileSchema }), updateProfile);
router.put('/settings', verifyJWT, updateSettings);
router.post('/reset-data', verifyJWT, resetUserData);

export default router;
