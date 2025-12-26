import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../services/api';
import { Plus, Edit, Trash2, GripVertical, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
  _count?: {
    menuItems: number;
  };
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIsActive, setCategoryIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.get<Category[]>('/menu/categories');
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias', error);
      alert('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      alert('Digite um nome para a categoria');
      return;
    }

    setSaving(true);
    try {
      await api.post('/menu/categories', {
        name: categoryName.trim(),
        isActive: categoryIsActive,
      });
      setCategoryName('');
      setCategoryIsActive(true);
      setShowCreateModal(false);
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao criar categoria', error);
      alert(error.message || 'Erro ao criar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryIsActive(category.isActive);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingCategory || !categoryName.trim()) {
      alert('Digite um nome para a categoria');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/menu/categories/${editingCategory.id}`, {
        name: categoryName.trim(),
        isActive: categoryIsActive,
      });
      setEditingCategory(null);
      setCategoryName('');
      setCategoryIsActive(true);
      setShowEditModal(false);
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao atualizar categoria', error);
      alert(error.message || 'Erro ao atualizar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      await api.delete(`/menu/categories/${id}`);
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao excluir categoria', error);
      alert(error.message || 'Erro ao excluir categoria');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[index - 1];
    newCategories[index - 1] = temp;

    // Atualizar displayOrder
    const reorderItems = newCategories.map((cat, idx) => ({
      id: cat.id,
      displayOrder: idx,
    }));

    try {
      await api.post('/menu/categories/reorder', { items: reorderItems });
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao reordenar categorias', error);
      alert(error.message || 'Erro ao reordenar categorias');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[index + 1];
    newCategories[index + 1] = temp;

    // Atualizar displayOrder
    const reorderItems = newCategories.map((cat, idx) => ({
      id: cat.id,
      displayOrder: idx,
    }));

    try {
      await api.post('/menu/categories/reorder', { items: reorderItems });
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao reordenar categorias', error);
      alert(error.message || 'Erro ao reordenar categorias');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await api.patch(`/menu/categories/${category.id}`, {
        isActive: !category.isActive,
      });
      loadCategories();
    } catch (error: any) {
      console.error('Erro ao atualizar categoria', error);
      alert(error.message || 'Erro ao atualizar categoria');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorias do Menu</h2>
          <p className="text-gray-500">Organize as categorias do seu cardápio</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={18} className="mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>Nenhuma categoria cadastrada ainda.</p>
            <p className="text-sm mt-2">Crie uma categoria para começar a organizar seu menu.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  !category.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === categories.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                  <GripVertical size={20} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-500">
                      {category._count?.menuItems || 0} item(ns) nesta categoria
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        category.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category.isActive ? 'Ativa' : 'Inativa'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={(category._count?.menuItems || 0) > 0}
                    title={
                      (category._count?.menuItems || 0) > 0
                        ? 'Não é possível excluir categoria com itens associados'
                        : 'Excluir categoria'
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCategoryName('');
          setCategoryIsActive(true);
        }}
        title="Nova Categoria"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Categoria
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Entradas, Pratos Principais..."
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create-active"
              checked={categoryIsActive}
              onChange={(e) => setCategoryIsActive(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="create-active" className="text-sm text-gray-700">
              Categoria ativa
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setCategoryName('');
                setCategoryIsActive(true);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} isLoading={saving}>
              Criar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCategory(null);
          setCategoryName('');
          setCategoryIsActive(true);
        }}
        title="Editar Categoria"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Categoria
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Entradas, Pratos Principais..."
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-active"
              checked={categoryIsActive}
              onChange={(e) => setCategoryIsActive(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="edit-active" className="text-sm text-gray-700">
              Categoria ativa
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setEditingCategory(null);
                setCategoryName('');
                setCategoryIsActive(true);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate} isLoading={saving}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

