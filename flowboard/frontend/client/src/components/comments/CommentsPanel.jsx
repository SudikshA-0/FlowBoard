import { useState } from 'react';
import { format } from 'date-fns';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { useComments } from '../../hooks/useComments';
import { useAuth }     from '../../context/AuthContext';
import Avatar          from '../ui/Avatar';
import Spinner         from '../ui/Spinner';

export default function CommentsPanel({ taskId }) {
  const { user }                        = useAuth();
  const { comments, loading, addComment, removeComment } = useComments(taskId);
  const [text, setText]                 = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addComment(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5">
      <p className="label flex items-center gap-1.5 mb-3">
        <MessageSquare size={11} /> Comments ({comments.length})
      </p>

      {/* Comment list */}
      <div className="flex flex-col gap-3 mb-4 max-h-60 overflow-y-auto">
        {loading && <div className="flex justify-center py-4"><Spinner size="sm" /></div>}
        {!loading && comments.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-4">No comments yet. Start the discussion!</p>
        )}
        {comments.map(c => (
          <div key={c._id} className="flex gap-2.5 group">
            <Avatar name={c.userId?.name} size="xs" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.userId?.name}</span>
                <span className="text-[10px] text-slate-400">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{c.text}</p>
            </div>
            {c.userId?._id === user?._id && (
              <button
                onClick={() => removeComment(c._id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <Avatar name={user?.name} size="xs" className="mt-2" />
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            placeholder="Write a comment… (Enter to submit)"
            rows={2}
            className="input resize-none text-xs pr-10 leading-relaxed"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="absolute right-2 bottom-2 w-7 h-7 rounded-lg bg-brand-400 text-white
                       flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-brand-500 transition-colors"
          >
            {submitting ? <Spinner size="sm" /> : <Send size={12} />}
          </button>
        </div>
      </form>
    </div>
  );
}
