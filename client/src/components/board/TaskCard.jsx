import { useState } from 'react';
import { motion } from 'framer-motion';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, MessageSquare, Clock, Trash2, Pencil } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import PriorityBadge from '../ui/PriorityBadge';

export default function TaskCard({ task, index, onEdit, onDelete }) {
  const [hover, setHover] = useState(false);

  const isOverdue = task.dueDate && !isPast(new Date(task.dueDate)) === false
    && task.status !== 'done' && isPast(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(2deg)`
              : provided.draggableProps.style?.transform,
          }}
          className={`card card-hover p-3.5 group relative select-none
                      ${snapshot.isDragging ? 'shadow-modal opacity-90 scale-[1.02]' : ''}
                      ${isOverdue ? 'border-l-2 border-l-red-400' : ''}`}
        >
          {/* Quick actions — appear on hover */}
          <div className={`absolute top-2.5 right-2.5 flex gap-1 transition-opacity duration-150
                          ${hover && !snapshot.isDragging ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200
                         dark:border-slate-600 flex items-center justify-center text-slate-500
                         hover:text-brand-500 hover:border-brand-300 transition-colors shadow-sm"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200
                         dark:border-slate-600 flex items-center justify-center text-slate-500
                         hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
            >
              <Trash2 size={11} />
            </button>
          </div>

          {/* Priority */}
          <div className="mb-2">
            <PriorityBadge priority={task.priority} />
          </div>

          {/* Title */}
          <h3
            onClick={() => onEdit(task)}
            className="text-sm font-semibold text-slate-800 dark:text-slate-100
                       leading-snug mb-1.5 pr-10 cursor-pointer hover:text-brand-500 transition-colors"
          >
            {task.title}
          </h3>

          {/* Description snippet */}
          {task.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {task.tags.slice(0, 3).map((tag) => (
                <span key={tag}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full
                             bg-brand-50 dark:bg-brand-900/30 text-brand-500 dark:text-brand-300
                             border border-brand-100 dark:border-brand-800">
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                 bg-slate-100 dark:bg-slate-700 text-slate-400">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock size={10} />
              {format(new Date(task.createdAt), 'MMM d')}
            </div>

            <div className="flex items-center gap-2">
              {task.dueDate && (
                <span className={`flex items-center gap-1 text-[10px] font-medium
                                  ${isOverdue ? 'text-red-500' : isDueToday ? 'text-amber-500' : 'text-slate-400'}`}>
                  <Calendar size={10} />
                  {isOverdue ? 'Overdue' : isDueToday ? 'Today' : format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
