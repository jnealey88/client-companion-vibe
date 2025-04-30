import { MailService } from '@sendgrid/mail';

// Initialize SendGrid mail service if API key is available
let mailService: MailService | null = null;

// Check if SENDGRID_API_KEY exists and is not empty
const apiKey = process.env.SENDGRID_API_KEY || '';
if (apiKey) {
  mailService = new MailService();
  mailService.setApiKey(apiKey);
  console.log('SendGrid mail service initialized');
} else {
  console.warn('SENDGRID_API_KEY environment variable not set. Email functionality will be simulated.');
}

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 * If SendGrid is not configured, it will simulate sending and return success
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // If SendGrid is configured, send the email
    if (mailService) {
      await mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      console.log(`Email sent to ${params.to}`);
    } else {
      // Simulate sending an email with a delay
      console.log('Simulating email send:', {
        to: params.to,
        from: params.from,
        subject: params.subject,
      });
      // Add artificial delay to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}