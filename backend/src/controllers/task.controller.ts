import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { AppError } from '../utils/errors.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { Priority, Status } from '@prisma/client';

// Zod schema for task creation
export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.nativeEnum(Priority, {
      message: 'Priority must be LOW, MEDIUM, or HIGH',
    }),
    status: z.nativeEnum(Status, {
      message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED',
    }),
    dueDate: z.string().transform((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date;
    }).refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, {
      message: 'Due date cannot be earlier than today',
    }),
  }),
});

// Zod schema for task updating
export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().optional(),
    priority: z.nativeEnum(Priority).optional(),
    status: z.nativeEnum(Status).optional(),
    dueDate: z.string().transform((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date;
    }).refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, {
      message: 'Due date cannot be earlier than today',
    }).optional(),
  }),
});

// GET /api/tasks
export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { search, status, priority, sortBy, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Filters
    const where: any = { userId };

    if (search) {
      where.title = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    if (status) {
      where.status = status as Status;
    }

    if (priority) {
      where.priority = priority as Priority;
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }; // default: newest created
    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'dueDate') {
      orderBy = { dueDate: 'asc' };
    }

    // Fetch tasks & total count
    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.task.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/stats
export const getTaskStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const [total, pending, inProgress, completed, overdue] = await prisma.$transaction([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: Status.PENDING } }),
      prisma.task.count({ where: { userId, status: Status.IN_PROGRESS } }),
      prisma.task.count({ where: { userId, status: Status.COMPLETED } }),
      prisma.task.count({
        where: {
          userId,
          status: { not: Status.COMPLETED },
          dueDate: { lt: now },
        },
      }),
    ]);

    res.json({
      total,
      pending,
      inProgress,
      completed,
      overdue,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const task = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks
export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, description, priority, status, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status,
        dueDate: new Date(dueDate),
        userId,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { title, description, priority, status, dueDate } = req.body;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404);
    }

    await prisma.task.delete({
      where: { id },
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
