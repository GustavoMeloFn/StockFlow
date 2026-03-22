import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, Product } from '@/hooks/useProducts';
import ProductFormDialog from '@/components/ProductFormDialog';
import StockAdjustDialog from '@/components/StockAdjustDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package, Plus, Sun, Moon, LogOut, Pencil, Loader2,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { products, isLoading, addProduct, updateProduct, deleteProduct, adjustStock } = useProducts();
  const [search, setSearch] = useState('');
  const [openProduct, setOpenProduct] = useState(false);
  const [productInEdit, setProductInEdit] = useState<Product | null>(null);
  const [stockOpen, setStockOpen] = useState(false);
  const [selectedForStock, setSelectedForStock] = useState<Product | null>(null);

  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    (product.sku?.toLowerCase().includes(search.toLowerCase())) ||
    (product.category?.toLowerCase().includes(search.toLowerCase()))
  );

  const getStockBadge = (product: Product) => {
    if (product.quantity === 0) return <Badge variant="destructive" className="text-[10px]">Sem estoque</Badge>;
    if (product.quantity <= product.min_quantity) return <Badge className="bg-warning text-warning-foreground text-[10px]">Baixo</Badge>;
    return <Badge variant="secondary" className="text-[10px]">OK</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:inline">StockFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.storeName}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Button
            onClick={() => { setProductInEdit(null); setOpenProduct(true); }}
            className="active:scale-[0.97] transition-transform"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
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
                    <TableHead className="hidden sm:table-cell">Imagem</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((product, index) => (
                    <TableRow
                      key={product.id}
                      className="group"
                    >
                      <TableCell className="hidden sm:table-cell">
                        {product.image ? <img src={`http://localhost:3000${product.image}`} alt={product.name} className="w-10 h-10 object-cover rounded" /> : '—'}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{product.sku || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{product.category || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{product.quantity} {product.unit}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getStockBadge(product)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right tabular-nums">
                        {product.sell_price ? `R$ ${product.sell_price.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={() => { setProductInEdit(product); setOpenProduct(true); }}
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
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

      <ProductFormDialog
        open={openProduct}
        onClose={() => setOpenProduct(false)}
        product={productInEdit}
        loading={addProduct.isPending || updateProduct.isPending}
        onSubmit={(data) => {
          if (productInEdit) {
            updateProduct.mutate({ id: productInEdit.id, ...data }, { onSuccess: () => setOpenProduct(false) });
          } else {
            addProduct.mutate(data, { onSuccess: () => setOpenProduct(false) });
          }
        }}
      />
      <StockAdjustDialog
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        product={selectedForStock}
        loading={adjustStock.isPending}
        onSubmit={(data) => {
          adjustStock.mutate(data, { onSuccess: () => setStockOpen(false) });
        }}
      />
    </div>
  );
}
