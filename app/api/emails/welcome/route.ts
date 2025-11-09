import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    console.log('Sending welcome email to:', email);

    const { data, error } = await resend.emails.send({
      from: 'LearnHub <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to LearnHub! 🎉',
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
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
               padding: 40px 20px;
               text-align: center;
               color: white;
             }
            .content {
               padding: 40px 30px;
             }
            .button {
               background: #667eea;
               color: white;
               padding: 14px 35px;
               text-decoration: none;
               border-radius: 8px;
               display: inline-block;
               font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
            }
            .footer {
              padding: 20px;
              text-align: center;
              background: #f8f9fa;
              color: #6c757d;
              font-size: 14px;
            }
            ul {
              margin: 20px 0;
              padding-left: 20px;
            }
            li {
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Welcome to LearnHub! 🎓</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your learning journey begins now</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
              <p style="font-size: 16px; color: #555;">
                Welcome to LearnHub! We're thrilled to have you join our community of learners. 
                Get ready to unlock new skills and advance your career.
              </p>
                             
              <p style="font-size: 16px; color: #555;"><strong>Here's what you can do:</strong></p>
              <ul style="font-size: 16px; color: #555;">
                <li>🚀 Access expert-led courses</li>
                <li>📚 Learn at your own pace</li>
                <li>💼 Advance your career skills</li>
                <li>👥 Join a community of learners</li>
                <li>🎯 Get certified upon completion</li>
              </ul>
               
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}" class="button">
                  Start Learning Now
                </a>
              </div>
               
              <p style="font-size: 16px; color: #555;">
                If you have any questions, simply reply to this email. We're always happy to help!
              </p>
                             
              <p style="font-size: 16px; color: #555;">
                Happy learning!<br>
                <strong>The LearnHub Team</strong>
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0;">
                © 2024 LearnHub. All rights reserved.<br>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/contact" style="color: #667eea;">Contact Support</a>
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

    console.log('Welcome email sent successfully to:', email);
    return NextResponse.json({ success: true, data });
   
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}