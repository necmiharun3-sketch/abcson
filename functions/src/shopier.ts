import { onRequest } from 'firebase-functions/v2/https';

// Placeholder: gerçek Shopier webhook entegrasyonu erişim gelince yapılacak.
export const shopierWebhook = onRequest(async (_req, res) => {
  res.status(501).json({
    ok: false,
    message: 'Shopier webhook not configured yet. Set SHOPIER_* secrets and implement signature verification.'
  });
  return;
});

