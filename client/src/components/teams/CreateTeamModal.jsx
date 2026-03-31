import { useState } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { useProjects } from '../../context/ProjectContext';

export default function CreateTeamModal({ open, onClose }) {
  const { createTeam } = useProjects();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (!trimmed) { setError('Team name is required.'); return; }
    setSaving(true);
    try {
      await createTeam({ name: trimmed });
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Team" size="md">
      <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
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
            placeholder="e.g. Marketing"
            className="input"
          />
        </div>

        <div className="flex justify-end gap-3 pt-1 border-t border-slate-100 dark:border-slate-700">
          <button type="button" onClick={handleClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner size="sm" /> : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

