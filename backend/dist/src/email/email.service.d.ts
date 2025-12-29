import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    private isConfigured;
    constructor(configService: ConfigService);
    private initializeTransporter;
    sendVerificationCode(email: string, code: string, firstName: string): Promise<boolean>;
    sendWelcomeEmail(email: string, firstName: string): Promise<boolean>;
    sendPasswordResetCode(email: string, code: string, firstName: string): Promise<boolean>;
    private sendEmail;
}
