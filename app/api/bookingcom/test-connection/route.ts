import { NextRequest, NextResponse } from 'next/server';
import { bookingComService } from '@/lib/bookingComService';

export async function GET() {
  const configured = bookingComService.isConfigured();

  if (!configured) {
    return NextResponse.json({
      success: false,
      configured: false,
      error: 'Missing one or more env vars: BOOKING_COM_API_KEY, BOOKING_COM_API_SECRET, BOOKING_COM_PROPERTY_ID',
    });
  }

  const result = await bookingComService.testConnection();
  return NextResponse.json({
    success: result.success,
    configured: true,
    propertyId: bookingComService.getPropertyId(),
    property: result.data,
    error: result.error,
  }, { status: result.success ? 200 : 400 });
}
