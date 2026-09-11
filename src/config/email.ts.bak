import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
}) => {
    try {
        const mailOptions = {
            from: options.from || process.env.SMTP_FROM || "noreply@quickclick.com",
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${options.to}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error("Email send error:", error);
        throw error;
    }
};

export const emailTemplates = {
    orderConfirmation: (data: { orderNumber: string; total: number; items: any[] }) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .order-details { padding: 20px; background: #f9f9f9; }
                    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎉 Order Confirmed!</h1>
                    <p>Order #${data.orderNumber}</p>
                </div>
                <div class="order-details">
                    <h2>Order Summary</h2>
                    ${data.items.map(item => `
                        <div class="item">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>₹${item.price * item.quantity}</span>
                        </div>
                    `).join('')}
                    <div class="total">Total: ₹${data.total}</div>
                </div>
                <p>Thank you for shopping with QuickClick!</p>
            </body>
            </html>
        `;
    },

    orderStatusUpdate: (data: { orderNumber: string; status: string; message?: string }) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .status { font-size: 24px; font-weight: bold; color: #2196F3; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📦 Order Status Update</h1>
                </div>
                <div class="content">
                    <p>Order <strong>#${data.orderNumber}</strong> status has been updated to:</p>
                    <div class="status">${data.status}</div>
                    ${data.message ? `<p>${data.message}</p>` : ''}
                    <p>Track your order in the QuickClick app.</p>
                </div>
            </body>
            </html>
        `;
    },

    otpEmail: (data: { otp: string; name?: string }) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
                    .otp { font-size: 32px; font-weight: bold; color: #FF6B35; text-align: center; padding: 20px; letter-spacing: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🔐 QuickClick OTP Verification</h1>
                </div>
                <p>Your OTP for verification is:</p>
                <div class="otp">${data.otp}</div>
                <p>This OTP is valid for 5 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </body>
            </html>
        `;
    },
};
