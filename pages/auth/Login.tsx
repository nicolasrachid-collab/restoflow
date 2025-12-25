import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Utensils, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Server Status State
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkServer = async () => {
        try {
            await api.get('/health');
            setServerStatus('online');
        } catch (e) {
            setServerStatus('offline');
        }
    };
    checkServer();
  }, []);

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative">
      {/* Server Status Indicator */}
      <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
        serverStatus === 'online' ? 'bg-green-100 text-green-700' : 
        serverStatus === 'offline' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {serverStatus === 'online' && <><Wifi size={14} /> Sistema Online</>}
        {serverStatus === 'offline' && <><WifiOff size={14} /> Servidor Offline</>}
        {serverStatus === 'checking' && <span className="animate-pulse">Conectando...</span>}
      </div>

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

        {serverStatus === 'offline' && (
             <div className="p-3 bg-orange-50 text-orange-800 text-sm rounded-lg border border-orange-200">
                <strong>Atenção:</strong> O backend não foi detectado. Certifique-se de que o servidor (Porta 3001) e o Docker (Porta 5432) estão rodando.
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

          <Button type="submit" className="w-full" size="lg" isLoading={loading} disabled={serverStatus === 'offline'}>
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