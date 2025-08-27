// --- Validação de Formulários ---
export const validateEstoqueForm = (form) => {
  const errors = {};
  
  if (!form.modelo.trim()) {
    errors.modelo = 'Modelo é obrigatório';
  }
  
  if (!form.largura || Number(form.largura) <= 0) {
    errors.largura = 'Largura deve ser um número positivo';
  }
  
  if (!form.comprimento || Number(form.comprimento) <= 0) {
    errors.comprimento = 'Comprimento deve ser um número positivo';
  }
  
  if (!form.custoRolo || Number(form.custoRolo) <= 0) {
    errors.custoRolo = 'Custo do rolo deve ser um número positivo';
  }
  
  return errors;
};

export const validateVendaForm = (form, estoque) => {
  const errors = {};
  
  if (!form.cliente.trim()) {
    errors.cliente = 'Cliente é obrigatório';
  }
  
  if (!form.projeto.trim()) {
    errors.projeto = 'Projeto é obrigatório';
  }
  
  if (!form.peliculaId) {
    errors.peliculaId = 'Selecione uma película';
  }
  
  const totalMedidas = Object.values(form.medidas).reduce((sum, val) => sum + (Number(val) || 0), 0);
  if (totalMedidas <= 0) {
    errors.medidas = 'Insira ao menos uma medida';
  }
  
  if (!form.valorCobrado || Number(form.valorCobrado) <= 0) {
    errors.valorCobrado = 'Valor cobrado deve ser um número positivo';
  }
  
  // Validar estoque disponível
  if (form.peliculaId && totalMedidas > 0) {
    const itemEstoque = estoque.find(item => item.id === form.peliculaId);
    if (itemEstoque) {
      const comprimentoDebitado = totalMedidas / itemEstoque.largura;
      if (comprimentoDebitado > itemEstoque.comprimentoRestante) {
        errors.estoque = `Estoque insuficiente! Disponível: ${formatNumber(itemEstoque.comprimentoRestante)}m.`;
      }
    }
  }
  
  return errors;
};

// Função auxiliar para formatação (precisamos também do formatHelpers.js)
const formatNumber = (value, decimalPlaces = 2) => (Number(value) || 0).toFixed(decimalPlaces).replace('.', ',');