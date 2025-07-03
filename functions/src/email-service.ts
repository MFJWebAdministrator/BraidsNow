import * as sgMail from '@sendgrid/mail';
import { defineString } from 'firebase-functions/params';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeClientData {
  clientName: string;
  clientEmail: string;
}

export interface WelcomeStylistData {
  stylistName: string;
  stylistEmail: string;
}

export interface AppointmentConfirmationData {
  clientName: string;
  clientEmail: string;
  stylistName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
}

export interface StylistAppointmentData {
  stylistName: string;
  stylistEmail: string;
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
}

export interface PaymentFailureData {
  stylistName: string;
  stylistEmail: string;
}

export interface AccountCancellationData {
  stylistName: string;
  stylistEmail: string;
}

export interface AppointmentDeniedData {
  clientName: string;
  clientEmail: string;
  stylistName: string;
}

export interface FullPaymentReminderData {
  clientName: string;
  clientEmail: string;
  stylistName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  balanceAmount: string;
}

export interface MessageNotificationData {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  userType: 'client' | 'stylist';
}

export class EmailService {
  private static readonly FROM_EMAIL = 'noreply@braidsnow.com';
  private static readonly FROM_NAME = 'BraidsNow.com Team';

  private static async sendEmail(emailData: EmailData): Promise<void> {
    try {
      const msg = {
        to: emailData.to,
        from: {
          email: EmailService.FROM_EMAIL,
          name: EmailService.FROM_NAME
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.stripHtml(emailData.html)
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${emailData.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // 1. Welcome Email – Clients
  static async sendWelcomeClientEmail(data: WelcomeClientData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to BraidsNow.com!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3F0052, #DFA801); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3F0052; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to BraidsNow.com!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.clientName},</p>
            
            <p>Welcome to BraidsNow.com! 🎉 You're now part of a growing community that connects you with top stylists ready to help you look your best.</p>
            
            <p>You can start browsing and booking appointments anytime.</p>
            
            <div style="text-align: center;">
              <a href="https://braidsnow.com/find-stylists" class="button">👉 Book Your First Appointment</a>
            </div>
            
            <p>Thank you for choosing BraidsNow.com. We're excited to have you here!</p>
            
            <p><strong>Peace & Blessings!</strong><br>
            The BraidsNow.com Team</p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.clientEmail,
      subject: 'Welcome to BraidsNow.com!',
      html
    });
  }

  // 2. Welcome Email – Stylists
  static async sendWelcomeStylistEmail(data: WelcomeStylistData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to BraidsNow.com!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3F0052, #DFA801); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3F0052; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          .steps { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to BraidsNow.com!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.stylistName},</p>
            
            <p>Welcome to BraidsNow.com! 🎉 We're excited to help you showcase your skills and grow your clientele.</p>
            
            <div class="steps">
              <h3>Here's what to do next:</h3>
              <ol>
                <li><strong>Set up your Stripe Payout Account.</strong><br>
                Go to Dashboard → Payments Tab → Manage Payout Settings</li>
                <li><strong>Add your services and pricing.</strong></li>
                <li><strong>Set your availability schedule.</strong></li>
              </ol>
            </div>
            
            <div style="text-align: center;">
              <a href="https://braidsnow.com/dashboard/stylist" class="button">👉 Set Up My Account</a>
            </div>
            
            <p>Thank you for trusting BraidsNow.com to support your business!</p>
            
            <p><strong>Peace & Blessings!</strong><br>
            The BraidsNow.com Team</p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.stylistEmail,
      subject: 'Welcome to BraidsNow.com!',
      html
    });
  }

  // 3. Appointment Confirmation – Client
  static async sendAppointmentConfirmationClient(data: AppointmentConfirmationData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Appointment is Confirmed!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3F0052, #DFA801); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Your Appointment is Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.clientName},</p>
            
            <p>Your appointment has been confirmed.</p>
            
            <div class="appointment-details">
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Stylist:</strong> ${data.stylistName}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
            </div>
            
            <p>We look forward to seeing you!</p>
            
            <p>Thank you,<br>
            <strong>BraidsNow.com Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.clientEmail,
      subject: 'Your Appointment is Confirmed!',
      html
    });
  }

  // 4. Appointment Confirmation – Stylist
  static async sendAppointmentConfirmationStylist(data: StylistAppointmentData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Appointment Booked!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3F0052, #DFA801); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Appointment Booked!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.stylistName},</p>
            
            <p>You have a new appointment booked.</p>
            
            <div class="appointment-details">
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
              <p><strong>Client:</strong> ${data.clientName}</p>
            </div>
            
            <p>Please check your calendar for full details.</p>
            
            <p>Thank you,<br>
            <strong>BraidsNow.com Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.stylistEmail,
      subject: 'New Appointment Booked!',
      html
    });
  }

  // 5. Payment Failure – Stylist
  static async sendPaymentFailureStylist(data: PaymentFailureData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed - Action Needed!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff4444, #cc0000); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3F0052; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Payment Failed - Action Needed!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.stylistName},</p>
            
            <p>We were unable to process your subscription payment for BraidsNow.com</p>
            
            <p>Please update your payment information to keep your account active and continue booking clients.</p>
            
            <div style="text-align: center;">
              <a href="https://braidsnow.com/dashboard/stylist/payments" class="button">👉 Update Payment Info</a>
            </div>
            
            <div class="warning">
              <p><strong>Important:</strong> If payment is not completed, your access to stylist features may be paused.</p>
            </div>
            
            <p>Thank you,<br>
            <strong>BraidsNow.com Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.stylistEmail,
      subject: 'Your BraidsNow.com Payment Has Failed – Action Needed!',
      html
    });
  }

  // 6. Account Cancellation – Stylist
  static async sendAccountCancellationStylist(data: AccountCancellationData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Cancelled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #666, #333); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3F0052; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${data.stylistName},</p>
            
            <p>Your BraidsNow account has been canceled, and access to stylist features has been removed.</p>
            
            <p>If this was a mistake or you'd like to return, you can reactivate your account anytime.</p>
            
            <div style="text-align: center;">
              <a href="https://braidsnow.com/stylist-community" class="button">👉 Reactivate My Account</a>
            </div>
            
            <p>Thank you,<br>
            <strong>BraidsNow.com Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.stylistEmail,
      subject: 'Your BraidsNow.com Account Has Been Canceled!',
      html
    });
  }

  // 7. Appointment Denied – Client
  static async sendAppointmentDeniedClient(data: AppointmentDeniedData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Unavailable</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff4444, #cc0000); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3F0052; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Appointment Unavailable</h1>
          </div>
          <div class="content">
            <p>Hi ${data.clientName},</p>
            
            <p>Unfortunately, your requested appointment with ${data.stylistName} could not be confirmed.</p>
            
            <p>Please choose another available time or contact your stylist directly for assistance.</p>
            
            <div style="text-align: center;">
              <a href="https://braidsnow.com/find-stylists" class="button">👉 View Available Times</a>
            </div>
            
            <p>Thank you,<br>
            <strong>BraidsNow.com Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.clientEmail,
      subject: 'BraidsNow.com Appointment Unavailable!',
      html
    });
  }

  // 8. Full Payment Required – Client (After Deposit Paid)
  static async sendFullPaymentReminderClient(data: FullPaymentReminderData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Full Payment Due Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3F0052, #DFA801); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          .reminder { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Full Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.clientName},</p>
            
            <p>Thank you for securing your appointment with a deposit.</p>
            
            <div class="reminder">
              <p><strong>Please remember: Full payment is required at the time of service.</strong></p>
              <p><strong>Remaining Balance:</strong> ${data.balanceAmount}</p>
            </div>
            
            <div class="appointment-details">
              <h3>👉 Appointment Details:</h3>
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Stylist:</strong> ${data.stylistName}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
            </div>
            
            <p>Thank you,<br>
            <strong>BraidsNow.com Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.clientEmail,
      subject: 'BraidsNow.com Reminder: Full Payment Due at Time of Service!',
      html
    });
  }

  // 9. Stylist Receives Message from Client
  static async sendMessageNotificationStylist(data: MessageNotificationData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Message from Client</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3F0052, #DFA801); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3F0052; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            
            <p>You've received a new message from ${data.senderName}.</p>
            
            <div style="text-align: center;">
              <a href="https://braidsnow.com/dashboard/stylist" class="button">👉 View Message</a>
            </div>
            
            <p>Be sure to reply soon to keep your client updated.</p>
            
            <p>Thank you,<br>
            <strong>BraidsNow.com Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `BraidsNow.com: New Message from ${data.senderName}`,
      html
    });
  }

  // 10. Client Receives Message from Stylist
  static async sendMessageNotificationClient(data: MessageNotificationData): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Message from Stylist</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3F0052, #DFA801); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #3F0052; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            
            <p>You've received a new message from ${data.senderName} about your appointment.</p>
            
            <div style="text-align: center;">
              <a href="https://braidsnow.com/dashboard/client" class="button">👉 View Message</a>
            </div>
            
            <p>We recommend checking your messages to stay connected with your stylist.</p>
            
            <p>Thank you,<br>
            <strong>BraidsNow.com Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 BraidsNow.com. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `BraidsNow.com: New Message from ${data.senderName}`,
      html
    });
  }
} 