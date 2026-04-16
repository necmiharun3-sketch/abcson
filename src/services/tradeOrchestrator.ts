import { FirebaseNotificationProvider } from "./providers/firebaseNotificationProvider";
import { FirebasePaymentProvider } from "./providers/firebasePaymentProvider";
import { FirebaseKycProvider } from "./providers/firebaseKycProvider";
import { ShopierPaymentProvider } from "./providers/shopierPaymentProvider";

const paymentProvider =
  (import.meta as any).env?.VITE_PAYMENT_PROVIDER === 'shopier'
    ? new ShopierPaymentProvider()
    : new FirebasePaymentProvider();
const notificationProvider = new FirebaseNotificationProvider();
const kycProvider = new FirebaseKycProvider();

export const tradeOrchestrator = {
  paymentProvider,
  notificationProvider,
  kycProvider,
};
