import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/auth/AuthForm';

export default function LoginPage() {
  const { login }          = useAuth();
  const navigate           = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async ({ email, password }) => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthForm mode="login" onSubmit={handleSubmit} loading={loading} error={error} />;
}
