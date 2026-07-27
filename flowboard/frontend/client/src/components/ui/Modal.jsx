import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className={`modal ${widths[size]} max-h-[92vh] flex flex-col`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 font-sans">{title}</h2>
              <button onClick={onClose} className="btn-icon"><X size={16} /></button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
