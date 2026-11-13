import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trello,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Activity as ActivityIcon,
  Calendar,
  Layers,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import api from '../api/axios';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CreateBoardModal } from '../components/boards/CreateBoardModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [recentBoards, setRecentBoards] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);

  const fetchDashboardData = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/metrics/${currentWorkspace._id}`);
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setCharts(res.data.charts);
        setUpcomingDeadlines(res.data.upcomingDeadlines || []);
        setRecentBoards(res.data.recentBoards || []);
        setRecentActivity(res.data.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentWorkspace?._id]);

  if (wsLoading || loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500">Loading workspace dashboard...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        icon={Layers}
        title="No Workspace Selected"
        description="Select or create a workspace to view your project dashboard."
      />
    );
  }

  const statCards = [
    {
      title: 'Total Boards',
      value: metrics?.totalBoards || 0,
      icon: Trello,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
      link: '/boards'
    },
    {
      title: 'Total Tasks',
      value: metrics?.totalTasks || 0,
      icon: CheckCircle2,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400',
      link: '/my-tasks'
    },
    {
      title: 'Assigned to Me',
      value: metrics?.assignedToMe || 0,
      icon: Flame,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
      link: '/my-tasks'
    },
    {
      title: 'Completed Tasks',
      value: metrics?.completedTasks || 0,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
    },
    {
      title: 'In Progress',
      value: metrics?.inProgressTasks || 0,
      icon: Clock,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400'
    },
    {
      title: 'Overdue Tasks',
      value: metrics?.overdueTasks || 0,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400'
    }
  ];

  const PIE_COLORS = ['#10B981', '#6366F1'];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            {currentWorkspace.name}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            Here is what’s happening with your team and active deliverables today.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => setIsCreateBoardOpen(true)}
            className="bg-white hover:bg-slate-100 text-indigo-900 font-semibold shadow-md"
            icon={Plus}
          >
            New Board
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            onClick={() => stat.link && navigate(stat.link)}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all ${
              stat.link ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {stat.title}
              </span>
              <div className={`p-2 rounded-xl ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown BarChart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Tasks by Priority
            </h3>
            <span className="text-xs text-slate-400">Total: {metrics?.totalTasks || 0}</span>
          </div>

          <div className="h-64 w-full">
            {charts?.priority && charts.priority.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.priority}>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No priority data available
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown Donut Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Completion Velocity
            </h3>
            <span className="text-xs text-slate-400">
              Completed vs Pending
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {charts?.completion && metrics?.totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.completion}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.completion.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-sm text-slate-400">
                Create tasks to visualize completion velocity
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Completed ({metrics?.completedTasks || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>Pending ({Math.max(0, (metrics?.totalTasks || 0) - (metrics?.completedTasks || 0))})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Upcoming Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Upcoming Deadlines
              </h3>
            </div>
            <Link
              to="/calendar"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Open Calendar
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No upcoming deadlines in the next 7 days.
              </p>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/boards/${task.board?._id || task.board}`)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {task.board?.name || 'Board'} • {task.list?.name || 'List'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={task.priority} size="sm">
                      {task.priority}
                    </Badge>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
                      {new Date(task.dueDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Workspace Activity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Team Activity
              </h3>
            </div>
            <Link
              to="/activity"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No activity recorded yet.
              </p>
            ) : (
              recentActivity.map((act) => (
                <div key={act._id} className="flex items-start gap-3">
                  <Avatar user={act.actor} size="sm" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                      <span className="font-semibold">{act.actor?.name || 'A user'}</span>{' '}
                      {act.description?.replace(act.actor?.name || '', '').trim()}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateBoardModal
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        workspaceId={currentWorkspace._id}
        onBoardCreated={() => fetchDashboardData()}
      />
    </div>
  );
};
