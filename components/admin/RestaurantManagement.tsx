'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, ChefHat, Users, UtensilsCrossed } from 'lucide-react';

export default function RestaurantManagement() {
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    category: 'main',
    price: '',
    vegetarian: false,
    spiceLevel: 0,
  });
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    capacity: '',
    location: 'indoor',
  });

  useEffect(() => {
    fetchMenuItems();
    fetchTables();
    fetchReservations();
    fetchOrders();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/restaurant/menu');
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/restaurant/tables');
      const data = await response.json();
      if (data.success) {
        setTables(data.data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/restaurant/reservations');
      const data = await response.json();
      if (data.success) {
        setReservations(data.data);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/restaurant/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const addMenuItem = async () => {
    if (!menuForm.name || !menuForm.price) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/restaurant/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...menuForm,
          price: parseFloat(menuForm.price),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMenuItems([...menuItems, data.data]);
        setMenuForm({
          name: '',
          description: '',
          category: 'main',
          price: '',
          vegetarian: false,
          spiceLevel: 0,
        });
        setShowMenuForm(false);
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const addTable = async () => {
    if (!tableForm.tableNumber || !tableForm.capacity) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/restaurant/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tableForm,
          capacity: parseInt(tableForm.capacity),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTables([...tables, data.data]);
        setTableForm({
          tableNumber: '',
          capacity: '',
          location: 'indoor',
        });
        setShowTableForm(false);
      }
    } catch (error) {
      console.error('Error adding table:', error);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const response = await fetch(`/api/restaurant/menu?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setMenuItems(menuItems.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const updateReservationStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/restaurant/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchReservations();
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/restaurant/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Tables</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            <span className="hidden sm:inline">Reservations</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Menu Management</h3>
            <Button onClick={() => setShowMenuForm(!showMenuForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {showMenuForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Input
                  placeholder="Item Name"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                />
                <Select value={menuForm.category} onValueChange={(value) => setMenuForm({ ...menuForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appetizer">Appetizer</SelectItem>
                    <SelectItem value="main">Main Course</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Price"
                  type="number"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                />
                <div className="flex gap-4">
                  <Button onClick={addMenuItem}>Save Item</Button>
                  <Button variant="outline" onClick={() => setShowMenuForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {menuItems.map((item) => (
              <Card key={item._id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-sm mt-2">
                        <span className="font-semibold">₹{item.price}</span>
                        {item.vegetarian && <span className="ml-2 text-green-600">Vegetarian</span>}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMenuItem(item._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Table Management</h3>
            <Button onClick={() => setShowTableForm(!showTableForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </div>

          {showTableForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Input
                  placeholder="Table Number"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                />
                <Input
                  placeholder="Capacity"
                  type="number"
                  value={tableForm.capacity}
                  onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                />
                <Select value={tableForm.location} onValueChange={(value) => setTableForm({ ...tableForm, location: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-4">
                  <Button onClick={addTable}>Save Table</Button>
                  <Button variant="outline" onClick={() => setShowTableForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <Card key={table._id}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-lg">{table.tableNumber}</h4>
                  <p className="text-sm text-muted-foreground">Capacity: {table.capacity} guests</p>
                  <p className="text-sm text-muted-foreground">Location: {table.location}</p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                        table.status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : table.status === 'reserved'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {table.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <h3 className="text-lg font-semibold">Table Reservations</h3>
          <div className="grid gap-4">
            {reservations.length === 0 ? (
              <p className="text-muted-foreground">No reservations yet</p>
            ) : (
              reservations.map((res) => (
                <Card key={res._id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{res.tableId?.tableNumber} - {res.guestCount} guests</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(res.reservationDate).toLocaleString()}
                        </p>
                        {res.specialRequests && (
                          <p className="text-sm mt-2">Note: {res.specialRequests}</p>
                        )}
                      </div>
                      <Select
                        value={res.status}
                        onValueChange={(value) => updateReservationStatus(res._id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <h3 className="text-lg font-semibold">Active Orders</h3>
          <div className="grid gap-4">
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No active orders</p>
            ) : (
              orders.map((order) => (
                <Card key={order._id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">Order #{order._id.slice(-8)}</h4>
                        <p className="text-sm text-muted-foreground">
                          Total: ₹{order.total}
                        </p>
                        <p className="text-sm mt-2">Items: {order.items.length}</p>
                      </div>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order._id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="served">Served</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
