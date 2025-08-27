import { supabase } from '../supabaseClient';

// Função para tentar novamente uma operação com backoff exponencial
export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Serviços para Estoque
export const estoqueService = {
  getAll: () => supabase.from('estoque').select('*').order('created_at', { ascending: false }),
  
  create: (item) => retryOperation(async () => {
    const { error } = await supabase.from('estoque').insert(item);
    if (error) throw error;
  }),
  
  update: (id, item) => retryOperation(async () => {
    const { error } = await supabase.from('estoque').update(item).eq('id', id);
    if (error) throw error;
  }),
  
  delete: (id) => retryOperation(async () => {
    const { error } = await supabase.from('estoque').delete().eq('id', id);
    if (error) throw error;
  })
};

// Serviços para Vendas
export const vendasService = {
  getAll: () => supabase.from('vendas').select('*').order('data', { ascending: false }),
  
  create: (venda) => retryOperation(async () => {
    const { error } = await supabase.from('vendas').insert(venda);
    if (error) throw error;
  })
};

// Função para buscar dados iniciais
export const fetchInitialData = async () => {
  try {
    // Fetch estoque
    const { data: estoqueData, error: estoqueError } = await estoqueService.getAll();
    
    if (estoqueError) {
      console.error("Failed to fetch estoque", estoqueError);
      throw estoqueError;
    }
    
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

    // Fetch vendas
    const { data: vendasData, error: vendasError } = await vendasService.getAll();
    
    if (vendasError) {
      console.error("Failed to fetch vendas", vendasError);
      throw vendasError;
    }
    
    // Convert numeric fields properly
    const formattedVendas = vendasData.map(venda => ({
      ...venda,
      total_usado_m2: Number(venda.total_usado_m2),
      custo_material: Number(venda.custo_material),
      lucro: Number(venda.lucro),
      margem_lucro: Number(venda.margem_lucro)
    }));

    return { estoque: formattedEstoque, vendas: formattedVendas };
  } catch (error) {
    console.error("Failed to fetch initial data", error);
    throw error;
  }
};