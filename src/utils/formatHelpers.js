// --- Funções Utilitárias de Formatação ---
export const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const formatNumber = (value, decimalPlaces = 2) => (Number(value) || 0).toFixed(decimalPlaces).replace('.', ',');

export const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');