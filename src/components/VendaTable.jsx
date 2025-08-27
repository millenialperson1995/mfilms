import { History } from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatHelpers';

export default function VendaTable({ vendas }) {
  return (
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
              vendas.map(venda => (
                <tr key={venda.id || venda.data} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(venda.data)}</td>
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
  );
}