import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export class EmailService {
  static async sendWelcomeEmail(email: string, name: string) {
    try {
      await resend.emails.send({
        from: 'LearnHub <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to LearnHub! 🎉',
        html: this.getWelcomeTemplate(name),
      });
      console.log('✅ Welcome email sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
    }
  }

  static async sendPurchaseEmail(
    email: string, 
    name: string, 
    courseTitle: string, 
    amount: number
  ) {
    try {
      await resend.emails.send({
        from: 'LearnHub <receipts@resend.dev>',
        to: email,
        subject: `🎉 Enrollment Confirmed: ${courseTitle}`,
        html: this.getPurchaseTemplate(name, courseTitle, amount),
      });
      console.log('✅ Purchase email sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send purchase email:', error);
    }
  }

  private static getWelcomeTemplate(name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to LearnHub! 🎓</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your learning journey begins now</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
          <p style="font-size: 16px; color: #555;">
            Welcome to LearnHub! We're thrilled to have you join our community of learners. 
            Get ready to unlock new skills and advance your career.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="background: #667eea; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Start Learning Now
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private static getPurchaseTemplate(name: string, courseTitle: string, amount: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Course Enrollment Confirmed! 🎉</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">You're all set to start learning</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
          <p style="font-size: 16px; color: #555;">
            Thank you for enrolling in <strong>${courseTitle}</strong>! Your payment has been processed successfully.
          </p>
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #333; margin-top: 0;">📋 Purchase Details</h3>
            <p style="margin: 8px 0;"><strong>Course:</strong> ${courseTitle}</p>
            <p style="margin: 8px 0;"><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)}</p>
            <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #10b981;">Confirmed ✅</span></p>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-courses" style="background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Go to My Courses
            </a>
          </div>
        </div>
      </div>
    `;
  }
}
