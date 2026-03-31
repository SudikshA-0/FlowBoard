import { useMemo, useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useProjects } from '../../context/ProjectContext';
import CreateProjectModal from '../projects/CreateProjectModal';
import CreateTeamModal from '../teams/CreateTeamModal';
import toast from 'react-hot-toast';
import { Filter, Flag, CheckCircle2, Clock, AlertCircle, LayoutGrid, Folder, Users, Plus, Link2 } from 'lucide-react';

const PRIORITIES = [
  { id: '',       label: 'All',    icon: LayoutGrid,    color: 'text-slate-500' },
  { id: 'high',   label: 'High',   icon: AlertCircle,   color: 'text-red-500'   },
  { id: 'medium', label: 'Medium', icon: Flag,          color: 'text-amber-500' },
  { id: 'low',    label: 'Low',    icon: CheckCircle2,  color: 'text-green-500' },
];

const STATUSES = [
  { id: '',           label: 'All Columns' },
  { id: 'todo',       label: 'To Do'       },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done',       label: 'Done'        },
];

export default function Sidebar() {
  const { tasks, filters, setFilters, analytics } = useTasks();
  const { loading: projectsLoading, personalProjects, teams, teamProjects, activeProjectId, setActiveProject, getInviteLink } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [copyingTeamId, setCopyingTeamId] = useState('');

  const stats = [
    { label: 'Total',     value: analytics?.total                ?? tasks.length,                      color: 'text-brand-400' },
    { label: 'Done',      value: analytics?.byStatus?.done       ?? tasks.filter(t=>t.status==='done').length,   color: 'text-green-500' },
    { label: 'Active',    value: analytics?.byStatus?.inprogress ?? tasks.filter(t=>t.status==='inprogress').length, color: 'text-blue-500' },
    { label: 'Overdue',   value: analytics?.overdue              ?? 0,                                 color: 'text-red-500'   },
  ];

  const teamProjectsByTeam = useMemo(() => {
    const map = new Map();
    (teamProjects ?? []).forEach((p) => {
      const key = p.teamId;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return map;
  }, [teamProjects]);

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col gap-4 sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pb-6 scrollbar-hidden">

      {/* Projects */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label flex items-center gap-1.5 mb-0"><Folder size={11} />Projects</p>
          <button onClick={() => setCreateOpen(true)} className="btn-icon" title="Create project">
            <Plus size={16} />
          </button>
        </div>

        {/* Personal */}
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Personal
          </p>
          {projectsLoading && (
            <p className="text-xs text-slate-400">Loading…</p>
          )}
          {!projectsLoading && (personalProjects ?? []).length === 0 && (
            <p className="text-xs text-slate-400 italic">No personal projects yet.</p>
          )}
          {(personalProjects ?? []).map((p) => {
            const active = p._id === activeProjectId;
            return (
              <button
                key={p._id}
                onClick={() => setActiveProject(p._id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-1 text-left
                  ${active
                    ? 'bg-brand-50 dark:bg-white/5 text-brand-600 dark:text-brand-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Teams */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Users size={11} /> Teams
            </p>
            <button onClick={() => setCreateTeamOpen(true)} className="btn-icon" title="Create team">
              <Plus size={16} />
            </button>
          </div>
          {(teams ?? []).length === 0 && (
            <p className="text-xs text-slate-400 italic">No teams yet.</p>
          )}
          {(teams ?? []).map((t) => {
            const projects = teamProjectsByTeam.get(t._id) ?? [];
            return (
              <div key={t._id} className="mb-2">
                <div className="flex items-center justify-between gap-2 px-2 py-1">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                    {t.name}
                  </div>
                  <button
                    className="btn-icon"
                    title="Copy invite link"
                    disabled={copyingTeamId === t._id}
                    onClick={async () => {
                      try {
                        setCopyingTeamId(t._id);
                        const link = await getInviteLink(t._id);
                        await navigator.clipboard.writeText(link);
                        toast.success('Invite link copied');
                      } catch (err) {
                        toast.error(err?.response?.data?.message ?? 'Failed to copy invite link');
                      } finally {
                        setCopyingTeamId('');
                      }
                    }}
                  >
                    <Link2 size={16} />
                  </button>
                </div>
                {projects.length === 0 ? (
                  <div className="text-xs text-slate-400 px-2 pb-1 italic">No projects</div>
                ) : (
                  projects.map((p) => {
                    const active = p._id === activeProjectId;
                    return (
                      <button
                        key={p._id}
                        onClick={() => setActiveProject(p._id)}
                        className={`w-full flex items-center gap-2 pl-5 pr-3 py-2 rounded-xl text-sm font-medium transition-all mb-1 text-left
                          ${active
                            ? 'bg-brand-50 dark:bg-white/5 text-brand-600 dark:text-brand-300'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${active ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className="truncate">{p.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="card p-4">
        <p className="label mb-3 flex items-center gap-1.5"><Clock size={11} />Overview</p>
        <div className="grid grid-cols-2 gap-2">
          {stats.map(s => (
            <div key={s.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
              <div className={`text-2xl font-bold font-sans tracking-tight ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {(analytics?.total ?? 0) > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Progress</span>
              <span className="font-bold text-green-500">
                {Math.round(((analytics?.byStatus?.done ?? 0) / (analytics?.total ?? 1)) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.round(((analytics?.byStatus?.done ?? 0) / (analytics?.total ?? 1)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Priority filter */}
      <div className="card p-4">
        <p className="label mb-2 flex items-center gap-1.5"><Filter size={11} />Priority</p>
        {PRIORITIES.map(p => {
          const Icon = p.icon;
          const active = filters.priority === p.id;
          return (
            <button key={p.id}
              onClick={() => setFilters(f => ({ ...f, priority: p.id }))}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                         font-medium transition-all duration-150 mb-1 text-left
                         ${active
                           ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-500 dark:text-brand-300'
                           : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Icon size={14} className={active ? 'text-brand-400' : p.color} />
              {p.label}
              <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md
                               ${active ? 'bg-brand-100 dark:bg-brand-800 text-brand-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                {p.id
                  ? (analytics?.byPriority?.[p.id] ?? tasks.filter(t => t.priority === p.id).length)
                  : (analytics?.total ?? tasks.length)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status filter */}
      <div className="card p-4">
        <p className="label mb-2">Status</p>
        {STATUSES.map(s => {
          const active = filters.status === s.id;
          return (
            <button key={s.id}
              onClick={() => setFilters(f => ({ ...f, status: s.id }))}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                         font-medium transition-all duration-150 mb-1 text-left
                         ${active
                           ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-500 dark:text-brand-300'
                           : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {s.label}
              <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md
                               ${active ? 'bg-brand-100 dark:bg-brand-800 text-brand-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                {s.id ? (analytics?.byStatus?.[s.id] ?? tasks.filter(t => t.status === s.id).length) : (analytics?.total ?? tasks.length)}
              </span>
            </button>
          );
        })}
      </div>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <CreateTeamModal open={createTeamOpen} onClose={() => setCreateTeamOpen(false)} />
    </aside>
  );
}
