import { useState } from 'react';
import { Plus, PackagePlus } from 'lucide-react';
import { validateEstoqueForm } from '../utils/validators';
import { estoqueService } from '../services/supabaseService';

const initialFormEstoque = { modelo: '', largura: '', comprimento: '', custoRolo: '' };

export default function EstoqueForm({ onAddEstoque, showToast }) {
  const [formEstoque, setFormEstoque] = useState(initialFormEstoque);
  const [formEstoqueErrors, setFormEstoqueErrors] = useState({});

  const handleEstoqueFormChange = (e) => {
    const { name, value } = e.target;
    setFormEstoque(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro específico quando o usuário começar a digitar
    if (formEstoqueErrors[name]) {
      setFormEstoqueErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAdicionarEstoque = async (e) => {
    e.preventDefault();
    
    // Validar formulário
    const errors = validateEstoqueForm(formEstoque);
    if (Object.keys(errors).length > 0) {
      setFormEstoqueErrors(errors);
      showToast("Por favor, corrija os erros no formulário.", "error");
      return;
    }
    
    const largura = Number(formEstoque.largura);
    const comprimento = Number(formEstoque.comprimento);
    const custoRolo = Number(formEstoque.custoRolo);
    const areaOriginal = largura * comprimento;

    if (areaOriginal <= 0) {
      showToast("Dimensões ou custo inválidos.", "error");
      return;
    }

    // Gerar um ID único baseado no timestamp + um número aleatório para evitar duplicatas
    const uniqueId = `P${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const novoItem = {
      id: uniqueId,
      modelo: formEstoque.modelo,
      largura,
      comprimento_original: comprimento,
      custo_rolo: custoRolo,
      area_original: areaOriginal,
      custo_m2: custoRolo / areaOriginal,
      comprimento_restante: comprimento,
      area_restante: areaOriginal,
    };
    
    // Add to Supabase com retry
    try {
      await estoqueService.create(novoItem);
      
      // Update parent state
      onAddEstoque({
        ...novoItem,
        comprimentoOriginal: comprimento,
        custoRolo: custoRolo,
        areaOriginal: areaOriginal,
        custoM2: custoRolo / areaOriginal,
        comprimentoRestante: comprimento,
        areaRestante: areaOriginal
      });
      
      setFormEstoque(initialFormEstoque);
      setFormEstoqueErrors({});
      showToast('Película adicionada com sucesso!');
    } catch (error) {
      console.error("Failed to add estoque", error);
      showToast("Erro ao adicionar película ao estoque. Por favor, tente novamente.", "error");
    }
  };

  return (
    <div className="card rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg">
      <h2 className="mb-4 flex items-center text-xl font-semibold text-slate-700">
        <PackagePlus className="mr-2 h-6 w-6 text-primary-color" />Cadastrar Nova Película
      </h2>
      <form onSubmit={handleAdicionarEstoque} className="space-y-4">
         <div>
          <label htmlFor="modelo" className="block text-sm font-medium text-slate-600">Modelo da Película</label>
          <input 
            type="text" 
            name="modelo" 
            value={formEstoque.modelo} 
            onChange={handleEstoqueFormChange} 
            id="modelo" 
            required 
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-color focus:ring-primary-color ${formEstoqueErrors.modelo ? 'border-red-500' : ''}`} 
          />
          {formEstoqueErrors.modelo && <p className="mt-1 text-sm text-red-600">{formEstoqueErrors.modelo}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="largura" className="block text-sm font-medium text-slate-600">Largura (m)</label>
            <input 
              type="number" 
              step="0.01" 
              name="largura" 
              value={formEstoque.largura} 
              onChange={handleEstoqueFormChange} 
              id="largura" 
              required 
              className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-color focus:ring-primary-color ${formEstoqueErrors.largura ? 'border-red-500' : ''}`} 
            />
            {formEstoqueErrors.largura && <p className="mt-1 text-sm text-red-600">{formEstoqueErrors.largura}</p>}
          </div>
          <div>
            <label htmlFor="comprimento" className="block text-sm font-medium text-slate-600">Comprimento (m)</label>
            <input 
              type="number" 
              step="0.01" 
              name="comprimento" 
              value={formEstoque.comprimento} 
              onChange={handleEstoqueFormChange} 
              id="comprimento" 
              required 
              className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-color focus:ring-primary-color ${formEstoqueErrors.comprimento ? 'border-red-500' : ''}`} 
            />
            {formEstoqueErrors.comprimento && <p className="mt-1 text-sm text-red-600">{formEstoqueErrors.comprimento}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="custo-rolo" className="block text-sm font-medium text-slate-600">Custo do Rolo (R$)</label>
          <input 
            type="number" 
            step="0.01" 
            name="custoRolo" 
            value={formEstoque.custoRolo} 
            onChange={handleEstoqueFormChange} 
            id="custo-rolo" 
            required 
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-color focus:ring-primary-color ${formEstoqueErrors.custoRolo ? 'border-red-500' : ''}`} 
          />
          {formEstoqueErrors.custoRolo && <p className="mt-1 text-sm text-red-600">{formEstoqueErrors.custoRolo}</p>}
        </div>
        <button type="submit" className="flex w-full items-center justify-center rounded-md bg-primary-color py-2.5 px-4 font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-color focus:ring-offset-2">
          <Plus className="mr-2 h-5 w-5" />Adicionar ao Estoque
        </button>
      </form>
    </div>
  );
}