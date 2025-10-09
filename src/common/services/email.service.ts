import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, template, context } = options;

    try {
      this.logger.log(`Sending email to: ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Template: ${template}`);
      this.logger.log(`Context: ${JSON.stringify(context)}`);

      // In a real application, you would integrate with an email service like:
      // - SendGrid
      // - AWS SES
      // - Nodemailer with SMTP
      // - Mailgun
      // - etc.

      // For development/demo purposes, we'll just log the email
      if (process.env['NODE_ENV'] === 'development') {
        this.logger.log('=== EMAIL CONTENT ===');
        this.logger.log(`To: ${to}`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log('Body would be generated from template with context');
        this.logger.log('=====================');
      }

      // Simulate async email sending
      await new Promise(resolve => setTimeout(resolve, 100));

      this.logger.log(`Email sent successfully to: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendEmailVerification(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: {
        verificationUrl,
        token,
      },
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: {
        resetUrl,
        token,
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      context: {
        firstName,
      },
    });
  }

  async sendContactNotification(
    contactName: string,
    contactEmail: string,
    message: string
  ): Promise<boolean> {
    const adminEmail = 'eadomestic@gmail.com';

    return this.sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission from ${contactName}`,
      template: 'contact-notification',
      context: {
        contactName,
        contactEmail,
        message,
      },
    });
  }
}
