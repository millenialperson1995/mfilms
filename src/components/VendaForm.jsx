import { useMemo, useState } from 'react';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import { validateVendaForm } from '../utils/validators';
import { formatCurrency, formatNumber } from '../utils/formatHelpers';
import { vendasService, estoqueService } from '../services/supabaseService';

const initialFormVenda = {
  cliente: '',
  projeto: '',
  peliculaId: '',
  medidas: { frente: '', lados: '', traseira: '', outros: '' },
  valorCobrado: ''
};

const LOW_STOCK_THRESHOLD = 4;

export default function VendaForm({ estoque, onAddVenda, onUpdateEstoque, showToast }) {
  const [formVenda, setFormVenda] = useState(initialFormVenda);
  const [formVendaErrors, setFormVendaErrors] = useState({});

  const handleVendaFormChange = (e) => {
    const { name, value } = e.target;
    setFormVenda(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro específico quando o usuário começar a digitar
    if (formVendaErrors[name]) {
      setFormVendaErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleVendaMedidasChange = (e) => {
    const { name, value } = e.target;
    setFormVenda(prev => ({ 
      ...prev, 
      medidas: { ...prev.medidas, [name]: value }
    }));
    
    // Limpar erro de medidas quando o usuário começar a digitar
    if (formVendaErrors.medidas) {
      setFormVendaErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.medidas;
        return newErrors;
      });
    }
  };

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

  const handleFinalizarVenda = async (e) => {
    e.preventDefault();
    
    // Validar formulário
    const errors = validateVendaForm(formVenda, estoque);
    if (Object.keys(errors).length > 0) {
      setFormVendaErrors(errors);
      showToast("Por favor, corrija os erros no formulário.", "error");
      return;
    }
    
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
    
    try {
      // Atualiza o estoque
      await estoqueService.update(formVenda.peliculaId, {
        comprimento_restante: novoComprimento,
        area_restante: novaAreaRestante
      });
      
      // Atualiza o estoque local
      const updatedItem = {
        ...itemEstoque,
        comprimentoRestante: novoComprimento,
        areaRestante: novaAreaRestante
      };
      
      onUpdateEstoque(updatedItem);

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
      
      await vendasService.create(vendaData);
      
      // Atualiza as vendas localmente
      onAddVenda({...vendaData, id: Date.now() + Math.random()});
      setFormVendaErrors({});

      showToast('Venda registrada com sucesso!');
      if ((itemEstoque.comprimentoRestante - comprimentoDebitado) <= LOW_STOCK_THRESHOLD) {
        showToast(`Atenção: Estoque baixo para ${itemEstoque.modelo}!`, 'warning');
      }
      setFormVenda(initialFormVenda);
    } catch (error) {
      console.error("Failed to process venda", error);
      showToast("Erro ao registrar venda. Por favor, tente novamente.", "error");
    }
  };

  return (
    <div className="card rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg">
       <h2 className="mb-4 flex items-center text-xl font-semibold text-slate-700">
        <ShoppingCart className="mr-2 h-6 w-6 text-secondary-color" />Registrar Venda
      </h2>
      <form onSubmit={handleFinalizarVenda} className="space-y-4">
        <div>
          <label htmlFor="cliente" className="block text-sm font-medium text-slate-600">Nome do Cliente</label>
          <input 
            type="text" 
            name="cliente" 
            value={formVenda.cliente} 
            onChange={handleVendaFormChange} 
            id="cliente" 
            required 
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm ${formVendaErrors.cliente ? 'border-red-500' : ''}`} 
          />
          {formVendaErrors.cliente && <p className="mt-1 text-sm text-red-600">{formVendaErrors.cliente}</p>}
        </div>
        <div>
          <label htmlFor="projeto" className="block text-sm font-medium text-slate-600">Carro / Projeto</label>
          <input 
            type="text" 
            name="projeto" 
            value={formVenda.projeto} 
            onChange={handleVendaFormChange} 
            id="projeto" 
            required 
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm ${formVendaErrors.projeto ? 'border-red-500' : ''}`} 
          />
          {formVendaErrors.projeto && <p className="mt-1 text-sm text-red-600">{formVendaErrors.projeto}</p>}
        </div>
        <div>
          <label htmlFor="pelicula-usada" className="block text-sm font-medium text-slate-600">Película a ser Utilizada</label>
          <select 
            name="peliculaId" 
            value={formVenda.peliculaId} 
            onChange={handleVendaFormChange} 
            id="pelicula-usada" 
            required 
            className={`mt-1 block w-full rounded-md border-slate-300 bg-white shadow-sm ${formVendaErrors.peliculaId ? 'border-red-500' : ''}`}
          >
            <option value="" disabled>Selecione uma película</option>
            {estoque.filter(item => item.comprimentoRestante > 0).map(item => (
              <option key={item.id} value={item.id}>
                {item.modelo} (ID: {item.id}) - {formatNumber(item.comprimentoRestante)}m restantes
              </option>
            ))}
          </select>
          {formVendaErrors.peliculaId && <p className="mt-1 text-sm text-red-600">{formVendaErrors.peliculaId}</p>}
        </div>
        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 font-medium text-slate-700">Medidas Utilizadas (m²)</p>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="number" 
              step="0.01" 
              name="frente" 
              value={formVenda.medidas.frente} 
              onChange={handleVendaMedidasChange} 
              placeholder="Frente" 
              className={`w-full rounded-md border-slate-300 py-2 px-3 text-sm ${formVendaErrors.medidas ? 'border-red-500' : ''}`} 
            />
            <input 
              type="number" 
              step="0.01" 
              name="lados" 
              value={formVenda.medidas.lados} 
              onChange={handleVendaMedidasChange} 
              placeholder="Lados" 
              className={`w-full rounded-md border-slate-300 py-2 px-3 text-sm ${formVendaErrors.medidas ? 'border-red-500' : ''}`} 
            />
            <input 
              type="number" 
              step="0.01" 
              name="traseira" 
              value={formVenda.medidas.traseira} 
              onChange={handleVendaMedidasChange} 
              placeholder="Traseira" 
              className={`w-full rounded-md border-slate-300 py-2 px-3 text-sm ${formVendaErrors.medidas ? 'border-red-500' : ''}`} 
            />
            <input 
              type="number" 
              step="0.01" 
              name="outros" 
              value={formVenda.medidas.outros} 
              onChange={handleVendaMedidasChange} 
              placeholder="Outros" 
              className={`w-full rounded-md border-slate-300 py-2 px-3 text-sm ${formVendaErrors.medidas ? 'border-red-500' : ''}`} 
            />
          </div>
          {formVendaErrors.medidas && <p className="mt-1 text-sm text-red-600">{formVendaErrors.medidas}</p>}
        </div>
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <div>
            <label htmlFor="valor-servico" className="block text-sm font-medium text-slate-600">Valor Cobrado (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              name="valorCobrado" 
              value={formVenda.valorCobrado} 
              onChange={handleVendaFormChange} 
              id="valor-servico" 
              required 
              className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm ${formVendaErrors.valorCobrado ? 'border-red-500' : ''}`} 
            />
            {formVendaErrors.valorCobrado && <p className="mt-1 text-sm text-red-600">{formVendaErrors.valorCobrado}</p>}
          </div>
          {formVendaErrors.estoque && <p className="mt-1 text-sm text-red-600">{formVendaErrors.estoque}</p>}
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
  );
}