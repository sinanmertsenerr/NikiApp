"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter;
    isConfigured = false;
    constructor(configService) {
        this.configService = configService;
        this.initializeTransporter();
    }
    initializeTransporter() {
        const host = this.configService.get('SMTP_HOST');
        const portStr = this.configService.get('SMTP_PORT');
        const user = this.configService.get('SMTP_USER');
        const pass = this.configService.get('SMTP_PASS');
        if (!host || !user || !pass) {
            this.logger.warn('SMTP not configured. Emails will be logged to console.');
            this.isConfigured = false;
            return;
        }
        const port = portStr ? parseInt(portStr, 10) : 587;
        const isSecure = port === 465;
        this.logger.log(`Initializing SMTP: host=${host}, port=${port}, secure=${isSecure}`);
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: isSecure,
            auth: {
                type: 'login',
                user,
                pass,
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 60000,
            tls: {
                rejectUnauthorized: false,
            },
            debug: true,
            logger: true,
        });
        this.isConfigured = true;
        this.logger.log('SMTP transporter initialized successfully');
    }
    async sendVerificationCode(email, code, firstName) {
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
    async sendWelcomeEmail(email, firstName) {
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
    async sendPasswordResetCode(email, code, firstName) {
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
    async sendEmail(to, subject, html, text) {
        const fromName = this.configService.get('SMTP_FROM_NAME') || 'Niki Coffee';
        const fromEmail = this.configService.get('SMTP_FROM_EMAIL') || 'noreply@nikicoffee.com';
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
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map