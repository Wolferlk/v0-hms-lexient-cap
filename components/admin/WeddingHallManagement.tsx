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
import { format, isPast, differenceInDays } from 'date-fns';
import {
  Heart, Plus, Trash2, Printer, QrCode, CheckCircle,
  XCircle, Search, Edit, RefreshCw, Calendar, Users,
  Music, Flower2, Camera, Star,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeddingHall { _id: string; name: string; capacity: number; basePrice: number; area: number; availability: string; }
interface MenuPackage { _id: string; packageNumber: number; name: string; pricePerHead: number; items: string[]; description: string; }

interface AddOn { type: string; description: string; price: number; }
interface AdditionalItem { name: string; quantity: number; unitPrice: number; total: number; }

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
  addOns: AddOn[];
  additionalItems: AdditionalItem[];
  baseAmount: number;
  menuAmount: number;
  addOnsAmount: number;
  additionalAmount: number;
  notes: string;
  payments: { amount: number; method: string; date: string; notes?: string }[];
  hallId?: { _id: string; name: string; capacity: number; basePrice: number };
  menuPackageId?: { _id: string; name: string; pricePerHead: number; items: string[] };
}

// ── Print helpers ─────────────────────────────────────────────────────────────

function printQuotation(q: Quotation, hotel = 'Lexient Hotel') {
  const qrUrl = `${window.location.origin}/wedding-bill/${q._id}`;
  const remainingAmount = q.totalAmount - q.advancePaid;
  const html = `<!DOCTYPE html><html><head><title>Wedding Quotation - ${q.quoteNumber}</title>
  <style>
    body{font-family:'Courier New',monospace;font-size:11px;width:300px;margin:0 auto;padding:8px}
    h2{text-align:center;font-size:15px;margin:0}
    .c{text-align:center} hr{border:none;border-top:1px dashed #000;margin:6px 0}
    table{width:100%;border-collapse:collapse} td{padding:2px 0} .r{text-align:right}
    .tb td{font-weight:bold;font-size:13px} img.qr{display:block;margin:8px auto;width:110px}
    @media print{body{margin:0}}
  </style></head><body>
  <h2>${hotel}</h2><p class="c">Wedding Quotation</p><hr/>
  <p><b>${q.quoteNumber}</b></p>
  <p>Client: <b>${q.clientName}</b></p>
  <p>Phone: ${q.clientPhone}</p>
  <p>Event Date: <b>${format(new Date(q.eventDate), 'dd MMM yyyy')}</b></p>
  <p>Time: ${q.eventStartTime} – ${q.eventEndTime}</p>
  <p>Hall: ${q.hallId?.name || 'TBD'} · ${q.pax} Pax</p>
  <p>Status: <b>${q.status.toUpperCase()}</b></p>
  <p>Valid Until: ${format(new Date(q.validUntil), 'dd MMM yyyy')}</p>
  <hr/>
  <table>
    <tr><td>Hall Base</td><td class="r">$${q.baseAmount.toFixed(2)}</td></tr>
    ${q.menuPackageId ? `<tr><td>Menu (${q.menuPackageId.name}) ×${q.pax}</td><td class="r">$${q.menuAmount.toFixed(2)}</td></tr>` : ''}
    ${q.addOns.map(a => `<tr><td>${a.description || a.type}</td><td class="r">$${a.price.toFixed(2)}</td></tr>`).join('')}
    ${q.additionalItems.map(i => `<tr><td>${i.name} ×${i.quantity}</td><td class="r">$${i.total.toFixed(2)}</td></tr>`).join('')}
  </table><hr/>
  <table>
    <tr class="tb"><td>TOTAL</td><td class="r">$${q.totalAmount.toFixed(2)}</td></tr>
    <tr><td>Advance Paid</td><td class="r">$${q.advancePaid.toFixed(2)}</td></tr>
    <tr class="tb"><td>BALANCE DUE</td><td class="r">$${remainingAmount.toFixed(2)}</td></tr>
  </table><hr/>
  ${q.payments.length > 0 ? `<p><b>Payments:</b></p>${q.payments.map(p => `<p>${p.method} - $${p.amount} (${format(new Date(p.date), 'MMM dd')})</p>`).join('')}<hr/>` : ''}
  <p class="c" style="font-size:10px">Scan to view your wedding bill</p>
  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrUrl)}" />
  <p class="c" style="font-size:9px">Thank you for choosing ${hotel}!</p>
  </body></html>`;
  const w = window.open('', '_blank', 'width=420,height=640');
  if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
}

