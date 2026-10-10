import express from 'express';
import {
  getCourses,
  addCourse,
  editCourse,
  incrementLesson,
  removeCourse
} from '../controllers/course.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getCourses);
router.post('/', addCourse);
router.put('/:id', editCourse);
router.post('/:id/increment', incrementLesson);
router.delete('/:id', removeCourse);

export default router;
