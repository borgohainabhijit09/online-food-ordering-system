import { Request, Response } from 'express';
import prisma from '../services/prisma';

export const getRawMaterials = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const rawMaterials = await prisma.rawMaterial.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
    res.json(rawMaterials);
  } catch (error) {
    console.error('Error fetching raw materials:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createRawMaterial = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, unit, currentStock, minimumStock, costPerUnit } = req.body;

    const rawMaterial = await prisma.rawMaterial.create({
      data: {
        tenantId,
        name,
        unit,
        currentStock: Number(currentStock),
        minimumStock: Number(minimumStock),
        costPerUnit: Number(costPerUnit)
      }
    });
    res.json(rawMaterial);
  } catch (error) {
    console.error('Error creating raw material:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRawMaterial = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;
    const { name, unit, currentStock, minimumStock, costPerUnit } = req.body;

    const rawMaterial = await prisma.rawMaterial.update({
      where: { id, tenantId },
      data: {
        name,
        unit,
        currentStock: Number(currentStock),
        minimumStock: Number(minimumStock),
        costPerUnit: Number(costPerUnit)
      }
    });
    res.json(rawMaterial);
  } catch (error) {
    console.error('Error updating raw material:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRawMaterial = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;

    await prisma.rawMaterial.delete({
      where: { id, tenantId }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Recipes ---

export const getRecipes = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const recipes = await prisma.recipe.findMany({
      where: { tenantId },
      include: {
        product: true,
        ingredients: {
          include: {
            rawMaterial: true
          }
        }
      }
    });
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createOrUpdateRecipe = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId, ingredients } = req.body;
    // ingredients: Array of { rawMaterialId, quantity }

    // Check if recipe already exists for product
    let recipe = await prisma.recipe.findUnique({
      where: { productId }
    });

    if (recipe) {
      if (recipe.tenantId !== tenantId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Delete existing ingredients to recreate them
      await prisma.recipeIngredient.deleteMany({
        where: { recipeId: recipe.id }
      });
      
      recipe = await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          ingredients: {
            create: ingredients.map((ing: any) => ({
              rawMaterialId: ing.rawMaterialId,
              quantity: Number(ing.quantity)
            }))
          }
        },
        include: {
          ingredients: {
            include: {
              rawMaterial: true
            }
          },
          product: true
        }
      });
    } else {
      recipe = await prisma.recipe.create({
        data: {
          tenantId,
          productId,
          ingredients: {
            create: ingredients.map((ing: any) => ({
              rawMaterialId: ing.rawMaterialId,
              quantity: Number(ing.quantity)
            }))
          }
        },
        include: {
          ingredients: {
            include: {
              rawMaterial: true
            }
          },
          product: true
        }
      });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;

    await prisma.recipe.delete({
      where: { id, tenantId }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getConsumptionForecast = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const days = parseInt(req.query.days as string) || 7;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Fetch orders in the last 30 days
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['DELIVERED', 'SERVED'] }, // Assuming successful orders
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        items: true
      }
    });

    const last15DaysItems: Record<string, number> = {};
    const previous15DaysItems: Record<string, number> = {};

    for (const order of orders) {
      const isRecent = order.createdAt >= fifteenDaysAgo;
      const targetMap = isRecent ? last15DaysItems : previous15DaysItems;
      for (const item of order.items) {
        const current = targetMap[item.productId] || 0;
        targetMap[item.productId] = current + item.quantity;
      }
    }

    // Fetch all recipes for this tenant
    const recipes = await prisma.recipe.findMany({
      where: { tenantId },
      include: {
        ingredients: {
          include: {
            rawMaterial: true
          }
        }
      }
    });

    const rawMaterialUsage30Days: Record<string, { rm: any, totalQty: number, recentQty: number, prevQty: number }> = {};

    for (const recipe of recipes) {
      const recentSold = last15DaysItems[recipe.productId] || 0;
      const prevSold = previous15DaysItems[recipe.productId] || 0;
      const totalSold = recentSold + prevSold;

      for (const ing of recipe.ingredients) {
        if (!rawMaterialUsage30Days[ing.rawMaterialId]) {
          rawMaterialUsage30Days[ing.rawMaterialId] = {
            rm: ing.rawMaterial,
            totalQty: 0,
            recentQty: 0,
            prevQty: 0
          };
        }
        
        const usage = rawMaterialUsage30Days[ing.rawMaterialId];
        if (usage) {
          usage.totalQty += (totalSold * ing.quantity);
          usage.recentQty += (recentSold * ing.quantity);
          usage.prevQty += (prevSold * ing.quantity);
        }
      }
    }

    const forecast = Object.values(rawMaterialUsage30Days).map(usage => {
      const { rm, totalQty, recentQty, prevQty } = usage;
      
      const averageDailyConsumption = totalQty / 30;
      const predictedNeeded = Math.ceil(averageDailyConsumption * days);
      
      let pctChange = 0;
      if (prevQty > 0) {
        pctChange = Math.round(((recentQty - prevQty) / prevQty) * 100);
      } else if (recentQty > 0) {
        pctChange = 100; // infinite basically, capped at 100%
      }

      let trend = 'flat';
      if (pctChange > 5) trend = 'up';
      else if (pctChange < -5) trend = 'down';

      return {
        id: rm.id,
        ingredient: rm.name,
        currentStock: rm.currentStock,
        predictedNeeded,
        trend,
        pctChange,
        unit: rm.unit,
        costPerUnit: rm.costPerUnit
      };
    });

    // Sort by largest deficit first
    forecast.sort((a, b) => {
      const deficitA = Math.max(0, a.predictedNeeded - a.currentStock);
      const deficitB = Math.max(0, b.predictedNeeded - b.currentStock);
      return deficitB - deficitA;
    });

    res.json(forecast);
  } catch (error) {
    console.error('Error generating consumption forecast:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
