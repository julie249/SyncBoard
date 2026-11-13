import React, { useState, useEffect } from 'react';
import { Plus, Search, Star, Archive, Layers } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSocket } from '../context/SocketContext';
import { BoardCard } from '../components/boards/BoardCard';
import { CreateBoardModal } from '../components/boards/CreateBoardModal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const BoardsPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { socket } = useSocket();

  const [boards, setBoards] = useState([]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchBoards = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (showArchived) params.append('archived', 'true');

      const res = await api.get(`/boards/workspace/${currentWorkspace._id}?${params.toString()}`);
      if (res.data.success) {
        setBoards(res.data.boards || []);
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [currentWorkspace?._id, search, showArchived]);

  // Real-time socket events for boards
  useEffect(() => {
    if (!socket || !currentWorkspace) return;

    const handleBoardCreated = (newBoard) => {
      setBoards((prev) => [newBoard, ...prev]);
    };

    const handleBoardUpdated = (updatedBoard) => {
      setBoards((prev) => prev.map((b) => (b._id === updatedBoard._id ? updatedBoard : b)));
    };

    const handleBoardDeleted = ({ boardId }) => {
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    };

    socket.on('board:created', handleBoardCreated);
    socket.on('board:updated', handleBoardUpdated);
    socket.on('board:deleted', handleBoardDeleted);

    return () => {
      socket.off('board:created', handleBoardCreated);
      socket.off('board:updated', handleBoardUpdated);
      socket.off('board:deleted', handleBoardDeleted);
    };
  }, [socket, currentWorkspace?._id]);

  const handleToggleStar = async (boardId) => {
    try {
      const res = await api.post(`/boards/${boardId}/star`);
      if (res.data.success) {
        setBoards((prev) =>
          prev.map((b) => (b._id === boardId ? { ...b, starredBy: res.data.starredBy } : b))
        );
      }
    } catch (err) {
      toast.error('Failed to update star');
    }
  };

  const starredBoards = boards.filter((b) => b.starredBy?.length > 0);
  const regularBoards = boards.filter((b) => !b.starredBy || b.starredBy.length === 0);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Boards
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create and manage boards to organize sprints, products, and deliverables.
          </p>
        </div>

        <Button icon={Plus} onClick={() => setIsCreateOpen(true)}>
          Create Board
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boards by name..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            showArchived
              ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
              : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          {showArchived ? 'Viewing Archived' : 'Show Archived'}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : boards.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={search ? 'No boards found' : 'No boards yet'}
          description={
            search
              ? 'No boards matched your search query. Try another term.'
              : 'Get started by creating your first collaboration board in this workspace.'
          }
          actionText={!search ? 'Create Board' : undefined}
          onAction={!search ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-8">
          {/* Starred Boards */}
          {starredBoards.length > 0 && !search && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Starred Boards
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {starredBoards.map((board) => (
                  <BoardCard
                    key={board._id}
                    board={board}
                    onToggleStar={handleToggleStar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Boards Grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {starredBoards.length > 0 && !search ? 'All Boards' : 'Boards'} ({boards.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(starredBoards.length > 0 && !search ? regularBoards : boards).map((board) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {currentWorkspace && (
        <CreateBoardModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          workspaceId={currentWorkspace._id}
          onBoardCreated={(newBoard) => setBoards((prev) => [newBoard, ...prev])}
        />
      )}
    </div>
  );
};
