"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./src/services/prisma"));
async function seed() {
    await prisma_1.default.subscriptionPackage.upsert({
        where: { name: 'App Only' },
        update: {},
        create: {
            name: 'App Only',
            price: 499,
            features: 'Only the app via web and mobile browser',
        },
    });
    await prisma_1.default.subscriptionPackage.upsert({
        where: { name: 'App + Landing Page' },
        update: {},
        create: {
            name: 'App + Landing Page',
            price: 599,
            features: 'App + Restaurant Landing page maintained by us',
        },
    });
    await prisma_1.default.subscriptionPackage.upsert({
        where: { name: 'App + Landing Page + SMM' },
        update: {},
        create: {
            name: 'App + Landing Page + SMM',
            price: 1499,
            features: 'App + landing page + Social Media Marketing',
        },
    });
    console.log('Successfully seeded subscription packages.');
    process.exit(0);
}
seed();
//# sourceMappingURL=seedPackages.js.map