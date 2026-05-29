'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  DollarSign,
  Search,
  RefreshCw,
  Printer,
  CheckCircle,
  UserCheck,
  TrendingUp,
  Calendar,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joiningDate: string;
  salary: number;
  employmentType: string;
  address: string;
  emergencyContact: string;
  bankDetails: string;
  status: string;
}

interface Attendance {
  _id: string;
  employeeId: { _id: string; name: string } | null;
  attendanceDate: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  checkInTime: string;
  checkOutTime: string;
  remarks: string;
}

interface Payroll {
  _id: string;
  employeeId: { _id: string; name: string; salary: number } | null;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate: string;
  paymentMethod: string;
}

const DEPARTMENTS = [
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'management', label: 'Management' },
  { value: 'boat_rides', label: 'Boat Rides' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'accounts', label: 'Accounts' },
];

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function deptLabel(val: string) {
  return DEPARTMENTS.find((d) => d.value === val)?.label ?? val;
}

// ── Status Badges ─────────────────────────────────────────────────────────────

function EmployeeStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'bg-green-100 text-green-700'
      : status === 'inactive'
      ? 'bg-gray-100 text-gray-600'
      : 'bg-red-100 text-red-700';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function AttendanceStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'present'
      ? 'bg-green-100 text-green-700'
      : status === 'absent'
      ? 'bg-red-100 text-red-700'
      : status === 'half_day'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-blue-100 text-blue-700';
  const label =
    status === 'half_day' ? 'Half Day' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function PayrollStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'paid'
      ? 'bg-green-100 text-green-700'
      : status === 'processed'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StaffManagement() {
  const [activeTab, setActiveTab] = useState('employees');

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);

  // Filters — Employees
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('all');
  const [empStatusFilter, setEmpStatusFilter] = useState('all');

  // Filters — Attendance
  const [attMonthFilter, setAttMonthFilter] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [attEmpFilter, setAttEmpFilter] = useState('all');
  const [attStatusFilter, setAttStatusFilter] = useState('all');

  // Filters — Payroll
  const [payrollMonth, setPayrollMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Employee dialog
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const defaultEmpForm = {
    name: '', email: '', phone: '', department: 'front_desk', position: '',
    joiningDate: '', salary: '', employmentType: 'full_time', address: '',
    emergencyContact: '', bankDetails: '', status: 'active',
  };
  const [empForm, setEmpForm] = useState<Record<string, string>>(defaultEmpForm);

  // Attendance dialog
  const [attDialogOpen, setAttDialogOpen] = useState(false);
  const defaultAttForm = {
    employeeId: '', attendanceDate: new Date().toISOString().slice(0, 10),
    status: 'present', checkInTime: '', checkOutTime: '', remarks: '',
  };
  const [attForm, setAttForm] = useState<Record<string, string>>(defaultAttForm);

  // Payroll dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const defaultPayForm = {
    employeeId: '', month: new Date().toISOString().slice(0, 7),
    allowances: '0', deductions: '0',
  };
  const [payForm, setPayForm] = useState<Record<string, string>>(defaultPayForm);

  // Payment method dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Payroll | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/employees');
      const data = await res.json();
      if (data.success) setEmployees(data.data ?? []);
    } catch {
      toast.error('Failed to load employees');
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/attendance');
      const data = await res.json();
      if (data.success) setAttendance(data.data ?? []);
    } catch {
      toast.error('Failed to load attendance');
    }
  }, []);

  const fetchPayroll = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/payroll');
      const data = await res.json();
      if (data.success) setPayroll(data.data ?? []);
    } catch {
      toast.error('Failed to load payroll');
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchPayroll();
  }, [fetchEmployees, fetchAttendance, fetchPayroll]);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const presentToday = attendance.filter(
    (a) => a.attendanceDate?.slice(0, 10) === todayStr && a.status === 'present'
  ).length;
  const monthlyPayrollTotal = employees
    .filter((e) => e.status === 'active')
    .reduce((sum, e) => sum + (e.salary ?? 0), 0);

  // ── Derived lists ─────────────────────────────────────────────────────────────

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase());
    const matchDept = empDeptFilter === 'all' || e.department === empDeptFilter;
    const matchStatus = empStatusFilter === 'all' || e.status === empStatusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const filteredAttendance = attendance.filter((a) => {
    const matchMonth = !attMonthFilter || a.attendanceDate?.slice(0, 7) === attMonthFilter;
    const matchEmp =
      attEmpFilter === 'all' || a.employeeId?._id === attEmpFilter;
    const matchStatus = attStatusFilter === 'all' || a.status === attStatusFilter;
    return matchMonth && matchEmp && matchStatus;
  });

  const attStats = {
    present: filteredAttendance.filter((a) => a.status === 'present').length,
    absent: filteredAttendance.filter((a) => a.status === 'absent').length,
    half_day: filteredAttendance.filter((a) => a.status === 'half_day').length,
    leave: filteredAttendance.filter((a) => a.status === 'leave').length,
  };

  const filteredPayroll = payroll.filter(
    (p) => !payrollMonth || p.month === payrollMonth
  );
  const pendingTotal = filteredPayroll
    .filter((p) => p.status === 'pending' || p.status === 'processed')
    .reduce((s, p) => s + (p.netSalary ?? 0), 0);
  const paidTotal = filteredPayroll
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (p.netSalary ?? 0), 0);

  // Calculated net for payroll form preview
  const previewEmployee = employees.find((e) => e._id === payForm.employeeId);
  const previewNet =
    (previewEmployee?.salary ?? 0) +
    (parseFloat(payForm.allowances) || 0) -
    (parseFloat(payForm.deductions) || 0);

  // ── Employee CRUD ─────────────────────────────────────────────────────────────

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmpForm(defaultEmpForm);
    setEmpDialogOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone ?? '',
      department: emp.department,
      position: emp.position,
      joiningDate: emp.joiningDate?.slice(0, 10) ?? '',
      salary: String(emp.salary ?? ''),
      employmentType: emp.employmentType ?? 'full_time',
      address: emp.address ?? '',
      emergencyContact: emp.emergencyContact ?? '',
      bankDetails: emp.bankDetails ?? '',
      status: emp.status ?? 'active',
    });
    setEmpDialogOpen(true);
  };

  const saveEmployee = async () => {
    if (!empForm.name || !empForm.email || !empForm.salary) {
      toast.error('Name, email, and salary are required');
      return;
    }
    // Ensure server-required fields have reasonable defaults and
    // map frontend employmentType (e.g. 'full_time') to model expected ('full-time')
    const payload = {
      ...empForm,
      phone: empForm.phone || 'N/A',
      position: empForm.position || 'Staff',
      salary: parseFloat(empForm.salary),
      joiningDate: new Date(empForm.joiningDate || new Date().toISOString().slice(0, 10)),
      employmentType: (empForm.employmentType || 'full_time').replace('_', '-'),
    };
    try {
      if (editingEmployee) {
        const res = await fetch('/api/staff/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEmployee._id, ...payload }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message ?? 'Update failed');
        toast.success('Employee updated successfully');
      } else {
        const res = await fetch('/api/staff/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message ?? 'Create failed');
        toast.success('Employee added successfully');
      }
      setEmpDialogOpen(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save employee');
    }
  };

  const deleteEmployee = async (emp: Employee) => {
    if (!confirm(`Remove ${emp.name} from the system?`)) return;
    try {
      const res = await fetch(`/api/staff/employees?id=${emp._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success('Employee removed');
          fetchEmployees();
          return;
        }
      }
      // Fallback: mark as terminated
      const res2 = await fetch('/api/staff/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp._id, status: 'terminated' }),
      });
      const data2 = await res2.json();
      if (!data2.success) throw new Error(data2.message ?? 'Failed');
      toast.success('Employee marked as terminated');
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to remove employee');
    }
  };

  // ── Attendance CRUD ───────────────────────────────────────────────────────────

  const openMarkAttendance = () => {
    setAttForm(defaultAttForm);
    setAttDialogOpen(true);
  };

  const submitAttendance = async () => {
    if (!attForm.employeeId || !attForm.attendanceDate) {
      toast.error('Employee and date are required');
      return;
    }
    try {
      // Normalize time-only inputs (HH:MM) into ISO datetimes so server can parse them reliably
      const payload: Record<string, any> = {
        employeeId: attForm.employeeId,
        attendanceDate: attForm.attendanceDate,
        status: attForm.status,
        remarks: attForm.remarks,
      };
      if (attForm.checkInTime) payload.checkInTime = `${attForm.attendanceDate}T${attForm.checkInTime}:00`;
      if (attForm.checkOutTime) payload.checkOutTime = `${attForm.attendanceDate}T${attForm.checkOutTime}:00`;

      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? 'Failed');
      toast.success('Attendance marked');
      setAttDialogOpen(false);
      fetchAttendance();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to mark attendance');
    }
  };

  // ── Payroll ───────────────────────────────────────────────────────────────────

  const openGeneratePayroll = () => {
    setPayForm(defaultPayForm);
    setPayDialogOpen(true);
  };

  const submitPayroll = async () => {
    if (!payForm.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    try {
      const res = await fetch('/api/staff/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: payForm.employeeId,
          month: payForm.month,
          allowances: parseFloat(payForm.allowances) || 0,
          deductions: parseFloat(payForm.deductions) || 0,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? 'Failed');
      toast.success('Payroll generated');
      setPayDialogOpen(false);
      fetchPayroll();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to generate payroll');
    }
  };

  const advancePayrollStatus = (pr: Payroll) => {
    if (pr.status === 'pending') {
      updatePayrollStatus(pr._id, 'processed', undefined, undefined);
    } else if (pr.status === 'processed') {
      setPaymentTarget(pr);
      setPaymentMethod('bank_transfer');
      setPaymentDialogOpen(true);
    }
  };

  const confirmPayment = async () => {
    if (!paymentTarget) return;
    await updatePayrollStatus(
      paymentTarget._id,
      'paid',
      new Date().toISOString(),
      paymentMethod
    );
    setPaymentDialogOpen(false);
    setPaymentTarget(null);
  };

  const updatePayrollStatus = async (
    id: string,
    status: string,
    paymentDate?: string,
    paymentMethodVal?: string
  ) => {
    try {
      const body: Record<string, any> = { id, status };
      if (paymentDate) body.paymentDate = paymentDate;
      if (paymentMethodVal) body.paymentMethod = paymentMethodVal;
      const res = await fetch('/api/staff/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? 'Failed');
      toast.success(`Payroll status updated to ${status}`);
      fetchPayroll();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update payroll');
    }
  };

  // ── Print Payslip ──────────────────────────────────────────────────────────────

  const printPayslip = (pr: Payroll) => {
    const empName = pr.employeeId?.name ?? 'Employee';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${empName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 24px; color: #1a1a2e; }
            .header p { margin: 4px 0; color: #666; }
            .section { margin-bottom: 20px; }
            .section h3 { font-size: 14px; text-transform: uppercase; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 12px; }
            .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
            .net { font-size: 16px; font-weight: bold; color: #1a1a2e; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lexient Hotel</h1>
            <p>Employee Payslip</p>
            <p>Month: ${pr.month}</p>
          </div>
          <div class="section">
            <h3>Employee Details</h3>
            <div class="row"><span>Name</span><span>${empName}</span></div>
            <div class="row"><span>Status</span><span>${pr.status}</span></div>
            ${pr.paymentDate ? `<div class="row"><span>Payment Date</span><span>${pr.paymentDate?.slice(0,10)}</span></div>` : ''}
            ${pr.paymentMethod ? `<div class="row"><span>Payment Method</span><span>${pr.paymentMethod}</span></div>` : ''}
          </div>
          <div class="section">
            <h3>Earnings & Deductions</h3>
            <div class="row"><span>Basic Salary</span><span>LKR ${(pr.basicSalary ?? pr.employeeId?.salary ?? 0).toLocaleString()}</span></div>
            <div class="row"><span>Allowances</span><span>+ LKR ${(pr.allowances ?? 0).toLocaleString()}</span></div>
            <div class="row"><span>Deductions</span><span>- LKR ${(pr.deductions ?? 0).toLocaleString()}</span></div>
            <div class="row net"><span>Net Salary</span><span>LKR ${(pr.netSalary ?? 0).toLocaleString()}</span></div>
          </div>
          <div class="footer">This is a system-generated payslip. — Lexient Hotel HR Department</div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Staff</p>
            <p className="text-2xl font-bold">{activeEmployees}</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <div className="rounded-full bg-orange-100 p-2">
            <CheckCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Present Today</p>
            <p className="text-2xl font-bold">{presentToday}</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Payroll</p>
            <p className="text-xl font-bold">LKR {monthlyPayrollTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payroll
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Employees ──────────────────────────────────────────────── */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Staff Directory</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchEmployees}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={openAddEmployee}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name…"
                className="pl-9"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
              />
            </div>
            <Select value={empDeptFilter} onValueChange={setEmpDeptFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={empStatusFilter} onValueChange={setEmpStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Cards */}
          {filteredEmployees.length === 0 ? (
            <div className="rounded-lg border p-10 text-center text-muted-foreground">
              No employees found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((emp) => (
                <div key={emp._id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <p className="font-semibold leading-none">{emp.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {emp.position || '—'}
                        </p>
                      </div>
                    </div>
                    <EmployeeStatusBadge status={emp.status ?? 'active'} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {deptLabel(emp.department)}
                    </span>
                    {emp.employmentType && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                        {emp.employmentType.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {emp.joiningDate
                        ? format(new Date(emp.joiningDate), 'dd MMM yyyy')
                        : '—'}
                    </span>
                    <span className="font-semibold text-green-700">
                      LKR {(emp.salary ?? 0).toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditEmployee(emp)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteEmployee(emp)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2: Attendance ──────────────────────────────────────────────── */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Attendance Tracker</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAttendance}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={openMarkAttendance}>
                <Plus className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Present', count: attStats.present, cls: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'Absent', count: attStats.absent, cls: 'bg-red-50 border-red-200 text-red-700' },
              { label: 'Half Day', count: attStats.half_day, cls: 'bg-orange-50 border-orange-200 text-orange-700' },
              { label: 'Leave', count: attStats.leave, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg border p-3 text-center ${s.cls}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="month"
              value={attMonthFilter}
              onChange={(e) => setAttMonthFilter(e.target.value)}
              className="w-44"
            />
            <Select value={attEmpFilter} onValueChange={setAttEmpFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={attStatusFilter} onValueChange={setAttStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attendance Table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Employee</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Check In</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Check Out</th>
                  <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((att) => (
                    <tr key={att._id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 font-medium">
                        {att.employeeId?.name ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {att.attendanceDate
                          ? format(new Date(att.attendanceDate), 'dd MMM yyyy')
                          : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <AttendanceStatusBadge status={att.status} />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">
                        {att.checkInTime || '—'}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">
                        {att.checkOutTime || '—'}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">
                        {att.remarks || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Tab 3: Payroll ────────────────────────────────────────────────── */}
        <TabsContent value="payroll" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Payroll Management</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchPayroll}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={openGeneratePayroll}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Payroll
              </Button>
            </div>
          </div>

          {/* Payroll summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 bg-yellow-50 border-yellow-200">
              <p className="text-xs text-yellow-700 font-medium">Pending / Processing</p>
              <p className="text-xl font-bold text-yellow-800 mt-1">
                LKR {pendingTotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-green-50 border-green-200">
              <p className="text-xs text-green-700 font-medium">Paid This Month</p>
              <p className="text-xl font-bold text-green-800 mt-1">
                LKR {paidTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Month filter */}
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium whitespace-nowrap">Month</Label>
            <Input
              type="month"
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              className="w-44"
            />
          </div>

          {/* Payroll table */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Employee</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Month</th>
                  <th className="text-right px-4 py-2 font-medium hidden md:table-cell">Basic</th>
                  <th className="text-right px-4 py-2 font-medium hidden md:table-cell">Allow.</th>
                  <th className="text-right px-4 py-2 font-medium hidden md:table-cell">Deduct.</th>
                  <th className="text-right px-4 py-2 font-medium">Net Salary</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayroll.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payroll records for this month.
                    </td>
                  </tr>
                ) : (
                  filteredPayroll.map((pr) => (
                    <tr key={pr._id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 font-medium">{pr.employeeId?.name ?? '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">{pr.month}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground hidden md:table-cell">
                        {(pr.basicSalary ?? pr.employeeId?.salary ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-green-600 hidden md:table-cell">
                        +{(pr.allowances ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-red-500 hidden md:table-cell">
                        -{(pr.deductions ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-bold">
                        LKR {(pr.netSalary ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <PayrollStatusBadge status={pr.status} />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          {pr.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2"
                              onClick={() => advancePayrollStatus(pr)}
                            >
                              {pr.status === 'pending' ? 'Process' : 'Mark Paid'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => printPayslip(pr)}
                            title="Print Payslip"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Add / Edit Employee ─────────────────────────────────────── */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Full Name *</Label>
                <Input
                  placeholder="John Perera"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input
                  placeholder="john@example.com"
                  type="email"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  placeholder="+94 77 000 0000"
                  value={empForm.phone}
                  onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Position</Label>
                <Input
                  placeholder="Senior Receptionist"
                  value={empForm.position}
                  onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Department</Label>
                <Select
                  value={empForm.department}
                  onValueChange={(v) => setEmpForm({ ...empForm, department: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Employment Type</Label>
                <Select
                  value={empForm.employmentType}
                  onValueChange={(v) => setEmpForm({ ...empForm, employmentType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Monthly Salary (LKR) *</Label>
                <Input
                  type="number"
                  placeholder="85000"
                  value={empForm.salary}
                  onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Joining Date</Label>
                <Input
                  type="date"
                  value={empForm.joiningDate}
                  onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input
                placeholder="123 Main St, Colombo"
                value={empForm.address}
                onChange={(e) => setEmpForm({ ...empForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Emergency Contact</Label>
                <Input
                  placeholder="+94 71 000 0000"
                  value={empForm.emergencyContact}
                  onChange={(e) => setEmpForm({ ...empForm, emergencyContact: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Bank Details</Label>
                <Input
                  placeholder="BOC — 123456789"
                  value={empForm.bankDetails}
                  onChange={(e) => setEmpForm({ ...empForm, bankDetails: e.target.value })}
                />
              </div>
            </div>
            {editingEmployee && (
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={empForm.status}
                  onValueChange={(v) => setEmpForm({ ...empForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEmpDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEmployee}>
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Mark Attendance ─────────────────────────────────────────── */}
      <Dialog open={attDialogOpen} onOpenChange={setAttDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select
                value={attForm.employeeId}
                onValueChange={(v) => setAttForm({ ...attForm, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.status === 'active')
                    .map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={attForm.attendanceDate}
                  onChange={(e) => setAttForm({ ...attForm, attendanceDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Status *</Label>
                <Select
                  value={attForm.status}
                  onValueChange={(v) => setAttForm({ ...attForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Check In Time</Label>
                <Input
                  type="time"
                  value={attForm.checkInTime}
                  onChange={(e) => setAttForm({ ...attForm, checkInTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Check Out Time</Label>
                <Input
                  type="time"
                  value={attForm.checkOutTime}
                  onChange={(e) => setAttForm({ ...attForm, checkOutTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Input
                placeholder="Optional remarks…"
                value={attForm.remarks}
                onChange={(e) => setAttForm({ ...attForm, remarks: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAttDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitAttendance}>Save Attendance</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Generate Payroll ────────────────────────────────────────── */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select
                value={payForm.employeeId}
                onValueChange={(v) => setPayForm({ ...payForm, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.status === 'active')
                    .map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.name} — LKR {(emp.salary ?? 0).toLocaleString()}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Month</Label>
              <Input
                type="month"
                value={payForm.month}
                onChange={(e) => setPayForm({ ...payForm, month: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Allowances (LKR)</Label>
                <Input
                  type="number"
                  min="0"
                  value={payForm.allowances}
                  onChange={(e) => setPayForm({ ...payForm, allowances: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Deductions (LKR)</Label>
                <Input
                  type="number"
                  min="0"
                  value={payForm.deductions}
                  onChange={(e) => setPayForm({ ...payForm, deductions: e.target.value })}
                />
              </div>
            </div>
            {payForm.employeeId && (
              <div className="rounded-lg border p-3 bg-muted/40 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Basic Salary</span>
                  <span>LKR {(previewEmployee?.salary ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Allowances</span>
                  <span>+ LKR {(parseFloat(payForm.allowances) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Deductions</span>
                  <span>- LKR {(parseFloat(payForm.deductions) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>Net Salary</span>
                  <span>LKR {previewNet.toLocaleString()}</span>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitPayroll}>Generate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Payment Method ──────────────────────────────────────────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Mark payroll for{' '}
              <span className="font-semibold text-foreground">
                {paymentTarget?.employeeId?.name}
              </span>{' '}
              as <strong>Paid</strong>?
            </p>
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmPayment}>Confirm Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
