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
