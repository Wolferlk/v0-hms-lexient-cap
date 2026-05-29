'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus, TrendingUp, TrendingDown, DollarSign, Search,
  RefreshCw, Trash2, Edit, CheckCircle, Clock, Printer,
  BarChart3, ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Expense {
  _id: string; category: string; description: string; amount: number;
  vendor?: string; status: string; paymentMethod?: string;
  dueDate?: string; notes?: string; createdAt: string;
}
interface Income {
  _id: string; source: string; amount: number; description: string;
  paymentMethod?: string; recordedDate: string; createdAt?: string;
}

const EXPENSE_CATEGORIES = ['utilities','maintenance','supplies','payroll','food','marketing','transport','insurance','tax','other'];
const INCOME_SOURCES = ['booking','restaurant','wedding_hall','day_out','boat_ride','event','other'];
const PAYMENT_METHODS = ['cash','card','bank_transfer','cheque','upi'];

const catColor: Record<string, string> = {
  utilities: 'bg-blue-100 text-blue-700', maintenance: 'bg-orange-100 text-orange-700',
  supplies: 'bg-purple-100 text-purple-700', payroll: 'bg-pink-100 text-pink-700',
  food: 'bg-yellow-100 text-yellow-700', marketing: 'bg-cyan-100 text-cyan-700',
  transport: 'bg-indigo-100 text-indigo-700', other: 'bg-gray-100 text-gray-600',
};
const srcColor: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-700', restaurant: 'bg-orange-100 text-orange-700',
  wedding_hall: 'bg-pink-100 text-pink-700', day_out: 'bg-green-100 text-green-700',
  boat_ride: 'bg-cyan-100 text-cyan-700', event: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
};
const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500', approved: 'bg-blue-100 text-blue-700',
};

