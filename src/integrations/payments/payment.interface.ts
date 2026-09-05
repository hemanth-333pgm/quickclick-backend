export interface PaymentProvider {
    createPayment(order: any): Promise<any>;
    verifyPayment(payload: any): Promise<any>;
    handleWebhook(payload: any): Promise<any>;
    refund(paymentId: string, amount: number): Promise<any>;
    getPaymentStatus(paymentId: string): Promise<any>;
}

export interface PaymentResult {
    success: boolean;
    paymentId: string;
    status: string;
    amount: number;
    currency: string;
    provider: string;
    error?: string;
    redirectUrl?: string;
    metadata?: any;
}

export interface WebhookPayload {
    event: string;
    paymentId: string;
    status: string;
    amount: number;
    signature: string;
    metadata?: any;
}
