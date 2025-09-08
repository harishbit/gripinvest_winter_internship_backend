import { Resend } from 'resend';

// Initialize Resend lazily
let resend: Resend | null = null;
let resendInitialized = false;

function initializeResend(): void {
  if (resendInitialized) return;
  

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder_key_replace_with_real_key') {
    try {
      resend = new Resend(process.env.RESEND_API_KEY);
    
    } catch (error) {
      console.error('❌ Failed to initialize Resend:', error);
    }
  } else {
    console.warn('⚠️  Resend API key not configured. Email functionality will be disabled.');
    console.warn('   To enable emails, get an API key from https://resend.com and update your .env file');
  }
  
  resendInitialized = true;
}

export class EmailService {
  static async sendPasswordResetCode(email: string, resetCode: string, userName?: string): Promise<boolean> {
    try {
      // Initialize Resend if not already done
      initializeResend();
      
      // Check if Resend is configured
      if (!resend) {
        console.warn(`📧 Email not sent to ${email}: Resend not configured`);
        console.warn('   Reset code would have been:', resetCode);
        return true; // Return true in development so the flow continues
      }

      const { data, error } = await resend.emails.send({
        from: process.env.PASSWORD_RESET_EMAIL || 'noreply@gripinvest.com',
        to: [email],
        subject: 'Password Reset Code - Grip Invest',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset Code</title>
              <style>
                body {
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f9f9f9;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  font-size: 28px;
                  font-weight: bold;
                  color: #2563eb;
                  margin-bottom: 10px;
                }
                .reset-code {
                  background: #f0f9ff;
                  border: 2px solid #2563eb;
                  border-radius: 8px;
                  padding: 20px;
                  text-align: center;
                  margin: 30px 0;
                }
                .code {
                  font-size: 32px;
                  font-weight: bold;
                  color: #2563eb;
                  letter-spacing: 3px;
                  margin: 10px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
                  color: #666;
                  font-size: 14px;
                }
                .warning {
                  background: #fef2f2;
                  border-left: 4px solid #ef4444;
                  padding: 15px;
                  margin: 20px 0;
                  border-radius: 4px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">
      <img src="/favicon.ico" alt="Grip Invest Logo" style="width:24px; height:24px; vertical-align:middle;">
      Grip Invest
    </div>
                  <h1>Password Reset Request</h1>
                </div>
                
                <p>Hello${userName ? `, ${userName}` : ''}!</p>
                
                <p>We received a request to reset your password for your Grip Invest account. Use the verification code below to reset your password:</p>
                
                <div class="reset-code">
                  <p><strong>Your verification code is:</strong></p>
                  <div class="code">${resetCode}</div>
                  <p><small>This code expires in 15 minutes</small></p>
                </div>
                
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                
                <div class="warning">
                  <strong>Security Note:</strong> Never share this code with anyone. Grip Invest will never ask for your verification code via phone or email.
                </div>
                
                <div class="footer">
                  <p>This email was sent by Grip Invest</p>
                  <p>If you have any questions, please contact our support team.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
Password Reset Code - Grip Invest

Hello${userName ? `, ${userName}` : ''}!

We received a request to reset your password for your Grip Invest account.

Your verification code is: ${resetCode}

This code expires in 15 minutes.

If you didn't request a password reset, please ignore this email.

Best regards,
The Grip Invest Team
        `
      });

      if (error) {
        console.error('Error sending password reset email:', error);
        return false;
      }

      
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    try {
      // Initialize Resend if not already done
      initializeResend();
      
      // Check if Resend is configured
      if (!resend) {
        console.warn(`📧 Welcome email not sent to ${email}: Resend not configured`);
        return true; // Return true in development so the flow continues
      }

      const { data, error } = await resend.emails.send({
        from: process.env.PASSWORD_RESET_EMAIL || 'noreply@gripinvest.com',
        to: [email],
        subject: 'Welcome to Grip Invest!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Grip Invest</title>
              <style>
                body {
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f9f9f9;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  font-size: 28px;
                  font-weight: bold;
                  color: #2563eb;
                  margin-bottom: 10px;
                }
                .cta-button {
                  background: #2563eb;
                  color: white;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 6px;
                  display: inline-block;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
                  color: #666;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">🚀 Grip Invest</div>
                  <h1>Welcome to Grip Invest!</h1>
                </div>
                
                <p>Hi ${firstName},</p>
                
                <p>Welcome to Grip Invest! We're excited to have you on board and help you achieve your investment goals.</p>
                
                <p>With Grip Invest, you can:</p>
                <ul>
                  <li>Explore various investment products</li>
                  <li>Build a diversified portfolio</li>
                  <li>Track your investment performance</li>
                  <li>Make informed investment decisions</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button">Start Investing</a>
                </div>
                
                <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
                
                <div class="footer">
                  <p>Happy investing!</p>
                  <p>The Grip Invest Team</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
Welcome to Grip Invest!

Hi ${firstName},

Welcome to Grip Invest! We're excited to have you on board and help you achieve your investment goals.

With Grip Invest, you can:
- Explore various investment products
- Build a diversified portfolio
- Track your investment performance
- Make informed investment decisions

Visit ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard to start investing.

If you have any questions or need assistance, don't hesitate to reach out to our support team.

Happy investing!
The Grip Invest Team
        `
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        return false;
      }

      console.log('Welcome email sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
}

// Helper function to generate random 6-digit code
export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
