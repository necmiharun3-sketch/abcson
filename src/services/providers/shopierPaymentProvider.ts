import {
  PaymentProvider,
  PaymentInitInput,
  PaymentInitResult,
  PaymentConfirmInput,
  PaymentCaptureInput,
  PaymentRefundInput,
} from './paymentProvider';

// Placeholder: gerçek Shopier entegrasyonu erişim gelince yapılacak.
export class ShopierPaymentProvider implements PaymentProvider {
  async initPayment(_input: PaymentInitInput): Promise<PaymentInitResult> {
    return {
      providerRef: 'shopier-not-configured',
      status: 'requires_action',
      redirectUrl: undefined,
    };
  }

  async confirm3DS(_input: PaymentConfirmInput): Promise<{ status: 'authorized' | 'failed' }> {
    return { status: 'failed' };
  }

  async capture(_input: PaymentCaptureInput): Promise<{ status: 'captured' | 'failed' }> {
    return { status: 'failed' };
  }

  async refund(_input: PaymentRefundInput): Promise<{ status: 'refunded' | 'failed' }> {
    return { status: 'failed' };
  }
}

