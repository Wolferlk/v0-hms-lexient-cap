'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, isPast, differenceInDays, addMonths } from 'date-fns';
import {
  Heart, Plus, Trash2, Printer, QrCode, CheckCircle,
  XCircle, Search, Edit, RefreshCw, Calendar, Users,
  Music, Flower2, Users2, Star, Home, Zap, PlusCircle,
  AlertCircle, Clock, TrendingUp, Wifi, Wind, Utensils,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface WeddingHall {
  _id: string;
  name: string;
  hallType: 'premium' | 'standard' | 'basic' | 'indoor' | 'outdoor';
  capacity: number;
  basePrice: number;
  area: number;
  availability: string;
  features: {
    airConditioned: boolean;
    parking: boolean;
    kitchenAccess: boolean;
    danceFloor: boolean;
    stage: boolean;
    soundSystem: boolean;
  };
}

interface MenuPackage {
  _id: string;
  packageNumber: number;
  name: string;
  pricePerHead: number;
  items: string[];
  description: string;
}

interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  paymentTerms: string;
  taxId?: string;
  rating: number;
  isActive: boolean;
}

interface SupplierPackage {
  _id: string;
  supplierId: string;
  packageType: 'dj' | 'decoration' | 'traditional_dancing' | 'photography' | 'videography' | 'other' | 'wedding_car';
  packageName: string;
  description: string;
  price: number;
  isActive: boolean;
}

interface AddOn {
  type: string;
  description: string;
  price: number;
}

interface AdditionalItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quotation {
  _id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventType: string;
  pax: number;
  status: string;
  totalAmount: number;
  advancePaid: number;
  validUntil: string;
  activatedDate?: string;
  expiryDate?: string;
  qrCode?: string;
  addOns: AddOn[];
  additionalItems: AdditionalItem[];
  baseAmount: number;
  menuAmount: number;
  addOnsAmount: number;
  additionalAmount: number;
  notes: string;
  payments: { amount: number; method: string; date: string; notes?: string }[];
  hallId?: { _id: string; name: string; capacity: number; basePrice: number; hallType: string };
  menuPackageId?: { _id: string; name: string; pricePerHead: number; items: string[] };
  supplierId?: { _id: string; name: string; contactPerson: string; email: string; phone: string };
  supplierPackageId?: { _id: string; packageType: string; packageName: string; price: number; description: string; supplierId: string };
  supplierPackageAmount?: number;
}

// ── Hall Types ───────────────────────────────────────────────────────────────

const HALL_TYPES = [
  { value: 'premium', label: 'Premium', icon: Star, color: 'text-yellow-600' },
  { value: 'standard', label: 'Standard', icon: Home, color: 'text-blue-600' },
  { value: 'basic', label: 'Basic', icon: Home, color: 'text-gray-600' },
  { value: 'indoor', label: 'Indoor', icon: Wifi, color: 'text-green-600' },
  { value: 'outdoor', label: 'Outdoor', icon: Wind, color: 'text-emerald-600' },
];

// ── Add-on Types ────────────────────────────────────────────────────────────

const ADD_ON_TYPES = [
  { value: 'dj', label: 'DJ Services', icon: Music, defaultPrice: 500 },
  { value: 'decoration', label: 'Decoration', icon: Flower2, defaultPrice: 1000 },
  { value: 'traditional_dancing', label: 'Traditional Dancing Team', icon: Users2, defaultPrice: 800 },
  { value: 'photography', label: 'Photography', icon: Star, defaultPrice: 600 },
  { value: 'videography', label: 'Videography', icon: Star, defaultPrice: 800 },
  { value: 'other', label: 'Other', icon: Plus, defaultPrice: 0 },
];

// ── Menu Packages (5 types) ──────────────────────────────────────────────────

const MENU_PACKAGE_DEFAULTS = [
  {
    packageNumber: 1,
    name: 'Classic Package',
    pricePerHead: 2500,
    items: ['Rice & Curry', 'Vegetable Curry', 'Chicken Korma', 'Bread', 'Dessert'],
  },
  {
    packageNumber: 2,
    name: 'Deluxe Package',
    pricePerHead: 4500,
    items: ['Biryani', 'Fish Curry', 'Chicken Tikka', 'Paneer Dish', 'Bread', 'Dessert', 'Beverages'],
  },
  {
    packageNumber: 3,
    name: 'Premium Package',
    pricePerHead: 6500,
    items: ['Seafood Biryani', 'Tandoori Chicken', 'Fish Fry', 'Mutton Curry', 'Paneer Tikka Masala', 'Bread Basket', 'Dessert', 'Beverages', 'Coffee/Tea'],
  },
  {
    packageNumber: 4,
    name: 'Royal Package',
    pricePerHead: 8500,
    items: ['King Prawns Biryani', 'Tandoori Fish', 'Mutton Roast', 'Butter Chicken', 'Paneer Do Pyaza', 'Multiple Breads', 'Dessert Bar', 'Premium Beverages', 'Appetizers'],
  },
  {
    packageNumber: 5,
    name: 'Elite Package',
    pricePerHead: 12000,
    items: ['Luxury Biryani Selection', 'Lobster Preparation', 'Prime Cuts', 'Chef Special Curry', 'Paneer Extravaganza', 'Artisan Breads', 'Gourmet Desserts', 'Wine & Beverages', 'Live Appetizer Station'],
  },
];

