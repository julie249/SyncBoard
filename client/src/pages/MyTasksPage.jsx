import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckSquare,
  Calendar,
  AlertCircle,
  Clock,
  LayoutList,
  LayoutGrid,
  Filter,
  CheckCircle2
} from 'lucide-react';
import api from '../api/axios';
import { useWorkspace } from '../context/WorkspaceContext';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { EmptyState } from '../components/common/EmptyState';
import { TaskDetailModal } from '../components/cards/TaskDetailModal';
import toast from 'react-hot-toast';

export const MyTasksPage = () => {
  const { currentWorkspace } = useWorkspace();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [selectedCardId, setSelectedCardId] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentWorkspace) params.append('workspaceId', currentWorkspace._id);
      if (search) params.append('search', search);
      if (priority) params.append('priority', priority);
      if (status) params.append('status', status);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await api.get(`/dashboard/my-tasks?${params.toString()}`);
      if (res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load my tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentWorkspace?._id, search, priority, status, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Assigned Tasks
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and manage all tasks assigned to you across boards.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task title..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="dueDate">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="createdAt">Sort by Newest</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks assigned"
          description={
            search || priority || status
              ? 'No assigned tasks match your filter criteria.'
              : 'You have zero active tasks assigned to you right now. Great job!'
          }
        />
      ) : viewMode === 'list' ? (
        /* Table / List View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.map((task) => {
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                !task.list?.name?.toLowerCase().includes('done');

              const completedChecklist = task.checklist?.filter((i) => i.completed).length || 0;
              const totalChecklist = task.checklist?.length || 0;

              return (
                <div
                  key={task._id}
                  onClick={() => setSelectedCardId(task._id)}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {task.board?.name || 'Board'} • {task.list?.name || 'List'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <Badge variant={task.priority} size="sm">
                      {task.priority}
                    </Badge>

                    {totalChecklist > 0 && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500">
                        <CheckSquare className="w-3.5 h-3.5" />
                        {completedChecklist}/{totalChecklist}
                      </span>
                    )}

                    {task.dueDate && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                        {new Date(task.dueDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <div
              key={task._id}
              onClick={() => setSelectedCardId(task._id)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="truncate max-w-[150px]">{task.board?.name || 'Board'}</span>
                  <Badge variant={task.priority} size="sm">
                    {task.priority}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">
                  {task.title}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{task.list?.name || 'List'}</span>
                {task.dueDate && (
                  <span>
                    Due{' '}
                    {new Date(task.dueDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCardId && (
        <TaskDetailModal
          isOpen={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
          cardId={selectedCardId}
          onCardUpdated={() => fetchTasks()}
          onCardDeleted={() => {
            fetchTasks();
            setSelectedCardId(null);
          }}
        />
      )}
    </div>
  );
};
