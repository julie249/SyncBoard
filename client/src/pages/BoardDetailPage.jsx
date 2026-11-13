import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import {
  Star,
  Plus,
  ArrowLeft,
  Users,
  Settings,
  MoreHorizontal,
  X
} from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { ListColumn } from '../components/lists/ListColumn';
import { TaskCard } from '../components/cards/TaskCard';
import { TaskDetailModal } from '../components/cards/TaskDetailModal';
import { FilterBar } from '../components/boards/FilterBar';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import toast from 'react-hot-toast';

export const BoardDetailPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { socket, joinBoard, leaveBoard } = useSocket();
  const { currentWorkspace } = useWorkspace();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active drag items for DragOverlay
  const [activeCard, setActiveCard] = useState(null);

  // Selected card for modal details
  const [selectedCardId, setSelectedCardId] = useState(null);

  // New list creator
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isSubmittingList, setIsSubmittingList] = useState(false);

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  // Setup dnd-kit sensors with distance threshold so click opens modal
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  const fetchBoardData = useCallback(async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      const res = await api.get(`/boards/${boardId}`);
      if (res.data.success) {
        setBoard(res.data.board);
        setLists(res.data.lists || []);
        setCards(res.data.cards || []);
      }
    } catch (err) {
      console.error('Failed to load board:', err);
      toast.error('Failed to load board details');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Real-time socket collaboration
  useEffect(() => {
    if (!socket || !boardId) return;

    joinBoard(boardId);

    // Socket Event Handlers
    const handleCardCreated = (newCard) => {
      setCards((prev) => {
        if (prev.some((c) => c._id === newCard._id)) return prev;
        return [...prev, newCard];
      });
    };

    const handleCardUpdated = (updatedCard) => {
      setCards((prev) =>
        prev.map((c) => (c._id === updatedCard._id ? updatedCard : c))
      );
    };

    const handleCardMoved = ({ card: movedCard, sourceListId, destinationListId, newPosition }) => {
      setCards((prev) => {
        const withoutOld = prev.filter((c) => c._id !== movedCard._id);
        return [...withoutOld, movedCard];
      });
    };

    const handleCardDeleted = ({ cardId: deletedId }) => {
      setCards((prev) => prev.filter((c) => c._id !== deletedId));
    };

    const handleListCreated = (newList) => {
      setLists((prev) => {
        if (prev.some((l) => l._id === newList._id)) return prev;
        return [...prev, newList];
      });
    };

    const handleListUpdated = (updatedList) => {
      setLists((prev) =>
        prev.map((l) => (l._id === updatedList._id ? updatedList : l))
      );
    };

    const handleListReordered = ({ lists: newOrderedLists }) => {
      setLists(newOrderedLists);
    };

    const handleListDeleted = ({ listId: deletedListId }) => {
      setLists((prev) => prev.filter((l) => l._id !== deletedListId));
      setCards((prev) => prev.filter((c) => c.list !== deletedListId));
    };

    const handleBoardUpdated = (updatedBoard) => {
      setBoard(updatedBoard);
    };

    socket.on('card:created', handleCardCreated);
    socket.on('card:updated', handleCardUpdated);
    socket.on('card:moved', handleCardMoved);
    socket.on('card:deleted', handleCardDeleted);
    socket.on('list:created', handleListCreated);
    socket.on('list:updated', handleListUpdated);
    socket.on('list:reordered', handleListReordered);
    socket.on('list:deleted', handleListDeleted);
    socket.on('board:updated', handleBoardUpdated);

    return () => {
      leaveBoard(boardId);
      socket.off('card:created', handleCardCreated);
      socket.off('card:updated', handleCardUpdated);
      socket.off('card:moved', handleCardMoved);
      socket.off('card:deleted', handleCardDeleted);
      socket.off('list:created', handleListCreated);
      socket.off('list:updated', handleListUpdated);
      socket.off('list:reordered', handleListReordered);
      socket.off('list:deleted', handleListDeleted);
      socket.off('board:updated', handleBoardUpdated);
    };
  }, [socket, boardId, joinBoard, leaveBoard]);

  // Drag and Drop Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const activeData = active.data.current;
    if (activeData?.type === 'Card') {
      setActiveCard(activeData.card);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === 'Card';
    const isOverACard = over.data.current?.type === 'Card';
    const isOverAList = over.data.current?.type === 'List';

    if (!isActiveACard) return;

    // Moving card over another card
    if (isOverACard) {
      setCards((prevCards) => {
        const activeIndex = prevCards.findIndex((c) => c._id === activeId);
        const overIndex = prevCards.findIndex((c) => c._id === overId);

        if (activeIndex === -1 || overIndex === -1) return prevCards;

        if (prevCards[activeIndex].list !== prevCards[overIndex].list) {
          const updated = [...prevCards];
          updated[activeIndex] = {
            ...updated[activeIndex],
            list: prevCards[overIndex].list
          };
          return arrayMove(updated, activeIndex, overIndex);
        }

        return arrayMove(prevCards, activeIndex, overIndex);
      });
    }

    // Moving card over an empty list column
    if (isOverAList) {
      setCards((prevCards) => {
        const activeIndex = prevCards.findIndex((c) => c._id === activeId);
        if (activeIndex === -1) return prevCards;

        if (prevCards[activeIndex].list !== overId) {
          const updated = [...prevCards];
          updated[activeIndex] = {
            ...updated[activeIndex],
            list: overId
          };
          return updated;
        }

        return prevCards;
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeCardItem = cards.find((c) => c._id === activeId);
    if (!activeCardItem) return;

    // Determine target list ID
    let targetListId = activeCardItem.list;
    if (over.data.current?.type === 'List') {
      targetListId = over.id;
    } else if (over.data.current?.type === 'Card') {
      targetListId = over.data.current.card.list;
    }

    // Get all cards in that target list sorted by current order
    const listCards = cards.filter((c) => c.list === targetListId);
    const cardIndexInList = listCards.findIndex((c) => c._id === activeId);

    // Calculate new position
    let newPosition = 1000;
    if (listCards.length > 1) {
      if (cardIndexInList === 0) {
        newPosition = Math.max(10, listCards[1].position / 2);
      } else if (cardIndexInList === listCards.length - 1) {
        newPosition = listCards[listCards.length - 2].position + 1000;
      } else {
        const prevCardPos = listCards[cardIndexInList - 1].position;
        const nextCardPos = listCards[cardIndexInList + 1].position;
        newPosition = (prevCardPos + nextCardPos) / 2;
      }
    }

    try {
      await api.put(`/cards/${activeId}/move`, {
        targetListId,
        newPosition,
        orderedCardIds: listCards.map((c) => c._id)
      });
    } catch (err) {
      console.error('Failed to persist card movement:', err);
      toast.error('Failed to sync card position');
      fetchBoardData(); // Rollback
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      setIsSubmittingList(true);
      const res = await api.post(`/lists/board/${boardId}`, {
        name: newListTitle.trim()
      });
      if (res.data.success) {
        setLists((prev) => [...prev, res.data.list]);
        setNewListTitle('');
        setIsAddingList(false);
        toast.success(`List "${res.data.list.name}" created`);
      }
    } catch (err) {
      toast.error('Failed to create list');
    } finally {
      setIsSubmittingList(false);
    }
  };

  const handleToggleStar = async () => {
    try {
      const res = await api.post(`/boards/${boardId}/star`);
      if (res.data.success) {
        setBoard((prev) => ({ ...prev, starredBy: res.data.starredBy }));
      }
    } catch (err) {
      toast.error('Failed to star board');
    }
  };

  // Filter cards based on search, priority, assignee
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (filterSearch && !card.title.toLowerCase().includes(filterSearch.toLowerCase())) {
        return false;
      }
      if (filterPriority && card.priority !== filterPriority) {
        return false;
      }
      if (filterAssignee) {
        const isAssigned = card.assignedTo?.some(
          (u) => (u._id || u) === filterAssignee
        );
        if (!isAssigned) return false;
      }
      return true;
    });
  }, [cards, filterSearch, filterPriority, filterAssignee]);

  const listIds = lists.map((l) => l._id);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Board not found or has been removed.</p>
        <Button onClick={() => navigate('/boards')} className="mt-4">
          Back to Boards
        </Button>
      </div>
    );
  }

  const isStarred = board.starredBy?.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -mt-2 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Board Header Bar */}
      <div
        className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-white shrink-0 shadow-sm"
        style={{
          background: board.background.startsWith('#')
            ? `linear-gradient(135deg, ${board.background}, ${board.background}e6)`
            : board.background
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/boards')}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white transition-colors shrink-0"
              title="Back to boards"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold truncate">
                  {board.name}
                </h1>
                <button
                  onClick={handleToggleStar}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${
                      isStarred ? 'fill-amber-400 text-amber-400' : 'text-white/80'
                    }`}
                  />
                </button>
              </div>
              {board.description && (
                <p className="text-xs text-white/80 truncate max-w-lg">
                  {board.description}
                </p>
              )}
            </div>
          </div>

          {/* Collaborator Avatars */}
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {currentWorkspace?.members?.map((m, idx) => (
                <Avatar
                  key={idx}
                  user={m.user}
                  size="xs"
                  className="ring-2 ring-white/30"
                />
              ))}
            </div>
            <span className="text-xs font-medium text-white/90 ml-1">
              {currentWorkspace?.members?.length || 1} members
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-3 pt-2 border-t border-white/20">
          <FilterBar
            search={filterSearch}
            onSearchChange={setFilterSearch}
            priority={filterPriority}
            onPriorityChange={setFilterPriority}
            assignee={filterAssignee}
            onAssigneeChange={setFilterAssignee}
            members={currentWorkspace?.members || []}
            onClearFilters={() => {
              setFilterSearch('');
              setFilterPriority('');
              setFilterAssignee('');
            }}
          />
        </div>
      </div>

      {/* Board Canvas (Horizontal scrolling container) */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden bg-slate-50 dark:bg-slate-950">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-5 h-full pb-4">
            <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => {
                const columnCards = filteredCards
                  .filter((card) => card.list === list._id)
                  .sort((a, b) => a.position - b.position);

                return (
                  <ListColumn
                    key={list._id}
                    list={list}
                    cards={columnCards}
                    onCardClick={(card) => setSelectedCardId(card._id)}
                    onListUpdated={(updated) =>
                      setLists((prev) =>
                        prev.map((l) => (l._id === updated._id ? updated : l))
                      )
                    }
                    onListDeleted={(deletedId) =>
                      setLists((prev) => prev.filter((l) => l._id !== deletedId))
                    }
                    onCardCreated={(newCard) =>
                      setCards((prev) => [...prev, newCard])
                    }
                  />
                );
              })}
            </SortableContext>

            {/* Add List Column Button / Inline Form */}
            <div className="w-72 sm:w-80 shrink-0">
              {isAddingList ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
                  <input
                    type="text"
                    autoFocus
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Enter list title..."
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateList(e);
                      if (e.key === 'Escape') setIsAddingList(false);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateList}
                      isLoading={isSubmittingList}
                    >
                      Add List
                    </Button>
                    <button
                      onClick={() => setIsAddingList(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="w-full flex items-center gap-2 p-3.5 rounded-2xl bg-slate-200/60 dark:bg-slate-900/40 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-800 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Plus className="w-4 h-4 text-indigo-500" />
                  Add another list
                </button>
              )}
            </div>
          </div>

          {/* Drag Overlay Preview */}
          <DragOverlay>
            {activeCard ? <TaskCard card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Details Modal */}
      {selectedCardId && (
        <TaskDetailModal
          isOpen={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
          cardId={selectedCardId}
          onCardUpdated={(updated) =>
            setCards((prev) =>
              prev.map((c) => (c._id === updated._id ? updated : c))
            )
          }
          onCardDeleted={(deletedId) => {
            setCards((prev) => prev.filter((c) => c._id !== deletedId));
            setSelectedCardId(null);
          }}
        />
      )}
    </div>
  );
};