const ADD_ON_TYPES = [
  { value: 'dj', label: 'DJ', icon: Music },
  { value: 'decoration', label: 'Decoration', icon: Flower2 },
  { value: 'traditional_dancing', label: 'Traditional Dancing', icon: Star },
  { value: 'photography', label: 'Photography', icon: Camera },
  { value: 'videography', label: 'Videography', icon: Camera },
  { value: 'other', label: 'Other', icon: Plus },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function WeddingHallManagement() {
  const [activeTab, setActiveTab] = useState('quotations');
  const [halls, setHalls] = useState<WeddingHall[]>([]);
  const [menuPackages, setMenuPackages] = useState<MenuPackage[]>([]);
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
    hallId: '', clientName: '', clientEmail: '', clientPhone: '',
    eventDate: '', eventStartTime: '18:00', eventEndTime: '23:00',
    eventType: 'wedding', pax: 100,
    menuPackageId: '', customMenuItems: [] as string[],
    addOns: [] as AddOn[], additionalItems: [] as AdditionalItem[], notes: '',
  });

  // Add items to active quotation
  const [addItemsDialog, setAddItemsDialog] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unitPrice: 0 });

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [payAction, setPayAction] = useState<'activate' | 'add_payment' | 'close'>('add_payment');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');

  // Menu package edit
  const [editPkgDialog, setEditPkgDialog] = useState(false);
  const [editingPkg, setEditingPkg] = useState<MenuPackage | null>(null);
  const [pkgForm, setPkgForm] = useState({ name: '', description: '', pricePerHead: 0, items: [''] });

  // Hall management
  const [hallDialog, setHallDialog] = useState(false);
  const [editingHall, setEditingHall] = useState<WeddingHall | null>(null);
  const [hallForm, setHallForm] = useState({ name: '', capacity: 100, area: 1000, basePrice: 500, description: '', availability: 'available' });

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hallsRes, pkgsRes, quotesRes] = await Promise.all([
        fetch('/api/wedding-hall/halls'),
        fetch('/api/wedding-hall/menu-packages'),
        fetch('/api/wedding-hall/quotations'),
      ]);
      const [h, p, q] = await Promise.all([hallsRes.json(), pkgsRes.json(), quotesRes.json()]);
      if (h.success) setHalls(h.data);
      if (p.success) setMenuPackages(p.data);
      if (q.success) setQuotations(q.data);
    } catch { toast.error('Failed to load data'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Create Quotation ──────────────────────────────────────────────────────

  const calcTotal = useCallback(() => {
    const hall = halls.find(h => h._id === form.hallId);
    const base = hall?.basePrice || 0;
    const pkg = menuPackages.find(p => p._id === form.menuPackageId);
    const menu = pkg ? pkg.pricePerHead * form.pax : 0;
    const addOnsTotal = form.addOns.reduce((s, a) => s + a.price, 0);
    const additionalTotal = form.additionalItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return { base, menu, addOnsTotal, additionalTotal, grand: base + menu + addOnsTotal + additionalTotal };
  }, [form, halls, menuPackages]);

  const createQuotation = async () => {
    try {
      const res = await fetch('/api/wedding-hall/quotations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Quotation created');
        setCreateDialog(false); setStep(1);
        setForm({ hallId: '', clientName: '', clientEmail: '', clientPhone: '', eventDate: '', eventStartTime: '18:00', eventEndTime: '23:00', eventType: 'wedding', pax: 100, menuPackageId: '', customMenuItems: [], addOns: [], additionalItems: [], notes: '' });
        fetchAll();
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to create quotation'); }
  };

  // ── Payment / Status actions ──────────────────────────────────────────────

  const openPaymentDialog = (q: Quotation, action: typeof payAction) => {
    setSelectedQ(q); setPayAction(action);
    setPayAmount(action === 'close' ? String(Math.max(0, q.totalAmount - q.advancePaid)) : '');
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
        toast.success(payAction === 'activate' ? 'Quotation activated!' : payAction === 'close' ? 'Event closed!' : 'Payment recorded');
        setPaymentDialog(false); fetchAll();
        if (detailPanel && selectedQ) {
          const r = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`);
          const d = await r.json();
          if (d.success) setSelectedQ(d.data);
        }
      } else { toast.error(data.error); }
    } catch { toast.error('Failed to process payment'); }
  };

  const cancelQuotation = async (id: string) => {
    const res = await fetch(`/api/wedding-hall/quotations/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Cancelled'); fetchAll(); }
  };

  // ── Add items to active quotation ─────────────────────────────────────────

  const handleAddItem = async () => {
    if (!selectedQ) return;
    const res = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_items', additionalItems: [newItem] }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Item added'); setNewItem({ name: '', quantity: 1, unitPrice: 0 });
      fetchAll();
      const r = await fetch(`/api/wedding-hall/quotations/${selectedQ._id}`);
      const d = await r.json();
      if (d.success) setSelectedQ(d.data);
    } else { toast.error(data.error); }
  };

  // ── Menu package edit ─────────────────────────────────────────────────────

  const savePkg = async () => {
    if (!editingPkg) return;
    const res = await fetch('/api/wedding-hall/menu-packages', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingPkg._id, ...pkgForm, items: pkgForm.items.filter(i => i.trim()) }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Package updated'); setEditPkgDialog(false); fetchAll(); }
    else { toast.error(data.error); }
  };

  // ── Hall management ───────────────────────────────────────────────────────

  const saveHall = async () => {
    try {
      const method = editingHall ? 'PUT' : 'POST';
      const body = editingHall ? { id: editingHall._id, ...hallForm } : hallForm;
      const res = await fetch('/api/wedding-hall/halls', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { toast.success(editingHall ? 'Hall updated' : 'Hall added'); setHallDialog(false); fetchAll(); }
      else { toast.error(data.error); }
    } catch { toast.error('Failed to save hall'); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const filteredQuotations = quotations.filter(q => {
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchSearch = q.clientName.toLowerCase().includes(search.toLowerCase()) || q.quoteNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const qStatusColor = (s: string) => ({
    draft: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-500',
    closed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-500',
  }[s] ?? 'bg-gray-100 text-gray-600');

  const totals = calcTotal();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="quotations"><Heart className="mr-1.5 h-3.5 w-3.5" />Quotations</TabsTrigger>
          <TabsTrigger value="halls">Halls</TabsTrigger>
          <TabsTrigger value="menus">Menu Packages</TabsTrigger>
        </TabsList>

        {/* ══ QUOTATIONS ══════════════════════════════════════════════════ */}
        <TabsContent value="quotations" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 w-48 h-8 text-sm" placeholder="Search client / #..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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
                return (
                  <div key={q._id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{q.clientName}</span>
                          <span className="text-xs text-muted-foreground">{q.quoteNumber}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${qStatusColor(q.status)}`}>{q.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(q.eventDate), 'MMM dd, yyyy')}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{q.pax} pax</span>
                          {q.hallId && <span>{q.hallId.name}</span>}
                          <span className="capitalize">{q.eventType.replace('_', ' ')}</span>
                        </div>
                        {q.status === 'draft' && (
                          <p className={`text-xs mt-1 ${daysLeft < 7 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                            Valid for {Math.max(0, daysLeft)} more day(s) · expires {format(new Date(q.validUntil), 'MMM dd')}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-bold">${q.totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-green-600">Paid: ${q.advancePaid.toFixed(2)}</p>
                        {balance > 0 && <p className="text-xs text-red-500">Due: ${balance.toFixed(2)}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setSelectedQ(q); setDetailPanel(true); }}>
                        <Edit className="h-3 w-3 mr-1" />View
                      </Button>
                      {q.status === 'draft' && !isPast(new Date(q.validUntil)) && (
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => openPaymentDialog(q, 'activate')}>
                          <CheckCircle className="h-3 w-3 mr-1" />Activate
                        </Button>
                      )}
                      {q.status === 'active' && (
                        <>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSelectedQ(q); setAddItemsDialog(true); }}>
                            <Plus className="h-3 w-3 mr-1" />Add Items
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openPaymentDialog(q, 'add_payment')}>
                            Payment
                          </Button>
                          <Button size="sm" className="h-7 text-xs" onClick={() => openPaymentDialog(q, 'close')}>
                            Close Event
                          </Button>
                        </>
                      )}
                      {q.status === 'closed' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => printQuotation(q)}>
                          <Printer className="h-3 w-3 mr-1" /><QrCode className="h-3 w-3 mr-1" />Print Bill
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
            <Button size="sm" onClick={() => { setEditingHall(null); setHallForm({ name: '', capacity: 100, area: 1000, basePrice: 500, description: '', availability: 'available' }); setHallDialog(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Hall
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {halls.map(hall => (
              <div key={hall._id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{hall.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    hall.availability === 'available' ? 'bg-green-100 text-green-700' :
                    hall.availability === 'booked' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>{hall.availability}</span>
                </div>
                <div className="grid grid-cols-3 text-sm text-muted-foreground gap-2">
                  <div><p className="text-xs">Capacity</p><p className="font-medium text-foreground">{hall.capacity} pax</p></div>
                  <div><p className="text-xs">Area</p><p className="font-medium text-foreground">{hall.area} sq.ft</p></div>
                  <div><p className="text-xs">Base Price</p><p className="font-medium text-foreground">${hall.basePrice}</p></div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => { setEditingHall(hall); setHallForm({ name: hall.name, capacity: hall.capacity, area: hall.area, basePrice: hall.basePrice, description: '', availability: hall.availability }); setHallDialog(true); }}>
                  <Edit className="h-3 w-3 mr-1" />Edit
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ══ MENU PACKAGES ══════════════════════════════════════════════ */}
        <TabsContent value="menus" className="space-y-4">
          <p className="text-sm text-muted-foreground">5 preset menu packages for weddings. Edit to customize what's included and price per head.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menuPackages.map(pkg => (
              <div key={pkg._id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-bold mr-2">{pkg.packageNumber}</span>
                    <span className="font-semibold">{pkg.name}</span>
                  </div>
                  <span className="text-lg font-bold">${pkg.pricePerHead}<span className="text-xs font-normal text-muted-foreground">/head</span></span>
                </div>
                <p className="text-xs text-muted-foreground">{pkg.description}</p>
                <div className="space-y-0.5">
                  {pkg.items.slice(0, 5).map((item, i) => <div key={i} className="text-xs text-muted-foreground">• {item}</div>)}
                  {pkg.items.length > 5 && <div className="text-xs text-muted-foreground">+{pkg.items.length - 5} more items</div>}
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs w-full"
                  onClick={() => { setEditingPkg(pkg); setPkgForm({ name: pkg.name, description: pkg.description, pricePerHead: pkg.pricePerHead, items: [...pkg.items, ''] }); setEditPkgDialog(true); }}>
                  <Edit className="h-3 w-3 mr-1" />Edit Package
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ══ CREATE QUOTATION DIALOG ════════════════════════════════════════ */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Wedding Quotation — Step {step} of 4</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Step progress */}
            <div className="flex gap-1">
              {[1,2,3,4].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-rose-500' : 'bg-muted'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Client Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2"><Label>Full Name *</Label><Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Phone *</Label><Input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} /></div>
                </div>
                <p className="text-sm font-semibold mt-4">Hall Selection</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2"><Label>Hall *</Label>
                    <Select value={form.hallId} onValueChange={v => setForm(f => ({ ...f, hallId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select hall..." /></SelectTrigger>
                      <SelectContent>
                        {halls.map(h => <SelectItem key={h._id} value={h._id}>{h.name} — {h.capacity} pax · ${h.basePrice}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setStep(2)} disabled={!form.clientName || !form.clientPhone || !form.hallId}>Next: Event Details →</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Event Details</p>
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
                <Button className="w-full" onClick={() => setStep(3)} disabled={!form.eventDate}>Next: Menu & Add-ons →</Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>← Back</Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold">Menu Package</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {menuPackages.map(pkg => (
                    <button key={pkg._id} onClick={() => setForm(f => ({ ...f, menuPackageId: f.menuPackageId === pkg._id ? '' : pkg._id }))}
                      className={`rounded-lg border-2 p-3 text-left text-sm transition-all ${form.menuPackageId === pkg._id ? 'border-rose-500 bg-rose-50' : 'border-border hover:border-rose-300'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{pkg.name}</span>
                        <span className="font-bold text-rose-600">${pkg.pricePerHead}/head</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                      <p className="text-xs mt-1 font-medium text-foreground">Total for {form.pax} pax: ${(pkg.pricePerHead * form.pax).toFixed(0)}</p>
                    </button>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, menuPackageId: '' }))}
                    className={`rounded-lg border-2 p-3 text-left text-sm transition-all ${!form.menuPackageId ? 'border-rose-500 bg-rose-50' : 'border-border hover:border-rose-300'}`}>
                    <span className="font-semibold">Custom Menu</span>
                    <p className="text-xs text-muted-foreground mt-1">No preset package — customize in quotation</p>
                  </button>
                </div>

                <p className="text-sm font-semibold">Add-ons</p>
                <div className="grid grid-cols-3 gap-2">
                  {ADD_ON_TYPES.map(a => {
                    const existing = form.addOns.find(x => x.type === a.value);
                    return (
                      <button key={a.value}
                        onClick={() => {
                          if (existing) setForm(f => ({ ...f, addOns: f.addOns.filter(x => x.type !== a.value) }));
                          else setForm(f => ({ ...f, addOns: [...f.addOns, { type: a.value, description: a.label, price: 0 }] }));
                        }}
                        className={`rounded-lg border p-2 text-xs text-center transition-all ${existing ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-border hover:border-rose-300'}`}>
                        <a.icon className="h-4 w-4 mx-auto mb-1" />{a.label}
                      </button>
                    );
                  })}
                </div>
                {form.addOns.length > 0 && (
                  <div className="space-y-2">
                    {form.addOns.map((ao, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm flex-1 capitalize">{ao.type.replace('_', ' ')}</span>
                        <Input className="w-24 h-8 text-sm" type="number" placeholder="Price" value={ao.price || ''} onChange={e => {
                          const updated = [...form.addOns]; updated[i].price = parseFloat(e.target.value) || 0; setForm(f => ({ ...f, addOns: updated }));
                        }} />
                        <Button variant="ghost" size="sm" className="h-8 text-red-500" onClick={() => setForm(f => ({ ...f, addOns: f.addOns.filter((_, j) => j !== i) }))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button className="w-full" onClick={() => setStep(4)}>Next: Review →</Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>← Back</Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold">Summary & Notes</p>
                <div className="rounded-lg bg-muted/40 p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Hall Base</span><span>${totals.base.toFixed(2)}</span></div>
                  {totals.menu > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Menu ({form.pax} pax)</span><span>${totals.menu.toFixed(2)}</span></div>}
                  {totals.addOnsTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Add-ons</span><span>${totals.addOnsTotal.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-base border-t pt-2"><span>Grand Total</span><span>${totals.grand.toFixed(2)}</span></div>
                  <p className="text-xs text-muted-foreground">Quotation valid for 3 months from today</p>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special requests, dietary notes..." /></div>
                <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={createQuotation}>Create Quotation</Button>
                <Button variant="ghost" className="w-full" onClick={() => setStep(3)}>← Back</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ PAYMENT DIALOG ═══════════════════════════════════════════════ */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {payAction === 'activate' ? '✅ Activate Quotation' : payAction === 'close' ? '🏁 Close Event' : '💳 Record Payment'}
            </DialogTitle>
          </DialogHeader>
          {selectedQ && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Total Amount</span><span className="font-bold">${selectedQ.totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid So Far</span><span>${selectedQ.advancePaid.toFixed(2)}</span></div>
                <div className="flex justify-between text-red-500 font-medium"><span>Balance Due</span><span>${(selectedQ.totalAmount - selectedQ.advancePaid).toFixed(2)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Amount *</Label><Input type="number" min={0} step={0.01} value={payAmount} onChange={e => setPayAmount(e.target.value)} /></div>
                <div className="space-y-2"><Label>Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="e.g. advance for venue booking" /></div>
              <Button className="w-full" onClick={handlePayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>
                {payAction === 'activate' ? 'Activate & Record Payment' : payAction === 'close' ? 'Close Event & Settle' : 'Record Payment'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ ADD ITEMS DIALOG ═════════════════════════════════════════════ */}
      <Dialog open={addItemsDialog} onOpenChange={setAddItemsDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Items to Quotation</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Item Name *</Label><Input value={newItem.name} onChange={e => setNewItem(i => ({ ...i, name: e.target.value }))} placeholder="e.g. Extra Floral Arrangement" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={newItem.quantity} onChange={e => setNewItem(i => ({ ...i, quantity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Unit Price ($)</Label><Input type="number" min={0} step={0.01} value={newItem.unitPrice} onChange={e => setNewItem(i => ({ ...i, unitPrice: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            {newItem.name && newItem.unitPrice > 0 && (
              <p className="text-sm font-medium text-muted-foreground">Total: ${(newItem.quantity * newItem.unitPrice).toFixed(2)}</p>
            )}
            <Button className="w-full" onClick={handleAddItem} disabled={!newItem.name.trim() || newItem.unitPrice <= 0}>Add to Quotation</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ EDIT MENU PACKAGE DIALOG ════════════════════════════════════ */}
      <Dialog open={editPkgDialog} onOpenChange={setEditPkgDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Menu Package — {editingPkg?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Package Name</Label><Input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Price Per Head ($)</Label><Input type="number" min={0} step={0.01} value={pkgForm.pricePerHead} onChange={e => setPkgForm(f => ({ ...f, pricePerHead: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-2">
              <Label>Menu Items (one per line)</Label>
              {pkgForm.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="h-8 text-sm" value={item} onChange={e => { const updated = [...pkgForm.items]; updated[i] = e.target.value; setPkgForm(f => ({ ...f, items: updated })); }} placeholder={`Item ${i + 1}`} />
                  <Button variant="ghost" size="sm" className="h-8 text-red-500 shrink-0" onClick={() => setPkgForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPkgForm(f => ({ ...f, items: [...f.items, ''] }))}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Item
              </Button>
            </div>
            <Button className="w-full" onClick={savePkg}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ HALL DIALOG ══════════════════════════════════════════════════ */}
      <Dialog open={hallDialog} onOpenChange={setHallDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingHall ? 'Edit Hall' : 'Add Wedding Hall'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><Label>Hall Name *</Label><Input value={hallForm.name} onChange={e => setHallForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" min={1} value={hallForm.capacity} onChange={e => setHallForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Area (sq.ft)</Label><Input type="number" min={1} value={hallForm.area} onChange={e => setHallForm(f => ({ ...f, area: parseInt(e.target.value) || 1 }))} /></div>
              <div className="space-y-2"><Label>Base Price ($)</Label><Input type="number" min={0} value={hallForm.basePrice} onChange={e => setHallForm(f => ({ ...f, basePrice: parseInt(e.target.value) || 0 }))} /></div>
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
            <Button className="w-full" onClick={saveHall} disabled={!hallForm.name.trim()}>{editingHall ? 'Save Changes' : 'Add Hall'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ QUOTATION DETAIL PANEL ══════════════════════════════════════ */}
      {detailPanel && selectedQ && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailPanel(false)} />
          <div className="relative bg-background w-full sm:w-[500px] h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg">{selectedQ.clientName}</h2>
                <p className="text-sm text-muted-foreground">{selectedQ.quoteNumber} · <span className={`font-medium ${selectedQ.status === 'active' ? 'text-green-600' : selectedQ.status === 'closed' ? 'text-blue-600' : 'text-muted-foreground'}`}>{selectedQ.status}</span></p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => printQuotation(selectedQ)}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDetailPanel(false)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Phone', selectedQ.clientPhone],
                  ['Email', selectedQ.clientEmail],
                  ['Event Date', format(new Date(selectedQ.eventDate), 'dd MMM yyyy')],
                  ['Time', `${selectedQ.eventStartTime} – ${selectedQ.eventEndTime}`],
                  ['Pax', String(selectedQ.pax)],
                  ['Hall', selectedQ.hallId?.name || '—'],
                  ['Type', selectedQ.eventType.replace('_', ' ')],
                  ['Valid Until', format(new Date(selectedQ.validUntil), 'dd MMM yyyy')],
                ].map(([l, v]) => (
                  <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{v}</p></div>
                ))}
              </div>

              {selectedQ.menuPackageId && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                  <p className="font-semibold text-rose-700">Menu: {selectedQ.menuPackageId.name}</p>
                  <p className="text-xs text-rose-600">${selectedQ.menuPackageId.pricePerHead}/head · ${selectedQ.menuAmount?.toFixed(2)} total</p>
                </div>
              )}

              {selectedQ.addOns.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Add-ons</p>
                  {selectedQ.addOns.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm border-b py-1">
                      <span className="capitalize">{a.type.replace('_', ' ')} — {a.description}</span>
                      <span>${a.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedQ.additionalItems.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Additional Items</p>
                  {selectedQ.additionalItems.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b py-1">
                      <span>{i.name} × {i.quantity}</span>
                      <span>${i.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Hall Base</span><span>${selectedQ.baseAmount?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Menu</span><span>${selectedQ.menuAmount?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Add-ons</span><span>${selectedQ.addOnsAmount?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Additional</span><span>${selectedQ.additionalAmount?.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Grand Total</span><span>${selectedQ.totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-green-600"><span>Advance Paid</span><span>-${selectedQ.advancePaid.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-red-600"><span>Balance Due</span><span>${(selectedQ.totalAmount - selectedQ.advancePaid).toFixed(2)}</span></div>
              </div>

              {selectedQ.payments.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Payment History</p>
                  {selectedQ.payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm rounded bg-muted/30 px-2 py-1 mb-1">
                      <span>{p.method} — ${p.amount}</span>
                      <span className="text-muted-foreground text-xs">{format(new Date(p.date), 'MMM dd')}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedQ.notes && (
                <div><p className="font-semibold mb-1">Notes</p><p className="text-muted-foreground text-sm">{selectedQ.notes}</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
