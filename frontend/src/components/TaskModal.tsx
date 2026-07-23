import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z.string().min(1, 'Due date is required').refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, {
    message: 'Due date cannot be earlier than today',
  }),
});

type TaskFields = z.infer<typeof taskSchema>;

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  onSuccess: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  onSuccess,
}) => {
  const isEdit = !!taskToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFields>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '',
    },
  });

  // Reset form when taskToEdit changes
  useEffect(() => {
    if (taskToEdit) {
      // Format dueDate from ISO string to YYYY-MM-DD for date input
      const formattedDate = new Date(taskToEdit.dueDate).toISOString().split('T')[0] || '';
      reset({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        priority: taskToEdit.priority,
        status: taskToEdit.status,
        dueDate: formattedDate,
      });
    } else {
      reset({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: '',
      });
    }
  }, [taskToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: TaskFields) => {
    try {
      if (isEdit && taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, data);
        toast.success('Task updated successfully');
      } else {
        await api.post('/tasks', data);
        toast.success('Task created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to save task';
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="Enter task title"
              className={`w-full px-4 py-2 rounded-xl border bg-slate-50 dark:bg-slate-950/30 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                errors.title ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-rose-500 mt-1 ml-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Enter description (optional)"
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority *
              </label>
              <select
                {...register('priority')}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              {...register('dueDate')}
              className={`w-full px-4 py-2 rounded-xl border bg-slate-50 dark:bg-slate-950/30 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                errors.dueDate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {errors.dueDate && (
              <p className="text-xs text-rose-500 mt-1 ml-1">{errors.dueDate.message}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-75 disabled:pointer-events-none cursor-pointer text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
