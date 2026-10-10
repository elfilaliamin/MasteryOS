import { Router } from 'express';
import { getCategories, addCategory, removeCategory } from '../controllers/category.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getCategories);
router.post('/', addCategory);
router.delete('/:id', removeCategory);

export default router;
