import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, Clock, Filter, Layers } from 'lucide-react';
import api from '../api/axios';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar } from '../components/common/Avatar';
import { EmptyState } from '../components/common/EmptyState';
import toast from 'react-hot-toast';

export const ActivityPage = () => {
  const { currentWorkspace } = useWorkspace();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const res = await api.get(
        `/activity/workspace/${currentWorkspace._id}?page=${page}&limit=25`
      );
      if (res.data.success) {
        setActivities(res.data.activities || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentWorkspace?._id, page]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Workspace Activity Audit
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A persistent chronological log of actions, movements, and updates across your workspace.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activity recorded yet"
          description="Actions performed in this workspace will appear in this timeline."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
            {activities.map((act) => (
              <div key={act._id} className="relative group">
                {/* Node icon on vertical line */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 group-hover:scale-125 transition-transform" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar user={act.actor} size="sm" className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {act.actor?.name || 'A user'}
                        </span>{' '}
                        {act.description?.replace(act.actor?.name || '', '').trim()}
                      </p>
                      {act.board && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          Board: {act.board.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
