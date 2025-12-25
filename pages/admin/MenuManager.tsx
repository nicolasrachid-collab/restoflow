import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { MenuItem, ImageSize } from '../../types';
import { generateText, generateMenuImage, editMenuImage } from '../../services/geminiService';
import { useResto } from '../../context/RestoContext';
import { Wand2, ImagePlus, Edit, Plus, Trash2 } from 'lucide-react';

export const MenuManager: React.FC = () => {
  const { menu, addMenuItem, updateMenuItem, removeMenuItem } = useResto();
  
  // Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  
  // Edit State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemImage, setEditItemImage] = useState<string | null>(null);
  
  // AI Loading States
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [editingImg, setEditingImg] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgSize, setImgSize] = useState<ImageSize>(ImageSize.SIZE_1K);

  const handleGenerateDescription = async () => {
    if (!newItemName) return alert('Digite o nome do prato primeiro');
    setGeneratingDesc(true);
    const desc = await generateText(`Crie uma descrição apetitosa e curta (máx 20 palavras) para um prato de restaurante chamado: ${newItemName}. Foque em sabor e ingredientes.`);
    setNewItemDesc(desc);
    setGeneratingDesc(false);
  };

  const handleGenerateImage = async () => {
    if (!newItemName) return alert('Digite o nome do prato primeiro');
    setGeneratingImg(true);
    const prompt = `Uma foto profissional e apetitosa de comida: ${newItemName}. Iluminação de estúdio, alta resolução, 8k, food styling.`;
    const base64 = await generateMenuImage(prompt, imgSize);
    if (base64) {
      setNewItemImage(base64);
    } else {
      alert('Falha ao gerar imagem.');
    }
    setGeneratingImg(false);
  };

  const handleEditImage = async () => {
    if (!newItemImage || !imgPrompt) return;
    setEditingImg(true);
    const edited = await editMenuImage(newItemImage, imgPrompt);
    if (edited) {
      setNewItemImage(edited);
      setImgPrompt('');
    } else {
      alert('Falha ao editar imagem.');
    }
    setEditingImg(false);
  };

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice) return;
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: newItemName,
      description: newItemDesc,
      price: parseFloat(newItemPrice),
      category: 'Geral',
      imageUrl: newItemImage || undefined
    };
    addMenuItem(newItem);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemImage(null);
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemDesc(item.description || '');
    setEditItemPrice(item.price.toString());
    setEditItemImage(item.imageUrl || null);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editItemName || !editItemPrice) return;
    updateMenuItem(editingItem.id, {
      name: editItemName,
      description: editItemDesc,
      price: parseFloat(editItemPrice),
      imageUrl: editItemImage || undefined
    });
    setEditingItem(null);
    setEditItemName('');
    setEditItemDesc('');
    setEditItemPrice('');
    setEditItemImage(null);
  };

  const handleGenerateEditDescription = async () => {
    if (!editItemName) return alert('Digite o nome do prato primeiro');
    setGeneratingDesc(true);
    const desc = await generateText(`Crie uma descrição apetitosa e curta (máx 20 palavras) para um prato de restaurante chamado: ${editItemName}. Foque em sabor e ingredientes.`);
    setEditItemDesc(desc);
    setGeneratingDesc(false);
  };

  const handleGenerateEditImage = async () => {
    if (!editItemName) return alert('Digite o nome do prato primeiro');
    setGeneratingImg(true);
    const prompt = `Uma foto profissional e apetitosa de comida: ${editItemName}. Iluminação de estúdio, alta resolução, 8k, food styling.`;
    const base64 = await generateMenuImage(prompt, imgSize);
    if (base64) {
      setEditItemImage(base64);
    } else {
      alert('Falha ao gerar imagem.');
    }
    setGeneratingImg(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Menu Inteligente</h2>
        <p className="text-gray-500">Utilize a IA para criar descrições e fotos incríveis para seus pratos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Plus size={20} /> Adicionar Novo Prato
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Prato</label>
              <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Pizza Margherita"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input 
                type="number" 
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <button 
                  onClick={handleGenerateDescription}
                  disabled={generatingDesc}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                >
                  <Wand2 size={12} /> Gerar com IA
                </button>
              </div>
              <textarea 
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Descrição detalhada do prato..."
              />
            </div>

            {/* Image Generation Section */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <label className="block text-sm font-medium text-gray-700">Imagem do Prato</label>
              
              {newItemImage ? (
                <div className="space-y-3">
                  <img src={newItemImage} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={imgPrompt}
                        onChange={(e) => setImgPrompt(e.target.value)}
                        placeholder="Comando para editar (Ex: Adicionar batatas)"
                        className="flex-1 px-3 py-1.5 text-sm border rounded"
                     />
                     <Button size="sm" variant="secondary" onClick={handleEditImage} isLoading={editingImg}>
                       <Edit size={14} className="mr-1"/> Editar
                     </Button>
                     <Button size="sm" variant="danger" onClick={() => setNewItemImage(null)}>
                       <Trash2 size={14} />
                     </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="mb-4">
                     <select 
                        value={imgSize}
                        onChange={(e) => setImgSize(e.target.value as ImageSize)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mr-2"
                     >
                        <option value={ImageSize.SIZE_1K}>1K (Rápido)</option>
                        <option value={ImageSize.SIZE_2K}>2K (HD)</option>
                        <option value={ImageSize.SIZE_4K}>4K (Ultra)</option>
                     </select>
                  </div>
                  <Button variant="secondary" onClick={handleGenerateImage} isLoading={generatingImg}>
                    <ImagePlus size={18} className="mr-2" />
                    Gerar Imagem com IA (Gemini Pro)
                  </Button>
                  <p className="mt-2 text-xs text-gray-500">Usa modelo Gemini 3 Pro Image</p>
                </div>
              )}
            </div>

            <Button className="w-full" onClick={handleAddItem}>Salvar Prato</Button>
          </div>
        </div>

        {/* Preview List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cardápio Atual</h3>
          {menu.map(item => (
            <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImagePlus size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900">{item.name}</h4>
                  <span className="font-bold text-indigo-600">R$ {item.price.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                <div className="mt-3 flex gap-2">
                  <button className="text-xs text-indigo-600 font-medium hover:text-indigo-800" onClick={() => handleEditClick(item)}>Editar</button>
                  <button className="text-xs text-red-600 font-medium hover:text-red-800" onClick={() => removeMenuItem(item.id)}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)}
        title="Editar Prato"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Prato</label>
            <input 
              type="text" 
              value={editItemName}
              onChange={(e) => setEditItemName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
            <input 
              type="number" 
              value={editItemPrice}
              onChange={(e) => setEditItemPrice(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <button 
                onClick={handleGenerateEditDescription}
                disabled={generatingDesc}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                <Wand2 size={12} /> Gerar com IA
              </button>
            </div>
            <textarea 
              value={editItemDesc}
              onChange={(e) => setEditItemDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {editItemImage && (
            <div>
              <img src={editItemImage} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              <Button 
                size="sm" 
                variant="danger" 
                onClick={() => setEditItemImage(null)}
                className="mt-2"
              >
                <Trash2 size={14} className="mr-1"/> Remover Imagem
              </Button>
            </div>
          )}

          {!editItemImage && (
            <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
              <Button variant="secondary" onClick={handleGenerateEditImage} isLoading={generatingImg}>
                <ImagePlus size={18} className="mr-2" />
                Gerar Nova Imagem
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="ghost" onClick={() => setEditingItem(null)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="flex-1">
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};