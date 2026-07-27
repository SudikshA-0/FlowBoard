import { useState, useEffect } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import TaskForm from './TaskForm';
import PriorityBadge from '../ui/PriorityBadge';
import StatusBadge from '../ui/StatusBadge';
import CommentsPanel from '../comments/CommentsPanel';
import { useTasks } from '../../context/TaskContext';
import { getDelayRiskDisplay } from '../../services/mlApi';

export default function TaskDetailModal({ task, onClose, onUpdate, onDelete }) {
  const { refreshTaskMl } = useTasks();
  const [mode, setMode] = useState('details');
  const [refreshing, setRefreshing] = useState(false);
  const taskId = task?._id || null;
  const isOverdue = !!task?.dueDate && task?.status !== 'done' && isPast(new Date(task.dueDate));

  useEffect(() => {
    setMode('details');
  }, [taskId]);

  const { pct: riskValue, label: riskLabel, isDone } = getDelayRiskDisplay(task);
  const hasRisk = riskValue !== null;
  const riskColorClass = isDone
    ? 'text-emerald-400'
    : riskLabel === 'High'
      ? 'text-red-400'
      : riskLabel === 'Medium'
        ? 'text-amber-400'
        : 'text-emerald-400';

  const handleRefreshMl = async () => {
    if (!task) return;
    setRefreshing(true);
    try {
      await refreshTaskMl(task);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdate = async (data) => {
    if (!taskId) return;
    await onUpdate(taskId, data);
    setMode('details');
  };

  return (
    <Modal
      open={!!taskId}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Task' : 'Task Details'}
      size="lg"
    >
      {mode === 'edit' ? (
        <TaskForm
          initial={task ?? null}
          onSubmit={handleUpdate}
          onCancel={() => setMode('details')}
          submitLabel="Save Changes"
        />
      ) : (
        <div>
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {task && <PriorityBadge priority={task.priority} />}
              {task && <StatusBadge status={task.status} />}
              {task?.status === 'done' && task?.completedAt && (
                <span className="badge bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                  <Calendar size={10} />
                  {`Completed · ${format(new Date(task.completedAt), 'MMM d, yyyy')}`}
                </span>
              )}
              {task?.dueDate && (
                <span className={`badge ${isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : isToday(new Date(task.dueDate)) ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Calendar size={10} />
                  {isOverdue ? 'Overdue · ' : isToday(new Date(task.dueDate)) ? 'Due today · ' : 'Due '}
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 leading-snug font-sans">
              {task?.title || ''}
            </h2>

            {task?.description ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-slate-300 dark:text-slate-600 italic">No description.</p>
            )}

            {task?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {task.tags.map((t) => (
                  <span key={t} className="text-[11px] font-medium px-2.5 py-1 rounded-full
                                           bg-brand-50 dark:bg-brand-900/30 text-brand-500
                                           border border-brand-100 dark:border-brand-800">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 mt-4 text-[11px] text-slate-400">
              <Clock size={11} />
              {task?.createdAt ? `Created ${format(new Date(task.createdAt), 'MMM d, yyyy · h:mm a')}` : 'Created'}
            </div>
            {task?.status === 'done' && task?.completedAt && (
              <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-500">
                <Clock size={11} />
                {`Completed ${format(new Date(task.completedAt), 'MMM d, yyyy · h:mm a')}`}
              </div>
            )}

            <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-lg font-semibold mb-2">🧠 AI Insights</h3>
              <p className="text-[11px] text-zinc-400 mb-2">Prediction powered by ML model</p>

              {hasRisk ? (
                <>
                  <p>
                    ⚠️ Delay Risk:{' '}
                    <b className={riskColorClass}>
                      {riskValue}%
                      {isDone ? ' (Completed)' : ` (${riskLabel})`}
                    </b>
                  </p>
                </>
              ) : (
                <p className="text-zinc-400">No prediction yet — use Refresh when the ML service is running.</p>
              )}

              <button
                type="button"
                onClick={handleRefreshMl}
                disabled={refreshing}
                className="mt-3 px-3 py-1 bg-purple-600 rounded disabled:opacity-50"
              >
                {refreshing ? 'Refreshing…' : 'Refresh Prediction'}
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setMode('edit')} className="btn-ghost text-xs">
                <Edit2 size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={() => { if (taskId) onDelete(taskId); onClose(); }}
                className="btn text-xs border border-red-200 dark:border-red-800 text-red-500
                           hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          {taskId && <CommentsPanel taskId={taskId} />}
        </div>
      )}
    </Modal>
  );
}
