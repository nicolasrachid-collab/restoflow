import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { Utensils, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantSlug: '',
    adminName: '',
    email: '',
    password: ''
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove symbols
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphen
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      restaurantName: name,
      restaurantSlug: generateSlug(name) // Auto-generate slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register', formData);
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-600 mb-2">
            <CheckCircle size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Comece Gratuitamente</h1>
          <p className="text-gray-500">Crie sua conta e modernize seu restaurante.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Restaurante</label>
            <input 
              type="text" 
              value={formData.restaurantName}
              onChange={handleNameChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Ex: Cantina Italiana"
              required
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Link Personalizado</label>
             <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 text-sm">
                <span>restoflow.com/r/</span>
                <input 
                    type="text" 
                    value={formData.restaurantSlug}
                    onChange={(e) => setFormData({...formData, restaurantSlug: e.target.value})}
                    className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 w-full ml-1 font-medium"
                    placeholder="cantina-italiana"
                    required
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
            <input 
              type="text" 
              value={formData.adminName}
              onChange={(e) => setFormData({...formData, adminName: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Nome do Gerente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="admin@exemplo.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" size="lg" isLoading={loading}>
            Criar Conta
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4">
           Já tem uma conta? <Link to="/login" className="text-orange-600 font-medium hover:underline">Fazer Login</Link>
        </div>
      </div>
    </div>
  );
};