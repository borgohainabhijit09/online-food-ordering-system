'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, ShoppingCart } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: 'PHYSICAL' | 'SERVICE';
  imageUrl?: string;
}

export default function TenantMarketplaceStorefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/api/marketplace/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/api/marketplace/requests', {
        productId: selectedProduct.id,
        quantity,
        notes
      });
      if (res.ok) {
        setSelectedProduct(null);
        setQuantity(1);
        setNotes('');
        setSuccessMessage('Purchase request submitted successfully! We will contact you shortly.');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to submit request', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  // Group by category
  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="space-y-8 relative">
      {successMessage && (
        <div className="fixed top-4 right-4 bg-emerald-50 text-emerald-700 border border-emerald-200 px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {products.length > 0 && categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            All Products
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <ShoppingCart className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Storefront is empty</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">Check back later for exciting new products and services!</p>
        </div>
      ) : (
        (selectedCategory ? [selectedCategory] : categories).map(category => (
          <div key={category} className="space-y-4">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white pb-2 border-b border-neutral-200 dark:border-neutral-800">
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.filter(p => p.category === category).map(product => (
                <div key={product.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50 group">
                  {product.imageUrl && (
                    <div className="w-full h-48 bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 relative">
                      <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${
                        product.type === 'SERVICE' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      }`}>
                        {product.type}
                      </span>
                      <span className="font-bold text-lg text-neutral-900 dark:text-white">
                        ₹{product.price.toFixed(2)}
                      </span>
                    </div>
                    <h4 className="font-bold text-xl mb-2 text-neutral-900 dark:text-white group-hover:text-orange-600 transition-colors">
                      {product.title}
                    </h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                  <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 mt-auto">
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-xl font-medium hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white transition-colors"
                    >
                      Request {product.type === 'SERVICE' ? 'Service' : 'Product'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Submit Request</h3>
              <p className="text-sm text-neutral-500 mt-1">For {selectedProduct.title}</p>
            </div>
            <form onSubmit={handleRequest} className="p-6 space-y-5">
              
              {selectedProduct.type === 'PHYSICAL' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)} 
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors" 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Additional Notes (Optional)</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors h-32 resize-none" 
                  placeholder="Any specific requirements or questions..."
                />
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-orange-800 dark:text-orange-200 font-medium">Estimated Total:</span>
                  <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                    ₹{(selectedProduct.price * quantity).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70 mt-1 text-center">
                  You will not be charged yet. Our team will contact you to confirm details and arrange payment.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setSelectedProduct(null)} className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
