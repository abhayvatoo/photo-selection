import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface InvitationEmailData {
  inviteeName: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;
  private fromName: string;

  private constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@photoselection.app';
    this.fromName = process.env.FROM_NAME || 'Photo Selection App';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Generate invitation email template
   */
  private generateInvitationTemplate(data: InvitationEmailData): EmailTemplate {
    const {
      inviteeName,
      inviterName,
      workspaceName,
      role,
      inviteUrl,
      expiresAt,
    } = data;

    const roleDisplayName = role === 'USER' ? 'Client' : 'Staff Member';
    const expiryDate = expiresAt.toLocaleDateString();
    const expiryTime = expiresAt.toLocaleTimeString();

    const subject = `You're invited to join ${workspaceName} as a ${roleDisplayName}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Workspace Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #059669; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📸 Photo Selection Invitation</h1>
            </div>
            <div class="content">
              <h2>Hello ${inviteeName || 'there'}!</h2>
              
              <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>"${workspaceName}"</strong> as a <strong>${roleDisplayName}</strong>.</p>
              
              ${
                role === 'USER'
                  ? `
                <p>As a client, you'll be able to:</p>
                <ul>
                  <li>View photos uploaded by the photographer</li>
                  <li>Select your favorite photos</li>
                  <li>Download your selected photos</li>
                  <li>See real-time updates when new photos are added</li>
                </ul>
              `
                  : `
                <p>As a staff member, you'll be able to:</p>
                <ul>
                  <li>Help manage the workspace</li>
                  <li>View and organize photos</li>
                  <li>Assist with client photo selections</li>
                  <li>Access workspace management tools</li>
                </ul>
              `
              }
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
              
              <div class="warning">
                <strong>⏰ Important:</strong> This invitation expires on <strong>${expiryDate} at ${expiryTime}</strong>. 
                Please accept it before then to gain access to the workspace.
              </div>
              
              <p>If you have any questions, please contact ${inviterName} directly.</p>
            </div>
            <div class="footer">
              <p>This invitation was sent by ${this.fromName}. If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>For support, please contact our team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Hello ${inviteeName || 'there'}!

${inviterName} has invited you to join the workspace "${workspaceName}" as a ${roleDisplayName}.

${
  role === 'USER'
    ? "As a client, you'll be able to view photos, select favorites, and download your selections."
    : "As a staff member, you'll be able to help manage the workspace and assist with photo selections."
}

To accept this invitation, please visit: ${inviteUrl}

IMPORTANT: This invitation expires on ${expiryDate} at ${expiryTime}.

If you have any questions, please contact ${inviterName} directly.

---
This invitation was sent by ${this.fromName}.
    `;

    return { subject, html, text };
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(
    recipientEmail: string,
    data: InvitationEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.generateInvitationTemplate(data);

      // Development mode - log email instead of sending
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.FORCE_REAL_EMAILS !== 'true'
      ) {
        console.log('\n' + '='.repeat(80));
        console.log('📧 DEVELOPMENT EMAIL - Invitation');
        console.log('='.repeat(80));
        console.log('📤 From:', `${this.fromName} <${this.fromEmail}>`);
        console.log('📥 To:', recipientEmail);
        console.log('📋 Subject:', template.subject);
        console.log('👤 Invitee:', data.inviteeName);
        console.log('👨‍💼 Inviter:', data.inviterName);
        console.log('🏢 Workspace:', data.workspaceName);
        console.log('🔑 Role:', data.role);
        console.log('🔗 Invite URL:', data.inviteUrl);
        console.log('⏰ Expires:', data.expiresAt.toISOString());
        console.log('='.repeat(80));
        console.log('🔗 COPY THIS INVITATION LINK TO TEST:');
        console.log('   ' + data.inviteUrl);
        console.log('='.repeat(80) + '\n');

        return {
          success: true,
          messageId: 'dev-' + Date.now(),
        };
      }

      const { data: emailData, error } = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [recipientEmail],
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      if (error) {
        console.error('Failed to send invitation email:', error);
        return {
          success: false,
          error: error.message || 'Failed to send invitation email',
        };
      }

      return {
        success: true,
        messageId: emailData?.id,
      };
    } catch (error) {
      console.error('📧 Failed to send invitation email:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(
    recipientEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Development mode - log email instead of sending
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.FORCE_REAL_EMAILS !== 'true'
      ) {
        console.log('\n' + '='.repeat(80));
        console.log('📧 DEVELOPMENT EMAIL - Test Email');
        console.log('='.repeat(80));
        console.log('📤 From:', `${this.fromName} <${this.fromEmail}>`);
        console.log('📥 To:', recipientEmail);
        console.log('📋 Subject: PhotoSelect - Email Service Test');
        console.log('📄 Content:');
        console.log(
          '   This is a test email to verify your email configuration is working correctly.'
        );
        console.log(
          '   If you received this email, your Resend integration is properly configured!'
        );
        console.log('   Sent at:', new Date().toISOString());
        console.log('='.repeat(80));
        console.log('✅ Email logged successfully (development mode)');
        console.log(
          '💡 To send real emails in development, set FORCE_REAL_EMAILS=true in .env'
        );
        console.log('='.repeat(80) + '\n');

        return { success: true };
      }

      if (!process.env.RESEND_API_KEY) {
        return { success: false, error: 'Resend API key not configured' };
      }

      const { data, error } = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [recipientEmail],
        subject: 'PhotoSelect - Email Service Test',
        text: 'This is a test email to verify your email configuration is working correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">PhotoSelect - Email Service Test</h2>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p>If you received this email, your Resend integration is properly configured!</p>
            <p style="color: #6b7280; font-size: 14px;">Sent at: ${new Date().toISOString()}</p>
          </div>
        `,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send test email',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }
}

export const emailService = EmailService.getInstance();
