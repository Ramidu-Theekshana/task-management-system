import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { TaskModal } from '../components/TaskModal.js';
import api from '../api/axios.js';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Filters & State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Loaders
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Modal Controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Fetch statistics
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await api.get('/tasks/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch task list
  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '6'); // Page limit size: 6 tasks

      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data.tasks);
      setTotalPages(response.data.pagination.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Trigger fetches on filter/sort changes
  useEffect(() => {
    fetchTasks();
  }, [search, statusFilter, priorityFilter, sortBy, page]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchTasks();
    fetchStats();
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted successfully');
      handleRefresh();
      // Adjust page if last task on current page is deleted
      if (tasks.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleEditClick = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      case 'LOW':
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="h-5 w-5 text-indigo-500" />;
      case 'PENDING':
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'COMPLETED') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 items-center justify-center flex bg-indigo-600 rounded-xl text-white font-bold text-lg shadow-md shadow-indigo-600/20">
                T
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Koncepthive TMS
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden sm:inline text-slate-600 dark:text-slate-300">
                Hi, {user?.name}
              </span>
              <ThemeToggle />
              <button
                onClick={logout}
                className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer text-sm shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Statistics Cards */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Card: Total */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
            <div className="text-slate-400 dark:text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">
              Total Tasks
            </div>
            <div className="text-3xl font-black">
              {loadingStats ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : stats?.total || 0}
            </div>
            <div className="absolute top-0 right-0 h-16 w-16 bg-slate-500/5 rounded-bl-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-slate-500/40" />
            </div>
          </div>

          {/* Card: Pending */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
            <div className="text-slate-400 dark:text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">
              Pending
            </div>
            <div className="text-3xl font-black text-slate-600 dark:text-slate-400">
              {loadingStats ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : stats?.pending || 0}
            </div>
            <div className="absolute top-0 right-0 h-16 w-16 bg-slate-500/5 rounded-bl-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-slate-500/40" />
            </div>
          </div>

          {/* Card: In Progress */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
            <div className="text-slate-400 dark:text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">
              In Progress
            </div>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {loadingStats ? <Loader2 className="h-8 w-8 animate-spin text-indigo-400" /> : stats?.inProgress || 0}
            </div>
            <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-bl-full flex items-center justify-center">
              <PlayCircle className="h-6 w-6 text-indigo-500/40" />
            </div>
          </div>

          {/* Card: Completed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
            <div className="text-slate-400 dark:text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {loadingStats ? <Loader2 className="h-8 w-8 animate-spin text-emerald-400" /> : stats?.completed || 0}
            </div>
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-500/40" />
            </div>
          </div>

          {/* Card: Overdue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs col-span-2 md:col-span-1 relative overflow-hidden group">
            <div className="text-rose-500/70 text-sm font-semibold mb-1 uppercase tracking-wider">
              Overdue
            </div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {loadingStats ? <Loader2 className="h-8 w-8 animate-spin text-rose-400" /> : stats?.overdue || 0}
            </div>
            <div className="absolute top-0 right-0 h-16 w-16 bg-rose-500/5 rounded-bl-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-rose-500/40" />
            </div>
          </div>
        </section>

        {/* Toolbar (Filters, Search, Add Button) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
          <div className="flex flex-1 flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              />
            </div>

            {/* Filter by Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all cursor-pointer appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>

            {/* Filter by Priority */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all cursor-pointer appearance-none"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <Filter className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>

            {/* Sort Order */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all cursor-pointer appearance-none"
              >
                <option value="newest">Newest Created</option>
                <option value="oldest">Oldest Created</option>
                <option value="dueDate">Due Date</option>
              </select>
              <ArrowUpDown className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Add Task Button */}
          <button
            onClick={handleCreateClick}
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-2 px-5 rounded-xl transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer text-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Task
          </button>
        </section>

        {/* Task Cards Grid */}
        <section className="relative min-h-[300px]">
          {loadingTasks ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/30 dark:bg-slate-950/30 backdrop-blur-xs rounded-2xl z-10">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          ) : null}

          {tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <div
                    key={task.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-xs flex flex-col justify-between group transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                      overdue
                        ? 'border-rose-300 dark:border-rose-950/50 hover:border-rose-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-950/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {getStatusIcon(task.status)}
                          <span className="capitalize">{task.status.replace('_', ' ').toLowerCase()}</span>
                        </div>
                      </div>

                      {/* Task Title */}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2 line-clamp-1">
                        {task.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-4">
                        {task.description || (
                          <span className="italic text-slate-300 dark:text-slate-600">No description provided.</span>
                        )}
                      </p>
                    </div>

                    {/* Bottom Details & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                      {/* Due Date */}
                      <div
                        className={`flex items-center gap-1.5 text-xs font-semibold ${
                          overdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        {overdue ? (
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.25 bg-rose-100 dark:bg-rose-950/60 rounded-sm">
                            Overdue
                          </span>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-950/50 cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit2 className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-950/50 cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-lg font-bold mb-1">No tasks found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-4">
                We couldn't find any tasks matching your filters or search terms. Create one to get started!
              </p>
              <button
                onClick={handleCreateClick}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer text-sm shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create First Task
              </button>
            </div>
          )}
        </section>

        {/* Pagination Footer */}
        {totalPages > 1 ? (
          <section className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="inline-flex items-center justify-center p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="inline-flex items-center justify-center p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </section>
        ) : null}
      </main>

      {/* Task Creation & Update Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
