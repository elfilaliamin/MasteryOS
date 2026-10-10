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

const router = Router();

router.use(verifyJWT);

router.get('/stats', getStats);
router.get('/', getTasks);
router.post('/', createNewTask);
router.get('/:id', getTask);
router.put('/:id', updateTaskDetails);
router.patch('/:id/status', updateStatus);
router.delete('/:id', removeTask);

export default router;
