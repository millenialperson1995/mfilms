import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  PackagePlus, ShoppingCart, Plus, CheckCircle, Boxes, History,
  Pencil, Trash2, AlertTriangle, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from './supabaseClient';

// --- Constantes e Estado Inicial ---
const LOW_STOCK_THRESHOLD = 4;
const initialFormEstoque = { modelo: '', largura: '', comprimento: '', custoRolo: '' };
const initialFormVenda = {
  cliente: '',
  projeto: '',
  peliculaId: '',
  medidas: { frente: '', lados: '', traseira: '', outros: '' },
  valorCobrado: ''
};

// --- Funções Utilitárias ---
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatNumber = (value, decimalPlaces = 2) => (Number(value) || 0).toFixed(decimalPlaces).replace('.', ',');

function App() {
  // --- STATE HOOKS ---
  const [estoque, setEstoque] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Estados dos formulários
  const [formEstoque, setFormEstoque] = useState(initialFormEstoque);
  const [formVenda, setFormVenda] = useState(initialFormVenda);

  // Estados dos modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // --- EFFECT HOOKS (Ciclo de Vida) ---
  // Carregar dados do Supabase na montagem inicial
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch estoque
        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (estoqueError) {
          console.error("Failed to fetch estoque", estoqueError);
        } else {
          // Convert numeric fields properly
          const formattedEstoque = estoqueData.map(item => ({
            ...item,
            largura: Number(item.largura),
            comprimentoOriginal: Number(item.comprimento_original),
            custoRolo: Number(item.custo_rolo),
            areaOriginal: Number(item.area_original),
            custoM2: Number(item.custo_m2),
            comprimentoRestante: Number(item.comprimento_restante),
            areaRestante: Number(item.area_restante)
          }));
          setEstoque(formattedEstoque);
        }

        // Fetch vendas
        const { data: vendasData, error: vendasError } = await supabase
          .from('vendas')
          .select('*')
          .order('data', { ascending: false });
        
        if (vendasError) {
          console.error("Failed to fetch vendas", vendasError);
        } else {
          // Convert numeric fields properly
          const formattedVendas = vendasData.map(venda => ({
            ...venda,
            total_usado_m2: Number(venda.total_usado_m2),
            custo_material: Number(venda.custo_material),
            lucro: Number(venda.lucro),
            margem_lucro: Number(venda.margem_lucro)
          }));
          setVendas(formattedVendas);
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };

    fetchInitialData();
  }, []);

  // --- DERIVED STATE & MEMOIZATION ---
  const vendasOrdenadas = useMemo(() => {
    return [...vendas].sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [vendas]);

  const resumoVenda = useMemo(() => {
    const item = estoque.find(i => i.id === formVenda.peliculaId);
    const totalUsadoM2 = Object.values(formVenda.medidas).reduce((sum, val) => sum + (Number(val) || 0), 0);
    
    if (!item || totalUsadoM2 === 0 || !formVenda.valorCobrado) {
      return { visivel: false };
    }
    
    const custo = totalUsadoM2 * item.custoM2;
    const lucro = Number(formVenda.valorCobrado) - custo;
    const margem = Number(formVenda.valorCobrado) > 0 ? (lucro / Number(formVenda.valorCobrado)) * 100 : 0;
    
    return { visivel: true, custo, lucro, margem };
  }, [formVenda, estoque]);

  // --- HANDLER FUNCTIONS ---
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleEstoqueFormChange = (e) => {
    const { name, value } = e.target;
    setFormEstoque(prev => ({ ...prev, [name]: value }));
  };
  
  const handleVendaFormChange = (e) => {
    const { name, value } = e.target;
    setFormVenda(prev => ({ ...prev, [name]: value }));
  };

  const handleVendaMedidasChange = (e) => {
    const { name, value } = e.target;
    setFormVenda(prev => ({ 
      ...prev, 
      medidas: { ...prev.medidas, [name]: value }
    }));
  };

  const handleAdicionarEstoque = async (e) => {
    e.preventDefault();
    const largura = Number(formEstoque.largura);
    const comprimento = Number(formEstoque.comprimento);
    const custoRolo = Number(formEstoque.custoRolo);
    const areaOriginal = largura * comprimento;

    if (areaOriginal <= 0) {
      showToast("Dimensões ou custo inválidos.", "error");
      return;
    }

    const novoItem = {
      id: `P${Date.now().toString().slice(-6)}`,
      modelo: formEstoque.modelo,
      largura,
      comprimento_original: comprimento,
      custo_rolo: custoRolo,
      area_original: areaOriginal,
      custo_m2: custoRolo / areaOriginal,
      comprimento_restante: comprimento,
      area_restante: areaOriginal,
    };
    
    // Add to Supabase
    const { error } = await supabase
      .from('estoque')
      .insert(novoItem);
    
    if (error) {
      console.error("Failed to add estoque", error);
      showToast("Erro ao adicionar película ao estoque.", "error");
      return;
    }
    
    // Update local state
    setEstoque(prev => [...prev, {
      ...novoItem,
      comprimentoOriginal: comprimento,
      custoRolo: custoRolo,
      areaOriginal: areaOriginal,
      custoM2: custoRolo / areaOriginal,
      comprimentoRestante: comprimento,
      areaRestante: areaOriginal
    }]);
    setFormEstoque(initialFormEstoque);
    showToast('Película adicionada com sucesso!');
  };

  const handleFinalizarVenda = async (e) => {
    e.preventDefault();
    const itemEstoque = estoque.find(item => item.id === formVenda.peliculaId);
    if (!itemEstoque) return showToast('Película inválida.', 'error');
    
    const totalUsadoM2 = Object.values(formVenda.medidas).reduce((s, v) => s + (Number(v) || 0), 0);
    if (totalUsadoM2 <= 0) return showToast('Insira ao menos uma medida.', 'error');

    const comprimentoDebitado = totalUsadoM2 / itemEstoque.largura;
    if (comprimentoDebitado > itemEstoque.comprimentoRestante) {
      return showToast(`Estoque insuficiente! Disponível: ${formatNumber(itemEstoque.comprimentoRestante)}m.`, 'error');
    }
    
    // Atualiza o estoque no Supabase
    const novoComprimento = itemEstoque.comprimentoRestante - comprimentoDebitado;
    const novaAreaRestante = itemEstoque.largura * novoComprimento;
    
    const { error: updateError } = await supabase
      .from('estoque')
      .update({
        comprimento_restante: novoComprimento,
        area_restante: novaAreaRestante
      })
      .eq('id', formVenda.peliculaId);
    
    if (updateError) {
      console.error("Failed to update estoque", updateError);
      showToast("Erro ao atualizar estoque.", "error");
      return;
    }
    
    // Atualiza o estoque local
    const novoEstoque = estoque.map(item => {
      if (item.id === formVenda.peliculaId) {
        return {
          ...item,
          comprimentoRestante: novoComprimento,
          areaRestante: novaAreaRestante
        };
      }
      return item;
    });
    setEstoque(novoEstoque);

    // Registra a venda no Supabase
    const custoMaterial = totalUsadoM2 * itemEstoque.custoM2;
    const lucro = Number(formVenda.valorCobrado) - custoMaterial;
    const margemLucro = Number(formVenda.valorCobrado) > 0 ? lucro / Number(formVenda.valorCobrado) : 0;
    
    const vendaData = {
      data: new Date().toISOString(),
      cliente: formVenda.cliente,
      projeto: formVenda.projeto,
      total_usado_m2: totalUsadoM2,
      custo_material: custoMaterial,
      lucro,
      margem_lucro: margemLucro,
    };
    
    const { error: insertError } = await supabase
      .from('vendas')
      .insert(vendaData);
    
    if (insertError) {
      console.error("Failed to insert venda", insertError);
      showToast("Erro ao registrar venda.", "error");
      return;
    }
    
    // Atualiza as vendas localmente
    setVendas(prev => [vendaData, ...prev]);

    showToast('Venda registrada com sucesso!');
    if ((itemEstoque.comprimentoRestante - comprimentoDebitado) <= LOW_STOCK_THRESHOLD) {
      showToast(`Atenção: Estoque baixo para ${itemEstoque.modelo}!`, 'warning');
    }
    setFormVenda(initialFormVenda);
  };
  
  const handleEdit = async (e) => {
    e.preventDefault();
    
    // Update in Supabase
    const { error } = await supabase
      .from('estoque')
      .update({
        modelo: currentItem.modelo,
        comprimento_restante: Number(currentItem.comprimentoRestante),
        custo_rolo: Number(currentItem.custoRolo),
        custo_m2: Number(currentItem.custoRolo) / (currentItem.largura * currentItem.comprimentoOriginal)
      })
      .eq('id', currentItem.id);
    
    if (error) {
      console.error("Failed to update item", error);
      showToast("Erro ao atualizar item.", "error");
      return;
    }
    
    // Update local state
    setEstoque(estoque.map(item => {
      if(item.id === currentItem.id) {
        const custoRolo = Number(currentItem.custoRolo);
        const areaOriginal = item.largura * item.comprimentoOriginal;
        return {
          ...item,
          modelo: currentItem.modelo,
          comprimentoRestante: Number(currentItem.comprimentoRestante),
          custoRolo: custoRolo,
          areaRestante: item.largura * Number(currentItem.comprimentoRestante),
          custoM2: areaOriginal > 0 ? custoRolo / areaOriginal : 0,
        }
      }
      return item;
    }));
    setIsEditModalOpen(false);
    showToast("Item atualizado com sucesso!");
  };

  const handleDelete = async () => {
    // Delete from Supabase
    const { error } = await supabase
      .from('estoque')
      .delete()
      .eq('id', currentItem.id);
    
    if (error) {
      console.error("Failed to delete item", error);
      showToast("Erro ao excluir item.", "error");
      return;
    }
    
    // Update local state
    setEstoque(estoque.filter(item => item.id !== currentItem.id));
    setIsDeleteModalOpen(false);
    showToast("Item excluído com sucesso!", "warning");
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
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium leading-6 text-slate-900">Editar Item do Estoque</h3>
            <form onSubmit={handleEdit} className="mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-modelo" className="block text-sm font-medium text-slate-600">Modelo</label>
                  <input type="text" value={currentItem.modelo} onChange={(e) => setCurrentItem({...currentItem, modelo: e.target.value})} id="edit-modelo" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="edit-comprimento-restante" className="block text-sm font-medium text-slate-600">Comprimento Restante (m)</label>
                  <input type="number" step="0.01" value={currentItem.comprimentoRestante} onChange={(e) => setCurrentItem({...currentItem, comprimentoRestante: e.target.value})} id="edit-comprimento-restante" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="edit-custo-rolo" className="block text-sm font-medium text-slate-600">Custo Total do Rolo (R$)</label>
                  <input type="number" step="0.01" value={currentItem.custoRolo} onChange={(e) => setCurrentItem({...currentItem, custoRolo: e.target.value})} id="edit-custo-rolo" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
                </div>
              </div>
              <div className="mt-5 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="rounded-md border border-transparent bg-primary-color px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      
      {isDeleteModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><Trash2 className="h-6 w-6 text-red-600" /></div>
            <h3 className="mt-4 text-lg font-medium leading-6 text-slate-900">Confirmar Exclusão</h3>
            <p className="mt-2 text-sm text-slate-500">Tem certeza? Esta ação não pode ser desfeita.</p>
            <div className="mt-5 flex justify-center space-x-3">
              <button onClick={() => setIsDeleteModalOpen(false)} type="button" className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Cancelar</button>
              <button onClick={handleDelete} type="button" className="w-full rounded-md border border-transparent bg-danger-color px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-danger-hover">Excluir</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-screen-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 md:text-4xl">M Film's</h1>
            <p className="mt-1 text-slate-500">Gestão Inteligente de Estoque e Vendas</p>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna Esquerda */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="card rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg">
              <h2 className="mb-4 flex items-center text-xl font-semibold text-slate-700">
                <PackagePlus className="mr-2 h-6 w-6 text-primary-color" />Cadastrar Nova Película
              </h2>
              <form onSubmit={handleAdicionarEstoque} className="space-y-4">
                 <div>
                  <label htmlFor="modelo" className="block text-sm font-medium text-slate-600">Modelo da Película</label>
                  <input type="text" name="modelo" value={formEstoque.modelo} onChange={handleEstoqueFormChange} id="modelo" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-color focus:ring-primary-color" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="largura" className="block text-sm font-medium text-slate-600">Largura (m)</label>
                    <input type="number" step="0.01" name="largura" value={formEstoque.largura} onChange={handleEstoqueFormChange} id="largura" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-color focus:ring-primary-color" />
                  </div>
                  <div>
                    <label htmlFor="comprimento" className="block text-sm font-medium text-slate-600">Comprimento (m)</label>
                    <input type="number" step="0.01" name="comprimento" value={formEstoque.comprimento} onChange={handleEstoqueFormChange} id="comprimento" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-color focus:ring-primary-color" />
                  </div>
                </div>
                <div>
                  <label htmlFor="custo-rolo" className="block text-sm font-medium text-slate-600">Custo do Rolo (R$)</label>
                  <input type="number" step="0.01" name="custoRolo" value={formEstoque.custoRolo} onChange={handleEstoqueFormChange} id="custo-rolo" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-color focus:ring-primary-color" />
                </div>
                <button type="submit" className="flex w-full items-center justify-center rounded-md bg-primary-color py-2.5 px-4 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-color focus:ring-offset-2">
                  <Plus className="mr-2 h-5 w-5" />Adicionar ao Estoque
                </button>
              </form>
            </div>
            
            <div className="card rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg">
               <h2 className="mb-4 flex items-center text-xl font-semibold text-slate-700">
                <ShoppingCart className="mr-2 h-6 w-6 text-secondary-color" />Registrar Venda
              </h2>
              <form onSubmit={handleFinalizarVenda} className="space-y-4">
                <div>
                  <label htmlFor="cliente" className="block text-sm font-medium text-slate-600">Nome do Cliente</label>
                  <input type="text" name="cliente" value={formVenda.cliente} onChange={handleVendaFormChange} id="cliente" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="projeto" className="block text-sm font-medium text-slate-600">Carro / Projeto</label>
                  <input type="text" name="projeto" value={formVenda.projeto} onChange={handleVendaFormChange} id="projeto" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
                </div>
                <div>
                  <label htmlFor="pelicula-usada" className="block text-sm font-medium text-slate-600">Película a ser Utilizada</label>
                  <select name="peliculaId" value={formVenda.peliculaId} onChange={handleVendaFormChange} id="pelicula-usada" required className="mt-1 block w-full rounded-md border-slate-300 bg-white shadow-sm">
                    <option value="" disabled>Selecione uma película</option>
                    {estoque.filter(item => item.comprimentoRestante > 0).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.modelo} (ID: {item.id}) - {formatNumber(item.comprimentoRestante)}m restantes
                      </option>
                    ))}
                  </select>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-2 font-medium text-slate-700">Medidas Utilizadas (m²)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" step="0.01" name="frente" value={formVenda.medidas.frente} onChange={handleVendaMedidasChange} placeholder="Frente" className="w-full rounded-md border-slate-300 py-2 px-3 text-sm" />
                    <input type="number" step="0.01" name="lados" value={formVenda.medidas.lados} onChange={handleVendaMedidasChange} placeholder="Lados" className="w-full rounded-md border-slate-300 py-2 px-3 text-sm" />
                    <input type="number" step="0.01" name="traseira" value={formVenda.medidas.traseira} onChange={handleVendaMedidasChange} placeholder="Traseira" className="w-full rounded-md border-slate-300 py-2 px-3 text-sm" />
                    <input type="number" step="0.01" name="outros" value={formVenda.medidas.outros} onChange={handleVendaMedidasChange} placeholder="Outros" className="w-full rounded-md border-slate-300 py-2 px-3 text-sm" />
                  </div>
                </div>
                <div className="space-y-4 border-t border-slate-200 pt-4">
                  <div>
                    <label htmlFor="valor-servico" className="block text-sm font-medium text-slate-600">Valor Cobrado (R$)</label>
                    <input type="number" step="0.01" name="valorCobrado" value={formVenda.valorCobrado} onChange={handleVendaFormChange} id="valor-servico" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
                  </div>
                  {resumoVenda.visivel && (
                    <div className="space-y-1 rounded-md bg-slate-50 p-3 text-sm">
                      <div className="flex justify-between"><span>Custo Material:</span> <span className="font-medium text-red-600">{formatCurrency(resumoVenda.custo)}</span></div>
                      <div className="flex justify-between"><span>Lucro Previsto:</span> <span className="font-bold text-green-600">{formatCurrency(resumoVenda.lucro)}</span></div>
                      <div className="flex justify-between"><span>Margem:</span> <span className="font-bold text-blue-600">{formatNumber(resumoVenda.margem)}%</span></div>
                    </div>
                  )}
                </div>
                <button type="submit" className="flex w-full items-center justify-center rounded-md bg-secondary-color py-2.5 px-4 font-semibold text-white hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-secondary-color focus:ring-offset-2">
                  <CheckCircle className="mr-2 h-5 w-5" />Finalizar Venda
                </button>
              </form>
            </div>
          </div>
          
          {/* Coluna Direita */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="card rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 flex items-center text-xl font-semibold text-slate-700">
                <Boxes className="mr-2 h-6 w-6 text-primary-color" />Estoque Atual
              </h2>
              <div className="custom-scrollbar overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Modelo</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Restante</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Custo/m²</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estoque.length === 0 ? (
                      <tr><td colSpan="5" className="py-8 text-center text-slate-500">Seu estoque está vazio.</td></tr>
                    ) : (
                      estoque.map(item => {
                        const isLowStock = item.comprimentoRestante <= LOW_STOCK_THRESHOLD;
                        return (
                          <tr key={item.id} className={`transition-colors hover:bg-slate-50 ${isLowStock ? 'low-stock-warning' : ''}`}>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.id}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{item.modelo}</td>
                            <td className={`px-4 py-3 text-sm font-semibold ${isLowStock ? 'low-stock-text' : 'text-green-600'}`}>
                              {isLowStock && <AlertTriangle className="mr-1 inline-block h-4 w-4" />}
                              {formatNumber(item.comprimentoRestante)}m ({formatNumber(item.areaRestante)}m²)
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">{formatCurrency(item.custoM2)}</td>
                            <td className="px-4 py-3 text-sm">
                              <button onClick={() => { setCurrentItem({ ...item }); setIsEditModalOpen(true); }} className="rounded-full p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => { setCurrentItem(item); setIsDeleteModalOpen(true); }} className="rounded-full p-1 text-red-500 hover:bg-red-100 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="card rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 flex items-center text-xl font-semibold text-slate-700">
                <History className="mr-2 h-6 w-6 text-secondary-color" />Histórico de Vendas
              </h2>
              <div className="custom-scrollbar max-h-96 overflow-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200">
                     <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Cliente/Projeto</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">m²</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Custo</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Lucro</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Margem</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y divide-slate-100">
                    {vendas.length === 0 ? (
                      <tr><td colSpan="6" className="py-8 text-center text-slate-500">Nenhuma venda registrada.</td></tr>
                    ) : (
                      vendasOrdenadas.map(venda => (
                        <tr key={venda.data} className="transition-colors hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-500">{new Date(venda.data).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            <div className="font-medium text-slate-800">{venda.cliente}</div>
                            <div>{venda.projeto}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{formatNumber(venda.total_usado_m2)}m²</td>
                          <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(venda.custo_material)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(venda.lucro)}</td>
                          <td className="px-4 py-3 text-sm text-blue-600">{formatNumber(venda.margem_lucro * 100)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;