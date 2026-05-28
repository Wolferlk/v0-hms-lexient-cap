import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Calendar, Users, Utensils, BarChart3, Wifi, Wind } from 'lucide-react';

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Welcome to Hotel Management System
            </h1>
            <p className="text-balance mt-6 text-lg text-muted-foreground">
              Complete hotel management solution with room booking, inventory management, and financial tracking. Streamline your operations and enhance guest experience.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/booking">
                <Button size="lg" className="w-full sm:w-auto">
                  Book a Room
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">Core Features</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: 'Room Booking',
                description: 'Easy online booking system with real-time availability',
              },
              {
                icon: Users,
                title: 'Guest Management',
                description: 'Manage customer profiles and booking history',
              },
              {
                icon: Utensils,
                title: 'Restaurant',
                description: 'Table reservations and menu management',
              },
              {
                icon: BarChart3,
                title: 'Financial Tracking',
                description: 'Revenue reports, expenses, and profit analysis',
              },
              {
                icon: Wind,
                title: 'Inventory',
                description: 'Food stock and kitchen supplies management',
              },
              {
                icon: Wifi,
                title: 'Booking.com Integration',
                description: 'Sync inventory with Booking.com platform',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-card p-6"
              >
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-muted-foreground">
            Book your room now or access the admin panel to manage your hotel operations.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/booking">
              <Button size="lg">Book Now</Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="lg">
                Login Admin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Hotel Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
