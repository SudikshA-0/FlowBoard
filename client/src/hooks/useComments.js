import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import toast from 'react-hot-toast';

export const useComments = (taskId) => {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const fetch = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/comments/${taskId}`);
      setComments(data.comments);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => {
    fetch();
    const socket = getSocket();
    socket.emit('joinTask', { taskId });

    const onAdd    = (c) => setComments(p => [...p, c]);
    const onDelete = (id) => setComments(p => p.filter(c => c._id !== id));
    socket.on('commentAdded', onAdd);
    socket.on('commentDeleted', onDelete);

    return () => {
      socket.emit('leaveTask', { taskId });
      socket.off('commentAdded', onAdd);
      socket.off('commentDeleted', onDelete);
    };
  }, [fetch, taskId]);

  const addComment = useCallback(async (text) => {
    const { data } = await api.post('/comments', { taskId, text });
    setComments(p => [...p, data.comment]);
    return data.comment;
  }, [taskId]);

  const removeComment = useCallback(async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments(p => p.filter(c => c._id !== id));
    } catch {
      toast.error('Failed to delete comment');
    }
  }, []);

  return { comments, loading, addComment, removeComment, refetch: fetch };
};
