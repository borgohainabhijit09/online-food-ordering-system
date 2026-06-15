import { Request, Response } from 'express';
import prisma from '../services/prisma';

// -----------------------------------------------------
// SUPER ADMIN MARKETPLACE ENDPOINTS
// -----------------------------------------------------

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.marketplaceProduct.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { title, description, price, category, type, imageUrl, isActive } = req.body;
    
    if (!title || !description || price === undefined || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await prisma.marketplaceProduct.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        type: type || 'PHYSICAL',
        imageUrl: imageUrl || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description, price, category, type, imageUrl, isActive } = req.body;

    const product = await prisma.marketplaceProduct.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(type && { type }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.marketplaceProduct.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Requests
export const getRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.marketplaceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        tenant: {
          select: {
            businessName: true,
            email: true,
            phone: true
          }
        }
      }
    });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching marketplace requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const updateRequestStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['PENDING', 'PROCESSING', 'FULFILLED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await prisma.marketplaceRequest.update({
      where: { id },
      data: { status },
      include: {
        product: true,
        tenant: {
          select: {
            businessName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.json(request);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};
