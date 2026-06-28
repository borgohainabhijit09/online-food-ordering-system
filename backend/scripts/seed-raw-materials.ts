import prisma from '../src/services/prisma';

const defaultMaterials = [
  { name: 'Flour', unit: 'kg', currentStock: 50, minimumStock: 10, costPerUnit: 40 },
  { name: 'Rice', unit: 'kg', currentStock: 100, minimumStock: 20, costPerUnit: 60 },
  { name: 'Chicken', unit: 'kg', currentStock: 30, minimumStock: 10, costPerUnit: 250 },
  { name: 'Tomato', unit: 'kg', currentStock: 20, minimumStock: 5, costPerUnit: 30 },
  { name: 'Onion', unit: 'kg', currentStock: 25, minimumStock: 5, costPerUnit: 40 },
  { name: 'Cheese', unit: 'kg', currentStock: 15, minimumStock: 5, costPerUnit: 400 },
  { name: 'Milk', unit: 'l', currentStock: 50, minimumStock: 10, costPerUnit: 60 },
  { name: 'Cooking Oil', unit: 'l', currentStock: 40, minimumStock: 10, costPerUnit: 150 },
  { name: 'Salt', unit: 'kg', currentStock: 10, minimumStock: 2, costPerUnit: 20 },
  { name: 'Pepper', unit: 'g', currentStock: 500, minimumStock: 100, costPerUnit: 2 }
];

async function seed() {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'demo-restaurant' }
    });

    if (!tenant) {
      throw new Error('No active tenant found');
    }

    console.log(`Seeding raw materials for tenant: ${tenant.slug}`);

    for (const material of defaultMaterials) {
      const exists = await prisma.rawMaterial.findFirst({
        where: { tenantId: tenant.id, name: material.name }
      });

      if (!exists) {
        await prisma.rawMaterial.create({
          data: {
            ...material,
            tenantId: tenant.id
          }
        });
        console.log(`Added: ${material.name}`);
      } else {
        console.log(`Already exists: ${material.name}`);
      }
    }
    console.log('Seeding completed!');
  } catch (error) {
    console.error('Error seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
