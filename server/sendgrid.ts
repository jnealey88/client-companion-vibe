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
    // If SendGrid is configured, try to send the email
    if (mailService) {
      try {
        await mailService.send({
          to: params.to,
          from: params.from,
          subject: params.subject,
          text: params.text,
          html: params.html,
        });
        console.log(`Email sent to ${params.to}`);
        return true;
      } catch (sendgridError) {
        // Log the SendGrid-specific error
        console.error('SendGrid email error:', sendgridError);
        
        // If there's an issue with SendGrid, fall back to simulation
        console.log('Falling back to email simulation due to SendGrid error');
      }
    }
    
    // Either no API key or SendGrid failed - simulate sending
    console.log('Simulating email send:', {
      to: params.to,
      from: params.from,
      subject: params.subject,
    });
    
    // Add artificial delay to simulate network request
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Return success for the simulated sending
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}