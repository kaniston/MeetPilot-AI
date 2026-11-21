import { Router } from 'express';
import { getTasks, patchTask } from '../controllers/taskController.js';

const router = Router();

router.get('/', getTasks);
router.patch('/:id', patchTask);

export default router;
