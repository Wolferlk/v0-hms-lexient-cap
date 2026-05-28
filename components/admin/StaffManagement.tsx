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
import { Plus, Edit2, Trash2, Users, Clock, DollarSign } from 'lucide-react';

export default function StaffManagement() {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'housekeeping',
    position: '',
    joiningDate: '',
    salary: '',
  });

  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    attendanceDate: '',
    status: 'present',
  });

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchPayroll();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/staff/employees');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/staff/attendance');
      const data = await response.json();
      if (data.success) {
        setAttendance(data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchPayroll = async () => {
    try {
      const response = await fetch('/api/staff/payroll');
      const data = await response.json();
      if (data.success) {
        setPayroll(data.data);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    }
  };

  const addEmployee = async () => {
    if (!employeeForm.name || !employeeForm.email || !employeeForm.salary) {
      alert('Please fill required fields');
      return;
    }

    try {
      const response = await fetch('/api/staff/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...employeeForm,
          salary: parseFloat(employeeForm.salary),
          joiningDate: new Date(employeeForm.joiningDate),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmployees([...employees, data.data]);
        setEmployeeForm({
          name: '',
          email: '',
          phone: '',
          department: 'housekeeping',
          position: '',
          joiningDate: '',
          salary: '',
        });
        setShowEmployeeForm(false);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const markAttendance = async () => {
    if (!attendanceForm.employeeId || !attendanceForm.attendanceDate) {
      alert('Please select employee and date');
      return;
    }

    try {
      const response = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceForm),
      });

      const data = await response.json();
      if (data.success) {
        setAttendance([data.data, ...attendance]);
        setAttendanceForm({
          employeeId: '',
          attendanceDate: '',
          status: 'present',
        });
        setShowAttendanceForm(false);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const generatePayroll = async (employeeId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    try {
      const response = await fetch('/api/staff/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          month: currentMonth,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPayroll([data.data, ...payroll]);
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
    }
  };

  const updatePayrollStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/staff/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          paymentDate: status === 'paid' ? new Date() : undefined,
          paymentMethod: status === 'paid' ? 'bank_transfer' : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchPayroll();
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
    }
  };

  return (
    <div className="space-y-6">
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

        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Staff Directory</h3>
            <Button onClick={() => setShowEmployeeForm(!showEmployeeForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>

          {showEmployeeForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Input
                  placeholder="Full Name"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                />
                <Select value={employeeForm.department} onValueChange={(value) => setEmployeeForm({ ...employeeForm, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="front_desk">Front Desk</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Position"
                  value={employeeForm.position}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                />
                <Input
                  placeholder="Joining Date"
                  type="date"
                  value={employeeForm.joiningDate}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, joiningDate: e.target.value })}
                />
                <Input
                  placeholder="Monthly Salary"
                  type="number"
                  value={employeeForm.salary}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
                />
                <div className="flex gap-4">
                  <Button onClick={addEmployee}>Save Employee</Button>
                  <Button variant="outline" onClick={() => setShowEmployeeForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((emp) => (
              <Card key={emp._id}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold">{emp.name}</h4>
                  <p className="text-sm text-muted-foreground">{emp.position}</p>
                  <p className="text-sm text-muted-foreground">{emp.department}</p>
                  <p className="text-sm mt-2">
                    <span className="font-semibold">₹{emp.salary}</span>/month
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        emp.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : emp.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mark Attendance</h3>
            <Button onClick={() => setShowAttendanceForm(!showAttendanceForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </div>

          {showAttendanceForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Select value={attendanceForm.employeeId} onValueChange={(value) => setAttendanceForm({ ...attendanceForm, employeeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Attendance Date"
                  type="date"
                  value={attendanceForm.attendanceDate}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, attendanceDate: e.target.value })}
                />
                <Select value={attendanceForm.status} onValueChange={(value) => setAttendanceForm({ ...attendanceForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-4">
                  <Button onClick={markAttendance}>Mark Attendance</Button>
                  <Button variant="outline" onClick={() => setShowAttendanceForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {attendance.slice(0, 10).map((att) => (
              <Card key={att._id}>
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{att.employeeId?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(att.attendanceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      att.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : att.status === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {att.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <h3 className="text-lg font-semibold">Payroll Management</h3>
          <div className="space-y-2">
            {employees.map((emp) => (
              <Card key={emp._id}>
                <CardContent className="pt-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">₹{emp.salary}/month</p>
                  </div>
                  <Button onClick={() => generatePayroll(emp._id)} size="sm" variant="outline">
                    Generate Payroll
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <h4 className="text-md font-semibold mb-4">Payroll Records</h4>
            <div className="space-y-2">
              {payroll.map((pr) => (
                <Card key={pr._id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{pr.employeeId?.name}</p>
                        <p className="text-sm text-muted-foreground">{pr.month}</p>
                        <p className="text-sm mt-2">
                          <span className="font-semibold">₹{pr.netSalary}</span> (net)
                        </p>
                      </div>
                      <Select
                        value={pr.status}
                        onValueChange={(value) => updatePayrollStatus(pr._id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processed">Processed</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
