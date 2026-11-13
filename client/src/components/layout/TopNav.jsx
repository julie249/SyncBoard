import React from 'react';
import { Menu, Search } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

export const TopNav = ({ onToggleMobile }) => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {currentWorkspace && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Workspace
            </span>
            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
              {currentWorkspace.name}
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <Avatar user={user} size="sm" />
          <span className="hidden md:inline-block text-xs font-medium text-slate-700 dark:text-slate-300">
            {user?.name?.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  );
};
