import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as habitController from '../controllers/habit.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createHabitSchema,
  updateHabitSchema,
  toggleHabitSchema,
  idParamSchema
} from '../validators/schemas.js';

const router = Router();

router.use(requireAuth);

router.get('/', habitController.getHabits);
router.post('/', validate({ body: createHabitSchema }), habitController.createHabit);
router.put('/:id', validate({ params: idParamSchema, body: updateHabitSchema }), habitController.updateHabit);
router.post('/:id/toggle', validate({ params: idParamSchema, body: toggleHabitSchema }), habitController.toggleHabit);
router.delete('/:id', validate({ params: idParamSchema }), habitController.deleteHabit);

export default router;
