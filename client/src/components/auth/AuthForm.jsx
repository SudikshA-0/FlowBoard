import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, LayoutDashboard } from 'lucide-react';
import Spinner from '../ui/Spinner';

// Keep field component at module scope to avoid remounts on parent re-render.
const Field = memo(function Field({
  icon: Icon,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  suffix,
}) {
  return (
    <div>
      <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          id={id}
          type={type}
          autoComplete={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input pl-10 pr-${suffix ? '10' : '4'} h-11 ${error ? 'border-red-400 ring-1 ring-red-400/30' : ''}`}
        />
        {suffix}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

export default function AuthForm({ mode, onSubmit, loading, error }) {
  const isLogin = mode === 'login';
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [show, setShow]     = useState(false);
  const [errs, setErrs]     = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrs(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!isLogin && !form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim())   e.email    = 'Email is required.';
    if (!form.password)       e.password = 'Password is required.';
    if (!isLogin && form.password.length < 6) e.password = 'Minimum 6 characters.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrs(e2); return; }
    onSubmit(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br
                    from-pink-50 via-brand-50/40 to-violet-50/60
                    dark:bg-[#0F1115] p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500
                          dark:bg-brand-500 dark:bg-none
                          flex items-center justify-center shadow-xl shadow-brand-400/30 mb-4">
            <LayoutDashboard size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isLogin ? 'Sign in to your FlowBoard workspace' : 'Start managing projects beautifully'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-modal">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20
                            border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <Field icon={User} id="name" placeholder="Full name"
                value={form.name} onChange={e => set('name', e.target.value)} error={errs.name} />
            )}
            <Field icon={Mail} id="email" type="email" placeholder="Email address"
              value={form.email} onChange={e => set('email', e.target.value)} error={errs.email} />
            <Field
              icon={Lock} id="password" type={show ? 'text' : 'password'}
              placeholder="Password" value={form.password}
              onChange={e => set('password', e.target.value)} error={errs.password}
              suffix={
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            <button type="submit" disabled={loading} className="btn-primary h-11 mt-1 justify-center text-sm">
              {loading ? <Spinner size="sm" /> : (isLogin ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/signup' : '/login'}
              className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        {isLogin && (
          <p className="text-center text-xs text-slate-400 mt-4">
            Demo: <span className="font-medium">demo@flowboard.app</span> / <span className="font-medium">demo123</span>
          </p>
        )}
      </div>
    </div>
  );
}
