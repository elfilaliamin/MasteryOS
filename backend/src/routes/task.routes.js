import { Router } from 'express';
import {
  getTasks,
  getTask,
  createNewTask,
  updateTaskDetails,
  updateStatus,
  removeTask,
  getStats
} from '../controllers/task.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  idParamSchema,
  taskQuerySchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema
} from '../validators/schemas.js';

const router = Router();

router.use(verifyJWT);

router.get('/stats', getStats);
router.get('/', validate({ query: taskQuerySchema }), getTasks);
router.post('/', validate({ body: createTaskSchema }), createNewTask);
router.get('/:id', validate({ params: idParamSchema }), getTask);
router.put('/:id', validate({ params: idParamSchema, body: updateTaskSchema }), updateTaskDetails);
router.patch('/:id/status', validate({ params: idParamSchema, body: updateTaskStatusSchema }), updateStatus);
router.delete('/:id', validate({ params: idParamSchema }), removeTask);

export default router;
