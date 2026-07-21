import { Edit2, Trash2 } from 'lucide-react';
import type { Investment } from '@/types/investment';

interface InvestmentTableProps {
  investments: Investment[];
  loading: boolean;
  onEdit: (inv: Investment) => void;
  onDelete: (id: string) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(n);
}

export function InvestmentTable({ investments, loading, onEdit, onDelete }: InvestmentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-hairline text-muted text-[12px] font-semibold uppercase tracking-wide">
            <th className="py-4 px-6">Name</th>
            <th className="py-4 px-6">Type</th>
            <th className="py-4 px-6 text-right">Invested</th>
            <th className="py-4 px-6 text-right">Current Val</th>
            <th className="py-4 px-6 text-right">Profit/Loss</th>
            <th className="py-4 px-6">Purchase Date</th>
            <th className="py-4 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!loading && investments.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-12 text-muted-soft text-body-md">
                No investments found.
              </td>
            </tr>
          )}
          {investments.map((inv) => {
            const profit = inv.currentValue - inv.investedAmount;
            const profitColor = profit > 0 ? 'text-semantic-up' : profit < 0 ? 'text-semantic-down' : 'text-ink';
            return (
              <tr key={inv.id} className="border-b border-hairline-soft hover:bg-surface-soft transition-colors h-16 group">
                <td className="py-3 px-6 text-ink font-semibold text-body-md whitespace-nowrap">{inv.investmentName}</td>
                <td className="py-3 px-6">
                  <span className="bg-surface-strong text-ink font-semibold text-xs rounded-pill px-3 py-1 uppercase tracking-wide">
                    {inv.investmentType}
                  </span>
                </td>
                <td className="py-3 px-6 text-right font-mono text-base font-medium tabular-nums text-ink">{fmt(inv.investedAmount)}</td>
                <td className="py-3 px-6 text-right font-mono text-base font-medium tabular-nums text-ink">{fmt(inv.currentValue)}</td>
                <td className={`py-3 px-6 text-right font-mono text-base font-medium tabular-nums ${profitColor}`}>
                  {profit > 0 ? '+' : ''}{fmt(profit)}
                </td>
                <td className="py-3 px-6 text-body-sm text-body-text">{inv.purchaseDate.split('T')[0]}</td>
                <td className="py-3 px-6 text-right whitespace-nowrap">
                  <button onClick={() => onEdit(inv)} className="p-2 text-muted hover:text-primary transition-colors inline-block" aria-label="Edit">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDelete(inv.id)} className="p-2 text-muted hover:text-semantic-down transition-colors inline-block ml-1" aria-label="Delete">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
