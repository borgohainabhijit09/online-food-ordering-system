import { Request, Response } from 'express';
import prisma from '../services/prisma';

export const getPublicRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category } = req.query;

    const locationKeywords = ['dibrugarh', 'assam', 'guwahati', 'near me', 'near', 'location', 'my location', 'here', 'city', 'area'];
    const isLocationSearch = search && locationKeywords.some((loc) => String(search).toLowerCase().includes(loc));

    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        ...(search && !isLocationSearch
          ? {
              OR: [
                { businessName: { contains: String(search), mode: 'insensitive' } },
                { slug: { contains: String(search), mode: 'insensitive' } },
                { settings: { restaurantName: { contains: String(search), mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        businessName: true,
        slug: true,
        phone: true,
        settings: {
          select: {
            restaurantName: true,
            isAcceptingOrders: true,
            deliveryRadiusKm: true,
            hasDeliveryCharge: true,
            deliveryChargeAmount: true,
            minOrderValueForDelivery: true,
            logoUrl: true,
            restaurantLat: true,
            restaurantLng: true,
            whatsappNumber: true,
          },
        },
        categories: {
          where: { isActive: true },
          select: { id: true, name: true },
          take: 5,
        },
        _count: {
          select: {
            products: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tenants.map((t, index) => {
      const cuisines = t.categories.map((c) => c.name);
      return {
        id: t.id,
        name: t.settings?.restaurantName || t.businessName,
        slug: t.slug,
        phone: t.phone || t.settings?.whatsappNumber,
        logoUrl: t.settings?.logoUrl || null,
        imageUrl: t.settings?.logoUrl || null,
        isAcceptingOrders: t.settings?.isAcceptingOrders ?? true,
        deliveryRadiusKm: t.settings?.deliveryRadiusKm ?? 5,
        deliveryFee: t.settings?.hasDeliveryCharge ? t.settings.deliveryChargeAmount : 0,
        minOrder: t.settings?.minOrderValueForDelivery ?? 0,
        cuisines: cuisines.length > 0 ? cuisines : ['Multi-Cuisine', 'Fast Food'],
        cuisineText: cuisines.length > 0 ? cuisines.join(' • ') : 'Indian • Fast Food • Beverages',
        rating: 4.4 + ((index % 5) * 0.1),
        reviewCount: 40 + (index * 17),
        prepTime: '20-30 min',
        distance: `${(1.2 + (index * 0.4)).toFixed(1)} km`,
        totalProducts: t._count.products,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching public restaurants:', error);
    res.status(500).json({ message: 'Failed to fetch restaurants' });
  }
};

export const getPublicRestaurantBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: String(slug) },
      select: {
        id: true,
        businessName: true,
        slug: true,
        phone: true,
        settings: {
          select: {
            restaurantName: true,
            isAcceptingOrders: true,
            deliveryRadiusKm: true,
            hasDeliveryCharge: true,
            deliveryChargeAmount: true,
            minOrderValueForDelivery: true,
            logoUrl: true,
            restaurantLat: true,
            restaurantLng: true,
            whatsappNumber: true,
            fssaiNumber: true,
          },
        },
        categories: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            products: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                description: true,
                basePrice: true,
                offerPrice: true,
                isTrending: true,
                dietaryPreference: true,
                isSpicy: true,
                images: { select: { id: true, url: true } },
                variants: { select: { id: true, name: true, price: true, offerPrice: true } },
                addons: {
                  select: {
                    addon: {
                      select: { id: true, name: true, price: true, imageUrl: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!tenant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const categoriesWithProducts = tenant.categories.map((c) => ({
      id: c.id,
      name: c.name,
      products: c.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        offerPrice: p.offerPrice,
        price: p.offerPrice && p.offerPrice < p.basePrice ? p.offerPrice : p.basePrice,
        isTrending: p.isTrending,
        dietaryPreference: p.dietaryPreference,
        isSpicy: p.isSpicy,
        images: p.images.map((img) => img.url),
        image: p.images[0]?.url || null,
        variants: p.variants,
        addons: p.addons.map((pa) => pa.addon),
      })),
    }));

    res.json({
      id: tenant.id,
      name: tenant.settings?.restaurantName || tenant.businessName,
      slug: tenant.slug,
      phone: tenant.phone || tenant.settings?.whatsappNumber,
      logoUrl: tenant.settings?.logoUrl || null,
      isAcceptingOrders: tenant.settings?.isAcceptingOrders ?? true,
      deliveryRadiusKm: tenant.settings?.deliveryRadiusKm ?? 5,
      deliveryFee: tenant.settings?.hasDeliveryCharge ? tenant.settings.deliveryChargeAmount : 0,
      minOrder: tenant.settings?.minOrderValueForDelivery ?? 0,
      fssaiNumber: tenant.settings?.fssaiNumber || null,
      rating: 4.6,
      reviewCount: 128,
      prepTime: '20-30 min',
      categories: categoriesWithProducts,
    });
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant details' });
  }
};

export const trackPublicOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: String(id) },
      include: {
        table: true,
        items: {
          include: { addons: true },
        },
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            phone: true,
            settings: {
              select: {
                restaurantName: true,
                logoUrl: true,
                whatsappNumber: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const productIds = order.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, dietaryPreference: true },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    const formattedItems = order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: productMap[item.productId]?.name || `Item #${item.productId.slice(-4).toUpperCase()}`,
      dietaryPreference: productMap[item.productId]?.dietaryPreference || 'VEG',
      quantity: item.quantity,
      price: item.price,
      variantName: item.variant,
      addons: item.addons.map((a) => ({ name: a.addonName, price: a.price })),
    }));

    res.json({
      id: order.id,
      status: order.status,
      orderType: order.orderType,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      tableNumber: order.table ? (order.table.tableName || order.table.tableNumber) : null,
      total: order.total,
      discountAmount: order.discountAmount || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      prepTimeMinutes: order.prepTimeMinutes || 25,
      estimatedCompletionTime: order.estimatedCompletionTime,
      createdAt: order.createdAt,
      remarks: order.remarks,
      restaurant: {
        id: order.tenant.id,
        name: order.tenant.settings?.restaurantName || order.tenant.businessName,
        slug: order.tenant.slug,
        phone: order.tenant.phone || order.tenant.settings?.whatsappNumber,
        logoUrl: order.tenant.settings?.logoUrl || null,
      },
      items: formattedItems,
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ message: 'Failed to track order' });
  }
};

export const getPublicOrdersByPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;
    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        phone: { contains: String(phone).replace(/\D/g, '').slice(-10) },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        table: true,
        items: true,
        tenant: {
          select: {
            businessName: true,
            slug: true,
            settings: {
              select: {
                restaurantName: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    const productIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

    const formatted = orders.map((order) => ({
      id: order.id,
      status: order.status,
      orderType: order.orderType,
      total: order.total,
      createdAt: order.createdAt,
      restaurantName: order.tenant.settings?.restaurantName || order.tenant.businessName,
      restaurantSlug: order.tenant.slug,
      restaurantLogo: order.tenant.settings?.logoUrl || null,
      tableNumber: order.table ? (order.table.tableName || order.table.tableNumber) : null,
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      itemsSummary: order.items
        .map((i) => `${i.quantity}x ${productMap[i.productId] || 'Item'}`)
        .slice(0, 3)
        .join(', ') + (order.items.length > 3 ? ` +${order.items.length - 3} more` : ''),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Failed to fetch customer orders' });
  }
};

export const getPublicCustomerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

    // Fetch customer records across tenants
    const customers = await prisma.customer.findMany({
      where: { phone: { contains: cleanPhone } },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            settings: {
              select: {
                restaurantName: true,
                logoUrl: true,
                loyaltyEnabled: true,
                pointValueInRupees: true,
                minimumPointsToRedeem: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch recent orders to get recent name & distinct addresses
    const recentOrders = await prisma.order.findMany({
      where: { phone: { contains: cleanPhone } },
      select: {
        id: true,
        address: true,
        latitude: true,
        longitude: true,
        customerName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    // Determine latest name
    const latestName = recentOrders[0]?.customerName || customers[0]?.name || '';
    const dob = customers.find((c) => c.dob)?.dob || null;

    // Collect distinct non-empty delivery addresses
    const addressMap = new Map<string, any>();
    recentOrders.forEach((o) => {
      if (o.address && o.address.trim()) {
        const trimmed = o.address.trim();
        if (!addressMap.has(trimmed)) {
          const count = addressMap.size;
          const label = count === 0 ? 'Home' : count === 1 ? 'Work' : 'Other';
          addressMap.set(trimmed, {
            id: o.id,
            label,
            address: trimmed,
            latitude: o.latitude,
            longitude: o.longitude,
          });
        }
      }
    });

    const addresses = Array.from(addressMap.values());

    // Collect loyalty passes across restaurants
    const loyalty = customers
      .filter((c) => (c.loyaltyPoints && c.loyaltyPoints > 0) || c.tenant.settings?.loyaltyEnabled)
      .map((c) => ({
        tenantId: c.tenantId,
        restaurantName: c.tenant.settings?.restaurantName || c.tenant.businessName,
        restaurantSlug: c.tenant.slug,
        restaurantLogo: c.tenant.settings?.logoUrl || null,
        points: c.loyaltyPoints || 0,
        pointValueInRupees: c.tenant.settings?.pointValueInRupees || 1,
        minimumPointsToRedeem: c.tenant.settings?.minimumPointsToRedeem || 50,
      }));

    res.json({
      phone: cleanPhone,
      name: latestName,
      dob: dob ? dob.toISOString().split('T')[0] : null,
      addresses,
      loyalty,
      totalOrders: recentOrders.length,
    });
  } catch (error) {
    console.error('Error fetching public customer profile:', error);
    res.status(500).json({ message: 'Failed to fetch customer profile' });
  }
};

export const updatePublicCustomerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, name, dob } = req.body;
    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);

    // Update customer records for this phone across tenants
    if (name || dob) {
      await prisma.customer.updateMany({
        where: { phone: { contains: cleanPhone } },
        data: {
          ...(name ? { name: String(name).trim() } : {}),
          ...(dob ? { dob: new Date(dob) } : {}),
        },
      });
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ message: 'Failed to update customer profile' });
  }
};
