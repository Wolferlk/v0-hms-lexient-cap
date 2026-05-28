'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface MenuItem {
  _id: string; name: string; category: string; price: number;
  available: boolean; preparationTime: number; vegetarian?: boolean; spiceLevel?: number;
}

interface BookingInfo {
  _id: string; bookingId: string; customerName: string;
  checkInDate: string; checkOutDate: string; status: string; roomIds: string[];
}

export default function RoomServicePage({ params }: { params: { bookingId: string } }) {
  const { bookingId } = params;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ menuItemId: string; quantity: number; name: string; price: number }[]>([]);
  const [mealType, setMealType] = useState('lunch');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [placing, setPlacing] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, mRes] = await Promise.all([
          fetch(`/api/bookings/${bookingId}`),
          fetch('/api/restaurant/menu'),
        ]);
        const [b, m] = await Promise.all([bRes.json(), mRes.json()]);

        if (!b.success || b.data.status !== 'checked-in') {
          setError('This room service link is not active. Please ask the front desk for assistance.');
          return;
        }
        setBooking(b.data);
        if (m.success) setMenuItems(m.data.filter((x: MenuItem) => x.available));
      } catch {
        setError('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookingId]);

  const getQty = (id: string) => cart.find(c => c.menuItemId === id)?.quantity || 0;

  const updateCart = (item: MenuItem, delta: number) => {
    const cur = getQty(item._id);
    const newQty = Math.max(0, cur + delta);
    if (newQty === 0) {
      setCart(cart.filter(c => c.menuItemId !== item._id));
    } else {
      const exists = cart.find(c => c.menuItemId === item._id);
      if (exists) setCart(cart.map(c => c.menuItemId === item._id ? { ...c, quantity: newQty } : c));
      else setCart([...cart, { menuItemId: item._id, quantity: newQty, name: item.name, price: item.price }]);
    }
  };

  const placeOrder = async () => {
    if (!cart.length) { toast.error('Add items to your order first'); return; }
    setPlacing(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/room-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
        }),
      });
      const d = await res.json();
      if (d.success) {
        setOrdered(true);
        setCart([]);
        toast.success('Order placed! We will bring it to your room.');
      } else {
        toast.error(d.error || 'Failed to place order');
      }
    } catch { toast.error('Failed to place order. Please try again.'); } finally { setPlacing(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🍽</div>
          <p className="text-muted-foreground">Loading menu…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold mb-2">Not Available</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (ordered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Order Received!</h2>
          <p className="text-muted-foreground mb-6">Your order has been sent to the kitchen. We'll deliver it to your room shortly.</p>
          <Button onClick={() => setOrdered(false)} variant="outline" className="w-full">Order More</Button>
        </div>
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(menuItems.map(m => m.category)))];
  const filteredMenu = menuItems.filter(m =>
    (activeCategory === 'all' || m.category === activeCategory) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  );
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'beverages'];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white px-4 pt-8 pb-16">
        <p className="text-amber-200 text-sm mb-1">🏨 Lexient Hotel</p>
        <h1 className="text-2xl font-bold">Room Service</h1>
        {booking && (
          <p className="text-amber-200 mt-1">Welcome, {booking.customerName}</p>
        )}
      </div>

      {/* Main card */}
      <div className="max-w-lg mx-auto -mt-8 px-4 space-y-4">
        {/* Meal type */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Meal Type</p>
          <div className="flex gap-1.5 flex-wrap">
            {mealTypes.map(t => (
              <button key={t}
                onClick={() => setMealType(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                  mealType === t ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Search + categories */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <Input
            className="rounded-xl border-gray-200"
            placeholder="🔍 Search menu items…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map(c => (
              <button key={c}
                onClick={() => setActiveCategory(c)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  activeCategory === c ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-2">
          {filteredMenu.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-muted-foreground">
              No items found
            </div>
          )}
          {filteredMenu.map(item => {
            const qty = getQty(item._id);
            return (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold">{item.name}</p>
                    {item.vegetarian && <span className="text-green-600 text-xs">🌿</span>}
                    {(item.spiceLevel ?? 0) > 0 && <span className="text-xs">{'🌶'.repeat(Math.min(item.spiceLevel!, 3))}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{item.category} · ~{item.preparationTime}min</p>
                  <p className="font-bold text-amber-800 mt-1">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {qty > 0 ? (
                    <>
                      <button onClick={() => updateCart(item, -1)}
                        className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 font-bold text-lg">−</button>
                      <span className="w-6 text-center font-bold text-base">{qty}</span>
                    </>
                  ) : null}
                  <button onClick={() => updateCart(item, 1)}
                    className="h-8 w-8 rounded-full bg-amber-700 flex items-center justify-center text-white hover:bg-amber-800 font-bold text-lg">+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky order button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-4 safe-bottom">
          <div className="max-w-lg mx-auto space-y-2">
            {/* Cart summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
              <span>{cartCount} item(s)</span>
              <span className="font-semibold text-foreground">Subtotal: ${cartTotal.toFixed(2)}</span>
            </div>
            {cart.map(c => (
              <div key={c.menuItemId} className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{c.name} × {c.quantity}</span>
                <span>${(c.price * c.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Button
              className="w-full bg-amber-700 hover:bg-amber-800 text-white rounded-xl h-12 text-base font-semibold"
              onClick={placeOrder}
              disabled={placing}>
              {placing ? 'Sending order…' : `Place Order — $${cartTotal.toFixed(2)}`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">Order will be charged to your room and delivered shortly.</p>
          </div>
        </div>
      )}
    </div>
  );
}
