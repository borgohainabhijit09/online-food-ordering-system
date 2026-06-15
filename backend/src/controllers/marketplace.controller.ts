import { Request, Response } from 'express';
import prisma from '../services/prisma';

// -----------------------------------------------------
// TENANT MARKETPLACE ENDPOINTS
// -----------------------------------------------------

export const getMarketplaceProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.marketplaceProduct.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createPurchaseRequest = async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;
    const { productId, quantity, notes } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const request = await prisma.marketplaceRequest.create({
      data: {
        tenantId,
        productId,
        quantity: quantity || 1,
        notes: notes || null
      },
      include: {
        product: true
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating purchase request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
};

export const getMyRequests = async (req: Request, res: Response) => {
  try {
    const { tenantId } = (req as any).user;

    const requests = await prisma.marketplaceRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: true
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching tenant marketplace requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};
