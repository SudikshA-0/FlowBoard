import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import { useProjects } from '../context/ProjectContext';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function JoinTeamPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const { refresh } = useProjects();

  const token = query.get('token') || '';
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const onJoin = async () => {
    setError('');
    if (!token) {
      setError('Missing invite token.');
      return;
    }
    setJoining(true);
    try {
      const { data } = await api.post('/teams/join', { token });
      toast.success(`Joined ${data.team?.name ?? 'team'}!`);
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to join team';
      setError(msg);
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-5">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">
          Join Team
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Use the invite link to join a workspace.
        </p>

        <div className="mt-5">
          <label className="label">Invite token</label>
          <input className="input" value={token} readOnly />
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button className="btn-ghost" onClick={() => navigate('/')}>Cancel</button>
          <button className="btn-primary" onClick={onJoin} disabled={joining || !token}>
            {joining ? <Spinner size="sm" /> : 'Join Team'}
          </button>
        </div>
      </div>
    </div>
  );
}

