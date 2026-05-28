import { NextRequest, NextResponse } from 'next/server';
import { HotelChatBot } from '@/lib/chatbotService';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { message, conversationId, bookingContext } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const chatBot = new HotelChatBot(decoded.userId, conversationId);
    
    if (bookingContext) {
      await chatBot.updateBookingContext(bookingContext);
    }

    const response = await chatBot.chat(message);

    return NextResponse.json({
      message: response,
      conversationId: chatBot['conversationId'],
    });
  } catch (error) {
    console.error('[v0] ChatBot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
