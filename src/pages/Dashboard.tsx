import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, Product } from '@/hooks/useProducts';
import DashboardStats from '@/components/DashboardStats';
import ProductFormDialog from '@/components/ProductFormDialog';
import StockAdjustDialog from '@/components/StockAdjustDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package, Plus, Search, LogOut, Pencil, Trash2, ArrowUpDown, Loader2,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { products, isLoading, addProduct, updateProduct, deleteProduct, adjustStock } = useProducts();
  const [search, setSearch] = useState('');
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockDialog, setStockDialog] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku?.toLowerCase().includes(search.toLowerCase())) ||
    (p.category?.toLowerCase().includes(search.toLowerCase()))
  );

  const getStockBadge = (p: Product) => {
    if (p.quantity === 0) return <Badge variant="destructive" className="text-[10px]">Sem estoque</Badge>;
    if (p.quantity <= p.min_quantity) return <Badge className="bg-warning text-warning-foreground text-[10px]">Baixo</Badge>;
    return <Badge variant="secondary" className="text-[10px]">OK</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:inline">Estoque</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.storeName}</span>
            <Button variant="ghost" size="icon" onClick={signOut} className="active:scale-[0.95]">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <DashboardStats products={products} />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => { setEditingProduct(null); setProductDialog(true); }}
            className="active:scale-[0.97] transition-transform"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden"
          style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards', opacity: 0 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>
              <p className="text-sm mt-1">{search ? 'Tente outra busca' : 'Clique em "Novo Produto" para começar'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden sm:table-cell">Imagem</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p, i) => (
                    <TableRow
                      key={p.id}
                      className="group"
                      style={{ animation: `fade-in 0.3s ease-out ${i * 40}ms forwards`, opacity: 0 }}
                    >
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {p.image ? <img src={`http://localhost:3000${p.image}`} alt={p.name} className="w-10 h-10 object-cover rounded" /> : '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{p.sku || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{p.category || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{p.quantity} {p.unit}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getStockBadge(p)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right tabular-nums">
                        {p.sell_price ? `R$ ${p.sell_price.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 active:scale-[0.95]"
                            onClick={() => { setStockProduct(p); setStockDialog(true); }}
                            title="Movimentar estoque"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 active:scale-[0.95]"
                            onClick={() => { setEditingProduct(p); setProductDialog(true); }}
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive active:scale-[0.95]"
                            onClick={() => deleteProduct.mutate(p.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <ProductFormDialog
        open={productDialog}
        onClose={() => setProductDialog(false)}
        product={editingProduct}
        loading={addProduct.isPending || updateProduct.isPending}
        onSubmit={(data) => {
          if (editingProduct) {
            updateProduct.mutate({ id: editingProduct.id, ...data }, { onSuccess: () => setProductDialog(false) });
          } else {
            addProduct.mutate(data, { onSuccess: () => setProductDialog(false) });
          }
        }}
      />
      <StockAdjustDialog
        open={stockDialog}
        onClose={() => setStockDialog(false)}
        product={stockProduct}
        loading={adjustStock.isPending}
        onSubmit={(data) => {
          adjustStock.mutate(data, { onSuccess: () => setStockDialog(false) });
        }}
      />
    </div>
  );
}
