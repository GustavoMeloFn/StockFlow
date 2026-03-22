import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Product } from '@/hooks/useProducts';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  product?: Product | null;
  loading?: boolean;
}

export default function ProductFormDialog({ open, onClose, onSubmit, product, loading }: Props) {
  const [form, setForm] = useState({
    name: '', sku: '', category: '', description: '', unit: 'un',
    cost_price: 0, sell_price: 0, quantity: 0, min_quantity: 0, image: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku ?? '',
        category: product.category ?? '',
        description: product.description ?? '',
        unit: product.unit,
        cost_price: product.cost_price ?? 0,
        sell_price: product.sell_price ?? 0,
        quantity: product.quantity,
        min_quantity: product.min_quantity,
        image: product.image ?? '',
      });
    } else {
      setForm({ name: '', sku: '', category: '', description: '', unit: 'un', cost_price: 0, sell_price: 0, quantity: 0, min_quantity: 0, image: '' });
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.imageUrl) {
        update('image', data.imageUrl);
      }
    } catch (error) {
      // Upload failed silently
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => update('sku', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={e => update('category', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input value={form.unit} onChange={e => update('unit', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Qtd. Mínima</Label>
              <Input type="number" value={form.min_quantity} onChange={e => update('min_quantity', +e.target.value)} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Preço de Custo</Label>
              <Input type="number" step="0.01" value={form.cost_price} onChange={e => update('cost_price', +e.target.value)} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Preço de Venda</Label>
              <Input type="number" step="0.01" value={form.sell_price} onChange={e => update('sell_price', +e.target.value)} min={0} />
            </div>
            {!product && (
              <div className="space-y-2">
                <Label>Quantidade Inicial</Label>
                <Input type="number" value={form.quantity} onChange={e => update('quantity', +e.target.value)} min={0} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Imagem</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            {uploading && <p className="text-sm text-gray-500">Fazendo upload...</p>}
            {form.image && <img src={`http://localhost:3000${form.image}`} alt="Preview" className="w-20 h-20 object-cover mt-2" />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="active:scale-[0.97] transition-transform">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : product ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
