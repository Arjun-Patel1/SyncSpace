import { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import api from './api';

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // 👈 NEW: Success state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(''); // Clear any previous success messages

    try {
      if (isLogin) {
        // Login Request
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        onLogin();
      } else {
        // Register Request
        await api.post('/auth/register', { username, email, password });
        setIsLogin(true); // Switch to login screen
        setSuccess("Account created successfully! Please log in."); // 👈 NEW: Beautiful inline message
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <LayoutDashboard className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to SyncSpace' : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input required type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2" />
            </div>

            {/* ⚡ NEW: Styled Success and Error Messages */}
            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm font-medium border border-green-200 text-center">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium border border-red-200 text-center">
                {error}
              </div>
            )}

            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }} 
              className="w-full text-center text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}