'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Search, MapPin, Clock, Phone, ChevronRight, Star, Plus, MessageCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ProductDrawer } from '../../components/ProductDrawer';
import { ScrollToTop } from '../../components/ScrollToTop';
import { CallWaiterButton } from '../../components/CallWaiterButton';
import { useCartStore } from '../../store/useCartStore';
import { apiClient } from '../../lib/apiClient';
import { Coffee } from 'lucide-react';

interface Variant { id: string; name: string; price: number; offerPrice?: number | null; }
interface Product {
  id: string; name: string; description: string; basePrice: number; offerPrice?: number | null;
  categoryId: string; isTrending: boolean; dietaryPreference: 'VEG' | 'NON_VEG' | 'VEGAN'; isSpicy: boolean;
  variants: Variant[];
  images: { url: string }[];
  isActive: boolean;
}

export default function Home() {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'VEGAN'>('ALL');
  const [isSpicyFilter, setIsSpicyFilter] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const { orderType, setOrderType, setTableInfo, tableNumber } = useCartStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        const [catRes, prodRes, setRes] = await Promise.all([
          apiClient.get('/api/categories'),
          apiClient.get('/api/products'),
          apiClient.get('/api/settings')
        ]);
        if (catRes.ok) {
          const allCategories = await catRes.json();
          setCategories(allCategories.filter((c: any) => c.isActive !== false));
        } else {
          setCategories([]);
        }

        if (prodRes.ok) {
          const allProducts = await prodRes.json();
          setProducts(allProducts.filter((p: any) => p.isActive));
        } else {
          setProducts([]);
        }

        if (setRes.ok) {
          setSettings(await setRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam) {
      setOrderType('DINE_IN');
      setTableInfo(null, tableParam);
    } else if (!useCartStore.getState().orderType) {
      setOrderType('DELIVERY');
    }

    // Check for active order
    const savedOrderId = localStorage.getItem('activeOrderId');
    if (savedOrderId) {
      setActiveOrderId(savedOrderId);
    }
  }, []);

  const handleAddClick = (product: any) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const cartItemsCount = useCartStore(state => state.getTotalItems());
  const cartTotal = useCartStore(state => state.getTotalPrice());

  const restaurantName = settings?.restaurantName || 'Loading...';



  return (
    <div className="">
      {activeOrderId && (
        <a 
          href={`/${tenantSlug}/track/${activeOrderId}`}
          className="block w-full bg-orange-600 text-white text-center py-2.5 px-4 font-medium text-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 z-50 relative"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          You have an active order! Tap to track it.
          <ChevronRight className="w-4 h-4" />
        </a>
      )}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Restaurant Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
                {settings?.restaurantName?.[0] || 'R'}
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="font-bold text-lg leading-tight tracking-tight">{settings?.restaurantName || 'Menu'}</h1>
              {settings?.isAcceptingOrders === false ? (
                <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Not Accepting Orders
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Accepting Orders
                </div>
              )}
            </div>
          </div>


          <div className="flex items-center gap-2.5">
            <a href={`tel:${settings?.whatsappNumber || ''}`} className="group flex items-center justify-center w-10 h-10 bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 rounded-full backdrop-blur-md border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <Phone className="w-4 h-4 text-neutral-600 dark:text-neutral-300 group-hover:text-orange-500 transition-colors" />
            </a>
            <a href={`https://wa.me/${settings?.whatsappNumber || ''}`} target="_blank" rel="noreferrer" className="group flex items-center justify-center w-10 h-10 bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 rounded-full backdrop-blur-md border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-md hover:border-green-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <MessageCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-300 group-hover:text-green-500 transition-colors" />
            </a>
            <a href={settings?.address ? `https://maps.google.com/?q=${encodeURIComponent(settings.address)}` : '#'} target="_blank" rel="noreferrer" className="group flex items-center justify-center w-10 h-10 bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 rounded-full backdrop-blur-md border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <MapPin className="w-4 h-4 text-neutral-600 dark:text-neutral-300 group-hover:text-blue-500 transition-colors" />
            </a>
          </div>
        </div>
        
        {/* Order Type Toggle Tabs */}
        {isMounted && !tableNumber && (
          <div className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 py-3 px-4 shadow-sm">
            <div className="max-w-5xl mx-auto flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
              <button
                onClick={() => setOrderType('DELIVERY')}
                className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${orderType === 'DELIVERY' || !orderType ? 'bg-white dark:bg-neutral-800 shadow-sm text-orange-600 dark:text-orange-500' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              >
                <MapPin className="w-5 h-5 mb-1" /> Delivery
              </button>
              <button
                onClick={() => setOrderType('TAKEAWAY')}
                className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${orderType === 'TAKEAWAY' ? 'bg-white dark:bg-neutral-800 shadow-sm text-emerald-600 dark:text-emerald-500' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              >
                <Clock className="w-5 h-5 mb-1" /> Takeaway
              </button>
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${orderType === 'DINE_IN' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-500' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
              >
                <Coffee className="w-5 h-5 mb-1" /> Dine-In
              </button>
            </div>
          </div>
        )}
        {/* If tableNumber is set, just show Dine In fixed banner */}
        {isMounted && tableNumber && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-900/50 py-2 px-4 text-sm">
            <div className="max-w-5xl mx-auto w-full flex justify-center items-center">
              <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-400">
                <Coffee className="w-4 h-4" /> Dine In - Table {tableNumber}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6">
        <div className="relative mb-4 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-base shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-neutral-400"
            placeholder="Search for biryani, rolls, desserts..."
          />
        </div>

        {/* Categories Carousel */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 tracking-tight">What's on your mind?</h2>
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                  <div className="w-16 h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex flex-col items-center gap-2 flex-shrink-0 snap-start group"
                >
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-3xl shadow-sm group-hover:shadow-md group-hover:border-orange-200 dark:group-hover:border-orange-900 transition-all group-active:scale-95 overflow-hidden">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-orange-500">{cat.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center text-sm mb-8 pb-2 overflow-x-auto no-scrollbar scroll-smooth snap-x">
          <button 
            onClick={() => setDietFilter('ALL')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border transition-colors snap-start ${dietFilter === 'ALL' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}
          >All</button>
          <button 
            onClick={() => setDietFilter('VEG')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border flex items-center gap-1 transition-colors snap-start ${dietFilter === 'VEG' ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}
          ><span className={`w-2 h-2 rounded-full ${dietFilter === 'VEG' ? 'bg-white' : 'bg-green-600'}`}></span> Veg</button>
          <button 
            onClick={() => setDietFilter('NON_VEG')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border flex items-center gap-1 transition-colors snap-start ${dietFilter === 'NON_VEG' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}
          ><span className={`w-2 h-2 rounded-full ${dietFilter === 'NON_VEG' ? 'bg-white' : 'bg-red-600'}`}></span> Non-Veg</button>
          <button 
            onClick={() => setDietFilter('VEGAN')}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border flex items-center gap-1 transition-colors snap-start ${dietFilter === 'VEGAN' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}
          >🌱 Vegan</button>
          <button 
            onClick={() => setIsSpicyFilter(!isSpicyFilter)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border flex items-center gap-1 transition-colors snap-start ${isSpicyFilter ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`}
          >🌶️ Spicy</button>
        </div>

        <div className="min-h-[50vh]">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">No products found matching your criteria.</div>
          ) : (
            searchQuery ? (
              <section className="mb-12">
                <h2 className="text-xl font-bold mb-6">Search Results for "{searchQuery}"</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products
                    .filter(p => dietFilter === 'ALL' || p.dietaryPreference === dietFilter || (dietFilter === 'VEG' && p.dietaryPreference === 'VEGAN'))
                    .filter(p => !isSpicyFilter || p.isSpicy)
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} settings={settings} onAdd={handleAddClick} />
                  ))}
                </div>
              </section>
            ) : (
              <>
                {products
                  .filter(p => p.offerPrice)
                  .filter(p => dietFilter === 'ALL' || p.dietaryPreference === dietFilter || (dietFilter === 'VEG' && p.dietaryPreference === 'VEGAN'))
                  .filter(p => !isSpicyFilter || p.isSpicy)
                  .length > 0 && (
                  <section id="category-offers" className="scroll-mt-24 mb-12">
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-500">Today's Offers</h2>
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">HOT</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products
                        .filter(p => p.offerPrice)
                        .filter(p => dietFilter === 'ALL' || p.dietaryPreference === dietFilter || (dietFilter === 'VEG' && p.dietaryPreference === 'VEGAN'))
                        .filter(p => !isSpicyFilter || p.isSpicy)
                        .map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} settings={settings} onAdd={handleAddClick} />
                      ))}
                    </div>
                  </section>
                )}

                {products
                  .filter(p => p.isTrending)
                  .filter(p => dietFilter === 'ALL' || p.dietaryPreference === dietFilter || (dietFilter === 'VEG' && p.dietaryPreference === 'VEGAN'))
                  .filter(p => !isSpicyFilter || p.isSpicy)
                  .length > 0 && (
                  <section id="category-trending" className="scroll-mt-24 mb-12">
                    <div className="flex items-center gap-2 mb-6">
                      <h2 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">Trending Now</h2>
                      <Star className="w-5 h-5 text-emerald-500 fill-emerald-500 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products
                        .filter(p => p.isTrending)
                        .filter(p => dietFilter === 'ALL' || p.dietaryPreference === dietFilter || (dietFilter === 'VEG' && p.dietaryPreference === 'VEGAN'))
                        .filter(p => !isSpicyFilter || p.isSpicy)
                        .map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} settings={settings} onAdd={handleAddClick} />
                      ))}
                    </div>
                  </section>
                )}

                {categories.map(cat => {
                  const catProducts = products
                    .filter(p => p.categoryId === cat.id)
                    .filter(p => dietFilter === 'ALL' || p.dietaryPreference === dietFilter || (dietFilter === 'VEG' && p.dietaryPreference === 'VEGAN'))
                    .filter(p => !isSpicyFilter || p.isSpicy);
                  if (catProducts.length === 0) return null;
                    return (
                      <section key={cat.id} id={`category-${cat.id}`} className="scroll-mt-24 mb-12">
                        <h2 className="text-2xl font-bold tracking-tight mb-6">{cat.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {catProducts.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} settings={settings} onAdd={handleAddClick} />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  {products.filter(p => !p.categoryId).length > 0 && (
                    <section id="category-uncategorized" className="scroll-mt-24">
                      <h2 className="text-2xl font-bold tracking-tight mb-6">Other Items</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.filter(p => !p.categoryId).map((product, index) => (
                          <ProductCard key={product.id} product={product} index={index} settings={settings} onAdd={handleAddClick} />
                        ))}
                      </div>
                    </section>
                  )}
              </>
            )
          )}
        </div>
      </main>

      {/* Floating Cart Button (only if items in cart) */}
      {isMounted && cartItemsCount > 0 && (
        <a href={`/${tenantSlug}/cart`} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-600/30 overflow-hidden flex items-stretch hover:-translate-y-1 transition-transform z-40 font-sans">
          <div className="flex-1 p-4">
            <div className="text-xs text-emerald-100 uppercase tracking-wider">{cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'}</div>
            <div className="font-bold text-lg">₹{cartTotal}</div>
          </div>
          <div className="flex items-center gap-2 font-bold px-6 bg-emerald-700/50">
            VIEW CART <ChevronRight className="w-5 h-5" />
          </div>
        </a>
      )}

      {/* Footer */}
      <footer className="mt-16 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-8 px-4 pb-8">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-xl font-bold">{restaurantName}</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Freshly prepared food delivered to your door.<br />
            Contact: +{settings?.whatsappNumber || '919876543210'}
          </p>
          {settings?.fssaiNumber && (
            <p className="text-neutral-400 dark:text-neutral-500 text-xs font-medium">
              FSSAI Lic. No. {settings.fssaiNumber}
            </p>
          )}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} {restaurantName}. All rights reserved.
          </div>
        </div>
      </footer>

      <ScrollToTop />
      <CallWaiterButton tenantSlug={tenantSlug} />

      <ProductDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}

function ProductCard({ product, index, settings, onAdd }: { product: any, index: number, settings: any, onAdd: (p: any) => void }) {
  const imageUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop';

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow flex gap-4">
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {product.category?.name && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/50">
                {product.category.name}
              </span>
            </div>
          )}
          <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight mb-1">{product.name}</h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm line-clamp-2 mb-2">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          {product.offerPrice ? (
            <div className="flex flex-col">
              <div className="font-bold text-lg text-orange-600 dark:text-orange-500">₹{product.offerPrice}</div>
              <div className="text-xs text-neutral-400 line-through">₹{product.basePrice}</div>
            </div>
          ) : (
            <div className="font-bold text-lg">₹{product.basePrice}</div>
          )}
        </div>
      </div>

      <div className="w-32 h-32 relative rounded-xl overflow-hidden shadow-sm flex-shrink-0">
        {product.offerPrice ? (
          <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 z-10 rounded-br-lg shadow-sm">
            SALE
          </div>
        ) : product.isTrending ? (
          <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 z-10 rounded-br-lg shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" /> TRENDING
          </div>
        ) : null}
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover w-full h-full"
          sizes="(max-width: 768px) 128px, 128px"
          priority={index < 4}
        />
        <button
          onClick={() => onAdd(product)}
          disabled={settings?.isAcceptingOrders === false}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-950 text-orange-600 font-bold uppercase text-sm px-4 py-2 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-800 hover:bg-orange-50 dark:hover:bg-neutral-900 transition-colors active:scale-95 flex items-center justify-center min-w-[80px] disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-white"
        >
          ADD
        </button>
      </div>
    </div>
  );
}
