import crypto from 'crypto';
import prisma from './prisma';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'restobuddy-enc-key-32chars-padded'; // 32 chars for AES-256
const IV_LENGTH = 16;

// ─── Encryption helpers ──────────────────────────────────────────────────────

export function encryptSecret(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptSecret(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const ivHex = parts[0]!;
  const encrypted = parts[1]!;
  const iv = Buffer.from(ivHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ─── Get restaurant Razorpay credentials ─────────────────────────────────────

export async function getRazorpayCredentials(tenantId: string): Promise<{ keyId: string; keySecret: string } | null> {
  const settings = await prisma.settings.findUnique({
    where: { tenantId },
    select: { razorpayKeyId: true, razorpayKeySecret: true, razorpayEnabled: true }
  });

  if (!settings?.razorpayEnabled || !settings.razorpayKeyId || !settings.razorpayKeySecret) {
    return null;
  }

  try {
    const keySecret = decryptSecret(settings.razorpayKeySecret);
    return { keyId: settings.razorpayKeyId, keySecret };
  } catch {
    return null;
  }
}

// ─── Create a Razorpay order via their API ────────────────────────────────────

export async function createRazorpayOrder(
  keyId: string,
  keySecret: string,
  amountInRupees: number,
  currency: string = 'INR',
  receipt: string
): Promise<{ id: string; amount: number; currency: string }> {
  const amountInPaise = Math.round(amountInRupees * 100); // Razorpay uses paise

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt,
      payment_capture: 1 // Auto-capture
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.description || 'Failed to create Razorpay order');
  }

  return response.json();
}

// ─── Verify payment signature (HMAC-SHA256) ───────────────────────────────────

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  keySecret: string
): boolean {
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');
  return expectedSignature === razorpaySignature;
}

// ─── Verify webhook signature ─────────────────────────────────────────────────

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}
