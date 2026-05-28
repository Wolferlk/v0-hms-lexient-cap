import axios from 'axios';
import { connectDB } from './mongodb';
import { ChatConversation, ChatFeedback } from './models/ChatBot';
import { Room } from './models/Room';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class HotelChatBot {
  private conversationId: string;
  private userId: string;
  private messages: ChatMessage[] = [];
  private bookingContext: any = {};

  constructor(userId: string, conversationId?: string) {
    this.userId = userId;
    this.conversationId = conversationId || '';
  }

  async initializeConversation() {
    await connectDB();

    if (!this.conversationId) {
      const conversation = new ChatConversation({
        userId: this.userId,
        messages: [],
        status: 'active',
      });
      await conversation.save();
      this.conversationId = conversation._id.toString();
    } else {
      const conversation = await ChatConversation.findById(this.conversationId);
      if (conversation) {
        this.messages = conversation.messages;
        this.bookingContext = conversation.bookingContext || {};
      }
    }
  }

  async chat(userMessage: string): Promise<string> {
    try {
      await this.initializeConversation();

      this.messages.push({
        role: 'user',
        content: userMessage,
      });

      const systemPrompt = this.buildSystemPrompt();
      const response = await this.callGroqAPI(systemPrompt);

      const assistantMessage = response.choices[0].message.content;

      this.messages.push({
        role: 'assistant',
        content: assistantMessage,
      });

      await this.saveConversation(userMessage, assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('[v0] ChatBot error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  private buildSystemPrompt(): string {
    return `You are a helpful hotel booking assistant for a luxury resort. You help customers with:
1. Room bookings and availability queries
2. Restaurant reservations and menu information
3. Wedding hall event planning
4. Day-out packages and boat ride bookings
5. General hotel information and amenities

Current booking context:
- Check-in: ${this.bookingContext.checkInDate || 'Not specified'}
- Check-out: ${this.bookingContext.checkOutDate || 'Not specified'}
- Guests: ${this.bookingContext.guests || 'Not specified'}
- Rooms: ${this.bookingContext.rooms || 'Not specified'}

Be friendly, professional, and guide customers through the booking process. If you need specific information not available in context, ask clarifying questions.`;
  }

  private async callGroqAPI(systemPrompt: string): Promise<any> {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...this.messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    return response.data;
  }

  private async saveConversation(userMessage: string, assistantMessage: string) {
    const conversation = await ChatConversation.findById(this.conversationId);
    if (conversation) {
      conversation.messages.push({
        role: 'user',
        content: userMessage,
      } as any);
      conversation.messages.push({
        role: 'assistant',
        content: assistantMessage,
      } as any);
      conversation.lastMessage = new Date();
      await conversation.save();
    }
  }

  async updateBookingContext(context: any) {
    this.bookingContext = { ...this.bookingContext, ...context };
    const conversation = await ChatConversation.findById(this.conversationId);
    if (conversation) {
      conversation.bookingContext = this.bookingContext;
      await conversation.save();
    }
  }

  async closeConversation(status: 'completed' | 'closed') {
    const conversation = await ChatConversation.findById(this.conversationId);
    if (conversation) {
      conversation.status = status;
      await conversation.save();
    }
  }

  async saveFeedback(rating: number, comment?: string, helpful?: boolean) {
    const feedback = new ChatFeedback({
      conversationId: this.conversationId,
      userId: this.userId,
      rating,
      comment,
      helpful,
    });
    await feedback.save();
  }
}
