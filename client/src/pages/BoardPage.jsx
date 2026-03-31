import { useState, useCallback, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { useTasks }       from '../context/TaskContext';
import Column            from '../components/board/Column';
import TaskForm          from '../components/board/TaskForm';
import TaskDetailModal   from '../components/board/TaskDetailModal';
import Modal             from '../components/ui/Modal';
import ConfirmDialog     from '../components/ui/ConfirmDialog';
import Sidebar           from '../components/layout/Sidebar';
import { useProjects }   from '../context/ProjectContext';

const COLUMN_ORDER = ['todo', 'inprogress', 'done'];

export default function BoardPage() {
  const { tasks, loading, createTask, updateTask, deleteTask, moveTask } = useTasks();
  const { activeProject } = useProjects();

  // Modal state
  const [addCol,    setAddCol]    = useState(null);   // column id for new task
  const [editTask,  setEditTask]  = useState(null);   // task object to view/edit
  const [deleteId,  setDeleteId]  = useState(null);   // task id to confirm delete
  const [creating,  setCreating]  = useState(false);
  const [updating,  setUpdating]  = useState(false);

  // ── DnD handler ──────────────────────────────────────────────────────────
  const onDragEnd = useCallback(async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    await moveTask(draggableId, newStatus, destination.index);

    if (source.droppableId !== destination.droppableId) {
      const labels = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
      toast.success(`Moved to ${labels[newStatus]}`, { icon: '📋' });
    }
  }, [moveTask]);

  // ── Create task ───────────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setCreating(true);
    try {
      await createTask({ ...formData, status: addCol ?? formData.status });
      setAddCol(null);
      toast.success('Task created!', { icon: '✅' });
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to create task';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  // ── Update task ───────────────────────────────────────────────────────────
  const handleUpdate = async (id, data) => {
    setUpdating(true);
    try {
      const updated = await updateTask(id, data);
      setEditTask(updated);
      toast.success('Task updated', { icon: '✏️' });
    } catch {
      toast.error('Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  // ── Delete task ───────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      toast.success('Task deleted', { icon: '🗑️' });
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Partition tasks into columns
  const byColumn = (colId) =>
    tasks
      .filter(t => t.status === colId)
      .sort((a, b) => a.order - b.order || new Date(b.createdAt) - new Date(a.createdAt));

  // Stable object prevents TaskForm reset/remount while typing in create modal.
  const createInitial = useMemo(() => ({ status: addCol ?? 'todo' }), [addCol]);

  return (
    <div className="flex gap-5 p-5 max-w-screen-2xl mx-auto">
      {/* Sidebar */}
      <Sidebar />

      {/* Main board area */}
      <main className="flex-1 min-w-0">
        {/* Board header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold font-sans text-slate-800 dark:text-slate-100 tracking-tight">
              {activeProject?.name ? activeProject.name : 'My Board'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} across {COLUMN_ORDER.length} columns
            </p>
          </div>
          <button
            onClick={() => setAddCol('todo')}
            className="btn-primary text-sm"
          >
            <Plus size={15} /> New Task
          </button>
        </div>

        {/* Kanban board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {COLUMN_ORDER.map(colId => (
              <Column
                key={colId}
                id={colId}
                tasks={byColumn(colId)}
                loading={loading}
                onAdd={(col) => setAddCol(col)}
                onEdit={(task) => setEditTask(task)}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        </DragDropContext>

        {/* Empty board state */}
        {tasks.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-50 to-violet-50
                            dark:bg-[#151821] dark:bg-none
                            flex items-center justify-center mb-5 border border-brand-100 dark:border-brand-800/40">
              <span className="text-4xl">📋</span>
            </div>
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Your board is empty</h2>
            <p className="text-sm text-slate-400 mb-5 max-w-xs">
              Create your first task to get started. Organize, prioritize, and track your work.
            </p>
            <button onClick={() => setAddCol('todo')} className="btn-primary">
              <Plus size={15} /> Create first task
            </button>
          </div>
        )}
      </main>

      {/* ── Modals ── */}

      {/* Create task */}
      <Modal
        open={!!addCol}
        onClose={() => setAddCol(null)}
        title="Create New Task"
        size="md"
      >
        <TaskForm
          initial={createInitial}
          onSubmit={handleCreate}
          onCancel={() => setAddCol(null)}
          submitLabel={creating ? 'Creating…' : 'Create Task'}
        />
      </Modal>

      {/* Task detail / edit */}
      <TaskDetailModal
        task={editTask}
        onClose={() => setEditTask(null)}
        onUpdate={handleUpdate}
        onDelete={(id) => { setEditTask(null); setDeleteId(id); }}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}
