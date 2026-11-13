import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from '../cards/TaskCard';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
import { Plus, MoreHorizontal, Trash2, Edit2, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const ListColumn = ({ list, cards, onCardClick, onListUpdated, onListDeleted, onCardCreated }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.name);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: list._id,
    data: {
      type: 'List',
      list
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  const handleTitleSubmit = async () => {
    if (!listTitle.trim() || listTitle === list.name) {
      setIsEditingTitle(false);
      setListTitle(list.name);
      return;
    }
    try {
      const res = await api.put(`/lists/${list._id}`, { name: listTitle.trim() });
      if (res.data.success) {
        setIsEditingTitle(false);
        if (onListUpdated) onListUpdated(res.data.list);
      }
    } catch (err) {
      toast.error('Failed to update list name');
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    try {
      setIsSubmittingCard(true);
      const res = await api.post(`/cards/board/${list.board}`, {
        title: newCardTitle.trim(),
        listId: list._id
      });
      if (res.data.success) {
        setNewCardTitle('');
        setIsAddingCard(false);
        if (onCardCreated) onCardCreated(res.data.card);
      }
    } catch (err) {
      toast.error('Failed to create card');
    } finally {
      setIsSubmittingCard(false);
    }
  };

  const handleDeleteList = async () => {
    try {
      const res = await api.delete(`/lists/${list._id}`);
      if (res.data.success) {
        toast.success('List deleted');
        setIsDeleteOpen(false);
        if (onListDeleted) onListDeleted(list._id);
      }
    } catch (err) {
      toast.error('Failed to delete list');
    }
  };

  const cardIds = cards.map((c) => c._id);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`w-72 sm:w-80 shrink-0 flex flex-col bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 max-h-[calc(100vh-12rem)] shadow-sm ${
          isDragging ? 'opacity-50 ring-2 ring-indigo-500' : ''
        }`}
      >
        {/* List Header */}
        <div
          {...attributes}
          {...listeners}
          className="p-3.5 flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setListTitle(list.name);
                  }
                }}
                className="w-full text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-indigo-500 focus:outline-none"
              />
            ) : (
              <h3
                onClick={() => setIsEditingTitle(true)}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {list.name}
              </h3>
            )}
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
              {cards.length}
            </span>
          </div>

          <button
            onClick={() => setIsDeleteOpen(true)}
            className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Delete List"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cards Container with SortableContext */}
        <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5 min-h-[50px]">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <TaskCard key={card._id} card={card} onClick={onCardClick} />
            ))}
          </SortableContext>
        </div>

        {/* Footer: Add Card Button or Form */}
        <div className="p-2.5 pt-0">
          {isAddingCard ? (
            <form onSubmit={handleCreateCard} className="space-y-2">
              <textarea
                autoFocus
                rows={2}
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateCard(e);
                  }
                  if (e.key === 'Escape') {
                    setIsAddingCard(false);
                  }
                }}
                placeholder="Enter a title for this card..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
              />
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" isLoading={isSubmittingCard}>
                  Add Card
                </Button>
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCard(true)}
              className="w-full flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add a card
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteList}
        title={`Delete list "${list.name}"?`}
        message="This will delete the list and all tasks contained inside it. Are you sure?"
        confirmText="Yes, delete list"
      />
    </>
  );
};
