'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit, AlertCircle } from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumLevel: number;
  unitCost: number;
  supplier: { _id: string; name: string };
  location: string;
  expiryDate?: string;
}

interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'food',
    quantity: 0,
    unit: 'kg',
    minimumLevel: 10,
    maximumLevel: 100,
    unitCost: 0,
    supplier: '',
    location: 'Storage',
    expiryDate: '',
  });

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const categoryFilter =
        filter !== 'all' ? `?category=${filter}` : '';
      const response = await fetch(`/api/inventory/items${categoryFilter}`);
      const data = await response.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('[v0] Fetch inventory error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/inventory/suppliers?activeOnly=true');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('[v0] Fetch suppliers error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.supplier ||
      formData.unitCost === 0
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/inventory/items/${editingId}`
        : '/api/inventory/items';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchInventory();
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({
          name: '',
          category: 'food',
          quantity: 0,
          unit: 'kg',
          minimumLevel: 10,
          maximumLevel: 100,
          unitCost: 0,
          supplier: '',
          location: 'Storage',
          expiryDate: '',
        });
      }
    } catch (error) {
      console.error('[v0] Submit form error:', error);
      alert('Error saving inventory item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/inventory/items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchInventory();
      }
    } catch (error) {
      console.error('[v0] Delete error:', error);
      alert('Error deleting item');
    }
  };

  const getLowStockItems = () => {
    return items.filter((item) => item.quantity < item.minimumLevel);
  };

  const lowStockCount = getLowStockItems().length;

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">
                {lowStockCount} items below minimum level
              </p>
              <p className="text-sm text-yellow-700">
                Consider restocking these items soon
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-sm text-muted-foreground">
            Total items: {items.length}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit' : 'Add'} Inventory Item
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Item Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Chicken Breast"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Unit *</label>
                  <Input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="kg, liters, pieces"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Unit Cost *</label>
                  <Input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitCost: parseFloat(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Minimum Level</label>
                  <Input
                    type="number"
                    value={formData.minimumLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumLevel: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Maximum Level</label>
                  <Input
                    type="number"
                    value={formData.maximumLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maximumLevel: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Supplier *</label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Storage location"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Expiry Date</label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update' : 'Add'} Item
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'food', 'beverage', 'supplies', 'equipment'].map(
          (cat) => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilter(cat);
                setFormData({ ...formData, category: cat });
              }}
              className="capitalize"
            >
              {cat}
            </Button>
          )
        )}
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground">No items found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-left py-3 px-2">Category</th>
                    <th className="text-right py-3 px-2">Qty</th>
                    <th className="text-right py-3 px-2">Min/Max</th>
                    <th className="text-right py-3 px-2">Unit Cost</th>
                    <th className="text-left py-3 px-2">Supplier</th>
                    <th className="text-right py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isLowStock = item.quantity < item.minimumLevel;
                    return (
                      <tr
                        key={item._id}
                        className={`border-b ${
                          isLowStock ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="py-3 px-2 font-medium">{item.name}</td>
                        <td className="py-3 px-2 capitalize">{item.category}</td>
                        <td
                          className={`py-3 px-2 text-right ${
                            isLowStock ? 'text-yellow-600 font-semibold' : ''
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-2 text-right text-xs text-muted-foreground">
                          {item.minimumLevel}/{item.maximumLevel}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {item.unitCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {item.supplier.name}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(item._id);
                                setFormData({
                                  ...item,
                                  supplier: item.supplier._id,
                                  expiryDate: item.expiryDate || '',
                                });
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item._id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
