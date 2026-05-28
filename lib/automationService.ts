import axios from 'axios';
import { connectDB } from './mongodb';
import { Notification, AutomationRule, Invoice } from './models/Automation';
import User from './models/User';

const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export class AutomationService {
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    channel: string,
    metadata?: any
  ) {
    try {
      await connectDB();

      const notification = new Notification({
        userId,
        title,
        message,
        type,
        channel,
        metadata,
      });

      await notification.save();

      // Send via channel
      const user = await User.findById(userId);
      if (user) {
        if (channel === 'email' && user.preferences.emailNotifications) {
          await this.sendEmail(user.email, title, message);
        } else if (channel === 'sms' && user.preferences.smsNotifications) {
          await this.sendSMS(user.phone, message);
        } else if (channel === 'whatsapp' && user.preferences.whatsappNotifications) {
          await this.sendWhatsApp(user.phone, message);
        }
      }

      notification.sentAt = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      console.error('[v0] Notification error:', error);
    }
  }

  private async sendEmail(to: string, subject: string, body: string) {
    try {
      console.log(`[v0] Email would be sent to ${to}: ${subject}`);
      // Implement email service (SendGrid, Nodemailer, etc.)
    } catch (error) {
      console.error('[v0] Email send error:', error);
    }
  }

  private async sendSMS(phone: string, message: string) {
    try {
      console.log(`[v0] SMS would be sent to ${phone}: ${message}`);
      // Implement SMS service (Twilio, AWS SNS, etc.)
    } catch (error) {
      console.error('[v0] SMS send error:', error);
    }
  }

  private async sendWhatsApp(phone: string, message: string) {
    try {
      if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_ID) {
        console.log(`[v0] WhatsApp would be sent to ${phone}: ${message}`);
        return;
      }

      const response = await axios.post(
        `https://graph.instagram.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_API_KEY}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('[v0] WhatsApp send error:', error);
    }
  }

  async executeAutomation(triggerEvent: string, data: any) {
    try {
      await connectDB();

      const rules = await AutomationRule.find({
        'trigger.event': triggerEvent,
        isActive: true,
      });

      for (const rule of rules) {
        // Check conditions
        let conditionsMet = true;
        for (const condition of rule.trigger.conditions || []) {
          if (!this.evaluateCondition(condition, data)) {
            conditionsMet = false;
            break;
          }
        }

        if (conditionsMet) {
          // Execute actions
          for (const action of rule.actions || []) {
            if (action.type === 'send_notification') {
              // Send notification
            } else if (action.type === 'send_email') {
              // Send email
            } else if (action.type === 'send_whatsapp') {
              // Send WhatsApp
            } else if (action.type === 'create_invoice') {
              // Create invoice
              await this.createInvoice(data);
            }
          }

          rule.executionHistory.push({
            executedAt: new Date(),
            status: 'success',
            details: data,
          });
          await rule.save();
        }
      }
    } catch (error) {
      console.error('[v0] Automation execution error:', error);
    }
  }

  private evaluateCondition(condition: any, data: any): boolean {
    const fieldValue = data[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'contains':
        return String(fieldValue).includes(condition.value);
      case 'in':
        return condition.value.includes(fieldValue);
      default:
        return true;
    }
  }

  async createInvoice(bookingData: any): Promise<any> {
    try {
      const invoiceNumber = `INV-${Date.now()}`;

      const invoice = new Invoice({
        bookingId: bookingData.bookingId,
        customerId: bookingData.customerId,
        invoiceNumber,
        items: bookingData.items || [],
        subtotal: bookingData.subtotal || 0,
        tax: bookingData.tax || 0,
        discount: bookingData.discount || 0,
        total: bookingData.total || 0,
        status: 'draft',
      });

      await invoice.save();
      return invoice;
    } catch (error) {
      console.error('[v0] Invoice creation error:', error);
    }
  }

  async markNotificationAsRead(notificationId: string) {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );
    return notification;
  }
}
