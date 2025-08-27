import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { estoqueService } from '../services/supabaseService';

export default function EditModal({ isOpen, currentItem, onClose, onUpdateItem, showToast }) {
  const [editItem, setEditItem] = useState(currentItem || {});

  useEffect(() => {
    setEditItem(currentItem || {});
  }, [currentItem]);

  const handleEdit = async (e) => {
    e.preventDefault();
    
    // Update in Supabase
    try {
      await estoqueService.update(editItem.id, {
        modelo: editItem.modelo,
        comprimento_restante: Number(editItem.comprimentoRestante),
        custo_rolo: Number(editItem.custoRolo),
        custo_m2: Number(editItem.custoRolo) / (editItem.largura * editItem.comprimentoOriginal)
      });
      
      // Update parent state
      onUpdateItem({
        ...editItem,
        comprimentoRestante: Number(editItem.comprimentoRestante),
        custoRolo: Number(editItem.custoRolo),
        custoM2: Number(editItem.custoRolo) / (editItem.largura * editItem.comprimentoOriginal)
      });
      
      onClose();
      showToast("Item atualizado com sucesso!");
    } catch (error) {
      console.error("Failed to update item", error);
      showToast("Erro ao atualizar item. Por favor, tente novamente.", "error");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-medium leading-6 text-slate-900">Editar Item do Estoque</h3>
        <form onSubmit={handleEdit} className="mt-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-modelo" className="block text-sm font-medium text-slate-600">Modelo</label>
              <input 
                type="text" 
                value={editItem.modelo || ''} 
                onChange={(e) => setEditItem({...editItem, modelo: e.target.value})} 
                id="edit-modelo" 
                required 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
              />
            </div>
            <div>
              <label htmlFor="edit-comprimento-restante" className="block text-sm font-medium text-slate-600">Comprimento Restante (m)</label>
              <input 
                type="number" 
                step="0.01" 
                value={editItem.comprimentoRestante || ''} 
                onChange={(e) => setEditItem({...editItem, comprimentoRestante: e.target.value})} 
                id="edit-comprimento-restante" 
                required 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
              />
            </div>
            <div>
              <label htmlFor="edit-custo-rolo" className="block text-sm font-medium text-slate-600">Custo Total do Rolo (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                value={editItem.custoRolo || ''} 
                onChange={(e) => setEditItem({...editItem, custoRolo: e.target.value})} 
                id="edit-custo-rolo" 
                required 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" 
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md border border-transparent bg-primary-color px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}