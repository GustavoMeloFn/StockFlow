import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

export type Product = {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  description: string | null;
  unit: string;
  cost_price: number | null;
  sell_price: number | null;
  quantity: number;
  min_quantity: number;
  image: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

const API_URL = 'http://localhost:3000/api';

export function useProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`${API_URL}/products?userId=${user.id}`);
      if (!res.ok) throw new Error('Erro ao buscar produtos');
      const data = await res.json();
      return data.sort((a: Product, b: Product) => a.name.localeCompare(b.name));
    },
    enabled: !!user,
  });

  const addProduct = useMutation({
    mutationFn: async (product: Omit<ProductInsert, 'user_id'>) => {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, user_id: user!.id }),
      });
      if (!res.ok) throw new Error('Erro ao adicionar produto');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Produto adicionado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message || 'Erro ao adicionar', variant: 'destructive' }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Erro ao atualizar produto');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Produto atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message || 'Erro ao atualizar', variant: 'destructive' }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao remover produto');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Produto removido' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message || 'Erro ao remover', variant: 'destructive' }),
  });

  const adjustStock = useMutation({
    mutationFn: async ({ productId, type, quantity, notes }: { productId: string; type: 'entrada' | 'saida' | 'ajuste'; quantity: number; notes?: string }) => {
      const product = productsQuery.data?.find(p => p.id === productId);
      if (!product) throw new Error('Produto não encontrado');

      let newQty = product.quantity;
      if (type === 'entrada') newQty += quantity;
      else if (type === 'saida') newQty -= quantity;
      else newQty = quantity;

      if (newQty < 0) throw new Error('Estoque não pode ficar negativo');

      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!res.ok) throw new Error('Erro ao ajustar estoque');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Estoque atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message || 'Erro ao ajustar estoque', variant: 'destructive' }),
  });

  return { products: productsQuery.data ?? [], isLoading: productsQuery.isLoading, addProduct, updateProduct, deleteProduct, adjustStock };
}
