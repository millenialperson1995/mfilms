import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatHelpers';

const LOW_STOCK_THRESHOLD = 4;

export default function EstoqueTable({ estoque, onEditItem, onDeleteItem }) {
  return (
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
                      <button onClick={() => onEditItem(item)} className="rounded-full p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => onDeleteItem(item)} className="rounded-full p-1 text-red-500 hover:bg-red-100 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Boxes({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}