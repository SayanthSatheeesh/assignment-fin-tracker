import type { PortfolioSummary } from '@/types/investment';

function StatCard({
  label, value, sub, isProfit,
}: {
  label: string; value: string; sub?: string; isProfit?: boolean;
}) {
  const profitColor = isProfit !== undefined
    ? (isProfit ? 'text-semantic-up' : 'text-semantic-down')
    : 'text-ink';

  return (
    <div className="flex-1 bg-canvas border border-hairline rounded-xl p-8">
      <p className="text-muted-foreground text-[12px] font-semibold uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`font-mono text-[28px] font-medium tabular-nums ${profitColor}`}>
        {value}
      </p>
      {sub && (
        <p className={`font-mono text-body-sm tabular-nums mt-1 ${profitColor}`}>{sub}</p>
      )}
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(n);
}

export function PortfolioSummaryCard({ summary }: { summary: PortfolioSummary }) {
  const isProfit = summary.profit >= 0;
  return (
    <section className="py-12 border-b border-hairline bg-canvas">
      <div className="max-w-[1200px] mx-auto px-6 flex gap-6 flex-col md:flex-row">
        <StatCard label="Total Invested" value={fmt(summary.totalInvested)} />
        <StatCard label="Current Value"  value={fmt(summary.currentValue)} />
        <StatCard
          label="Profit / Loss"
          value={(isProfit && summary.profit > 0 ? '+' : '') + fmt(summary.profit)}
          isProfit={summary.profit !== 0 ? isProfit : undefined}
        />
        <StatCard
          label="Return %"
          value={`${isProfit && summary.profitPercentage > 0 ? '+' : ''}${summary.profitPercentage.toFixed(2)}%`}
          isProfit={summary.profitPercentage !== 0 ? isProfit : undefined}
        />
      </div>
    </section>
  );
}
