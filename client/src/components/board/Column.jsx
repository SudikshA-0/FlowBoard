import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import Spinner from '../ui/Spinner';

const COLUMN_META = {
  todo:       { label: 'To Do',       color: 'bg-slate-400',  glow: '', accent: '#94a3b8' },
  inprogress: { label: 'In Progress', color: 'bg-blue-500',   glow: 'border-blue-200 dark:border-blue-800/40', accent: '#3b82f6' },
  done:       { label: 'Done',        color: 'bg-emerald-500',glow: 'border-emerald-200 dark:border-emerald-800/40', accent: '#10b981' },
};

export default function Column({ id, tasks, onAdd, onEdit, onDelete, loading }) {
  const meta    = COLUMN_META[id];
  const [addHover, setAddHover] = useState(false);

  return (
    <div className="column">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${meta.color} shadow-sm`}
                style={{ boxShadow: `0 0 8px ${meta.accent}66` }} />
          <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200 font-sans">{meta.label}</h2>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700
                           px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(id)}
          onMouseEnter={() => setAddHover(true)}
          onMouseLeave={() => setAddHover(false)}
          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700
                     flex items-center justify-center transition-all duration-150
                     hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20
                     hover:text-brand-500 text-slate-400"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Drop zone */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 px-3 pb-3 flex flex-col gap-2 min-h-[80px] rounded-b-2xl
                        transition-colors duration-200 overflow-y-auto
                        ${snapshot.isDraggingOver
                          ? 'bg-brand-50/60 dark:bg-brand-900/10'
                          : ''}`}
          >
            {loading && tasks.length === 0 ? (
              <div className="flex justify-center py-8"><Spinner size="sm" /></div>
            ) : (
              <AnimatePresence>
                {tasks.map((task, index) => (
                  <motion.div
                    key={task._id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                  >
                    <TaskCard
                      task={task}
                      index={index}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Drop indicator */}
            {snapshot.isDraggingOver && (
              <div className="h-16 rounded-xl border-2 border-dashed border-brand-300
                              dark:border-brand-600 flex items-center justify-center
                              text-brand-400 text-xs font-medium flex-shrink-0">
                Release to drop
              </div>
            )}

            {provided.placeholder}

            {/* Empty state */}
            {tasks.length === 0 && !snapshot.isDraggingOver && !loading && (
              <div className="flex flex-col items-center py-6 text-slate-300 dark:text-slate-600">
                <div className="text-3xl mb-1 opacity-40">◌</div>
                <p className="text-[11px]">No tasks</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
