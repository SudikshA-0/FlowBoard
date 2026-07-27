import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import Modal from '../ui/Modal';
import { useTasks } from '../../context/TaskContext';
import { getDelayRiskDisplay } from '../../services/mlApi';

export default function AiInsightsModal({ task, open, onClose }) {
  const { refreshTaskMl } = useTasks();
  const taskId = task?._id || null;
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { pct: riskPct, label: riskLabel, isDone } = getDelayRiskDisplay(task);

  const riskStyle = isDone
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : riskLabel === 'High'
      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
      : riskLabel === 'Medium'
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';

  const runPrediction = async () => {
    if (!taskId || !task) return;
    setError('');
    setRefreshing(true);
    try {
      await refreshTaskMl(task);
    } catch (e) {
      setError(e?.message || 'Prediction failed');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setError('');
      setRefreshing(false);
    }
  }, [open]);

  return (
    <Modal open={open && !!taskId} onClose={onClose} title="AI Insights" size="lg">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-brand-400" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {task?.title ? `AI Insights · ${task.title}` : 'AI Insights'}
            </p>
          </div>
          <button
            type="button"
            onClick={runPrediction}
            disabled={refreshing}
            className="btn-ghost text-xs"
          >
            {refreshing ? 'Predicting…' : 'Refresh Prediction'}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${riskStyle}`}>
            Delay Risk
            <span className="font-bold">
              {riskPct == null ? '—' : `${riskPct}%`}
              {riskPct != null && isDone && ' (Completed)'}
            </span>
            {!isDone && riskLabel && <span className="opacity-80">({riskLabel})</span>}
          </span>
          {error && (
            <span className="text-xs text-red-500 break-all">{error}</span>
          )}
        </div>

        <div className="mt-4 card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {riskPct == null
              ? 'Run prediction to see current delay risk.'
              : isDone
                ? 'Task completed. Delay risk is fixed at 0%.'
                : 'Risk shown above is generated from the current task state.'}
          </p>
        </div>
      </div>
    </Modal>
  );
}
