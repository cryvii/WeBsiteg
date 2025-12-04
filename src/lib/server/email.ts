import { env } from '$env/dynamic/private';

// Simple email notification service
// For production, integrate with Sendgrid, Resend, or your email provider

export async function sendAcceptanceEmail(clientEmail: string, clientName: string, completionDate: string) {
  try {
    const message = `
Commission Accepted! 🎨

Hello ${clientName},

Great news! I've accepted your commission request and will be working on it.

Estimated Completion Date: ${new Date(completionDate).toLocaleDateString()}

I'll reach out if I have any questions about your request. Thanks for your patience!

Best regards,
Your Artist

---
Email sent to: ${clientEmail}
    `;

    console.log('[EMAIL] Acceptance notification:\n', message);
    
    // TODO: Integrate with email service (Sendgrid, Resend, etc.)
    // Example: await sendgrid.send({ to: clientEmail, subject: ..., text: ... })
  } catch (error) {
    console.error('Email notification failed:', error);
  }
}

export async function sendRejectionEmail(clientEmail: string, clientName: string, reason?: string) {
  try {
    const message = `
Commission Status Update

Hello ${clientName},

Thank you for your commission request. Unfortunately, I'm unable to accept it at this time.

${reason ? `Reason: ${reason}` : ''}

Feel free to reach out again in the future. I appreciate your interest!

Best regards,
Your Artist

---
Email sent to: ${clientEmail}
    `;

    console.log('[EMAIL] Rejection notification:\n', message);
    
    // TODO: Integrate with email service (Sendgrid, Resend, etc.)
  } catch (error) {
    console.error('Email notification failed:', error);
  }
}

