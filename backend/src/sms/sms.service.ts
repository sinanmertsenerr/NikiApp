import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendSmsResponse {
    success: boolean;
    message?: string;
    jobId?: string;
    error?: string;
}

interface NetgsmResponse {
    code: string;
    jobId?: string;
}

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly usercode: string;
    private readonly password: string;
    private readonly msgheader: string;
    private readonly apiUrl = 'https://api.netgsm.com.tr/sms/send/otp';

    constructor(private configService: ConfigService) {
        this.usercode = this.configService.get<string>('NETGSM_USERCODE') || '';
        this.password = this.configService.get<string>('NETGSM_PASSWORD') || '';
        this.msgheader = this.configService.get<string>('NETGSM_MSGHEADER') || '';
    }

    /**
     * Send OTP SMS via Netgsm API
     */
    async sendOtp(phone: string, code: string): Promise<SendSmsResponse> {
        // Check if Netgsm is configured
        if (!this.usercode || !this.password || !this.msgheader) {
            this.logger.warn('Netgsm not configured, SMS not sent');
            return {
                success: false,
                error: 'SMS servisi yapılandırılmamış',
            };
        }

        // Format phone number (remove leading + if present)
        const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;

        // Prepare message
        const message = `Dogrulama kodunuz: ${code}. Bu kod 5 dakika gecerlidir.`;

        try {
            this.logger.log(`Sending OTP SMS to ${formattedPhone}`);

            // Netgsm OTP API request
            const url = new URL(this.apiUrl);
            url.searchParams.set('usercode', this.usercode);
            url.searchParams.set('password', this.password);
            url.searchParams.set('gsmno', formattedPhone);
            url.searchParams.set('message', message);
            url.searchParams.set('msgheader', this.msgheader);
            url.searchParams.set('dil', 'TR');

            const response = await fetch(url.toString(), {
                method: 'GET',
                signal: AbortSignal.timeout(10000),
            });

            const data = await response.text();

            // Parse response
            const result = this.parseNetgsmResponse(data);

            if (result.code === '00' || result.code === '01' || result.code === '02') {
                this.logger.log(`OTP SMS sent successfully to ${formattedPhone}, jobId: ${result.jobId}`);
                return {
                    success: true,
                    jobId: result.jobId,
                    message: 'SMS gönderildi',
                };
            } else {
                const errorMessage = this.getErrorMessage(result.code);
                this.logger.error(`Failed to send OTP SMS: ${errorMessage}`);
                return {
                    success: false,
                    error: errorMessage,
                };
            }
        } catch (error: any) {
            this.logger.error(`SMS sending error: ${error.message}`);
            return {
                success: false,
                error: 'SMS gönderilemedi. Lütfen daha sonra tekrar deneyin.',
            };
        }
    }

    /**
     * Parse Netgsm API response
     */
    private parseNetgsmResponse(data: string): NetgsmResponse {
        // Response format: "00 JOBID" or error code
        const parts = data.toString().trim().split(' ');
        return {
            code: parts[0],
            jobId: parts[1],
        };
    }

    /**
     * Get human-readable error message from Netgsm error code
     */
    private getErrorMessage(code: string): string {
        const errorMessages: Record<string, string> = {
            '20': 'Mesaj metni boş',
            '30': 'Geçersiz kullanıcı bilgileri',
            '40': 'Gönderici adı onaylı değil',
            '50': 'Abone kaydı bulunamadı',
            '51': 'Tekrarlı gönderim yapılamaz',
            '70': 'Geçersiz veya eksik parametre',
            '80': 'Sorgu limiti aşıldı',
            '85': 'Aynı içerik tekrar gönderilemez',
        };

        return errorMessages[code] || `SMS hatası (Kod: ${code})`;
    }
}
