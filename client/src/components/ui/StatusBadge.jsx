const MAP = {
  todo:       { label: 'To Do',       cls: 'status-todo'       },
  inprogress: { label: 'In Progress', cls: 'status-inprogress' },
  done:       { label: 'Done',        cls: 'status-done'       },
};

export default function StatusBadge({ status }) {
  const cfg = MAP[status] ?? MAP.todo;
  return <span className={cfg.cls}>{cfg.label}</span>;
}
