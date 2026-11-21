import { Router } from 'express';
import { postAssistantChat } from '../controllers/aiController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/chat', asyncHandler(postAssistantChat));

export default router;
