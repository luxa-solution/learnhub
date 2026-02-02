// lib/services/emailService.ts
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your Public Key from .env.local
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';
if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
    console.log('✅ EmailJS initialized');
} else {
    console.warn('⚠️ EmailJS Public Key is not configured.');
}

export class EmailService {
    // WELCOME EMAIL - for new account signups
    static async sendWelcomeEmail(toEmail: string, toName: string): Promise<boolean> {
        try {
            // Get your IDs from environment variables
            const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
            const templateId = process.env.NEXT_PUBLIC_EMAILJS_WELCOME_TEMPLATE_ID;

            if (!serviceId || !templateId) {
                throw new Error('EmailJS service or template ID for welcome email not configured.');
            }

            console.log('📧 Sending WELCOME email via EmailJS to:', toEmail);
            console.log('Using Welcome Template ID:', templateId);

            // Parameters must match placeholders in your "Welcome" EmailJS template
            const templateParams = {
                to_email: toEmail,
                to_name: toName,
                site_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            };

            const response = await emailjs.send(serviceId, templateId, templateParams);
            console.log('✅ WELCOME email sent successfully:', response.status);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to send WELCOME email:', error);
            return false;
        }
    }

    // PURCHASE EMAIL - for course purchases
    static async sendPurchaseEmail(
        toEmail: string,
        toName: string,
        courseTitle: string,
        amount: number
    ): Promise<boolean> {
        try {
            // Get your IDs from environment variables
            const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
            const templateId = process.env.NEXT_PUBLIC_EMAILJS_PURCHASE_TEMPLATE_ID;

            if (!serviceId || !templateId) {
                throw new Error('EmailJS service or template ID for purchase email not configured.');
            }

            console.log('📧 Sending PURCHASE email via EmailJS to:', toEmail);
            console.log('Using Purchase Template ID:', templateId);

            // Parameters must match placeholders in your "Purchase Receipt" template
            const templateParams = {
                to_email: toEmail,
                to_name: toName,
                course_title: courseTitle,
                amount_paid: `$${(amount / 100).toFixed(2)}`,
                order_id: `ORDER-${Date.now()}`, // Generates a simple order number
                site_url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                course_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/my-courses`,
            };

            const response = await emailjs.send(serviceId, templateId, templateParams);
            console.log('✅ PURCHASE email sent successfully:', response.status);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to send PURCHASE email:', error);
            return false;
        }
    }
}
