import mongoose from 'mongoose';

const ChatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant'],
        },
        content: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bookingContext: {
      checkInDate: Date,
      checkOutDate: Date,
      guests: Number,
      rooms: Number,
      selectedRooms: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Room',
        },
      ],
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'completed'],
      default: 'active',
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    lastMessage: Date,
  },
  {
    timestamps: true,
  }
);

const FeedbackSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    helpful: Boolean,
  },
  {
    timestamps: true,
  }
);

export const ChatConversation =
  mongoose.models.ChatConversation || mongoose.model('ChatConversation', ChatConversationSchema);

export const ChatFeedback =
  mongoose.models.ChatFeedback || mongoose.model('ChatFeedback', FeedbackSchema);

export default ChatConversation;
