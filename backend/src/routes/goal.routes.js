import { Router } from 'express';
import { getGoals, addGoal, editGoal, removeGoal } from '../controllers/goal.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createGoalSchema, updateGoalSchema, idParamSchema } from '../validators/schemas.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getGoals);
router.post('/', validate({ body: createGoalSchema }), addGoal);
router.put('/:id', validate({ params: idParamSchema, body: updateGoalSchema }), editGoal);
router.delete('/:id', validate({ params: idParamSchema }), removeGoal);

export default router;
