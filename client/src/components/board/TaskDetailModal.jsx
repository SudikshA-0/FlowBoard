import { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Calendar, Clock, Edit2, Trash2, MessageSquare } from 'lucide-react';
import Modal        from '../ui/Modal';
import TaskForm     from './TaskForm';
import PriorityBadge from '../ui/PriorityBadge';
import StatusBadge   from '../ui/StatusBadge';
import CommentsPanel from '../comments/CommentsPanel';

export default function TaskDetailModal({ task, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  if (!task) return null;

  const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));

  const handleUpdate = async (data) => {
    await onUpdate(task._id, data);
    setEditing(false);
  };

  return (
    <Modal open={!!task} onClose={onClose} title={editing ? 'Edit Task' : 'Task Details'} size="lg">
      {editing ? (
        <TaskForm
          initial={task}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Save Changes"
        />
      ) : (
        <div>
          {/* Detail view */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <PriorityBadge priority={task.priority} />
              <StatusBadge   status={task.status} />
              {task.dueDate && (
                <span className={`badge ${isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : isToday(new Date(task.dueDate)) ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Calendar size={10} />
                  {isOverdue ? 'Overdue · ' : isToday(new Date(task.dueDate)) ? 'Due today · ' : 'Due '}
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 leading-snug font-sans">
              {task.title}
            </h2>

            {task.description ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-slate-300 dark:text-slate-600 italic">No description.</p>
            )}

            {/* Tags */}
            {task.tags?.length > 0 && (
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
              Created {format(new Date(task.createdAt), 'MMM d, yyyy · h:mm a')}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditing(true)} className="btn-ghost text-xs">
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => { onDelete(task._id); onClose(); }}
                className="btn text-xs border border-red-200 dark:border-red-800 text-red-500
                           hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          {/* Comments */}
          <CommentsPanel taskId={task._id} />
        </div>
      )}
    </Modal>
  );
}
