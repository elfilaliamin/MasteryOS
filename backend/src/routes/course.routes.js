import express from 'express';
import {
  getCourses,
  addCourse,
  editCourse,
  incrementLesson,
  removeCourse
} from '../controllers/course.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCourseSchema, updateCourseSchema, idParamSchema } from '../validators/schemas.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getCourses);
router.post('/', validate({ body: createCourseSchema }), addCourse);
router.put('/:id', validate({ params: idParamSchema, body: updateCourseSchema }), editCourse);
router.post('/:id/increment', validate({ params: idParamSchema }), incrementLesson);
router.delete('/:id', validate({ params: idParamSchema }), removeCourse);

export default router;
