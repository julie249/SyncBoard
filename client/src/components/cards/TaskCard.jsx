import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckSquare, MessageSquare, AlertCircle } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';

export const TaskCard = ({ card, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card._id,
    data: {
      type: 'Card',
      card
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  const completedChecklistCount = card.checklist?.filter((item) => item.completed).length || 0;
  const totalChecklistCount = card.checklist?.length || 0;

  const isOverdue =
    card.dueDate &&
    new Date(card.dueDate) < new Date();

  const formattedDueDate = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick && onClick(card)}
      className={`group relative bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'opacity-40 ring-2 ring-indigo-500 shadow-lg' : ''
      }`}
    >
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {card.labels.map((lbl, idx) => (
            <span
              key={lbl._id || idx}
              style={{ backgroundColor: `${lbl.color}20`, color: lbl.color }}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
        {card.title}
      </h4>

      {/* Description Snippet */}
      {card.description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {card.description}
        </p>
      )}

      {/* Card Footer: Badges, Due Date, Assignees */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority */}
          {card.priority && (
            <Badge variant={card.priority} size="sm">
              {card.priority}
            </Badge>
          )}

          {/* Checklist progress */}
          {totalChecklistCount > 0 && (
            <div
              className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                completedChecklistCount === totalChecklistCount
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedChecklistCount}/{totalChecklistCount}
              </span>
            </div>
          )}

          {/* Due Date */}
          {formattedDueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                isOverdue
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isOverdue ? (
                <AlertCircle className="w-3 h-3 text-rose-500" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>

        {/* Assigned Users Stacking */}
        {card.assignedTo && card.assignedTo.length > 0 && (
          <div className="flex items-center -space-x-1.5 overflow-hidden shrink-0">
            {card.assignedTo.map((u, i) => (
              <Avatar
                key={u._id || i}
                user={u}
                size="xs"
                className="ring-1 ring-white dark:ring-slate-900"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
