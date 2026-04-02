import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useProducts, Product } from '@/hooks/useProducts';
import ProductFormDialog from '@/components/ProductFormDialog';
import StockAdjustDialog from '@/components/StockAdjustDialog';
import DashboardStats from '@/components/DashboardStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package, Plus, Sun, Moon, LogOut, Pencil, Loader2, Search, Trash, ChevronUp, ChevronDown,
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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    (product.sku?.toLowerCase().includes(search.toLowerCase())) ||
    (product.category?.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (!sortColumn) return 0;
    let aVal: string | number, bVal: string | number;
    switch (sortColumn) {
      case 'Produto':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'SKU':
        aVal = (a.sku || '').toLowerCase();
        bVal = (b.sku || '').toLowerCase();
        break;
      case 'Categoria':
        aVal = (a.category || '').toLowerCase();
        bVal = (b.category || '').toLowerCase();
        break;
      case 'Qtd':
        aVal = a.quantity;
        bVal = b.quantity;
        break;
      case 'Status':
        aVal = a.quantity;
        bVal = b.quantity;
        break;
      case 'Preço Venda':
        aVal = a.sell_price || 0;
        bVal = b.sell_price || 0;
        break;
      default:
        return 0;
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStockBadge = (product: Product) => {
    if (product.quantity === 0) return <Badge variant="destructive" className="text-[10px]">Sem estoque</Badge>;
    if (product.quantity <= product.min_quantity) return <Badge className="bg-warning text-warning-foreground text-[10px]">Baixo</Badge>;
    return <Badge variant="secondary" className="text-[10px]">OK</Badge>;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
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
        {/* Report e dashboards referente ao estoque do usuário atual */}
        {/* <DashboardStats products={products} /> */}

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
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('Produto')}>
                      Produto {sortColumn === 'Produto' && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell cursor-pointer select-none" onClick={() => handleSort('SKU')}>
                      SKU {sortColumn === 'SKU' && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                    </TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer select-none" onClick={() => handleSort('Categoria')}>
                      Categoria {sortColumn === 'Categoria' && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('Qtd')}>
                      Qtd {sortColumn === 'Qtd' && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell cursor-pointer select-none" onClick={() => handleSort('Status')}>
                      Status {sortColumn === 'Status' && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-right cursor-pointer select-none" onClick={() => handleSort('Preço Venda')}>
                      Preço Venda {sortColumn === 'Preço Venda' && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFiltered.map((product, index) => (
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
                          {/* <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => { setSelectedForStock(product); setStockOpen(true); }}
                            title="Ajustar Estoque"
                          >
                            <Package className="h-3.5 w-3.5" />
                          </Button> */}
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover este produto?')) {
                                deleteProduct.mutate(product.id);
                              }
                            }}
                            title="Remover"
                          >
                            <Trash className="h-3.5 w-3.5" />
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
