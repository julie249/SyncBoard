import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Layers } from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const BoardCard = ({ board, onToggleStar }) => {
  const navigate = useNavigate();
  const isStarred = board.starredBy?.length > 0; // or checked against user

  return (
    <div
      onClick={() => navigate(`/boards/${board._id}`)}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      {/* Top Banner with custom background color */}
      <div
        className="h-20 w-full relative p-3 flex items-start justify-between"
        style={{
          background: board.background.startsWith('#')
            ? `linear-gradient(135deg, ${board.background}, ${board.background}dd)`
            : board.background
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
          <Layers className="w-4 h-4" />
        </div>

        {onToggleStar && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(board._id);
            }}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                isStarred ? 'fill-amber-400 text-amber-400' : 'text-white/80'
              }`}
            />
          </button>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {board.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {board.description || 'No description provided'}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date(board.updatedAt || board.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>

          {board.createdBy && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">by</span>
              <Avatar user={board.createdBy} size="xs" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
