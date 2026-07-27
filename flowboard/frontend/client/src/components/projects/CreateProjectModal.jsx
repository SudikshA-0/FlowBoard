import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { useProjects } from '../../context/ProjectContext';

export default function CreateProjectModal({ open, onClose }) {
  const { teams, createProject } = useProjects();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('personal'); // 'personal' | 'team'
  const [teamId, setTeamId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const teamOptions = useMemo(() => teams ?? [], [teams]);

  const reset = () => {
    setName('');
    setDescription('');
    setScope('personal');
    setTeamId('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (!trimmed) { setError('Project name is required.'); return; }
    if (scope === 'team' && !teamId) { setError('Please select a team.'); return; }

    setSaving(true);
    try {
      await createProject({
        name: trimmed,
        description: description.trim(),
        teamId: scope === 'team' ? teamId : null,
      });
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Project" size="md">
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="label">Name *</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website Redesign"
            className="input"
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)…"
            className="input resize-none"
          />
        </div>

        <div>
          <label className="label">Scope</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('personal')}
              className={`btn-ghost justify-center ${scope === 'personal' ? 'ring-2 ring-brand-500/20 border-brand-200 dark:border-brand-700' : ''}`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setScope('team')}
              className={`btn-ghost justify-center ${scope === 'team' ? 'ring-2 ring-brand-500/20 border-brand-200 dark:border-brand-700' : ''}`}
            >
              Team
            </button>
          </div>
        </div>

        {scope === 'team' && (
          <div>
            <label className="label">Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="input"
            >
              <option value="">Select a team…</option>
              {teamOptions.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-1 border-t border-slate-100 dark:border-slate-700">
          <button type="button" onClick={handleClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner size="sm" /> : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