// ── Print Receipt ─────────────────────────────────────────────────────────────
function printReceipt(item: Income | Expense, type: 'income' | 'expense') {
  const isIncome = type === 'income';
  const inc = item as Income;
  const exp = item as Expense;
  const html = `<!DOCTYPE html><html><head><title>Receipt</title>
  <style>body{font-family:'Courier New',monospace;font-size:11px;width:280px;margin:0 auto;padding:8px}
  h2{text-align:center;font-size:14px;margin:0}.c{text-align:center}hr{border:none;border-top:1px dashed #000;margin:5px 0}
  table{width:100%} td{padding:2px 0} .r{text-align:right} .b{font-weight:bold;font-size:13px}</style>
  </head><body>
  <h2>Lexient Hotel</h2>
  <p class="c">${isIncome ? 'Income Receipt' : 'Expense Receipt'}</p><hr/>
  <p><b>${isIncome ? `Source: ${inc.source}` : `Category: ${exp.category}`}</b></p>
  <p>${item.description}</p>
  ${!isIncome && exp.vendor ? `<p>Vendor: ${exp.vendor}</p>` : ''}
  <p>Method: ${item.paymentMethod || 'N/A'}</p>
  <p>Date: ${format(new Date(isIncome ? inc.recordedDate || inc.createdAt || '' : exp.createdAt), 'dd MMM yyyy')}</p>
  <hr/>
  <table><tr class="b"><td>${isIncome ? 'INCOME' : 'EXPENSE'}</td><td class="r">Rs.${item.amount.toLocaleString()}</td></tr></table>
  <hr/><p class="c" style="font-size:9px">Lexient Hotel — Finance Dept</p>
  </body></html>`;
  const w = window.open('', '_blank', 'width=380,height=540');
  if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FinancialManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [period, setPeriod] = useState('monthly');

  // Filters
  const [expSearch, setExpSearch] = useState('');
  const [expCat, setExpCat] = useState('all');
  const [expStatus, setExpStatus] = useState('all');
  const [expDateFrom, setExpDateFrom] = useState('');
  const [expDateTo, setExpDateTo] = useState('');
  const [incSearch, setIncSearch] = useState('');
  const [incSource, setIncSource] = useState('all');
  const [incDateFrom, setIncDateFrom] = useState('');
  const [incDateTo, setIncDateTo] = useState('');

  // Expense dialog
  const [expDialog, setExpDialog] = useState(false);
  const [editingExp, setEditingExp] = useState<Expense | null>(null);
  const [expForm, setExpForm] = useState({
    category: 'utilities', description: '', amount: 0, vendor: '',
    paymentMethod: 'cash', status: 'pending', dueDate: '', notes: '',
  });

  // Income dialog
  const [incDialog, setIncDialog] = useState(false);
  const [editingInc, setEditingInc] = useState<Income | null>(null);
  const [incForm, setIncForm] = useState({
    source: 'booking', amount: 0, description: '',
    paymentMethod: 'cash', recordedDate: '',
  });

  // Expense status dialog
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusExp, setStatusExp] = useState<Expense | null>(null);
  const [newStatus, setNewStatus] = useState('paid');
  const [statusMethod, setStatusMethod] = useState('cash');

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [er, ir] = await Promise.all([
        fetch(`/api/finance/expenses?limit=200`),
        fetch(`/api/finance/income?period=${period}`),
      ]);
      const [ed, id] = await Promise.all([er.json(), ir.json()]);
      if (ed.success) setExpenses(ed.data ?? []);
      if (id.success) setIncome(id.data ?? []);
    } catch { toast.error('Failed to load financial data'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Computed Stats ────────────────────────────────────────────────────────
  const totalIncome = income.reduce((s, i) => s + (i.amount ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';
  const pendingExp = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount ?? 0), 0);
  const paidExp = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + (e.amount ?? 0), 0);

  // Category breakdown
  const expByCat = EXPENSE_CATEGORIES.map(cat => ({
    cat, total: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount ?? 0), 0),
    count: expenses.filter(e => e.category === cat).length,
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

  const incBySrc = INCOME_SOURCES.map(src => ({
    src, total: income.filter(i => i.source === src).reduce((s, i) => s + (i.amount ?? 0), 0),
    count: income.filter(i => i.source === src).length,
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

  // Filtered lists
  const filteredExp = expenses.filter(e => {
    const q = expSearch.toLowerCase();
    const matchSearch = e.description.toLowerCase().includes(q) || (e.vendor ?? '').toLowerCase().includes(q);
    const matchCat = expCat === 'all' || e.category === expCat;
    const matchStatus = expStatus === 'all' || e.status === expStatus;
    const matchFrom = !expDateFrom || new Date(e.createdAt) >= new Date(expDateFrom);
    const matchTo = !expDateTo || new Date(e.createdAt) <= new Date(expDateTo + 'T23:59:59');
    return matchSearch && matchCat && matchStatus && matchFrom && matchTo;
  });

  const filteredInc = income.filter(i => {
    const q = incSearch.toLowerCase();
    const matchSearch = i.description.toLowerCase().includes(q);
    const matchSrc = incSource === 'all' || i.source === incSource;
    const date = i.recordedDate || i.createdAt || '';
    const matchFrom = !incDateFrom || new Date(date) >= new Date(incDateFrom);
    const matchTo = !incDateTo || new Date(date) <= new Date(incDateTo + 'T23:59:59');
    return matchSearch && matchSrc && matchFrom && matchTo;
  });

  // ── Expense CRUD ──────────────────────────────────────────────────────────
  const saveExpense = async () => {
    if (!expForm.description || !expForm.amount) { toast.error('Description and amount required'); return; }
    try {
      const method = editingExp ? 'PUT' : 'POST';
      const body = editingExp ? { id: editingExp._id, ...expForm } : { ...expForm, createdBy: 'admin' };
      const res = await fetch('/api/finance/expenses', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        toast.success(editingExp ? 'Expense updated' : 'Expense added');
        setExpDialog(false); setEditingExp(null); fetchAll();
      } else toast.error(data.error || 'Failed');
    } catch { toast.error('Failed to save expense'); }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    const res = await fetch(`/api/finance/expenses?id=${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 404) { toast.success('Expense deleted'); fetchAll(); }
    else {
      // Fallback: mark as cancelled
      await fetch('/api/finance/expenses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'cancelled' }) });
      toast.success('Expense cancelled'); fetchAll();
    }
  };

  const updateExpStatus = async () => {
    if (!statusExp) return;
    const res = await fetch('/api/finance/expenses', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: statusExp._id, status: newStatus, paymentMethod: newStatus === 'paid' ? statusMethod : undefined }),
    });
    const data = await res.json();
    if (data.success) { toast.success('Status updated'); setStatusDialog(false); fetchAll(); }
    else toast.error(data.error || 'Failed');
  };

  // ── Income CRUD ───────────────────────────────────────────────────────────
  const saveIncome = async () => {
    if (!incForm.amount || !incForm.description) { toast.error('Amount and description required'); return; }
    try {
      const method = editingInc ? 'PUT' : 'POST';
      const body = editingInc ? { id: editingInc._id, ...incForm } : { ...incForm, recordedBy: 'admin', recordedDate: incForm.recordedDate || new Date().toISOString() };
      const res = await fetch('/api/finance/income', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        toast.success(editingInc ? 'Income updated' : 'Income recorded');
        setIncDialog(false); setEditingInc(null); fetchAll();
      } else toast.error(data.error || 'Failed');
    } catch { toast.error('Failed to save income'); }
  };

  const deleteIncome = async (id: string) => {
    if (!confirm('Delete this income record?')) return;
    const res = await fetch(`/api/finance/income?id=${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 404) { toast.success('Income deleted'); fetchAll(); }
    else { toast.error('Delete not supported — contact admin'); }
  };

  // ── Open helpers ──────────────────────────────────────────────────────────
  const openAddExp = () => {
    setEditingExp(null);
    setExpForm({ category: 'utilities', description: '', amount: 0, vendor: '', paymentMethod: 'cash', status: 'pending', dueDate: '', notes: '' });
    setExpDialog(true);
  };
  const openEditExp = (e: Expense) => {
    setEditingExp(e);
    setExpForm({ category: e.category, description: e.description, amount: e.amount, vendor: e.vendor || '', paymentMethod: e.paymentMethod || 'cash', status: e.status, dueDate: e.dueDate?.slice(0, 10) || '', notes: e.notes || '' });
    setExpDialog(true);
  };
  const openAddInc = () => {
    setEditingInc(null);
    setIncForm({ source: 'booking', amount: 0, description: '', paymentMethod: 'cash', recordedDate: new Date().toISOString().slice(0, 10) });
    setIncDialog(true);
  };
  const openEditInc = (i: Income) => {
    setEditingInc(i);
    setIncForm({ source: i.source, amount: i.amount, description: i.description, paymentMethod: i.paymentMethod || 'cash', recordedDate: i.recordedDate?.slice(0, 10) || '' });
    setIncDialog(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Stats Bar ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">Rs.{totalIncome.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{incBySrc.length} sources</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-xl font-bold text-red-500">Rs.{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pending: Rs.{pendingExp.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Net Profit</p>
            <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-500'}`} />
          </div>
          <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>Rs.{netProfit.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Margin: {profitMargin}%</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Paid Expenses</p>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600">Rs.{paidExp.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">of Rs.{totalExpenses.toLocaleString()} total</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Period:</span>
        {['weekly','monthly','yearly'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {p}
          </button>
        ))}
        <Button variant="outline" size="sm" className="ml-auto" onClick={fetchAll}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview"><BarChart3 className="mr-1.5 h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="income"><TrendingUp className="mr-1.5 h-3.5 w-3.5" />Income</TabsTrigger>
          <TabsTrigger value="expenses"><TrendingDown className="mr-1.5 h-3.5 w-3.5" />Expenses</TabsTrigger>
        </TabsList>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Income by source */}
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />Income by Source
              </p>
              {incBySrc.length === 0 ? <p className="text-xs text-muted-foreground">No income data</p> : (
                <div className="space-y-2">
                  {incBySrc.map(({ src, total, count }) => (
                    <div key={src} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${srcColor[src] || 'bg-gray-100 text-gray-600'}`}>{src.replace('_', ' ')}</span>
                        <span className="text-xs text-muted-foreground">{count} records</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">Rs.{total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses by category */}
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />Expenses by Category
              </p>
              {expByCat.length === 0 ? <p className="text-xs text-muted-foreground">No expense data</p> : (
                <div className="space-y-2">
                  {expByCat.map(({ cat, total, count }) => (
                    <div key={cat} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${catColor[cat] || 'bg-gray-100 text-gray-600'}`}>{cat}</span>
                        <span className="text-xs text-muted-foreground">{count} records</span>
                      </div>
                      <span className="text-sm font-semibold text-red-500">Rs.{total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profit bar */}
          {totalIncome > 0 && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-semibold text-sm">Profit / Loss Ratio</p>
              <div className="flex h-5 rounded-full overflow-hidden bg-muted">
                <div className="bg-green-500 transition-all" style={{ width: `${Math.min(100, (totalIncome / (totalIncome + Math.abs(netProfit < 0 ? netProfit : 0) )) * 100)}%` }} />
                <div className="bg-red-400 flex-1" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Income: Rs.{totalIncome.toLocaleString()}</span>
                <span>Expenses: Rs.{totalExpenses.toLocaleString()}</span>
              </div>
              <div className={`text-center font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfit >= 0 ? 'PROFIT' : 'LOSS'}: Rs.{Math.abs(netProfit).toLocaleString()} ({profitMargin}%)
              </div>
            </div>
          )}

          {/* Recent records */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-sm mb-3">Recent Income</p>
              {income.slice(0, 5).map(i => (
                <div key={i._id} className="flex justify-between text-sm border-b py-1.5">
                  <div>
                    <span className="font-medium">{i.description}</span>
                    <p className="text-xs text-muted-foreground capitalize">{i.source?.replace('_', ' ')}</p>
                  </div>
                  <span className="text-green-600 font-semibold">+Rs.{(i.amount ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-sm mb-3">Recent Expenses</p>
              {expenses.slice(0, 5).map(e => (
                <div key={e._id} className="flex justify-between text-sm border-b py-1.5">
                  <div>
                    <span className="font-medium">{e.description}</span>
                    <p className="text-xs text-muted-foreground capitalize">{e.category} · <span className={`${e.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{e.status}</span></p>
                  </div>
                  <span className="text-red-500 font-semibold">-Rs.{(e.amount ?? 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ══ INCOME ════════════════════════════════════════════════════ */}
        <TabsContent value="income" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 w-44 h-8 text-sm" placeholder="Search..." value={incSearch} onChange={e => setIncSearch(e.target.value)} />
              </div>
              <Select value={incSource} onValueChange={setIncSource}>
                <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {INCOME_SOURCES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" className="h-8 text-sm w-36" value={incDateFrom} onChange={e => setIncDateFrom(e.target.value)} title="From date" />
              <Input type="date" className="h-8 text-sm w-36" value={incDateTo} onChange={e => setIncDateTo(e.target.value)} title="To date" />
            </div>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={openAddInc}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Income
            </Button>
          </div>

          <div className="rounded-lg border p-2 text-sm text-muted-foreground flex gap-4">
            <span>Showing {filteredInc.length} records</span>
            <span className="text-green-600 font-semibold">Total: Rs.{filteredInc.reduce((s, i) => s + (i.amount ?? 0), 0).toLocaleString()}</span>
          </div>

          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
            <div className="space-y-2">
              {filteredInc.length === 0 && <p className="text-center py-8 text-muted-foreground">No income records found</p>}
              {filteredInc.map(i => (
                <div key={i._id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{i.description}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${srcColor[i.source] || 'bg-gray-100 text-gray-600'}`}>{i.source?.replace('_', ' ')}</span>
                        {i.paymentMethod && <span className="text-xs text-muted-foreground capitalize">{i.paymentMethod.replace('_', ' ')}</span>}
                        <span className="text-xs text-muted-foreground">{format(new Date(i.recordedDate || i.createdAt || new Date()), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-bold">+Rs.{(i.amount ?? 0).toLocaleString()}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditInc(i)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => printReceipt(i, 'income')}>
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteIncome(i._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══ EXPENSES ══════════════════════════════════════════════════ */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="pl-8 w-44 h-8 text-sm" placeholder="Search..." value={expSearch} onChange={e => setExpSearch(e.target.value)} />
              </div>
              <Select value={expCat} onValueChange={setExpCat}>
                <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={expStatus} onValueChange={setExpStatus}>
                <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" className="h-8 text-sm w-36" value={expDateFrom} onChange={e => setExpDateFrom(e.target.value)} title="From date" />
              <Input type="date" className="h-8 text-sm w-36" value={expDateTo} onChange={e => setExpDateTo(e.target.value)} title="To date" />
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={openAddExp}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Expense
            </Button>
          </div>

          <div className="flex gap-4 rounded-lg border p-2 text-sm text-muted-foreground">
            <span>Showing {filteredExp.length} records</span>
            <span className="text-red-500 font-semibold">Total: Rs.{filteredExp.reduce((s, e) => s + (e.amount ?? 0), 0).toLocaleString()}</span>
            <span className="text-yellow-600">Pending: Rs.{filteredExp.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount ?? 0), 0).toLocaleString()}</span>
          </div>

          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (
            <div className="space-y-2">
              {filteredExp.length === 0 && <p className="text-center py-8 text-muted-foreground">No expense records found</p>}
              {filteredExp.map(e => (
                <div key={e._id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{e.description}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${catColor[e.category] || 'bg-gray-100 text-gray-600'}`}>{e.category}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[e.status] || 'bg-gray-100 text-gray-600'}`}>{e.status}</span>
                        {e.vendor && <span className="text-xs text-muted-foreground">{e.vendor}</span>}
                        {e.paymentMethod && <span className="text-xs text-muted-foreground capitalize">{e.paymentMethod.replace('_', ' ')}</span>}
                        <span className="text-xs text-muted-foreground">{format(new Date(e.createdAt), 'dd MMM yyyy')}</span>
                      </div>
                      {e.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{e.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">-Rs.{(e.amount ?? 0).toLocaleString()}</span>
                    {e.status === 'pending' && (
                      <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => { setStatusExp(e); setNewStatus('paid'); setStatusMethod('cash'); setStatusDialog(true); }}>
                        <CheckCircle className="h-3 w-3 mr-1" />Mark Paid
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditExp(e)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => printReceipt(e, 'expense')}>
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteExpense(e._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ══ ADD / EDIT EXPENSE DIALOG ════════════════════════════════════ */}
      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingExp ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={expForm.category} onValueChange={v => setExpForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={expForm.status} onValueChange={v => setExpForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2"><Label>Description *</Label><Input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Electricity bill" /></div>
              <div className="space-y-2"><Label>Amount (Rs.) *</Label><Input type="number" min={0} step={0.01} value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Vendor</Label><Input value={expForm.vendor} onChange={e => setExpForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" /></div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={expForm.paymentMethod} onValueChange={v => setExpForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={expForm.dueDate} onChange={e => setExpForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Notes</Label><Input value={expForm.notes} onChange={e => setExpForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." /></div>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={saveExpense} disabled={!expForm.description || !expForm.amount}>
              {editingExp ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ ADD / EDIT INCOME DIALOG ═════════════════════════════════════ */}
      <Dialog open={incDialog} onOpenChange={setIncDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingInc ? 'Edit Income' : 'Record Income'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Source *</Label>
                <Select value={incForm.source} onValueChange={v => setIncForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INCOME_SOURCES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={incForm.paymentMethod} onValueChange={v => setIncForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2"><Label>Description *</Label><Input value={incForm.description} onChange={e => setIncForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Room 101 booking payment" /></div>
              <div className="space-y-2"><Label>Amount (Rs.) *</Label><Input type="number" min={0} step={0.01} value={incForm.amount} onChange={e => setIncForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={incForm.recordedDate} onChange={e => setIncForm(f => ({ ...f, recordedDate: e.target.value }))} /></div>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={saveIncome} disabled={!incForm.description || !incForm.amount}>
              {editingInc ? 'Save Changes' : 'Record Income'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ EXPENSE STATUS DIALOG ════════════════════════════════════════ */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Expense Status</DialogTitle></DialogHeader>
          {statusExp && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-semibold">{statusExp.description}</p>
                <p className="text-muted-foreground">Amount: <span className="font-bold text-red-500">Rs.{(statusExp.amount ?? 0).toLocaleString()}</span></p>
              </div>
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newStatus === 'paid' && (
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={statusMethod} onValueChange={setStatusMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full" onClick={updateExpStatus}>Update Status</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
