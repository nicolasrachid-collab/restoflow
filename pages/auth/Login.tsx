import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Utensils, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 text-orange-600 mb-2">
            <Utensils size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">RestoFlow Admin</h1>
          <p className="text-gray-500">Acesse sua dashboard de gestão.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="admin@exemplo.com"
              required
            />
          </div>
          
          <div>
             <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
             </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Entrar
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4">
           Não tem uma conta? <Link to="/register" className="text-orange-600 font-medium hover:underline">Criar conta grátis</Link>
        </div>
        
        <div className="text-center text-xs text-gray-400 mt-2">
           Demo: admin@restoflow.com / 123456
        </div>
      </div>
    </div>
  );
};