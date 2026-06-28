import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma';
import { validateCoupon } from '../services/coupon.service';

interface TenantReq extends Request { tenantId?: string; }

export const getOrders = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { tableId, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    const whereClause: any = { tenantId: req.tenantId };
    
    if (tableId) whereClause.tableId = tableId as string;
    if (status) {
      if (status === 'ACTIVE') {
        whereClause.status = { notIn: ['DELIVERED', 'CANCELLED'] };
      } else if (status === 'KOT') {
        whereClause.status = { in: ['NEW', 'ACCEPTED', 'PREPARING'] };
      } else {
        whereClause.status = status as string;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          table: true,
          items: {
            include: { addons: true }
          }
        }
      }),
      prisma.order.count({ where: whereClause })
    ]);

    // Fetch product names to attach to items
    const productIds = [...new Set(orders.flatMap(o => o.items.map(i => i.productId)))];
    let productMap: Record<string, string> = {};
    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      });
      productMap = Object.fromEntries(products.map(p => [p.id, p.name]));
    }

    const ordersWithNames = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: { name: productMap[item.productId] || `Product #${item.productId.slice(-4).toUpperCase()}` }
      }))
    }));

    res.status(200).json({
      orders: ordersWithNames,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + orders.length < total
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getNewOrdersCount = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.order.count({
      where: { tenantId: req.tenantId, status: { in: ['NEW', 'READY'] } }
    });
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: { id: id as string, tenantId: req.tenantId },
      include: {
        table: true,
        items: {
          include: { addons: true }
        }
      }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Fetch product names to attach to items
    const productIds = order.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    
    const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));
    
    const orderWithNames = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        productName: productMap[item.productId] || `Product #${item.productId.slice(-4).toUpperCase()}`
      }))
    };

    res.status(200).json(orderWithNames);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, prepTimeMinutes } = req.body;
    
    const existing = await prisma.order.findFirst({ where: { id: id as string, tenantId: req.tenantId } });
    if (!existing) return res.status(404).json({ message: 'Order not found' });

    const updateData: any = { status };
    if (status === 'PREPARING' && prepTimeMinutes !== undefined) {
      const minutes = parseInt(prepTimeMinutes);
      if (!isNaN(minutes)) {
        updateData.prepTimeMinutes = minutes;
        updateData.estimatedCompletionTime = new Date(Date.now() + minutes * 60 * 1000);
      }
    }

    const order = await prisma.order.update({
      where: { id: id as string },
      data: updateData
    });
    
    // Free the table if order is completed or cancelled
    if (existing.tableId && (status === 'SERVED' || status === 'CANCELLED' || status === 'DELIVERED')) {
      await prisma.restaurantTable.update({
        where: { id: existing.tableId },
        data: { status: 'AVAILABLE' }
      });
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: TenantReq, res: Response, next: NextFunction) => {
  try {
    const { customerName, phone, address, latitude, longitude, total, items, remarks, couponCode, dob, orderType, tableId } = req.body;

    let finalTotal = total;
    let appliedDiscount = 0;

    // Validate Coupon Server-Side
    if (couponCode) {
      const rawCartTotal = items.reduce((sum: number, item: any) => {
        const addonTotal = item.addons?.reduce((a: number, addon: any) => a + addon.price, 0) || 0;
        return sum + (item.price + addonTotal) * item.quantity;
      }, 0);

      const couponResult = await validateCoupon({
        tenantId: req.tenantId!,
        couponCode,
        phone,
        cartTotal: rawCartTotal
      });

      if (!couponResult.valid) {
        return res.status(400).json({ message: couponResult.message });
      }

      appliedDiscount = couponResult.discountAmount!;
      // Note: we don't overwrite finalTotal with couponResult.finalAmount because finalTotal includes delivery fees sent by frontend.
    }

    // Upsert Customer Profile
    const customer = await prisma.customer.upsert({
      where: {
        tenantId_phone: { tenantId: req.tenantId!, phone: phone }
      },
      update: {
        name: customerName,
        ...(dob ? { dob: new Date(dob) } : {})
      },
      create: {
        tenantId: req.tenantId!,
        name: customerName,
        phone: phone,
        ...(dob ? { dob: new Date(dob) } : {})
      }
    });

    let existingActiveOrder = null;
    if (orderType === 'DINE_IN' && tableId) {
      existingActiveOrder = await prisma.order.findFirst({
        where: {
          tableId,
          tenantId: req.tenantId!,
          status: { notIn: ['DELIVERED', 'CANCELLED', 'SERVED'] }
        }
      });
    }

    let order;

    if (existingActiveOrder) {
      order = await prisma.order.update({
        where: { id: existingActiveOrder.id },
        data: {
          total: existingActiveOrder.total + finalTotal,
          discountAmount: (existingActiveOrder.discountAmount || 0) + appliedDiscount,
          remarks: remarks ? (existingActiveOrder.remarks ? `${existingActiveOrder.remarks} | Appended: ${remarks}` : remarks) : existingActiveOrder.remarks,
          status: 'NEW', // Alert kitchen of new items
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              variant: item.variant,
              addons: {
                create: item.addons?.map((addon: any) => ({
                  addonName: addon.addonName,
                  price: addon.price
                })) || []
              }
            }))
          }
        },
        include: {
          items: {
            include: { addons: true }
          }
        }
      });
    } else {
      order = await prisma.order.create({
        data: {
          customerName,
          phone,
          address,
          latitude,
          longitude,
          orderType: orderType || 'DELIVERY',
          table: tableId ? { connect: { id: tableId } } : undefined,
          total: finalTotal,
          couponCode: couponCode || null,
          discountAmount: appliedDiscount,
          remarks,
          status: 'NEW',
          tenant: { connect: { id: req.tenantId! } },
          customer: { connect: { id: customer.id } },
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              variant: item.variant,
              addons: {
                create: item.addons?.map((addon: any) => ({
                  addonName: addon.addonName,
                  price: addon.price
                })) || []
              }
            }))
          }
        },
        include: {
          items: {
            include: { addons: true }
          }
        }
      });
    }

    // Set table status to occupied if it's a new Dine-In order or appended
    if (tableId && orderType === 'DINE_IN') {
      await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });
    }

    // Recipe Based Inventory Deduction
    try {
      for (const item of items) {
        const recipe = await prisma.recipe.findUnique({
          where: { productId: item.productId },
          include: { ingredients: true }
        });

        if (recipe) {
          for (const ingredient of recipe.ingredients) {
            const totalQuantityNeeded = ingredient.quantity * item.quantity;
            await prisma.rawMaterial.update({
              where: { id: ingredient.rawMaterialId },
              data: {
                currentStock: {
                  decrement: totalQuantityNeeded
                }
              }
            });
          }
        }
      }
    } catch (invError) {
      console.error('Failed to deduct inventory for order:', invError);
      // Proceed with order even if inventory deduction fails
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};
