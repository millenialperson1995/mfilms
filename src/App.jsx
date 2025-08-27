import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { fetchInitialData } from './services/supabaseService';

// Import components
import EstoqueForm from './components/EstoqueForm';
import VendaForm from './components/VendaForm';
import EstoqueTable from './components/EstoqueTable';
import VendaTable from './components/VendaTable';
import EditModal from './components/EditModal';
import DeleteModal from './components/DeleteModal';

function App() {
  // --- STATE HOOKS ---
  const [estoque, setEstoque] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [toasts, setToasts] = useState([]);
  
  // Estados dos modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // --- EFFECT HOOKS (Ciclo de Vida) ---
  // Carregar dados do Supabase na montagem inicial
  useEffect(() => {
    const loadData = async () => {
      try {
        const { estoque, vendas } = await fetchInitialData();
        setEstoque(estoque);
        setVendas(vendas);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        showToast("Erro ao carregar dados iniciais. Por favor, recarregue a página.", "error");
      }
    };

    loadData();
  }, []);

  // --- HANDLER FUNCTIONS ---
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Funções para manipular o estoque
  const handleAddEstoque = (item) => {
    setEstoque(prev => [...prev, item]);
  };

  const handleUpdateEstoque = (updatedItem) => {
    setEstoque(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const handleDeleteEstoque = (id) => {
    setEstoque(prev => prev.filter(item => item.id !== id));
  };

  // Funções para manipular as vendas
  const handleAddVenda = (venda) => {
    setVendas(prev => [venda, ...prev]);
  };

  // Funções para manipular os modais
  const handleOpenEditModal = (item) => {
    setCurrentItem(item);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (item) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  // --- RENDERIZADO (JSX) ---
  return (
    <div className="p-4 md:p-6">
      {/* Container de Toasts */}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
          {toasts.map(toast => {
            const icons = { success: <CheckCircle2 />, warning: <AlertTriangle />, error: <AlertCircle /> };
            const colors = { success: 'bg-secondary-color', warning: 'bg-warning-color', error: 'bg-danger-color' };
            return (
              <div key={toast.id} className={`toast-animate flex items-center gap-3 rounded-lg px-5 py-3 text-white shadow-lg ${colors[toast.type]}`}>
                {icons[toast.type]} {toast.message}
              </div>
            )
          })}
        </div>,
        document.body
      )}

      {/* Modais */}
      <EditModal 
        isOpen={isEditModalOpen}
        currentItem={currentItem}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateItem={handleUpdateEstoque}
        showToast={showToast}
      />
      
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        currentItem={currentItem}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteItem={handleDeleteEstoque}
        showToast={showToast}
      />

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-screen-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 md:text-4xl">FilmFlow</h1>
            <p className="mt-1 text-slate-500">Gestão Inteligente de Estoque e Vendas</p>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna Esquerda */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <EstoqueForm onAddEstoque={handleAddEstoque} showToast={showToast} />
            <VendaForm 
              estoque={estoque}
              onAddVenda={handleAddVenda}
              onUpdateEstoque={handleUpdateEstoque}
              showToast={showToast}
            />
          </div>
          
          {/* Coluna Direita */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EstoqueTable 
              estoque={estoque}
              onEditItem={handleOpenEditModal}
              onDeleteItem={handleOpenDeleteModal}
            />
            <VendaTable vendas={vendas} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;