const formatLKR = (amount?: number | null) =>
  `LKR ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Print Helpers ────────────────────────────────────────────────────────────

function printBillWithQR(q: Quotation, hotel = 'Lexient Hotel') {
  const qrUrl = q.qrCode || `${window.location.origin}/wedding-bill/${q._id}`;
  const remainingAmount = q.totalAmount - q.advancePaid;
  
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>Wedding Bill - ${q.quoteNumber}</title>
    <style>
      * { margin: 0; padding: 0; }
      body { font-family: 'Courier New', monospace; font-size: 12px; width: 320px; margin: 0 auto; padding: 12px; }
      .header { text-align: center; margin-bottom: 12px; }
      .header h1 { font-size: 16px; margin: 4px 0; }
      .header p { font-size: 10px; color: #666; margin: 2px 0; }
      hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
      .section { margin-bottom: 10px; }
      .section-title { font-weight: bold; font-size: 11px; margin: 6px 0 4px; }
      .row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
      .row.header { font-weight: bold; border-bottom: 1px solid #000; }
      .row.total { font-weight: bold; font-size: 12px; border-top: 1px solid #000; margin-top: 4px; }
      .amount { text-align: right; min-width: 60px; }
      .qr-section { text-align: center; margin: 12px 0; }
      .qr-section img { max-width: 140px; height: auto; }
      .qr-section p { font-size: 9px; color: #666; margin-top: 4px; }
      .footer { text-align: center; font-size: 9px; color: #666; margin-top: 8px; border-top: 1px dashed #000; padding-top: 6px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 3px 0; font-size: 10px; }
      td.label { text-align: left; }
      td.value { text-align: right; }
      .highlight { background-color: #f0f0f0; padding: 2px; }
      @media print { body { margin: 0; padding: 8px; } }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${hotel}</h1>
      <p>Wedding Event Bill</p>
    </div>
    <hr/>
    
    <div class="section">
      <div class="section-title">BILL DETAILS</div>
      <div class="row">
        <span>Bill #: ${q.quoteNumber}</span>
        <span>${format(new Date(), 'dd MMM yyyy')}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">CLIENT INFORMATION</div>
      <div class="row"><span class="label">${q.clientName}</span></div>
      <div class="row"><span class="label">Phone: ${q.clientPhone}</span></div>
      <div class="row"><span class="label">Email: ${q.clientEmail}</span></div>
    </div>
    
    <div class="section">
      <div class="section-title">EVENT DETAILS</div>
      <div class="row"><span class="label">Date:</span><span>${format(new Date(q.eventDate), 'dd MMM yyyy')}</span></div>
      <div class="row"><span class="label">Time:</span><span>${q.eventStartTime} - ${q.eventEndTime}</span></div>
      <div class="row"><span class="label">Pax:</span><span>${q.pax} guests</span></div>
      <div class="row"><span class="label">Hall:</span><span>${q.hallId?.name || 'N/A'}</span></div>
    </div>
    
    <hr/>
    
    <div class="section">
      <div class="section-title">BILLING BREAKDOWN</div>
      <table>
        <tr class="row">
          <td class="label">Item</td>
          <td class="amount">Amount</td>
        </tr>
        <tr class="row">
          <td class="label">Hall Base Charge</td>
          <td class="amount">${formatLKR(q.baseAmount)}</td>
        </tr>
        ${q.menuPackageId ? `<tr class="row">
          <td class="label">Menu (${q.menuPackageId.name})</td>
          <td class="amount">${formatLKR(q.menuAmount)}</td>
        </tr>` : ''}
        ${q.addOns.map(a => `<tr class="row">
          <td class="label">${a.description || a.type}</td>
          <td class="amount">${formatLKR(a.price)}</td>
        </tr>`).join('')}
        ${q.additionalItems.map(i => `<tr class="row">
          <td class="label">${i.name} (×${i.quantity})</td>
          <td class="amount">${formatLKR(i.total)}</td>
        </tr>`).join('')}
      </table>
    </div>
    
    <hr/>
    
    <div class="section">
      <table>
        <tr class="row total">
          <td class="label">TOTAL AMOUNT</td>
          <td class="amount highlight">${formatLKR(q.totalAmount)}</td>
        </tr>
        <tr class="row">
          <td class="label">Amount Paid</td>
          <td class="amount">${formatLKR(q.advancePaid)}</td>
        </tr>
        <tr class="row total">
          <td class="label">BALANCE DUE</td>
          <td class="amount highlight">${formatLKR(remainingAmount)}</td>
        </tr>
      </table>
    </div>
    
    <div class="qr-section">
      <p><strong>Scan QR Code for Digital Bill</strong></p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrUrl)}" alt="QR Code" />
      <p>Use this QR for scanning and bill verification</p>
    </div>
    
    <div class="footer">
      <p>Thank you for choosing ${hotel}!</p>
      <p>For inquiries, contact: events@${hotel.toLowerCase().replace(/\\s+/g, '')}.com</p>
      <p style="margin-top: 6px; font-size: 8px;">Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
    </div>
  </body>
  </html>`;

  const w = window.open('', '_blank', 'width=420,height=640');
  if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function WeddingHallManagementAdvanced() {
  const [activeTab, setActiveTab] = useState('quotations');
  const [halls, setHalls] = useState<WeddingHall[]>([]);
  const [menuPackages, setMenuPackages] = useState<MenuPackage[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierPackages, setSupplierPackages] = useState<SupplierPackage[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Detail panel
  const [selectedQ, setSelectedQ] = useState<Quotation | null>(null);
  const [detailPanel, setDetailPanel] = useState(false);

  // Create quotation wizard
  const [createDialog, setCreateDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    hallId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventDate: '',
    eventStartTime: '18:00',
    eventEndTime: '23:00',
    eventType: 'wedding',
    pax: 100,
    menuPackageId: '',
    supplierId: '',
    supplierPackageId: '',
    customMenuItems: [] as string[],
    addOns: [] as AddOn[],
    additionalItems: [] as AdditionalItem[],
    notes: '',
  });

  // Add items to active quotation
  const [addItemsDialog, setAddItemsDialog] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unitPrice: 0 });

  // Edit items
  const [editItemsMode, setEditItemsMode] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemDraft, setEditItemDraft] = useState({ name: '', quantity: 1, unitPrice: 0 });

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [payAction, setPayAction] = useState<'activate' | 'add_payment' | 'close' | 'reactivate'>('add_payment');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');

  // Menu package edit
  const [editPkgDialog, setEditPkgDialog] = useState(false);
  const [editingPkg, setEditingPkg] = useState<MenuPackage | null>(null);
  const [pkgForm, setPkgForm] = useState({ packageNumber: 1, name: '', description: '', pricePerHead: 0, items: [''] });
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', paymentTerms: 'COD', taxId: '', rating: 5,
  });
  const [supplierPackageDialog, setSupplierPackageDialog] = useState(false);
  const [editingSupplierPackage, setEditingSupplierPackage] = useState<SupplierPackage | null>(null);
  const [supplierPackageForm, setSupplierPackageForm] = useState({
    supplierId: '', packageType: 'dj', packageName: '', description: '', price: 0,
  });

  // Hall management
  const [hallDialog, setHallDialog] = useState(false);
  const [editingHall, setEditingHall] = useState<WeddingHall | null>(null);
  const [hallForm, setHallForm] = useState<{
    name: string;
    hallType: 'premium' | 'standard' | 'basic' | 'indoor' | 'outdoor';
    capacity: number;
    area: number;
    basePrice: number;
    description: string;
    availability: string;
    features: {
      airConditioned: boolean;
      parking: boolean;
      kitchenAccess: boolean;
      danceFloor: boolean;
      stage: boolean;
      soundSystem: boolean;
    };
  }>({
    name: '',
    hallType: 'standard',
    capacity: 100,
    area: 1000,
    basePrice: 500,
    description: '',
    availability: 'available',
    features: {
      airConditioned: false,
      parking: false,
      kitchenAccess: false,
      danceFloor: false,
      stage: false,
      soundSystem: false,
    },
  });

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hallsRes, pkgsRes, suppliersRes, supplierPkgsRes, quotesRes] = await Promise.all([
        fetch('/api/wedding-hall/halls'),
        fetch('/api/wedding-hall/menu-packages'),
        fetch('/api/inventory/suppliers?activeOnly=true&limit=100'),
        fetch('/api/wedding-hall/supplier-packages?activeOnly=true'),
        fetch('/api/wedding-hall/quotations'),
      ]);
      const [h, p, s, sp, q] = await Promise.all([
        hallsRes.json(),
        pkgsRes.json(),
        suppliersRes.json(),
        supplierPkgsRes.json(),
        quotesRes.json(),
      ]);
      if (h.success) setHalls(h.data?.data || h.data || []);
      if (p.success) setMenuPackages(p.data || []);
      if (s.success) setSuppliers(s.data || []);
      if (sp.success) setSupplierPackages(sp.data || []);
      if (q.success) setQuotations(q.data || []);
    } catch { toast.error('Failed to load data'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Create Quotation ────────────────────────────────────────────────────

  const calcTotal = useCallback(() => {
    const hall = halls.find(h => h._id === form.hallId);
    const base = hall?.basePrice || 0;
    const pkg = menuPackages.find(p => p._id === form.menuPackageId);
    const supplierPkg = supplierPackages.find(p => p._id === form.supplierPackageId);
    const menu = pkg ? pkg.pricePerHead * form.pax : 0;
    const supplierPackageAmount = supplierPkg ? supplierPkg.price : 0;
    const addOnsTotal = form.addOns.reduce((s, a) => s + a.price, 0);
    const additionalTotal = form.additionalItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return { base, menu, supplierPackageAmount, addOnsTotal, additionalTotal, grand: base + menu + supplierPackageAmount + addOnsTotal + additionalTotal };
  }, [form, halls, menuPackages, supplierPackages]);

  const createQuotation = async () => {
    try {
      const res = await fetch('/api/wedding-hall/quotations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Quotation created successfully! Quotation is valid for 3 months.');
        setCreateDialog(false); setStep(1);
        setForm({
          hallId: '', clientName: '', clientEmail: '', clientPhone: '', eventDate: '', eventStartTime: '18:00',
          eventEndTime: '23:00', eventType: 'wedding', pax: 100, menuPackageId: '', supplierId: '', supplierPackageId: '', customMenuItems: [], addOns: [],
          additionalItems: [], notes: ''
        });
        fetchAll();
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to create quotation'); }
  };

  // ── Payment / Status actions ─────────────────────────────────────────────

  const openPaymentDialog = (q: Quotation, action: typeof payAction) => {
    setSelectedQ(q); setPayAction(action);
    if (action === 'close') {
      setPayAmount(String(Math.max(0, q.totalAmount - q.advancePaid)));
    } else {
      setPayAmount('');
    }
    setPayMethod('cash'); setPayNotes('');
    setPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedQ) return;
    const amount = parseFloat(payAmount);
    try {
      const res = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: payAction, amount, method: payMethod, notes: payNotes }),
      });
      const data = await res.json();
      if (data.success) {
        const msgs = {
          activate: 'Quotation activated! Valid for 3 months with QR code generated.',
          add_payment: 'Payment recorded successfully',
          close: 'Event closed and bill finalized!',
          reactivate: 'Quotation reactivated with new 3-month expiry!',
        };
        toast.success(msgs[payAction]);
        setPaymentDialog(false); fetchAll();
        const r = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`);
        const d = await r.json();
        if (d.success) setSelectedQ(d.data);
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to process payment'); }
  };

  const cancelQuotation = async (id: string) => {
    const res = await fetch(`/api/wedding-hall/quotations/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Quotation cancelled'); fetchAll(); }
  };

  // ── Add/Edit items to active quotation ───────────────────────────────────

  const handleAddItem = async () => {
    if (!selectedQ) return;
    const res = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_items', additionalItems: [newItem] }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Item added'); setNewItem({ name: '', quantity: 1, unitPrice: 0 }); setAddItemsDialog(false);
      const r = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`);
      const d = await r.json();
      if (d.success) setSelectedQ(d.data);
    } else { toast.error(data.error); }
  };

  const handleEditItem = async (itemIndex: number, name: string, quantity: number, unitPrice: number) => {
    if (!selectedQ) return;
    const res = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit_items', itemIndex, name, quantity, unitPrice }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Item updated'); setEditingItemIndex(null);
      const r = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`);
      const d = await r.json();
      if (d.success) setSelectedQ(d.data);
    } else { toast.error(data.error); }
  };

  const startEditItem = (item: AdditionalItem, itemIndex: number) => {
    setEditingItemIndex(itemIndex);
    setEditItemDraft({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice });
  };

  const handleDeleteItem = async (itemIndex: number) => {
    if (!selectedQ) return;
    const res = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_item', itemIndex }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Item removed');
      const r = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`);
      const d = await r.json();
      if (d.success) setSelectedQ(d.data);
    } else { toast.error(data.error); }
  };

  // ── Menu package edit ────────────────────────────────────────────────────

  const savePkg = async () => {
    const method = editingPkg ? 'PUT' : 'POST';
    const body = editingPkg ? { id: editingPkg._id, ...pkgForm } : pkgForm;
    const res = await fetch('/api/wedding-hall/menu-packages', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, items: pkgForm.items.filter(i => i.trim()) }),
    });
    const data = await res.json();
    if (data.success) { toast.success(editingPkg ? 'Menu package updated' : 'Menu package created'); setEditPkgDialog(false); setEditingPkg(null); fetchAll(); }
    else { toast.error(data.error); }
  };

  const deletePkg = async (id: string) => {
    const res = await fetch(`/api/wedding-hall/menu-packages?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Menu package deleted'); fetchAll(); }
    else { toast.error(data.error); }
  };

  const saveSupplier = async () => {
    const method = editingSupplier ? 'PUT' : 'POST';
    const body = editingSupplier ? { id: editingSupplier._id, ...supplierForm } : supplierForm;
    const res = await fetch('/api/inventory/suppliers', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(editingSupplier ? 'Supplier updated' : 'Supplier added');
      setSupplierDialog(false);
      setEditingSupplier(null);
      setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', paymentTerms: 'COD', taxId: '', rating: 5 });
      fetchAll();
    } else {
      toast.error(data.error);
    }
  };

  const deleteSupplier = async (id: string) => {
    const res = await fetch(`/api/inventory/suppliers?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Supplier deleted'); fetchAll(); }
    else { toast.error(data.error); }
  };

  const saveSupplierPackage = async () => {
    const method = editingSupplierPackage ? 'PUT' : 'POST';
    const body = editingSupplierPackage ? { id: editingSupplierPackage._id, ...supplierPackageForm } : supplierPackageForm;
    const res = await fetch('/api/wedding-hall/supplier-packages', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(editingSupplierPackage ? 'Supplier package updated' : 'Supplier package added');
      setSupplierPackageDialog(false);
      setEditingSupplierPackage(null);
      setSupplierPackageForm({ supplierId: '', packageType: 'dj', packageName: '', description: '', price: 0 });
      fetchAll();
    } else {
      toast.error(data.error);
    }
  };

  const deleteSupplierPackage = async (id: string) => {
    const res = await fetch(`/api/wedding-hall/supplier-packages?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Supplier package deleted'); fetchAll(); }
    else { toast.error(data.error); }
  };

  // ── Hall management ──────────────────────────────────────────────────────

  const saveHall = async () => {
    try {
      const method = editingHall ? 'PUT' : 'POST';
      const body = editingHall ? { id: editingHall._id, ...hallForm } : hallForm;
      const res = await fetch('/api/wedding-hall/halls', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { 
        toast.success(editingHall ? 'Hall updated' : 'Hall added'); 
        setHallDialog(false); 
        fetchAll(); 
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to save hall'); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const filteredQuotations = quotations.filter(q => {
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchSearch = q.clientName.toLowerCase().includes(search.toLowerCase()) || q.quoteNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const qStatusColor = (s: string) => ({
    draft: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-orange-100 text-orange-700',
    closed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-500',
  }[s] ?? 'bg-gray-100 text-gray-600');

  const totals = calcTotal();

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="quotations"><Heart className="mr-1.5 h-3.5 w-3.5" />Quotations</TabsTrigger>
          <TabsTrigger value="halls">Wedding Halls</TabsTrigger>
          <TabsTrigger value="menus">Menu Packages (5)</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        {/* ══ QUOTATIONS ═══════════════════════════════════════════════════ */}
        <TabsContent value="quotations" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 w-48 h-8 text-sm" placeholder="Search client / #..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft (Pending)</SelectItem>
                  <SelectItem value="active">Active (Within 3mo)</SelectItem>
                  <SelectItem value="expired">Expired (After 3mo)</SelectItem>
                  <SelectItem value="closed">Closed (Completed)</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
              <Button size="sm" onClick={() => { setStep(1); setCreateDialog(true); }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />New Quotation
              </Button>
            </div>
          </div>

          {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
            <div className="space-y-3">
              {filteredQuotations.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No quotations found</p>
              )}
              {filteredQuotations.map(q => {
                const daysLeft = differenceInDays(new Date(q.validUntil), new Date());
                const balance = q.totalAmount - q.advancePaid;
                const isExpired = q.status === 'expired' || q.status === 'expired';
                
                return (
                  <div key={q._id} className={`rounded-lg border p-4 space-y-2 ${q.status === 'closed' ? 'bg-blue-50' : q.status === 'active' ? 'bg-green-50' : ''}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{q.clientName}</span>
                          <span className="text-xs text-muted-foreground">{q.quoteNumber}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${qStatusColor(q.status)}`}>{q.status.toUpperCase()}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(q.eventDate), 'MMM dd, yyyy')}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{q.pax} pax</span>
                          {q.hallId && <span className="flex items-center gap-1"><Home className="h-3 w-3" />{q.hallId.name}</span>}
                          <span className="capitalize">{q.eventType.replace('_', ' ')}</span>
                        </div>
                        {q.status === 'draft' && (
                          <p className={`text-xs mt-1 flex items-center gap-1 ${daysLeft < 7 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                            <Clock className="h-3 w-3" />Valid for {Math.max(0, daysLeft)} day(s) • Expires {format(new Date(q.validUntil), 'MMM dd')}
                          </p>
                        )}
                        {q.status === 'active' && q.expiryDate && (
                          <p className="text-xs mt-1 flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />Active until {format(new Date(q.expiryDate), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-bold">{formatLKR(q.totalAmount)}</p>
                        <p className="text-xs text-green-600">Paid: {formatLKR(q.advancePaid)}</p>
                        {balance > 0 && <p className="text-xs text-red-500">Due: {formatLKR(balance)}</p>}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectedQ(q); setDetailPanel(true); }}>
                        <Edit className="h-3 w-3 mr-1" />View Details
                      </Button>
                      
                      {q.status === 'draft' && !isPast(new Date(q.validUntil)) && (
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => openPaymentDialog(q, 'activate')}>
                          <CheckCircle className="h-3 w-3 mr-1" />Activate
                        </Button>
                      )}

                      {q.status === 'expired' && (
                        <Button size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700" onClick={() => openPaymentDialog(q, 'reactivate')}>
                          <RefreshCw className="h-3 w-3 mr-1" />Reactivate
                        </Button>
                      )}
                      
                      {q.status === 'active' && (
                        <>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSelectedQ(q); setAddItemsDialog(true); }}>
                            <Plus className="h-3 w-3 mr-1" />Add Items
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openPaymentDialog(q, 'add_payment')}>
                            <Zap className="h-3 w-3 mr-1" />Payment
                          </Button>
                          <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => openPaymentDialog(q, 'close')}>
                            <CheckCircle className="h-3 w-3 mr-1" />Close Event
                          </Button>
                        </>
                      )}
                      
                      {q.status === 'closed' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => printBillWithQR(q)}>
                          <Printer className="h-3 w-3 mr-1" /><QrCode className="h-3 w-3" />Print Bill
                        </Button>
                      )}
                      
                      {['draft', 'expired'].includes(q.status) && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => cancelQuotation(q._id)}>
                          <XCircle className="h-3 w-3 mr-1" />Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ══ HALLS ════════════════════════════════════════════════════════ */}
        <TabsContent value="halls" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditingHall(null); setHallForm({
              name: '', hallType: 'standard', capacity: 100, area: 1000, basePrice: 500, description: '',
              availability: 'available', features: { airConditioned: false, parking: false, kitchenAccess: false,
              danceFloor: false, stage: false, soundSystem: false }
            }); setHallDialog(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Wedding Hall
            </Button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {halls.map(hall => {
              const typeIcon = HALL_TYPES.find(t => t.value === hall.hallType)?.icon || Home;
              const TypeIcon = typeIcon;
              return (
                <div key={hall._id} className="rounded-lg border p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{hall.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <TypeIcon className="h-3 w-3" />{HALL_TYPES.find(t => t.value === hall.hallType)?.label}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      hall.availability === 'available' ? 'bg-green-100 text-green-700' :
                      hall.availability === 'booked' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>{hall.availability}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-xs text-muted-foreground">Capacity</p><p className="font-medium">{hall.capacity} pax</p></div>
                    <div><p className="text-xs text-muted-foreground">Area</p><p className="font-medium">{hall.area} sq.ft</p></div>
                    <div className="col-span-2"><p className="text-xs text-muted-foreground">Base Price</p><p className="font-bold text-lg">{formatLKR(hall.basePrice)}</p></div>
                  </div>

                  {hall.features && (
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {[
                        { key: 'airConditioned', label: 'AC', icon: Wind },
                        { key: 'parking', label: 'Parking', icon: Home },
                        { key: 'kitchenAccess', label: 'Kitchen', icon: Utensils },
                        { key: 'danceFloor', label: 'Dance', icon: Music },
                        { key: 'stage', label: 'Stage', icon: Star },
                        { key: 'soundSystem', label: 'Sound', icon: Zap },
                      ].map(f => (
                        <div key={f.key} className={`rounded p-1 text-center ${(hall.features as any)[f.key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {f.label}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button variant="outline" size="sm" className="w-full h-7 text-xs"
                    onClick={() => { setEditingHall(hall); setHallForm({
                      name: hall.name, hallType: hall.hallType, capacity: hall.capacity, area: hall.area,
                      basePrice: hall.basePrice, description: '', availability: hall.availability,
                      features: hall.features
                    }); setHallDialog(true); }}>
                    <Edit className="h-3 w-3 mr-1" />Edit Hall
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ══ MENU PACKAGES (5 TYPES) ══════════════════════════════════════ */}
        <TabsContent value="menus" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded p-3">
              📋 <strong>Menu Packages</strong> — Customize presets or add new package options for quotations.
            </p>
            <Button size="sm" onClick={() => {
              const nextNumber = Math.max(0, ...menuPackages.map(pkg => pkg.packageNumber)) + 1;
              setEditingPkg(null);
              setPkgForm({ packageNumber: nextNumber, name: '', description: '', pricePerHead: 0, items: [''] });
              setEditPkgDialog(true);
            }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Menu Package
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menuPackages.map(pkg => (
              <div key={pkg._id} className="rounded-lg border p-4 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-sm font-bold mr-2">{pkg.packageNumber}</span>
                    <span className="font-semibold">{pkg.name}</span>
                  </div>
                  <span className="text-lg font-bold text-rose-600">{formatLKR(pkg.pricePerHead)}<span className="text-xs font-normal text-muted-foreground">/head</span></span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>
                <div className="space-y-0.5 text-xs">
                  {pkg.items.slice(0, 6).map((item, i) => <div key={i} className="text-muted-foreground">• {item}</div>)}
                  {pkg.items.length > 6 && <div className="text-muted-foreground font-medium">+{pkg.items.length - 6} more items</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1"
                    onClick={() => { setEditingPkg(pkg); setPkgForm({ packageNumber: pkg.packageNumber, name: pkg.name, description: pkg.description, pricePerHead: pkg.pricePerHead, items: [...pkg.items, ''] }); setEditPkgDialog(true); }}>
                    <Edit className="h-3 w-3 mr-1" />Customize
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => deletePkg(pkg._id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        {/* ══ SUPPLIERS ═══════════════════════════════════════════════════ */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded p-3">
              🧾 Manage wedding suppliers and supplier packages available for quotations.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => {
                setEditingSupplier(null);
                setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', paymentTerms: 'COD', taxId: '', rating: 5 });
                setSupplierDialog(true);
              }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add Supplier
              </Button>
              <Button size="sm" onClick={() => {
                setEditingSupplierPackage(null);
                setSupplierPackageForm({ supplierId: '', packageType: 'dj', packageName: '', description: '', price: 0 });
                setSupplierPackageDialog(true);
              }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add Package
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Suppliers</h3>
                  <p className="text-xs text-muted-foreground">Add/edit wedding vendor details and contact information.</p>
                </div>
                <span className="text-xs text-muted-foreground">{suppliers.length} suppliers</span>
              </div>
              {suppliers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suppliers added yet.</p>
              ) : (
                <div className="space-y-3">
                  {suppliers.map(s => (
                    <div key={s._id} className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.contactPerson} · {s.phone} · {s.email}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
                          setEditingSupplier(s);
                          setSupplierForm({
                            name: s.name,
                            contactPerson: s.contactPerson,
                            email: s.email,
                            phone: s.phone,
                            address: s.address,
                            city: s.city,
                            state: s.state,
                            zipCode: s.zipCode,
                            paymentTerms: s.paymentTerms,
                            taxId: s.taxId || '',
                            rating: s.rating,
                          });
                          setSupplierDialog(true);
                        }}>
                          <Edit className="h-3 w-3 mr-1" />Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600" onClick={() => deleteSupplier(s._id)}>
                          <Trash2 className="h-3 w-3 mr-1" />Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Supplier Packages</h3>
                  <p className="text-xs text-muted-foreground">Create packages for DJ, decor, photography, car rental, and more.</p>
                </div>
                <span className="text-xs text-muted-foreground">{supplierPackages.length} packages</span>
              </div>
              {supplierPackages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No package definitions yet.</p>
              ) : (
                <div className="space-y-3">
                  {supplierPackages.map(pkg => {
                    const supplier = suppliers.find(s => s._id === pkg.supplierId);
                    return (
                      <div key={pkg._id} className="rounded-lg border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{pkg.packageName}</p>
                          <p className="text-xs text-muted-foreground">{pkg.packageType.replace('_', ' ')} · {supplier?.name || 'Unknown supplier'}</p>
                          <p className="text-xs text-muted-foreground">{formatLKR(pkg.price)} · {pkg.description}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
                            setEditingSupplierPackage(pkg);
                            setSupplierPackageForm({
                              supplierId: pkg.supplierId,
                              packageType: pkg.packageType,
                              packageName: pkg.packageName,
                              description: pkg.description,
                              price: pkg.price,
                            });
                            setSupplierPackageDialog(true);
                          }}>
                            <Edit className="h-3 w-3 mr-1" />Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600" onClick={() => deleteSupplierPackage(pkg._id)}>
                            <Trash2 className="h-3 w-3 mr-1" />Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ══ CREATE QUOTATION DIALOG ════════════════════════════════════════ */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Wedding Quotation — Step {step} of 4</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Progress bar */}
            <div className="flex gap-1">
              {[1,2,3,4].map(s => (
                <div key={s} className={`h-2 flex-1 rounded-full transition-colors ${step >= s ? 'bg-rose-500' : 'bg-muted'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-3">👤 Client Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-2"><Label>Full Name *</Label><Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="e.g. John Smith" /></div>
                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="john@example.com" /></div>
                    <div className="space-y-2"><Label>Phone *</Label><Input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="+1 (555) 000-0000" /></div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3">🏛️ Select Wedding Hall *</p>
                  <Select value={form.hallId} onValueChange={v => setForm(f => ({ ...f, hallId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choose a wedding hall..." /></SelectTrigger>
                    <SelectContent>
                      {halls.map(h => <SelectItem key={h._id} value={h._id}>
                        {h.name} — {h.hallType} · {h.capacity} pax · {formatLKR(h.basePrice)}
                      </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={() => setStep(2)} disabled={!form.clientName || !form.clientPhone || !form.hallId}>
                  Next: Event Details →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold">📅 Event Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2"><Label>Event Date *</Label><Input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.eventStartTime} onChange={e => setForm(f => ({ ...f, eventStartTime: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.eventEndTime} onChange={e => setForm(f => ({ ...f, eventEndTime: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Event Type</Label>
                    <Select value={form.eventType} onValueChange={v => setForm(f => ({ ...f, eventType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['wedding','reception','pre_wedding','birthday','corporate','other'].map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Number of Guests (Pax) *</Label><Input type="number" min={1} value={form.pax} onChange={e => setForm(f => ({ ...f, pax: parseInt(e.target.value) || 1 }))} /></div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setStep(3)} disabled={!form.eventDate}>Next: Menu & Services →</Button>
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-3">🍽️ Menu Selection</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {menuPackages.map(pkg => (
                      <button key={pkg._id} onClick={() => setForm(f => ({ ...f, menuPackageId: f.menuPackageId === pkg._id ? '' : pkg._id }))}
                        className={`rounded-lg border-2 p-3 text-left text-sm transition-all ${form.menuPackageId === pkg._id ? 'border-rose-500 bg-rose-50' : 'border-border hover:border-rose-300'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Package {pkg.packageNumber}: {pkg.name}</span>
                          <span className="font-bold text-rose-600">{formatLKR(pkg.pricePerHead)}/head</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{pkg.items.slice(0, 3).join(', ')}...</p>
                        <p className="text-xs mt-2 font-medium text-foreground">Total for {form.pax} pax: {formatLKR(pkg.pricePerHead * form.pax)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3">🎉 Additional Services & Add-ons</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ADD_ON_TYPES.map(a => {
                      const existing = form.addOns.find(x => x.type === a.value);
                      const Icon = a.icon;
                      return (
                        <button key={a.value}
                          onClick={() => {
                            if (existing) setForm(f => ({ ...f, addOns: f.addOns.filter(x => x.type !== a.value) }));
                            else setForm(f => ({ ...f, addOns: [...f.addOns, { type: a.value, description: a.label, price: a.defaultPrice }] }));
                          }}
                          className={`rounded-lg border p-2 text-xs text-center transition-all flex flex-col items-center gap-1 ${existing ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-border hover:border-rose-300'}`}>
                          <Icon className="h-4 w-4" />{a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.addOns.length > 0 && (
                  <div className="space-y-2 bg-gray-50 p-3 rounded">
                    <p className="text-xs font-semibold">Service Pricing</p>
                    {form.addOns.map((ao, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm flex-1 capitalize">{ao.type.replace('_', ' ')}</span>
                        <Input className="w-24 h-8 text-sm" type="number" placeholder="LKR" value={ao.price || ''} onChange={e => {
                          const updated = [...form.addOns]; updated[i].price = parseFloat(e.target.value) || 0; setForm(f => ({ ...f, addOns: updated }));
                        }} />
                        <Button variant="ghost" size="sm" className="h-8 text-red-500" onClick={() => setForm(f => ({ ...f, addOns: f.addOns.filter((_, j) => j !== i) }))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                  <div>
                    <p className="text-sm font-semibold mb-3">🤝 Supplier & Package Selection</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Select value={form.supplierId} onValueChange={v => {
                          setForm(f => ({
                            ...f,
                            supplierId: v,
                            supplierPackageId: supplierPackages.find(pkg => pkg._id === f.supplierPackageId && pkg.supplierId === v) ? f.supplierPackageId : '',
                          }));
                        }}>
                          <SelectTrigger><SelectValue placeholder="Choose supplier..." /></SelectTrigger>
                          <SelectContent>
                            {suppliers.map(s => (
                              <SelectItem key={s._id} value={s._id}>{s.name} · {s.contactPerson}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Supplier Package</Label>
                        <Select value={form.supplierPackageId} onValueChange={v => {
                          const pkg = supplierPackages.find(item => item._id === v);
                          setForm(f => ({
                            ...f,
                            supplierPackageId: v,
                            supplierId: pkg?.supplierId || f.supplierId,
                          }));
                        }}>
                          <SelectTrigger><SelectValue placeholder="Choose package..." /></SelectTrigger>
                          <SelectContent>
                            {supplierPackages
                              .filter(pkg => !form.supplierId || pkg.supplierId === form.supplierId)
                              .map(pkg => (
                                <SelectItem key={pkg._id} value={pkg._id}>{pkg.packageName} · {formatLKR(pkg.price)}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {form.supplierPackageId && (
                      <div className="rounded-lg bg-muted/40 p-3 mt-3 text-sm">
                        <p className="font-medium">{supplierPackages.find(pkg => pkg._id === form.supplierPackageId)?.packageName}</p>
                        <p className="text-xs text-muted-foreground">{supplierPackages.find(pkg => pkg._id === form.supplierPackageId)?.description}</p>
                      </div>
                    )}
                  </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setStep(4)}>Next: Review & Confirm →</Button>
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>← Back</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold">📊 Quotation Summary</p>
                <div className="rounded-lg bg-muted/40 p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Hall Base Charge</span><span>{formatLKR(totals.base)}</span></div>
                  {totals.menu > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Menu ({form.pax} pax)</span><span>{formatLKR(totals.menu)}</span></div>}
                    {totals.supplierPackageAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Supplier Package</span><span>{formatLKR(totals.supplierPackageAmount)}</span></div>}
                  {totals.addOnsTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Add-ons & Services</span><span>{formatLKR(totals.addOnsTotal)}</span></div>}
                  <div className="flex justify-between font-bold text-base border-t pt-2"><span>GRAND TOTAL</span><span>{formatLKR(totals.grand)}</span></div>
                  <p className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    ⏰ <strong>Valid for 3 months</strong> from today. After 3 months, quotation expires. Can be reactivated with advance payment.
                  </p>
                </div>
                <div className="space-y-2"><Label>Special Notes & Requests</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. dietary restrictions, special arrangements..." /></div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-rose-600 hover:bg-rose-700" onClick={createQuotation}>✅ Create Quotation</Button>
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(3)}>← Back</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ PAYMENT DIALOG ══════════════════════════════════════════════ */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {payAction === 'activate' && '✅ Activate Quotation'}
              {payAction === 'reactivate' && '🔄 Reactivate Expired Quotation'}
              {payAction === 'add_payment' && '💳 Record Payment'}
              {payAction === 'close' && '🏁 Close Wedding Event'}
            </DialogTitle>
          </DialogHeader>
          {selectedQ && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Total Amount</span><span className="font-bold">{formatLKR(selectedQ.totalAmount)}</span></div>
                <div className="flex justify-between text-green-600"><span>Already Paid</span><span>{formatLKR(selectedQ.advancePaid)}</span></div>
                <div className="flex justify-between text-red-500 font-medium"><span>Balance Due</span><span>{formatLKR(selectedQ.totalAmount - selectedQ.advancePaid)}</span></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Amount to Pay (LKR) *</Label><Input type="number" min={0} step={0.01} value={payAmount} onChange={e => setPayAmount(e.target.value)} /></div>
                <div className="space-y-2"><Label>Payment Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI / Digital</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2"><Label>Notes (Optional)</Label><Input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="e.g. advance for venue booking" /></div>
              
              {(payAction === 'activate' || payAction === 'reactivate') && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-700">
                  <strong>✅ After activation:</strong> Quotation will be valid for 3 months. A QR code will be generated for bill scanning.
                </div>
              )}
              
              <Button className="w-full" onClick={handlePayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>
                {payAction === 'activate' ? '✅ Activate & Record Payment' : 
                 payAction === 'reactivate' ? '🔄 Reactivate & Record Payment' : 
                 payAction === 'close' ? '🏁 Close Event & Finalize Bill' : 
                 '💳 Record Payment'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ ADD ITEMS DIALOG ═════════════════════════════════════════════ */}
      <Dialog open={addItemsDialog} onOpenChange={setAddItemsDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Items to Bill (Before Closing)</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">Add additional items to the bill before closing the event. You can edit or delete items later.</p>
            <div className="space-y-2"><Label>Item Name *</Label><Input value={newItem.name} onChange={e => setNewItem(i => ({ ...i, name: e.target.value }))} placeholder="e.g. Extra Floral Arrangement, Additional Bar Service" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={newItem.quantity} onChange={e => setNewItem(i => ({ ...i, quantity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Unit Price (LKR)</Label><Input type="number" min={0} step={0.01} value={newItem.unitPrice} onChange={e => setNewItem(i => ({ ...i, unitPrice: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            {newItem.name && newItem.unitPrice > 0 && (
              <p className="text-sm font-medium text-muted-foreground">Total: {formatLKR(newItem.quantity * newItem.unitPrice)}</p>
            )}
            <Button className="w-full" onClick={handleAddItem} disabled={!newItem.name.trim() || newItem.unitPrice <= 0}>➕ Add Item to Bill</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ EDIT MENU PACKAGE DIALOG ────────────────────────────────────── */}
      <Dialog open={editPkgDialog} onOpenChange={setEditPkgDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPkg ? `Customize Menu Package - ${editingPkg.name}` : 'Add Menu Package'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>No.</Label><Input type="number" min={1} value={pkgForm.packageNumber} onChange={e => setPkgForm(f => ({ ...f, packageNumber: parseInt(e.target.value) || 1 }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Package Name</Label><Input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of what's included" /></div>
            <div className="space-y-2"><Label>Price Per Head (LKR)</Label><Input type="number" min={0} step={0.01} value={pkgForm.pricePerHead} onChange={e => setPkgForm(f => ({ ...f, pricePerHead: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-2">
              <Label>Menu Items (one per line)</Label>
              {pkgForm.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="h-8 text-sm" value={item} onChange={e => { const updated = [...pkgForm.items]; updated[i] = e.target.value; setPkgForm(f => ({ ...f, items: updated })); }} placeholder={`Item ${i + 1}`} />
                  {pkgForm.items.length > 1 && (
                    <Button variant="ghost" size="sm" className="h-8 text-red-500 shrink-0" onClick={() => setPkgForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setPkgForm(f => ({ ...f, items: [...f.items, ''] }))}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Menu Item
              </Button>
            </div>
            <Button className="w-full" onClick={savePkg} disabled={!pkgForm.name.trim() || pkgForm.pricePerHead < 0}>💾 Save Package</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ SUPPLIER DIALOG ─────────────────────────────────────────────── */}
      <Dialog open={supplierDialog} onOpenChange={(open) => {
        if (!open) {
          setEditingSupplier(null);
          setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', paymentTerms: 'COD', taxId: '', rating: 5 });
        }
        setSupplierDialog(open);
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Supplier Name *</Label><Input value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Contact Person *</Label><Input value={supplierForm.contactPerson} onChange={e => setSupplierForm(f => ({ ...f, contactPerson: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={supplierForm.email} onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Phone *</Label><Input value={supplierForm.phone} onChange={e => setSupplierForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Payment Terms</Label><Input value={supplierForm.paymentTerms} onChange={e => setSupplierForm(f => ({ ...f, paymentTerms: e.target.value }))} placeholder="COD, Net 30" /></div>
            </div>
            <div className="space-y-2"><Label>Address *</Label><Input value={supplierForm.address} onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>City</Label><Input value={supplierForm.city} onChange={e => setSupplierForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={supplierForm.state} onChange={e => setSupplierForm(f => ({ ...f, state: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Zip Code</Label><Input value={supplierForm.zipCode} onChange={e => setSupplierForm(f => ({ ...f, zipCode: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tax ID</Label><Input value={supplierForm.taxId} onChange={e => setSupplierForm(f => ({ ...f, taxId: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Rating</Label><Input type="number" min={1} max={5} value={supplierForm.rating} onChange={e => setSupplierForm(f => ({ ...f, rating: parseInt(e.target.value) || 1 }))} /></div>
            </div>
            <Button className="w-full" onClick={saveSupplier} disabled={!supplierForm.name.trim() || !supplierForm.contactPerson.trim() || !supplierForm.email.trim() || !supplierForm.phone.trim() || !supplierForm.address.trim()}>💾 Save Supplier</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ SUPPLIER PACKAGE DIALOG ─────────────────────────────────────── */}
      <Dialog open={supplierPackageDialog} onOpenChange={(open) => {
        if (!open) {
          setEditingSupplierPackage(null);
          setSupplierPackageForm({ supplierId: '', packageType: 'dj', packageName: '', description: '', price: 0 });
        }
        setSupplierPackageDialog(open);
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingSupplierPackage ? 'Edit Supplier Package' : 'Add Supplier Package'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Supplier *</Label>
              <Select value={supplierPackageForm.supplierId} onValueChange={v => setSupplierPackageForm(f => ({ ...f, supplierId: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose supplier..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Package Type *</Label>
              <Select value={supplierPackageForm.packageType} onValueChange={v => setSupplierPackageForm(f => ({ ...f, packageType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['dj','decoration','traditional_dancing','photography','videography','other','wedding_car'].map(type => (
                    <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Package Name *</Label><Input value={supplierPackageForm.packageName} onChange={e => setSupplierPackageForm(f => ({ ...f, packageName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Price (LKR)</Label><Input type="number" min={0} value={supplierPackageForm.price} onChange={e => setSupplierPackageForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={supplierPackageForm.description} onChange={e => setSupplierPackageForm(f => ({ ...f, description: e.target.value }))} /></div>
            <Button className="w-full" onClick={saveSupplierPackage} disabled={!supplierPackageForm.supplierId || !supplierPackageForm.packageName.trim() || supplierPackageForm.price < 0}>💾 Save Package</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ HALL DIALOG ══════════════════════════════════════════════════ */}
      <Dialog open={hallDialog} onOpenChange={setHallDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingHall ? '✏️ Edit Wedding Hall' : '➕ Add New Wedding Hall'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Hall Name *</Label><Input value={hallForm.name} onChange={e => setHallForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Banquet Grand Hall" /></div>
            
            <div className="space-y-2"><Label>Hall Type</Label>
              <Select value={hallForm.hallType} onValueChange={v => setHallForm(f => ({ ...f, hallType: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HALL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" min={1} value={hallForm.capacity} onChange={e => setHallForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Area (sq.ft)</Label><Input type="number" min={1} value={hallForm.area} onChange={e => setHallForm(f => ({ ...f, area: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Base Price (LKR)</Label><Input type="number" min={0} value={hallForm.basePrice} onChange={e => setHallForm(f => ({ ...f, basePrice: parseInt(e.target.value) || 0 }))} /></div>
            </div>

            <div className="space-y-2"><Label>Availability</Label>
              <Select value={hallForm.availability} onValueChange={v => setHallForm(f => ({ ...f, availability: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Hall Features</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'airConditioned', label: 'Air Conditioned' },
                  { key: 'parking', label: 'Parking' },
                  { key: 'kitchenAccess', label: 'Kitchen Access' },
                  { key: 'danceFloor', label: 'Dance Floor' },
                  { key: 'stage', label: 'Stage' },
                  { key: 'soundSystem', label: 'Sound System' },
                ].map(f => (
                  <button key={f.key}
                    onClick={() => setHallForm(prev => ({
                      ...prev,
                      features: { ...prev.features, [f.key]: !(prev.features as any)[f.key] }
                    }))}
                    className={`rounded-lg border-2 p-2 text-sm text-center transition-all ${(hallForm.features as any)[f.key] ? 'border-green-400 bg-green-50 text-green-700' : 'border-border hover:border-green-300'}`}>
                    {(hallForm.features as any)[f.key] ? '✅' : '⭕'} {f.label}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={saveHall} disabled={!hallForm.name.trim()}>{editingHall ? '💾 Save Changes' : '➕ Add Hall'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ QUOTATION DETAIL PANEL ════════════════════════════════════════ */}
      {detailPanel && selectedQ && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailPanel(false)} />
          <div className="relative bg-background w-full sm:w-[540px] h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg">{selectedQ.clientName}</h2>
                <p className="text-sm text-muted-foreground">{selectedQ.quoteNumber}</p>
              </div>
              <div className="flex gap-1">
                {selectedQ.status === 'closed' && (
                  <Button variant="outline" size="sm" onClick={() => printBillWithQR(selectedQ)} title="Print bill with QR code">
                    <Printer className="h-4 w-4 mr-1" /><QrCode className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setDetailPanel(false)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4 text-sm">
              {/* Status Badge */}
              <div className={`rounded-lg p-3 ${qStatusColor(selectedQ.status).replace('text', 'bg').replace('bg-', 'bg-')} text-center font-semibold`}>
                {selectedQ.status === 'draft' && '📝 Draft - Awaiting Activation'}
                {selectedQ.status === 'active' && '✅ Active - Valid until ' + (selectedQ.expiryDate ? format(new Date(selectedQ.expiryDate), 'MMM dd, yyyy') : 'TBD')}
                {selectedQ.status === 'expired' && '⏰ Expired - Can be reactivated'}
                {selectedQ.status === 'closed' && '🏁 Closed - Event Completed'}
                {selectedQ.status === 'cancelled' && '❌ Cancelled'}
              </div>

              {/* Client & Event Info */}
              <div>
                <p className="font-semibold mb-2">📋 Client & Event Info</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selectedQ.clientPhone}</p></div>
                  <div><p className="text-muted-foreground">Email</p><p className="font-medium truncate">{selectedQ.clientEmail}</p></div>
                  <div><p className="text-muted-foreground">Event Date</p><p className="font-medium">{format(new Date(selectedQ.eventDate), 'dd MMM yyyy')}</p></div>
                  <div><p className="text-muted-foreground">Time</p><p className="font-medium">{selectedQ.eventStartTime} – {selectedQ.eventEndTime}</p></div>
                  <div><p className="text-muted-foreground">Guests</p><p className="font-medium">{selectedQ.pax} pax</p></div>
                  <div><p className="text-muted-foreground">Hall</p><p className="font-medium">{selectedQ.hallId?.name || '—'}</p></div>
                </div>
              </div>

              {/* Menu & Add-ons */}
              {selectedQ.menuPackageId && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                  <p className="font-semibold text-rose-700">🍽️ Menu: {selectedQ.menuPackageId.name}</p>
                  <p className="text-xs text-rose-600 mt-1">{formatLKR(selectedQ.menuPackageId.pricePerHead)}/head · Total: {formatLKR(selectedQ.menuAmount)}</p>
                </div>
              )}

              {selectedQ.supplierPackageId && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="font-semibold text-blue-700">🤝 Supplier Package: {selectedQ.supplierPackageId.packageName}</p>
                  <p className="text-xs text-blue-600 mt-1">{selectedQ.supplierId?.name || 'Supplier'} · {formatLKR(selectedQ.supplierPackageId.price)}</p>
                  {selectedQ.supplierPackageId.description && <p className="text-xs text-muted-foreground mt-1">{selectedQ.supplierPackageId.description}</p>}
                </div>
              )}

              {selectedQ.addOns.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">🎉 Services & Add-ons</p>
                  <div className="space-y-1">
                    {selectedQ.addOns.map((a, i) => (
                      <div key={i} className="flex justify-between text-xs border-b py-1 last:border-b-0">
                        <span className="capitalize">{a.type.replace('_', ' ')}</span>
                        <span className="font-medium">{formatLKR(a.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Items with Edit Capability */}
              {selectedQ.additionalItems.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">📝 Additional Items</p>
                    {selectedQ.status === 'active' && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => {
                        setEditItemsMode(!editItemsMode);
                        setEditingItemIndex(null);
                      }}>
                        {editItemsMode ? 'Done' : '✏️ Edit'}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedQ.additionalItems.map((i, idx) => (
                      <div key={idx} className={`border rounded p-2 ${editingItemIndex === idx ? 'bg-blue-50' : 'bg-muted/30'}`}>
                        {editItemsMode && editingItemIndex === idx ? (
                          <div className="space-y-2">
                            <Input value={editItemDraft.name} className="h-7 text-xs" onChange={e => setEditItemDraft(d => ({ ...d, name: e.target.value }))} placeholder="Item name" />
                            <div className="grid grid-cols-3 gap-2">
                              <Input type="number" min={1} value={editItemDraft.quantity} className="h-7 text-xs" onChange={e => setEditItemDraft(d => ({ ...d, quantity: parseInt(e.target.value) || 1 }))} placeholder="Qty" />
                              <Input type="number" min={0} value={editItemDraft.unitPrice} className="h-7 text-xs" onChange={e => setEditItemDraft(d => ({ ...d, unitPrice: parseFloat(e.target.value) || 0 }))} placeholder="LKR" />
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleDeleteItem(idx)}>Delete</Button>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => handleEditItem(idx, editItemDraft.name, editItemDraft.quantity, editItemDraft.unitPrice)} disabled={!editItemDraft.name.trim() || editItemDraft.unitPrice < 0}>Save</Button>
                              <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={() => setEditingItemIndex(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="font-medium">{i.name} ×{i.quantity}</span>
                              <p className="text-muted-foreground">{formatLKR(i.unitPrice)} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{formatLKR(i.total)}</span>
                              {editItemsMode && (
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => startEditItem(i, idx)}>Edit</Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Summary */}
              <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Hall Base</span><span>{formatLKR(selectedQ.baseAmount)}</span></div>
                {selectedQ.menuAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Menu</span><span>{formatLKR(selectedQ.menuAmount)}</span></div>}
                {selectedQ.addOnsAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Add-ons</span><span>{formatLKR(selectedQ.addOnsAmount)}</span></div>}
                {selectedQ.additionalAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Additional Items</span><span>{formatLKR(selectedQ.additionalAmount)}</span></div>}
                <div className="flex justify-between font-bold border-t pt-1"><span>TOTAL</span><span>{formatLKR(selectedQ.totalAmount)}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid</span><span>-{formatLKR(selectedQ.advancePaid)}</span></div>
                <div className="flex justify-between font-bold text-red-600"><span>DUE</span><span>{formatLKR(selectedQ.totalAmount - selectedQ.advancePaid)}</span></div>
              </div>

              {/* Payment History */}
              {selectedQ.payments.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">💳 Payment History</p>
                  <div className="space-y-1">
                    {selectedQ.payments.map((p, i) => (
                      <div key={i} className="flex justify-between text-xs rounded bg-muted/30 px-2 py-1">
                        <span className="capitalize">{p.method} - {formatLKR(p.amount)}</span>
                        <span className="text-muted-foreground">{format(new Date(p.date), 'MMM dd')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedQ.notes && (
                <div><p className="font-semibold mb-1">📌 Notes</p><p className="text-muted-foreground text-xs bg-yellow-50 p-2 rounded">{selectedQ.notes}</p></div>
              )}

              {/* QR Code Display for Active/Closed */}
              {(selectedQ.status === 'active' || selectedQ.status === 'closed') && selectedQ.qrCode && (
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs font-semibold mb-2">🔗 Scan for Digital Bill</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(selectedQ.qrCode)}`} alt="QR" className="mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">{selectedQ.qrCode}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
