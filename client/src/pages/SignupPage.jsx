import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/auth/AuthForm';

export default function SignupPage() {
  const { signup }         = useAuth();
  const navigate           = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async ({ name, email, password }) => {
    setLoading(true);
    setError('');
    try {
      await signup(name, email, password);
      toast.success('Account created! Welcome to FlowBoard 🎉');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <AuthForm mode="signup" onSubmit={handleSubmit} loading={loading} error={error} />;
}
