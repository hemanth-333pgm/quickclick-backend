import { logger } from "../../config/logger";

// Twilio or any SMS provider
export class SMSService {
    private twilioClient: any = null;

    constructor() {
        // Initialize Twilio if configured
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            // const twilio = require('twilio');
            // this.twilioClient = twilio(
            //     process.env.TWILIO_ACCOUNT_SID,
            //     process.env.TWILIO_AUTH_TOKEN
            // );
            logger.info("📱 SMS service initialized");
        } else {
            logger.warn("⚠️ SMS service not configured - using mock");
        }
    }

    async sendOTP(mobile: string, otp: string): Promise<boolean> {
        try {
            const message = `Your QuickClick OTP is: ${otp}. Valid for 5 minutes.`;

            if (this.twilioClient) {
                // Send via Twilio
                // await this.twilioClient.messages.create({
                //     body: message,
                //     to: mobile,
                //     from: process.env.TWILIO_PHONE_NUMBER,
                // });
                logger.info(`📱 OTP sent to ${mobile}`);
                return true;
            } else {
                // Mock for development
                logger.info(`📱 [MOCK] OTP ${otp} sent to ${mobile}`);
                return true;
            }
        } catch (error) {
            logger.error(`SMS send error to ${mobile}:`, error);
            return false;
        }
    }

    async sendOrderUpdate(mobile: string, orderNumber: string, status: string): Promise<boolean> {
        try {
            const message = `QuickClick: Order #${orderNumber} is now ${status}. Track in app.`;

            if (this.twilioClient) {
                // Send via Twilio
                // await this.twilioClient.messages.create({
                //     body: message,
                //     to: mobile,
                //     from: process.env.TWILIO_PHONE_NUMBER,
                // });
                logger.info(`📱 Order update sent to ${mobile}`);
                return true;
            } else {
                logger.info(`📱 [MOCK] Order update sent to ${mobile}: ${message}`);
                return true;
            }
        } catch (error) {
            logger.error(`SMS send error to ${mobile}:`, error);
            return false;
        }
    }
}

export const smsService = new SMSService();
