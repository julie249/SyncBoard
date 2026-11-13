import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const CreateBoardModal = ({ isOpen, onClose, workspaceId, onBoardCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [background, setBackground] = useState('#4F46E5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    '#4F46E5', // Indigo
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#0F172A'  // Slate dark
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;

    try {
      setIsSubmitting(true);
      const res = await api.post(`/boards/workspace/${workspaceId}`, {
        name: name.trim(),
        description: description.trim(),
        background
      });

      if (res.data.success) {
        toast.success(`Board "${res.data.board.name}" created!`);
        setName('');
        setDescription('');
        setBackground('#4F46E5');
        onClose();
        if (onBoardCreated) onBoardCreated(res.data.board);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create board');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Board" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Color Preview */}
        <div
          className="h-20 w-full rounded-xl transition-colors duration-200 shadow-inner flex items-center justify-center text-white font-semibold text-sm shadow-slate-900/10"
          style={{ backgroundColor: background }}
        >
          {name || 'Board Preview'}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Board Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q4 Sprint, Website Launch"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short overview of this board's purpose..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Background Theme
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBackground(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  background === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Board
          </Button>
        </div>
      </form>
    </Modal>
  );
};
