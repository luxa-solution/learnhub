import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, courseTitle, amount } = await request.json();

    console.log('Sending purchase email to:', email, 'for course:', courseTitle);

    const { data, error } = await resend.emails.send({
      from: 'LearnHub <receipts@resend.dev>',
      to: email,
      subject: `🎉 Enrollment Confirmed: ${courseTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
               font-family: 'Arial', sans-serif;
               line-height: 1.6;
               color: #333;
               margin: 0;
               padding: 0;
               background-color: #f4f4f4;
            }
            .container {
               max-width: 600px;
               margin: 0 auto;
               background: white;
            }
            .header {
               background: linear-gradient(135deg, #10b981 0%, #059669 100%);
               padding: 40px 20px;
               text-align: center;
               color: white;
             }
            .content {
               padding: 40px 30px;
             }
            .button {
               background: #10b981;
               color: white;
               padding: 14px 35px;
               text-decoration: none;
               border-radius: 8px;
               display: inline-block;
               font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
            }
            .receipt {
               background: #f8f9fa;
               padding: 25px;
               border-radius: 10px;
               margin: 25px 0;
              border-left: 4px solid #10b981;
            }
            .footer {
              padding: 20px;
              text-align: center;
              background: #f8f9fa;
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Course Enrollment Confirmed! 🎉</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">You're all set to start learning</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
              <p style="font-size: 16px; color: #555;">
                Thank you for enrolling in <strong>${courseTitle}</strong>! Your payment has been processed successfully and you now have full access to the course content.
              </p>
                             
              <div class="receipt">
                <h3 style="color: #333; margin-top: 0;">📋 Purchase Details</h3>
                <p style="margin: 8px 0;"><strong>Course:</strong> ${courseTitle}</p>
                <p style="margin: 8px 0;"><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)}</p>
                <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #10b981;">Confirmed ✅</span></p>
                <p style="margin: 8px 0;"><strong>Access:</strong> Immediate & Lifetime</p>
                <p style="margin: 8px 0;"><strong>Enrollment Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
               
              <p style="font-size: 16px; color: #555;">
                You can access your course immediately and start learning at your own pace.
              </p>
               
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/my-courses" class="button">
                  Go to My Courses
                </a>
              </div>
               
              <p style="font-size: 16px; color: #555;">
                <strong>Need help?</strong> Reply to this email or visit our 
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/help" style="color: #10b981;"> help center</a>.
              </p>
                             
              <p style="font-size: 16px; color: #555;">
                Happy learning!<br>
                <strong>The LearnHub Team</strong>
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">
                © 2024 LearnHub. All rights reserved.<br>
                This is a receipt for your recent purchase. Please keep it for your records.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    console.log('Purchase email sent successfully to:', email);
    return NextResponse.json({ success: true, data });
   
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}