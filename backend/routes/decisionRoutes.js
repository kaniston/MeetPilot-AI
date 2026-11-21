import { Router } from 'express';
import { getDecisions, patchConflict } from '../controllers/decisionController.js';
import { postCompareDecisions } from '../controllers/aiController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', getDecisions);
router.post('/compare', asyncHandler(postCompareDecisions));
router.patch('/conflicts/:id', patchConflict);

export default router;
