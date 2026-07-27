const MAP = {
  high:   { label: 'High',   cls: 'badge-high',   dot: 'bg-red-500'   },
  medium: { label: 'Medium', cls: 'badge-medium', dot: 'bg-amber-500' },
  low:    { label: 'Low',    cls: 'badge-low',    dot: 'bg-green-500' },
};

export default function PriorityBadge({ priority }) {
  const cfg = MAP[priority] ?? MAP.medium;
  return (
    <span className={cfg.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
