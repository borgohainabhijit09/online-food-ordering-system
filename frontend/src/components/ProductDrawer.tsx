'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '../store/useCartStore';

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any; // We'll type this properly later
}

export function ProductDrawer({ isOpen, onClose, product }: ProductDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  const addItem = useCartStore(state => state.addItem);

  const productVariants = product?.variants || [];
  const productAddons = product?.addons?.map((pa: any) => pa.addon) || [];

  const handleAddonToggle = (id: string) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    let total = product?.offerPrice ?? product?.basePrice ?? 0;
    if (selectedVariant) {
      const v = productVariants.find((v: any) => v.id === selectedVariant);
      if (v) total = v.offerPrice ?? v.price;
    }
    selectedAddons.forEach(addonId => {
      const a = productAddons.find((a: any) => a.id === addonId);
      if (a) total += a.price;
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    let variantObj;
    if (selectedVariant) {
      const v = productVariants.find((v: any) => v.id === selectedVariant);
      if (v) variantObj = { id: v.id, name: v.name, price: v.offerPrice ?? v.price };
    }
    
    const addonsObj = selectedAddons.map(id => {
      const a = productAddons.find((a: any) => a.id === id);
      return { id: a!.id, name: a!.name, price: a!.price };
    });

    addItem({
      productId: product.id,
      name: product.name,
      price: product.offerPrice ?? product.basePrice ?? product.price, // Fallback for safety
      quantity,
      variant: variantObj,
      addons: addonsObj
    });
    
    // Reset state and close
    setQuantity(1);
    setSelectedVariant(null);
    setSelectedAddons([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-50 max-h-[90vh] overflow-hidden flex flex-col md:max-w-md md:mx-auto shadow-2xl"
          >
            {/* Header / Image */}
            <div className="relative h-56 flex-shrink-0">
              <Image 
                src={product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop'} 
                alt={product?.name || 'Product'} 
                fill 
                className="object-cover w-full h-full" 
                sizes="(max-width: 768px) 100vw, 400px" 
                priority
              />
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-between">
                {product?.name}
                {product?.offerPrice && (
                  <span className="text-sm font-normal text-neutral-500 line-through">₹{product.basePrice}</span>
                )}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6">{product?.description}</p>

              {/* Variants */}
              {productVariants && productVariants.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3 flex items-center justify-between">
                    Size/Variant
                    <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">Required</span>
                  </h3>
                  <div className="space-y-2">
                    {productVariants.map((variant: any) => (
                      <label 
                        key={variant.id} 
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedVariant === variant.id 
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="variant" 
                            checked={selectedVariant === variant.id}
                            onChange={() => setSelectedVariant(variant.id)}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="font-medium">{variant.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          {variant.offerPrice ? (
                            <>
                              <span className="font-bold text-orange-600 dark:text-orange-500">₹{variant.offerPrice}</span>
                              <span className="text-xs text-neutral-400 line-through">₹{variant.price}</span>
                            </>
                          ) : (
                            <span className="font-medium">₹{variant.price}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {productAddons && productAddons.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold mb-3 flex items-center justify-between">
                    Add-ons
                    <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">Optional</span>
                  </h3>
                  <div className="space-y-2">
                    {productAddons.map((addon: any) => (
                      <label 
                        key={addon.id} 
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAddons.includes(addon.id)
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedAddons.includes(addon.id)}
                            onChange={() => handleAddonToggle(addon.id)}
                            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                          />
                          {addon.imageUrl && (
                            <img src={addon.imageUrl} alt={addon.name} className="w-10 h-10 object-cover rounded-md border border-neutral-200 dark:border-neutral-700" />
                          )}
                          <span className="font-medium">{addon.name}</span>
                        </div>
                        <span className="text-neutral-500">+₹{addon.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-4">
              <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-xl">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-white dark:bg-neutral-700 rounded-lg shadow-sm"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white dark:bg-neutral-700 rounded-lg shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-orange-600/30 transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                Add item • ₹{calculateTotal()}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
