import { useTasks } from '../../context/TaskContext';
import { CheckCircle, Clock, AlertCircle, Activity, TrendingUp } from 'lucide-react';

const BAR_COLORS = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-green-400',
};
const STATUS_COLORS = {
  todo:       'bg-slate-400',
  inprogress: 'bg-blue-500',
  done:       'bg-emerald-500',
};

export default function AnalyticsPanel() {
  const { analytics, tasks } = useTasks();

  const total      = analytics?.total      ?? tasks.length;
  const done       = analytics?.byStatus?.done ?? tasks.filter(t => t.status === 'done').length;
  const inprogress = analytics?.byStatus?.inprogress ?? tasks.filter(t => t.status === 'inprogress').length;
  const todo       = analytics?.byStatus?.todo ?? tasks.filter(t => t.status === 'todo').length;
  const overdue    = analytics?.overdue ?? 0;
  const pct        = total ? Math.round((done / total) * 100) : 0;

  const priData = ['high', 'medium', 'low'].map(p => ({
    label: p.charAt(0).toUpperCase() + p.slice(1),
    value: analytics?.byPriority?.[p] ?? tasks.filter(t => t.priority === p).length,
    key: p,
  }));
  const maxPri = Math.max(...priData.map(d => d.value), 1);

  const statData = [
    { label: 'To Do',       value: todo,       key: 'todo'       },
    { label: 'In Progress', value: inprogress, key: 'inprogress' },
    { label: 'Done',        value: done,        key: 'done'       },
  ];

  const KPI = ({ icon: Icon, label, value, sub, color }) => (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold font-sans tracking-tight text-slate-800 dark:text-slate-100">{value}</div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</div>
        {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-sans text-slate-800 dark:text-slate-100 tracking-tight">Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Overview of your board activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Activity}     label="Total Tasks"   value={total}      color="bg-brand-400"   sub={`${pct}% complete`} />
        <KPI icon={CheckCircle}  label="Completed"     value={done}        color="bg-emerald-500" sub="Done" />
        <KPI icon={Clock}        label="In Progress"   value={inprogress}  color="bg-blue-500"    sub="Active" />
        <KPI icon={AlertCircle}  label="Overdue"       value={overdue}     color="bg-red-500"     sub="Past due" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Priority distribution */}
        <div className="card p-5">
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4">Priority Distribution</p>
          <div className="flex flex-col gap-3">
            {priData.map(d => (
              <div key={d.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600 dark:text-slate-400">{d.label}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{d.value}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[d.key]}`}
                    style={{ width: `${(d.value / maxPri) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="card p-5">
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4">Status Breakdown</p>

          {/* Donut-style pie replacement: stacked bar */}
          <div className="h-8 rounded-full overflow-hidden flex mb-4">
            {statData.map(s => (
              <div
                key={s.key}
                className={`h-full transition-all duration-700 ${STATUS_COLORS[s.key]}`}
                style={{ width: total ? `${(s.value / total) * 100}%` : '0%' }}
                title={`${s.label}: ${s.value}`}
              />
            ))}
            {total === 0 && <div className="h-full w-full bg-slate-100 dark:bg-slate-700" />}
          </div>

          <div className="flex flex-col gap-2.5">
            {statData.map(s => (
              <div key={s.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[s.key]}`} />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.value}</span>
                  <span className="text-[10px] text-slate-400 w-10 text-right">
                    {total ? Math.round((s.value / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Overall Completion</p>
          <span className="text-2xl font-bold font-sans text-brand-400">{pct}%</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-500 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{done} of {total} tasks completed</p>
      </div>
    </div>
  );
}
