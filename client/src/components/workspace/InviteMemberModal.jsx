import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Mail, Shield, User } from 'lucide-react';

export const InviteMemberModal = ({ isOpen, onClose, workspaceId, onInviteSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || !workspaceId) return;

    try {
      setIsLoading(true);
      const res = await api.post(`/workspaces/${workspaceId}/invite`, {
        email: email.trim(),
        role
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Invitation sent successfully!');
        setEmail('');
        setRole('member');
        onClose();
        if (onInviteSuccess) onInviteSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member" maxWidth="max-w-md">
      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Role & Permissions
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('member')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                role === 'member'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs">
                <User className="w-4 h-4 text-indigo-600" />
                Member
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Can create and move cards, view boards, and comment.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                role === 'admin'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs">
                <Shield className="w-4 h-4 text-indigo-600" />
                Admin
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Full access: invite/remove members, manage boards & settings.
              </p>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
