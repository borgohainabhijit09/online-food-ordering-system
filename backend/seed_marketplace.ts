import 'dotenv/config';
import { MarketplaceProductType } from '@prisma/client';
import prisma from './src/services/prisma';

const marketplaceProducts = [
  // Food Containers (PHYSICAL)
  { title: 'Aluminium Containers', description: 'High quality aluminium containers for hot and cold food packaging.', price: 99.0, category: 'Food Containers', type: MarketplaceProductType.PHYSICAL },
  { title: 'Microwave Containers', description: 'Microwave safe containers suitable for reheating and takeaways.', price: 149.0, category: 'Food Containers', type: MarketplaceProductType.PHYSICAL },
  { title: 'Plastic Containers', description: 'Durable, food-grade plastic containers for various cuisines.', price: 89.0, category: 'Food Containers', type: MarketplaceProductType.PHYSICAL },
  { title: 'Kraft Food Boxes', description: 'Eco-friendly kraft boxes for salads, noodles, and rice bowls.', price: 129.0, category: 'Food Containers', type: MarketplaceProductType.PHYSICAL },
  { title: 'Bento Boxes', description: 'Premium multi-compartment bento boxes for meal combos.', price: 199.0, category: 'Food Containers', type: MarketplaceProductType.PHYSICAL },
  { title: 'Meal Trays', description: 'Sturdy meal trays with compartments for dine-in and delivery.', price: 159.0, category: 'Food Containers', type: MarketplaceProductType.PHYSICAL },

  // Carry Bags (PHYSICAL)
  { title: 'Paper Carry Bags', description: 'Eco-friendly paper carry bags with strong handles.', price: 49.0, category: 'Carry Bags', type: MarketplaceProductType.PHYSICAL },
  { title: 'Kraft Bags', description: 'Durable brown kraft bags for takeaway orders.', price: 39.0, category: 'Carry Bags', type: MarketplaceProductType.PHYSICAL },
  { title: 'D-Cut Bags', description: 'Sturdy non-woven D-cut bags for multiple items.', price: 29.0, category: 'Carry Bags', type: MarketplaceProductType.PHYSICAL },
  { title: 'Printed Carry Bags', description: 'Custom printed carry bags with your restaurant logo.', price: 89.0, category: 'Carry Bags', type: MarketplaceProductType.PHYSICAL },

  // Packaging Accessories (PHYSICAL)
  { title: 'Stickers', description: 'Custom logo stickers for food packaging.', price: 499.0, category: 'Packaging Accessories', type: MarketplaceProductType.PHYSICAL },
  { title: 'Thank You Labels', description: 'Pre-printed Thank You labels for sealing delivery bags.', price: 299.0, category: 'Packaging Accessories', type: MarketplaceProductType.PHYSICAL },

  // Social Media (SERVICE)
  { title: 'Instagram Management', description: 'Professional Instagram account management and growth strategies.', price: 9999.0, category: 'Social Media', type: MarketplaceProductType.SERVICE },
  { title: 'Facebook Management', description: 'Targeted Facebook page management and community engagement.', price: 7999.0, category: 'Social Media', type: MarketplaceProductType.SERVICE },
  { title: 'Content Creation', description: 'High-quality graphic design and copywriting for social posts.', price: 5999.0, category: 'Social Media', type: MarketplaceProductType.SERVICE },
  { title: 'Reels Creation', description: 'Trendy, engaging short-form video reels for your brand.', price: 4999.0, category: 'Social Media', type: MarketplaceProductType.SERVICE },
  { title: 'Monthly Posting Plans', description: 'Consistent 30-day posting schedule across all platforms.', price: 14999.0, category: 'Social Media', type: MarketplaceProductType.SERVICE },

  // SEO (SERVICE)
  { title: 'Google Business Profile Setup', description: 'Complete setup and optimization of your Google My Business profile.', price: 2999.0, category: 'SEO', type: MarketplaceProductType.SERVICE },
  { title: 'Google Reviews Campaign', description: 'Automated campaigns to generate genuine 5-star Google reviews.', price: 3999.0, category: 'SEO', type: MarketplaceProductType.SERVICE },
  { title: 'Local SEO', description: 'Comprehensive local search engine optimization to rank higher.', price: 8999.0, category: 'SEO', type: MarketplaceProductType.SERVICE },

  // Branding (SERVICE)
  { title: 'Logo Design', description: 'Custom, professional logo design tailored for restaurants.', price: 4999.0, category: 'Branding', type: MarketplaceProductType.SERVICE },
  { title: 'Menu Design', description: 'Visually appealing and appetizing restaurant menu design.', price: 3499.0, category: 'Branding', type: MarketplaceProductType.SERVICE },
  { title: 'Brand Identity Package', description: 'Complete branding package including colors, fonts, and assets.', price: 12999.0, category: 'Branding', type: MarketplaceProductType.SERVICE },

  // Food Photography & Video Services (SERVICE)
  { title: 'Product Photography', description: 'High-resolution professional photos of your individual dishes.', price: 5999.0, category: 'Food Photography', type: MarketplaceProductType.SERVICE },
  { title: 'Menu Photography', description: 'Full menu photoshoot for delivery apps and printed menus.', price: 9999.0, category: 'Food Photography', type: MarketplaceProductType.SERVICE },
  { title: 'Social Media Photography', description: 'Stylized, aesthetic photos optimized for Instagram and Facebook.', price: 7999.0, category: 'Food Photography', type: MarketplaceProductType.SERVICE },
  { title: 'Reels Shoot', description: 'On-location video shoot specifically formatted for Reels/TikTok.', price: 6999.0, category: 'Video Services', type: MarketplaceProductType.SERVICE },
  { title: 'Promo Video', description: 'Cinematic promotional video showcasing your restaurant.', price: 14999.0, category: 'Video Services', type: MarketplaceProductType.SERVICE },
  { title: 'Restaurant Walkthrough Video', description: 'Immersive video tour of your restaurant ambiance and kitchen.', price: 11999.0, category: 'Video Services', type: MarketplaceProductType.SERVICE },
];

async function main() {
  console.log('Seeding marketplace products...');
  for (const product of marketplaceProducts) {
    await prisma.marketplaceProduct.create({
      data: product
    });
  }
  console.log('Finished seeding marketplace products!');
}

main()
  .catch(e => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
