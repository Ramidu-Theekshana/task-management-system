import { Router } from 'express';
import {
  getTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  createTaskSchema,
  updateTaskSchema,
} from '../controllers/task.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';

const router = Router();

// Secure all task routes
router.use(requireAuth as any);

router.get('/', getTasks as any);
router.get('/stats', getTaskStats as any);
router.get('/:id', getTaskById as any);
router.post('/', validateRequest(createTaskSchema), createTask as any);
router.put('/:id', validateRequest(updateTaskSchema), updateTask as any);
router.delete('/:id', deleteTask as any);

export default router;
