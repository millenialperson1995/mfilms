import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { estoqueService } from '../services/supabaseService';

export default function DeleteModal({ isOpen, currentItem, onClose, onDeleteItem, showToast }) {
  const handleDelete = async () => {
    // Delete from Supabase
    try {
      await estoqueService.delete(currentItem.id);
      
      // Update parent state
      onDeleteItem(currentItem.id);
      onClose();
      showToast("Item excluído com sucesso!", "warning");
    } catch (error) {
      console.error("Failed to delete item", error);
      showToast("Erro ao excluir item. Por favor, tente novamente.", "error");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium leading-6 text-slate-900">Confirmar Exclusão</h3>
        <p className="mt-2 text-sm text-slate-500">Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="mt-5 flex justify-center space-x-3">
          <button onClick={onClose} type="button" className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={handleDelete} type="button" className="w-full rounded-md border border-transparent bg-danger-color px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger-hover">Excluir</button>
        </div>
      </div>
    </div>,
    document.body
  );
}