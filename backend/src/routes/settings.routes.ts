import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import prisma from '../services/prisma';
import { encryptSecret, decryptSecret } from '../services/razorpay.service';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getSettings);
router.put('/', updateSettings);

// ─── Razorpay Payment Gateway Settings ───────────────────────────────────────

// GET /api/settings/payment-gateway — get connection status (never returns secret)
router.get('/payment-gateway', async (req: any, res) => {
  try {
    const tenantId = req.tenantId as string;
    const settings = await prisma.settings.findUnique({
      where: { tenantId },
      select: { razorpayKeyId: true, razorpayEnabled: true }
    });

    res.json({
      connected: !!(settings?.razorpayKeyId && settings?.razorpayEnabled),
      keyId: settings?.razorpayKeyId || null,
      enabled: settings?.razorpayEnabled || false
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/settings/payment-gateway — connect Razorpay (save encrypted keys)
router.post('/payment-gateway', authenticate, async (req: any, res) => {
  try {
    const tenantId = req.tenantId as string;
    const { keyId, keySecret } = req.body;

    if (!keyId || !keySecret) {
      res.status(400).json({ message: 'Both Key ID and Key Secret are required.' });
      return;
    }

    if (!keyId.startsWith('rzp_')) {
      res.status(400).json({ message: 'Invalid Razorpay Key ID format. Should start with rzp_test_ or rzp_live_' });
      return;
    }

    const encryptedSecret = encryptSecret(keySecret);

    await prisma.settings.update({
      where: { tenantId },
      data: {
        razorpayKeyId: keyId.trim(),
        razorpayKeySecret: encryptedSecret,
        razorpayEnabled: true
      }
    });

    res.json({ success: true, message: 'Razorpay connected successfully', keyId });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/settings/payment-gateway — disconnect Razorpay
router.delete('/payment-gateway', authenticate, async (req: any, res) => {
  try {
    const tenantId = req.tenantId as string;

    await prisma.settings.update({
      where: { tenantId },
      data: {
        razorpayKeyId: null,
        razorpayKeySecret: null,
        razorpayEnabled: false
      }
    });

    res.json({ success: true, message: 'Razorpay disconnected.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
