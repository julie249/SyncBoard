import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Briefcase, Settings } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const WorkspaceSwitcher = ({ onOpenSettings }) => {
  const { workspaces, currentWorkspace, selectWorkspace, createWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setIsSubmitting(true);
    const res = await createWorkspace(newWsName, newWsDesc);
    setIsSubmitting(false);
    if (res.success) {
      setNewWsName('');
      setNewWsDesc('');
      setIsCreateOpen(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-all text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {currentWorkspace ? currentWorkspace.name[0].toUpperCase() : 'W'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Workspace</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Your Workspaces
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {workspaces.map((ws) => {
                const isSelected = ws._id === currentWorkspace?._id;
                return (
                  <button
                    key={ws._id}
                    onClick={() => {
                      selectWorkspace(ws._id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      isSelected
                        ? 'font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {ws.name[0].toUpperCase()}
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Workspace
              </button>
              {onOpenSettings && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Workspace Settings
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Workspace"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="e.g. Design Team, Mobile App"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={newWsDesc}
              onChange={(e) => setNewWsDesc(e.target.value)}
              placeholder="What does your team work on in this workspace?"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
