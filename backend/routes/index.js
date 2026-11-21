import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import meetingRoutes from './meetingRoutes.js';
import taskRoutes from './taskRoutes.js';
import decisionRoutes from './decisionRoutes.js';
import assistantRoutes from './assistantRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/meetings', meetingRoutes);
router.use('/tasks', taskRoutes);
router.use('/decisions', decisionRoutes);
router.use('/assistant', assistantRoutes);

export default router;
