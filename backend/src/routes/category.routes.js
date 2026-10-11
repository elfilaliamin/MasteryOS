import { Router } from 'express';
import { getCategories, addCategory, removeCategory } from '../controllers/category.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCategorySchema, idParamSchema } from '../validators/schemas.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getCategories);
router.post('/', validate({ body: createCategorySchema }), addCategory);
router.delete('/:id', validate({ params: idParamSchema }), removeCategory);

export default router;
