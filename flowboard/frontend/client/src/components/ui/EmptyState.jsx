export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20
                        flex items-center justify-center mb-4">
          <Icon className="text-brand-400" size={26} />
        </div>
      )}
      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}
