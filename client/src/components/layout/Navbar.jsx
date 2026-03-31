import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sun, Moon, Bell, LogOut, LayoutDashboard, BarChart2, X } from 'lucide-react';
import { useAuth }  from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';

export default function Navbar() {
  const { user, logout }          = useAuth();
  const { filters, setFilters }   = useTasks();
  const { dark, toggle }          = useTheme();
  const [showUser, setShowUser]   = useState(false);

  return (
    <header className="nav">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 mr-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500
                        dark:bg-brand-500 dark:bg-none
                        flex items-center justify-center shadow-lg shadow-brand-400/30">
          <LayoutDashboard size={16} className="text-white" />
        </div>
        <span className="font-sans font-bold text-slate-900 dark:text-white text-base tracking-tight">
          Flow<span className="text-gradient">Board</span>
        </span>
      </Link>

      <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          className="input pl-9 pr-8 h-9 text-xs"
        />
        {filters.search && (
          <button onClick={() => setFilters(f => ({ ...f, search: '' }))}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={13} />
          </button>
        )}
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        <Link to="/analytics" className="btn-icon hidden sm:flex" title="Analytics">
          <BarChart2 size={17} />
        </Link>

        <button onClick={toggle} className="btn-icon" title="Toggle theme">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setShowUser(v => !v)} className="flex items-center gap-2 pl-1">
            <Avatar name={user?.name} size="sm" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-10 w-52 card shadow-modal py-1 z-50 animate-slide-up">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); setShowUser(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500
                           hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
