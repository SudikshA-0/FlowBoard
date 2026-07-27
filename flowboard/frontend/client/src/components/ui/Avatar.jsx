const COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

export default function Avatar({ name = '', size = 'sm', className = '' }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  const sz = { xs: 'w-6 h-6 text-[9px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];

  return (
    <div className={`rounded-full bg-gradient-to-br ${color} text-white font-bold
                     flex items-center justify-center flex-shrink-0 ${sz} ${className}`}>
      {initials || '?'}
    </div>
  );
}
