import { Router } from 'express';
import { getGoals, addGoal, editGoal, removeGoal } from '../controllers/goal.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getGoals);
router.post('/', addGoal);
router.put('/:id', editGoal);
router.delete('/:id', removeGoal);

export default router;
