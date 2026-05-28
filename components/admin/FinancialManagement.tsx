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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Expense {
  _id: string;
  category: string;
  description: string;
  amount: number;
  vendor?: string;
  status: string;
  createdAt: string;
}

interface Income {
  _id: string;
  source: string;
  amount: number;
  description: string;
  recordedDate: string;
}

export default function FinancialManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'expense' | 'income'>('expense');
  const [period, setPeriod] = useState('monthly');

  const [expenseForm, setExpenseForm] = useState({
    category: 'utilities',
    description: '',
    amount: 0,
    vendor: '',
    paymentMethod: 'cash',
    status: 'pending',
  });

  const [incomeForm, setIncomeForm] = useState({
    source: 'booking',
    amount: 0,
    description: '',
    paymentMethod: 'cash',
  });

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [expenseRes, incomeRes, summaryRes] = await Promise.all([
        fetch('/api/finance/expenses'),
        fetch('/api/finance/income'),
        fetch(`/api/finance/income?period=${period}`),
      ]);

      const [expenseData, incomeData, summaryData] = await Promise.all([
        expenseRes.json(),
        incomeRes.json(),
        summaryRes.json(),
      ]);

      if (expenseData.success) setExpenses(expenseData.data);
      if (incomeData.success) setIncome(incomeData.data);
      if (summaryData.success) setSummary(summaryData.summary);
    } catch (error) {
      console.error('[v0] Fetch financial data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseForm.description || !expenseForm.amount) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const response = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          createdBy: 'admin_user_id', // Would be actual user ID
        }),
      });

      if (response.ok) {
        fetchFinancialData();
        setIsDialogOpen(false);
        setExpenseForm({
          category: 'utilities',
          description: '',
          amount: 0,
          vendor: '',
          paymentMethod: 'cash',
          status: 'pending',
        });
      }
    } catch (error) {
      console.error('[v0] Add expense error:', error);
      alert('Error adding expense');
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!incomeForm.amount || !incomeForm.description) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const response = await fetch('/api/finance/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...incomeForm,
          recordedBy: 'admin_user_id', // Would be actual user ID
        }),
      });

      if (response.ok) {
        fetchFinancialData();
        setIsDialogOpen(false);
        setIncomeForm({
          source: 'booking',
          amount: 0,
          description: '',
          paymentMethod: 'cash',
        });
      }
    } catch (error) {
      console.error('[v0] Add income error:', error);
      alert('Error adding income');
    }
  };

  const profitMargin = summary.totalIncome > 0 
    ? ((summary.netProfit / summary.totalIncome) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{summary.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{summary.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{summary.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Profit Margin: {profitMargin}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period and Add Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">
            Track income and expenses
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Dialog
            open={isDialogOpen && dialogType === 'expense'}
            onOpenChange={() => {
              if (!isDialogOpen) setDialogType('expense');
              setIsDialogOpen(!isDialogOpen);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setDialogType('expense')}
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) =>
                      setExpenseForm({ ...expenseForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="e.g., Electricity bill"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        amount: parseFloat(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Vendor</label>
                  <Input
                    value={expenseForm.vendor}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, vendor: e.target.value })
                    }
                    placeholder="Vendor name"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isDialogOpen && dialogType === 'income'}
            onOpenChange={() => {
              if (!isDialogOpen) setDialogType('income');
              setIsDialogOpen(!isDialogOpen);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => setDialogType('income')}
              >
                <Plus className="h-4 w-4" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Income</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddIncome} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Source</label>
                  <Select
                    value={incomeForm.source}
                    onValueChange={(value) =>
                      setIncomeForm({ ...incomeForm, source: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="wedding_hall">Wedding Hall</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={incomeForm.amount}
                    onChange={(e) =>
                      setIncomeForm({
                        ...incomeForm,
                        amount: parseFloat(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={incomeForm.description}
                    onChange={(e) =>
                      setIncomeForm({
                        ...incomeForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="e.g., Room booking payment"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Income
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs for Income and Expenses */}
      <Tabs defaultValue="income" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : income.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No income records yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Source</th>
                        <th className="text-left py-3 px-2">Description</th>
                        <th className="text-right py-3 px-2">Amount</th>
                        <th className="text-left py-3 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {income.map((item) => (
                        <tr key={item._id} className="border-b">
                          <td className="py-3 px-2 capitalize">{item.source}</td>
                          <td className="py-3 px-2">{item.description}</td>
                          <td className="py-3 px-2 text-right font-semibold text-green-600">
                            ₹{item.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {new Date(item.recordedDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expense Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : expenses.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No expense records yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Category</th>
                        <th className="text-left py-3 px-2">Description</th>
                        <th className="text-right py-3 px-2">Amount</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-left py-3 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((item) => (
                        <tr key={item._id} className="border-b">
                          <td className="py-3 px-2 capitalize">{item.category}</td>
                          <td className="py-3 px-2">{item.description}</td>
                          <td className="py-3 px-2 text-right font-semibold text-red-600">
                            ₹{item.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                              item.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
