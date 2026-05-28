'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import RoomManagement from '@/components/admin/RoomManagement';
import BookingManagement from '@/components/admin/BookingManagement';
import BookingComIntegration from '@/components/admin/BookingComIntegration';
import InventoryManagement from '@/components/admin/InventoryManagement';
import FinancialManagement from '@/components/admin/FinancialManagement';
import WeddingHallManagementAdvanced from '@/components/admin/WeddingHallManagementAdvanced';
import RestaurantManagement from '@/components/admin/RestaurantManagement';
import DayOutManagement from '@/components/admin/DayOutManagement';
import StaffManagement from '@/components/admin/StaffManagement';
import AnalyticsReporting from '@/components/admin/AnalyticsReporting';
import Dashboard from '@/components/admin/Dashboard';
import {
  BarChart3, Home, Calendar, Users, Zap, Package,
  DollarSign, Heart, UtensilsCrossed, Anchor, LineChart,
  Menu, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: BarChart3 },
  { id: 'bookings',   label: 'Bookings',      icon: Calendar },
  { id: 'rooms',      label: 'Rooms',         icon: Home },
  { id: 'restaurant', label: 'Restaurant',    icon: UtensilsCrossed },
  { id: 'wedding',    label: 'Wedding',       icon: Heart },
  { id: 'dayout',     label: 'Day-out',       icon: Anchor },
  { id: 'staff',      label: 'Staff',         icon: Users },
  { id: 'inventory',  label: 'Inventory',     icon: Package },
  { id: 'finance',    label: 'Finance',       icon: DollarSign },
  { id: 'analytics',  label: 'Analytics',     icon: LineChart },
  { id: 'bookingcom', label: 'Booking.com',   icon: Zap },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = NAV_ITEMS.find(n => n.id === activeTab);

  const navigate = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`
            fixed top-0 left-0 z-40 h-full w-56 bg-card border-r border-border pt-16 flex flex-col
            transition-transform duration-200
            lg:static lg:translate-x-0 lg:z-auto lg:pt-0 lg:h-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-3 border-b border-border hidden lg:block">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Admin Panel</p>
            </div>
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                    transition-colors text-left
                    ${activeTab === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile header bar */}
          <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background px-4 py-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-1.5 hover:bg-muted"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="font-semibold">
              {current?.icon && <current.icon className="inline-block h-4 w-4 mr-1.5" />}
              {current?.label}
            </h1>
          </div>

          <div className="p-4 lg:p-6 space-y-4">
            {/* Page title — desktop */}
            <div className="hidden lg:flex items-center gap-3 mb-6">
              {current?.icon && <current.icon className="h-6 w-6 text-muted-foreground" />}
              <h1 className="text-2xl font-bold">{current?.label}</h1>
            </div>

            {activeTab === 'dashboard'  && <Dashboard onNavigate={navigate} />}
            {activeTab === 'rooms'      && <RoomManagement />}
            {activeTab === 'bookings'   && <BookingManagement />}
            {activeTab === 'restaurant' && <RestaurantManagement />}
            {activeTab === 'dayout'     && <DayOutManagement />}
            {activeTab === 'staff'      && <StaffManagement />}
            {activeTab === 'inventory'  && <InventoryManagement />}
            {activeTab === 'finance'    && <FinancialManagement />}
            {activeTab === 'wedding'    && <WeddingHallManagementAdvanced />}
            {activeTab === 'analytics'  && <AnalyticsReporting />}
            {activeTab === 'bookingcom' && <BookingComIntegration />}
          </div>
        </main>
      </div>
    </div>
  );
}
