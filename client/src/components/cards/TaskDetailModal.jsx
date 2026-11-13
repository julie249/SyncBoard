import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Activity as ActivityIcon,
  Trash2,
  Plus,
  X,
  User,
  Tag,
  Clock,
  Send,
  CheckCircle2,
  Circle
} from 'lucide-react';

export const TaskDetailModal = ({ isOpen, onClose, cardId, onCardUpdated, onCardDeleted }) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { socket } = useSocket();

  const [card, setCard] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'

  // Label creator state
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366F1');
  const [showLabelCreator, setShowLabelCreator] = useState(false);

  // Deletion confirm
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCardDetails = async () => {
    if (!cardId) return;
    try {
      setLoading(true);
      const res = await api.get(`/cards/${cardId}`);
      if (res.data.success) {
        const c = res.data.card;
        setCard(c);
        setTitle(c.title || '');
        setDescription(c.description || '');
        setPriority(c.priority || 'Medium');
        setDueDate(c.dueDate ? new Date(c.dueDate).toISOString().split('T')[0] : '');
        setAssignedTo(c.assignedTo?.map((u) => u._id || u) || []);
        setComments(res.data.comments || []);
        setActivities(res.data.activities || []);
      }
    } catch (err) {
      console.error('Failed to load card details:', err);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && cardId) {
      fetchCardDetails();
    }
  }, [isOpen, cardId]);

  // Real-time socket listeners for comments and updates
  useEffect(() => {
    if (!socket || !cardId) return;

    const handleCommentCreated = ({ cardId: targetCardId, comment }) => {
      if (targetCardId === cardId) {
        setComments((prev) => {
          if (prev.some((c) => c._id === comment._id)) return prev;
          return [...prev, comment];
        });
      }
    };

    const handleCommentDeleted = ({ cardId: targetCardId, commentId }) => {
      if (targetCardId === cardId) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    };

    const handleCardUpdated = (updatedCard) => {
      if (updatedCard._id === cardId) {
        setCard(updatedCard);
        setTitle(updatedCard.title || '');
        setDescription(updatedCard.description || '');
        setPriority(updatedCard.priority || 'Medium');
        setDueDate(updatedCard.dueDate ? new Date(updatedCard.dueDate).toISOString().split('T')[0] : '');
        setAssignedTo(updatedCard.assignedTo?.map((u) => u._id || u) || []);
      }
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('card:updated', handleCardUpdated);

    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('card:updated', handleCardUpdated);
    };
  }, [socket, cardId]);

  const handleSaveField = async (fieldsToUpdate) => {
    try {
      const res = await api.put(`/cards/${cardId}`, fieldsToUpdate);
      if (res.data.success) {
        setCard(res.data.card);
        if (onCardUpdated) onCardUpdated(res.data.card);
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    try {
      const res = await api.post(`/cards/${cardId}/checklist`, {
        title: newChecklistTitle.trim()
      });
      if (res.data.success) {
        setCard(res.data.card);
        setNewChecklistTitle('');
        if (onCardUpdated) onCardUpdated(res.data.card);
      }
    } catch (err) {
      toast.error('Failed to add checklist item');
    }
  };

  const handleToggleChecklist = async (itemId, completed) => {
    try {
      const res = await api.put(`/cards/${cardId}/checklist/${itemId}`, {
        completed: !completed
      });
      if (res.data.success) {
        setCard(res.data.card);
        if (onCardUpdated) onCardUpdated(res.data.card);
      }
    } catch (err) {
      toast.error('Failed to toggle checklist item');
    }
  };

  const handleDeleteChecklist = async (itemId) => {
    try {
      const res = await api.delete(`/cards/${cardId}/checklist/${itemId}`);
      if (res.data.success) {
        setCard(res.data.card);
        if (onCardUpdated) onCardUpdated(res.data.card);
      }
    } catch (err) {
      toast.error('Failed to delete checklist item');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/comments/card/${cardId}`, {
        content: newComment.trim()
      });
      if (res.data.success) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment('');
      }
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        toast.success('Comment deleted');
      }
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;
    const currentLabels = card.labels || [];
    const updated = [
      ...currentLabels,
      { name: newLabelName.trim(), color: newLabelColor }
    ];
    setNewLabelName('');
    setShowLabelCreator(false);
    await handleSaveField({ labels: updated });
  };

  const handleRemoveLabel = async (indexToRemove) => {
    const updated = card.labels.filter((_, idx) => idx !== indexToRemove);
    await handleSaveField({ labels: updated });
  };

  const handleToggleAssignee = async (memberUserId) => {
    const isCurrentlyAssigned = assignedTo.includes(memberUserId);
    const updated = isCurrentlyAssigned
      ? assignedTo.filter((id) => id !== memberUserId)
      : [...assignedTo, memberUserId];

    setAssignedTo(updated);
    await handleSaveField({ assignedTo: updated });
  };

  const handleDeleteCard = async () => {
    try {
      setIsDeleting(true);
      const res = await api.delete(`/cards/${cardId}`);
      if (res.data.success) {
        toast.success('Task deleted');
        setIsDeleteOpen(false);
        onClose();
        if (onCardDeleted) onCardDeleted(cardId);
      }
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!card && loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Loading task details...</p>
        </div>
      </Modal>
    );
  }

  if (!card) return null;

  const completedChecklistCount = card.checklist?.filter((item) => item.completed).length || 0;
  const totalChecklistCount = card.checklist?.length || 0;
  const checklistProgress =
    totalChecklistCount > 0
      ? Math.round((completedChecklistCount / totalChecklistCount) * 100)
      : 0;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
        {/* Header Breadcrumb and Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>List:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {card.list?.name || 'List'}
            </span>
          </div>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Task
          </button>
        </div>

        {/* Title Input */}
        <div className="mt-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleSaveField({ title })}
            placeholder="Task title..."
            className="w-full text-lg font-bold text-slate-900 dark:text-white bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:ring-0 px-1 py-1 rounded-none transition-colors"
          />
        </div>

        {/* Main Grid: Details (Left 2/3) vs Metadata Sidebar (Right 1/3) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-5">
            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSaveField({ description })}
                placeholder="Add more detail to this task..."
                className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Checklist
                  </label>
                </div>
                {totalChecklistCount > 0 && (
                  <span className="text-xs font-medium text-slate-500">
                    {checklistProgress}%
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {totalChecklistCount > 0 && (
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              )}

              {/* Checklist Items */}
              <div className="space-y-1.5">
                {card.checklist?.map((item) => (
                  <div
                    key={item._id}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(item._id, item.completed)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`text-sm break-words ${
                          item.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteChecklist(item._id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add checklist item form */}
              <form onSubmit={handleAddChecklist} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="Add a checklist item..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button type="submit" size="sm" variant="secondary">
                  Add
                </Button>
              </form>
            </div>

            {/* Comments & Activity Tabs */}
            <div className="pt-2">
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-3">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-1.5 pb-2 px-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Comments ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-1.5 pb-2 px-2 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === 'activity'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ActivityIcon className="w-3.5 h-3.5" />
                  Activity History
                </button>
              </div>

              {/* Comments Feed */}
              {activeTab === 'comments' && (
                <div className="space-y-3">
                  {/* Add comment input */}
                  <form onSubmit={handleAddComment} className="flex items-start gap-2.5">
                    <Avatar user={user} size="sm" />
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <Button type="submit" size="sm" icon={Send}>
                        Post
                      </Button>
                    </div>
                  </form>

                  {/* List of comments */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pt-2">
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      comments.map((c) => (
                        <div key={c._id} className="flex items-start gap-2.5 group">
                          <Avatar user={c.author} size="sm" />
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                {c.author?.name || 'User'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">
                                  {new Date(c.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {c.author?._id === user?._id && (
                                  <button
                                    onClick={() => handleDeleteComment(c._id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 break-words leading-relaxed">
                              {c.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Activity History Feed */}
              {activeTab === 'activity' && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No activity recorded for this task.
                    </p>
                  ) : (
                    activities.map((act) => (
                      <div key={act._id} className="flex items-center gap-2 text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <Avatar user={act.actor} size="xs" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {act.description}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                          {new Date(act.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata & Controls */}
          <div className="space-y-5 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  handleSaveField({ priority: e.target.value });
                }}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
            </div>

            {/* Due Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleSaveField({ dueDate: e.target.value || null });
                }}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Assignees Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Assignees
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {currentWorkspace?.members?.map((m) => {
                  const mUser = m.user;
                  const mId = mUser?._id || mUser;
                  const isAssigned = assignedTo.includes(mId);

                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => handleToggleAssignee(mId)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-colors ${
                        isAssigned
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar user={mUser} size="xs" />
                        <span className="truncate">{mUser?.name || 'Member'}</span>
                      </div>
                      {isAssigned && <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Labels Manager */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Labels
                </label>
                <button
                  onClick={() => setShowLabelCreator(!showLabelCreator)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  + Add
                </button>
              </div>

              {/* Labels list */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {card.labels?.map((lbl, idx) => (
                  <span
                    key={idx}
                    style={{ backgroundColor: `${lbl.color}25`, color: lbl.color }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                  >
                    {lbl.name}
                    <button
                      onClick={() => handleRemoveLabel(idx)}
                      className="hover:opacity-75"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* New Label Creator */}
              {showLabelCreator && (
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label title..."
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-2">
                    {['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewLabelColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full transition-transform ${
                            newLabelColor === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-1' : ''
                          }`}
                        />
                      )
                    )}
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowLabelCreator(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddLabel}>
                      Add Label
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCard}
        isLoading={isDeleting}
        title="Delete this task?"
        message="This task and all associated comments, checklist items, and activity will be permanently removed."
        confirmText="Yes, delete task"
      />
    </>
  );
};
