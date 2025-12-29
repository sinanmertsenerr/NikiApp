import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const portStr = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured. Emails will be logged to console.');
      this.isConfigured = false;
      return;
    }

    // Parse port as number (ConfigService may return string)
    const port = portStr ? parseInt(portStr, 10) : 587;
    const isSecure = port === 465;

    this.logger.log(`Initializing SMTP: host=${host}, port=${port}, secure=${isSecure}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        type: 'login', // Use LOGIN instead of PLAIN
        user,
        pass,
      },
      // Increase timeouts for slow connections
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      // TLS options for SSL connections
      tls: {
        // Allow self-signed certificates if needed
        rejectUnauthorized: false,
      },
      // Enable debug for troubleshooting
      debug: true,
      logger: true,
    });

    this.isConfigured = true;
    this.logger.log('SMTP transporter initialized successfully');
  }

  /**
   * Send verification code email
   */
  async sendVerificationCode(email: string, code: string, firstName: string): Promise<boolean> {
    const subject = 'Niki Coffee - Email Doğrulama Kodu';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6B4423 0%, #8B5A2B 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
          .content { padding: 40px 30px; text-align: center; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
          .code-box { background: #f8f4f0; border: 2px dashed #6B4423; border-radius: 12px; padding: 25px; margin: 25px 0; }
          .code { font-size: 36px; font-weight: bold; color: #6B4423; letter-spacing: 8px; font-family: monospace; }
          .info { color: #666; font-size: 14px; line-height: 1.6; }
          .warning { background: #fff3e0; border-radius: 8px; padding: 15px; margin-top: 20px; color: #e65100; font-size: 13px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Niki Coffee</h1>
            <p>Email Doğrulama</p>
          </div>
          <div class="content">
            <p class="greeting">Merhaba <strong>${firstName}</strong>,</p>
            <p class="info">Niki Coffee'ye hoş geldin! Hesabını doğrulamak için aşağıdaki kodu kullan:</p>

            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <p class="info">Bu kod <strong>10 dakika</strong> içinde geçerliliğini yitirecektir.</p>

            <div class="warning">
              ⚠️ Bu kodu kimseyle paylaşma. Niki Coffee çalışanları senden asla bu kodu istemez.
            </div>
          </div>
          <div class="footer">
            <p>Bu email Niki Coffee tarafından gönderilmiştir.</p>
            <p>Eğer bu işlemi sen yapmadıysan, bu emaili görmezden gelebilirsin.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Merhaba ${firstName},

Niki Coffee'ye hoş geldin! Hesabını doğrulamak için aşağıdaki kodu kullan:

${code}

Bu kod 10 dakika içinde geçerliliğini yitirecektir.

Bu kodu kimseyle paylaşma.

Niki Coffee
    `;

    return this.sendEmail(email, subject, html, text);
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const subject = 'Niki Coffee\'ye Hoş Geldin! ☕';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6B4423 0%, #8B5A2B 100%); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 32px; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 20px; color: #333; margin-bottom: 25px; text-align: center; }
          .features { background: #f8f4f0; border-radius: 12px; padding: 25px; margin: 20px 0; }
          .feature { display: flex; align-items: center; margin: 15px 0; color: #333; }
          .feature-icon { font-size: 24px; margin-right: 15px; }
          .cta { text-align: center; margin-top: 30px; }
          .button { display: inline-block; background: #6B4423; color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Hoş Geldin!</h1>
          </div>
          <div class="content">
            <p class="greeting">Merhaba <strong>${firstName}</strong>,</p>
            <p style="color: #666; line-height: 1.6;">
              Niki Coffee ailesine katıldığın için çok mutluyuz! Artık birçok avantajdan yararlanabilirsin:
            </p>

            <div class="features">
              <div class="feature">
                <span class="feature-icon">🎡</span>
                <span>Haftalık şans çarkı ile ödüller kazan</span>
              </div>
              <div class="feature">
                <span class="feature-icon">☕</span>
                <span>Her 10 kahvede 1 kahve bedava</span>
              </div>
              <div class="feature">
                <span class="feature-icon">💰</span>
                <span>Niki Credits ile %15 indirim</span>
              </div>
              <div class="feature">
                <span class="feature-icon">🏆</span>
                <span>Rozetler ve özel kampanyalar</span>
              </div>
            </div>

            <div class="cta">
              <p style="color: #666;">Hemen uygulamayı aç ve keşfetmeye başla!</p>
            </div>
          </div>
          <div class="footer">
            <p>Niki Coffee - Her yudumda mutluluk ☕</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Merhaba ${firstName},

Niki Coffee ailesine katıldığın için çok mutluyuz!

Artık birçok avantajdan yararlanabilirsin:
- Haftalık şans çarkı ile ödüller kazan
- Her 10 kahvede 1 kahve bedava
- Niki Credits ile %15 indirim
- Rozetler ve özel kampanyalar

Hemen uygulamayı aç ve keşfetmeye başla!

Niki Coffee - Her yudumda mutluluk
    `;

    return this.sendEmail(email, subject, html, text);
  }

  /**
   * Send password reset code email
   */
  async sendPasswordResetCode(email: string, code: string, firstName: string): Promise<boolean> {
    const subject = 'Niki Coffee - Şifre Sıfırlama Kodu';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6B4423 0%, #8B5A2B 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
          .content { padding: 40px 30px; text-align: center; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
          .code-box { background: #f8f4f0; border: 2px dashed #6B4423; border-radius: 12px; padding: 25px; margin: 25px 0; }
          .code { font-size: 36px; font-weight: bold; color: #6B4423; letter-spacing: 8px; font-family: monospace; }
          .info { color: #666; font-size: 14px; line-height: 1.6; }
          .warning { background: #ffebee; border-radius: 8px; padding: 15px; margin-top: 20px; color: #c62828; font-size: 13px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Niki Coffee</h1>
            <p>Şifre Sıfırlama</p>
          </div>
          <div class="content">
            <p class="greeting">Merhaba <strong>${firstName}</strong>,</p>
            <p class="info">Şifreni sıfırlamak için aşağıdaki kodu kullan:</p>

            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <p class="info">Bu kod <strong>15 dakika</strong> içinde geçerliliğini yitirecektir.</p>

            <div class="warning">
              ⚠️ Bu işlemi sen yapmadıysan, hesabın tehlikede olabilir. Lütfen bu emaili görmezden gel ve şifreni değiştirme.
            </div>
          </div>
          <div class="footer">
            <p>Bu email Niki Coffee tarafından gönderilmiştir.</p>
            <p>Şifre sıfırlama talebinde bulunmadıysan bu emaili görmezden gelebilirsin.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Merhaba ${firstName},

Şifreni sıfırlamak için aşağıdaki kodu kullan:

${code}

Bu kod 15 dakika içinde geçerliliğini yitirecektir.

Bu işlemi sen yapmadıysan, bu emaili görmezden gel.

Niki Coffee
    `;

    return this.sendEmail(email, subject, html, text);
  }

  /**
   * Generic send email method
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<boolean> {
    const fromName = this.configService.get<string>('SMTP_FROM_NAME') || 'Niki Coffee';
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL') || 'noreply@nikicoffee.com';

    // If SMTP not configured, log to console
    if (!this.isConfigured) {
      this.logger.log('========== EMAIL (DEV MODE) ==========');
      this.logger.log(`To: ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Text: ${text.substring(0, 200)}...`);
      this.logger.log('=======================================');
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }
}
