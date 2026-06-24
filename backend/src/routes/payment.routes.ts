import { Router, Request, Response } from 'express';
import prisma from '../services/prisma';
import {
  getRazorpayCredentials,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
} from '../services/razorpay.service';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-order
// Called right before opening Razorpay checkout modal
// Uses x-tenant-slug to find the restaurant's Razorpay credentials
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-order', async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId as string;
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: 'Invalid amount' });
      return;
    }

    const credentials = await getRazorpayCredentials(tenantId);
    if (!credentials) {
      res.status(403).json({ message: 'Online payments not configured for this restaurant.' });
      return;
    }

    const receipt = `rcpt_${orderId || Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(
      credentials.keyId,
      credentials.keySecret,
      amount,
      'INR',
      receipt
    );

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: credentials.keyId // Public key — safe to send to frontend
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment order' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Called after Razorpay checkout completes — verifies the HMAC signature
// then marks the RestoBuddy order as PAID
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify', async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId as string;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, restoOrderId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ message: 'Missing payment verification fields' });
      return;
    }

    const credentials = await getRazorpayCredentials(tenantId);
    if (!credentials) {
      res.status(403).json({ message: 'Razorpay not configured' });
      return;
    }

    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      credentials.keySecret
    );

    if (!isValid) {
      res.status(400).json({ message: 'Payment signature verification failed. Possible fraud.' });
      return;
    }

    // Update order as PAID if restoOrderId provided
    if (restoOrderId) {
      await prisma.order.update({
        where: { id: restoOrderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'ONLINE',
          razorpayOrderId,
          razorpayPaymentId
        }
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      razorpayPaymentId
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// Razorpay webhook — async confirmation after payment events
// Configured in Razorpay Dashboard → Settings → Webhooks
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const signature = req.headers['x-razorpay-signature'] as string;

    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(
        JSON.stringify(req.body),
        signature,
        webhookSecret
      );

      if (!isValid) {
        res.status(400).json({ message: 'Invalid webhook signature' });
        return;
      }
    }

    const event = req.body;

    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const razorpayPaymentId = payment?.id;

      if (razorpayOrderId) {
        // Find order by razorpay order id and mark as paid
        await prisma.order.updateMany({
          where: { razorpayOrderId },
          data: {
            paymentStatus: 'PAID',
            razorpayPaymentId
          }
        });
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;

      if (razorpayOrderId) {
        await prisma.order.updateMany({
          where: { razorpayOrderId },
          data: { paymentStatus: 'FAILED' }
        });
      }
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/status
// Check if this restaurant has online payments configured
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', async (req: any, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId as string;
    const settings = await prisma.settings.findUnique({
      where: { tenantId },
      select: { razorpayKeyId: true, razorpayEnabled: true }
    });

    res.json({
      enabled: settings?.razorpayEnabled || false,
      keyId: settings?.razorpayKeyId
        ? settings.razorpayKeyId.substring(0, 12) + '...'
        : null
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to get payment status' });
  }
});

export default router;
