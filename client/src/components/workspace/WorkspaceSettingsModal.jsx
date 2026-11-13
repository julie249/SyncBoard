import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';
import { InviteMemberModal } from './InviteMemberModal';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Users, Settings, Trash2, UserPlus, Shield, UserX } from 'lucide-react';

export const WorkspaceSettingsModal = ({ isOpen, onClose }) => {
  const { currentWorkspace, updateWorkspace, deleteWorkspace, isWorkspaceAdmin, fetchWorkspaces } =
    useWorkspace();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'members'
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [description, setDescription] = useState(currentWorkspace?.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!currentWorkspace) return null;

  const isOwner =
    currentWorkspace.owner?._id === user?._id ||
    currentWorkspace.owner === user?._id;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsUpdating(true);
    await updateWorkspace(currentWorkspace._id, name, description);
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deleteWorkspace(currentWorkspace._id);
    setIsDeleting(false);
    if (res.success) {
      setIsDeleteOpen(false);
      onClose();
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await api.put(`/workspaces/${currentWorkspace._id}/members/role`, {
        targetUserId,
        role: newRole
      });
      if (res.data.success) {
        toast.success('Member role updated');
        fetchWorkspaces();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    try {
      const res = await api.delete(`/workspaces/${currentWorkspace._id}/members`, {
        data: { targetUserId }
      });
      if (res.data.success) {
        toast.success('Member removed from workspace');
        fetchWorkspaces();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Workspace Settings" maxWidth="max-w-2xl">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Members ({currentWorkspace.members?.length || 1})
          </button>
        </div>

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                required
                disabled={!isWorkspaceAdmin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                disabled={!isWorkspaceAdmin}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            {isWorkspaceAdmin && (
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isUpdating}>
                  Save Changes
                </Button>
              </div>
            )}

            {/* Danger Zone */}
            {isOwner && (
              <div className="mt-8 pt-6 border-t border-rose-100 dark:border-rose-950/50">
                <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  Danger Zone
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Permanently delete this workspace and all associated boards, lists, cards, and activity.
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete Workspace
                  </Button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Tab 2: Members Management */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Collaborate with team members across boards in this workspace.
              </p>
              {isWorkspaceAdmin && (
                <Button
                  size="sm"
                  icon={UserPlus}
                  onClick={() => setIsInviteOpen(true)}
                >
                  Invite Member
                </Button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {currentWorkspace.members?.map((m) => {
                const memberUser = m.user;
                const memberUserId = memberUser?._id || memberUser;
                const isMemberOwner =
                  currentWorkspace.owner?._id === memberUserId ||
                  currentWorkspace.owner === memberUserId;
                const isCurrentSelf = user?._id === memberUserId;

                return (
                  <div
                    key={memberUserId}
                    className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={memberUser} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {memberUser?.name || 'User'}
                          </p>
                          {isMemberOwner && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Owner
                            </span>
                          )}
                          {isCurrentSelf && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              (You)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {memberUser?.email || ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isWorkspaceAdmin && !isMemberOwner ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(memberUserId, e.target.value)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize flex items-center gap-1">
                          {m.role === 'admin' && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                          {isMemberOwner ? 'Owner' : m.role}
                        </span>
                      )}

                      {isWorkspaceAdmin && !isMemberOwner && !isCurrentSelf && (
                        <button
                          onClick={() => handleRemoveMember(memberUserId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={currentWorkspace._id}
        onInviteSuccess={fetchWorkspaces}
      />

      {/* Delete Workspace Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={`Delete "${currentWorkspace.name}"?`}
        message="This will immediately and permanently delete this workspace and all boards, lists, tasks, comments, and activity within it. This action cannot be reversed."
        confirmText="Yes, delete workspace"
      />
    </>
  );
};
