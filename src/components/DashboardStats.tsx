import { Package, AlertTriangle, TrendingUp, Boxes } from 'lucide-react';
import type { Product } from '@/hooks/useProducts';

interface Props {
  products: Product[];
}

export default function DashboardStats({ products }: Props) {
  const totalProducts = products.length;
  const totalItems = products.reduce((sum, product) => sum + product.quantity, 0);
  const lowStock = products.filter(product => product.quantity <= product.min_quantity && product.quantity > 0).length;
  const outOfStock = products.filter(product => product.quantity === 0).length;
  const totalValue = products.reduce((sum, product) => sum + (product.sell_price ?? 0) * product.quantity, 0);

  const stats = [
    { label: 'Produtos', value: totalProducts, icon: Package, color: 'bg-primary/10 text-primary' },
    { label: 'Itens em Estoque', value: totalItems.toLocaleString('pt-BR'), icon: Boxes, color: 'bg-secondary text-secondary-foreground' },
    { label: 'Estoque Baixo', value: lowStock + outOfStock, icon: AlertTriangle, color: outOfStock > 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning-foreground' },
    { label: 'Valor Total', value: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            <div className={`rounded-lg p-2 ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
