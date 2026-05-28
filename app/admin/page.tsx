'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Home,
  Calendar,
  Users,
  Zap,
  Package,
  DollarSign,
  Heart,
  UtensilsCrossed,
  Anchor,
} from 'lucide-react';
import RoomManagement from '@/components/admin/RoomManagement';
import BookingManagement from '@/components/admin/BookingManagement';
import BookingComIntegration from '@/components/admin/BookingComIntegration';
import InventoryManagement from '@/components/admin/InventoryManagement';
import FinancialManagement from '@/components/admin/FinancialManagement';
import WeddingHallManagement from '@/components/admin/WeddingHallManagement';
import RestaurantManagement from '@/components/admin/RestaurantManagement';
import DayOutManagement from '@/components/admin/DayOutManagement';
import StaffManagement from '@/components/admin/StaffManagement';
import Dashboard from '@/components/admin/Dashboard';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 gap-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Rooms</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="flex items-center gap-1">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Restaurant</span>
            </TabsTrigger>
            <TabsTrigger value="dayout" className="flex items-center gap-1">
              <Anchor className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Day-out</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline text-xs">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline text-xs">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="wedding" className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span className="hidden md:inline text-xs">Wedding</span>
            </TabsTrigger>
            <TabsTrigger value="bookingcom" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span className="hidden lg:inline text-xs">Booking.com</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline text-xs">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            <RoomManagement />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="restaurant" className="space-y-6">
            <RestaurantManagement />
          </TabsContent>

          <TabsContent value="dayout" className="space-y-6">
            <DayOutManagement />
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <StaffManagement />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryManagement />
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <FinancialManagement />
          </TabsContent>

          <TabsContent value="wedding" className="space-y-6">
            <WeddingHallManagement />
          </TabsContent>

          <TabsContent value="bookingcom" className="space-y-6">
            <BookingComIntegration />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Statistics and reports will be available here in the next phase.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
