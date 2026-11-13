import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export const FilterBar = ({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  members = [],
  onClearFilters
}) => {
  const hasActiveFilters = Boolean(search || priority || assignee);

  return (
    <div className="flex flex-wrap items-center gap-2.5 py-2">
      {/* Search Bar */}
      <div className="relative min-w-[180px] sm:min-w-[220px]">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter tasks..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Priority Dropdown */}
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
      </select>

      {/* Assignee Dropdown */}
      {members.length > 0 && (
        <select
          value={assignee}
          onChange={(e) => onAssigneeChange(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Members</option>
          {members.map((m) => {
            const mUser = m.user;
            const mId = mUser?._id || mUser;
            return (
              <option key={mId} value={mId}>
                {mUser?.name || 'Member'}
              </option>
            );
          })}
        </select>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium px-2 py-1 flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
    </div>
  );
};
