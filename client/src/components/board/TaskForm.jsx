import { useState, useEffect } from 'react';
import { Tag, X } from 'lucide-react';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES   = [
  { id: 'todo',       label: 'To Do'       },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done',       label: 'Done'        },
];

const defaultForm = () => ({
  title: '', description: '', priority: 'medium',
  status: 'todo', tags: [], dueDate: '',
});

export default function TaskForm({ initial, onSubmit, onCancel, submitLabel = 'Create Task' }) {
  const [form,   setForm]   = useState({ ...defaultForm(), ...(initial ?? {}) });
  const [tagIn,  setTagIn]  = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      // Only hydrate when a new initial payload is passed by parent (open/edit switch).
      setForm({
        ...defaultForm(),
        ...initial,
        dueDate: initial.dueDate
          ? new Date(initial.dueDate).toISOString().split('T')[0]
          : '',
        tags: initial.tags ?? [],
      });
    }
  }, [initial?._id, initial?.status]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const addTag = (e) => {
    e.preventDefault();
    const v = tagIn.trim();
    if (v && !form.tags.includes(v)) set('tags', [...form.tags, v]);
    setTagIn('');
  };

  const validate = () => {
    const errs = {};
    if (!form.title?.trim()) errs.title = 'Title is required.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({ ...form, dueDate: form.dueDate || null });
  };

  const priColors = { low: 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600',
                      medium: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-600',
                      high:   'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600' };

  return (
    <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

      {/* Title */}
      <div>
        <label className="label">Title *</label>
        <input
          autoFocus
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="What needs to be done?"
          className={`input ${errors.title ? 'border-red-400 ring-1 ring-red-400' : ''}`}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Add details, context, or acceptance criteria…"
          className="input resize-none leading-relaxed"
        />
      </div>

      {/* Priority + Status grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Priority</label>
          <div className="flex gap-1.5">
            {PRIORITIES.map(p => (
              <button key={p} type="button"
                onClick={() => set('priority', p)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide border
                            transition-all ${form.priority === p ? priColors[p] : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="input"
          >
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Due date */}
      <div>
        <label className="label">Due Date</label>
        <input
          type="date"
          value={form.dueDate}
          onChange={e => set('dueDate', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="input"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="label flex items-center gap-1"><Tag size={10} />Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.tags.map((t) => (
            <span key={t}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full
                         bg-brand-50 dark:bg-brand-900/30 text-brand-500 border border-brand-100 dark:border-brand-800">
              {t}
              <button type="button" onClick={() => set('tags', form.tags.filter((tag) => tag !== t))}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagIn}
            onChange={e => setTagIn(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag(e)}
            placeholder="Type a tag and press Enter"
            className="input flex-1"
          />
          <button type="button" onClick={addTag} className="btn-ghost px-3 py-2 text-xs">Add</button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-1 border-t border-slate-100 dark:border-slate-700">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
