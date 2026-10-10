import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as habitController from '../controllers/habit.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', habitController.getHabits);
router.post('/', habitController.createHabit);
router.put('/:id', habitController.updateHabit);
router.post('/:id/toggle', habitController.toggleHabit);
router.delete('/:id', habitController.deleteHabit);

export default router;
