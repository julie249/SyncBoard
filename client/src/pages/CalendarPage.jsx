import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useWorkspace } from '../context/WorkspaceContext';
import { TaskDetailModal } from '../components/cards/TaskDetailModal';
import { Badge } from '../components/common/Badge';
import toast from 'react-hot-toast';

export const CalendarPage = () => {
  const { currentWorkspace } = useWorkspace();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Calculate days in month and starting day of week
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fetchCalendarTasks = async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      // Range: start of month to end of month
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const res = await api.get(
        `/calendar/workspace/${currentWorkspace._id}?start=${start}&end=${end}`
      );
      if (res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load calendar tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, [currentWorkspace?._id, year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map tasks by day number (1 to daysInMonth)
  const tasksByDay = useMemoTasksByDay(tasks, year, month);

  function useMemoTasksByDay(taskList, y, m) {
    const map = {};
    taskList.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (d.getFullYear() === y && d.getMonth() === m) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    });
    return map;
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {monthName} {year}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} scheduled this month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[110px] p-2 bg-slate-50/40 dark:bg-slate-950/20"
            />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNumber = idx + 1;
            const dayTasks = tasksByDay[dayNumber] || [];
            const isToday = isCurrentMonth && today.getDate() === dayNumber;

            return (
              <div
                key={`day-${dayNumber}`}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                  isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNumber}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Task Chips */}
                <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                  {dayTasks.map((t) => {
                    const isCompleted = t.list?.name?.toLowerCase().includes('done');
                    const isOverdue =
                      new Date(t.dueDate) < today && !isCompleted;

                    return (
                      <button
                        key={t._id}
                        onClick={() => setSelectedCardId(t._id)}
                        className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-medium truncate transition-colors flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                            : isOverdue
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 hover:bg-indigo-100'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                        ) : isOverdue ? (
                          <AlertCircle className="w-2.5 h-2.5 shrink-0 text-rose-600" />
                        ) : null}
                        <span className="truncate">{t.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCardId && (
        <TaskDetailModal
          isOpen={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
          cardId={selectedCardId}
          onCardUpdated={() => fetchCalendarTasks()}
          onCardDeleted={() => {
            fetchCalendarTasks();
            setSelectedCardId(null);
          }}
        />
      )}
    </div>
  );
};
