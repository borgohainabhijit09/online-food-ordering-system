'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Image as ImageIcon, Star } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface Category { id: string; name: string; }
interface Addon { id: string; name: string; price: number; }
interface Variant { name: string; price: number; offerPrice?: number | null; }
interface Product { id: string; name: string; basePrice: number; offerPrice?: number | null; category: Category; isTrending: boolean; dietaryPreference: 'VEG' | 'NON_VEG' | 'VEGAN'; isSpicy: boolean; }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filter State
  const [filterCategoryId, setFilterCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isTrending, setIsTrending] = useState(false);
  const [dietaryPreference, setDietaryPreference] = useState<'VEG' | 'NON_VEG' | 'VEGAN'>('VEG');
  const [isSpicy, setIsSpicy] = useState(false);
  
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, addonRes] = await Promise.all([
        apiClient.get('/api/products'),
        apiClient.get('/api/categories'),
        apiClient.get('/api/addons')
      ]);
      setProducts(await prodRes.json());
      
      const cats = await catRes.json();
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);

      setAvailableAddons(await addonRes.json());
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: 0, offerPrice: null }]);
  };

  const handleVariantChange = (index: number, field: keyof Variant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleAddonToggle = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        description,
        basePrice,
        offerPrice: offerPrice === '' ? null : offerPrice,
        categoryId,
        imageUrl,
        isTrending,
        dietaryPreference,
        isSpicy,
        variants: variants.filter(v => v.name.trim() !== ''),
        addons: selectedAddons
      };

      const res = editingId 
        ? await apiClient.put(`/api/products/${editingId}`, payload)
        : await apiClient.post('/api/products', payload);

      if (res.ok) {
        setShowForm(false);
        // Reset
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save product', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setBasePrice(0);
    setOfferPrice('');
    setImageUrl('');
    setIsTrending(false);
    setDietaryPreference('VEG');
    setIsSpicy(false);
    setVariants([]);
    setSelectedAddons([]);
    if (categories.length > 0) setCategoryId(categories[0].id);
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description || '');
    setBasePrice(product.basePrice);
    setOfferPrice(product.offerPrice ?? '');
    setCategoryId(product.categoryId);
    setImageUrl(product.images?.[0]?.url || '');
    setIsTrending(product.isTrending || false);
    setDietaryPreference(product.dietaryPreference || 'VEG');
    setIsSpicy(product.isSpicy || false);
    
    // Set variants (excluding id and other DB fields for the form)
    setVariants(product.variants?.map((v: any) => ({ name: v.name, price: v.price, offerPrice: v.offerPrice })) || []);
    
    // Set addons
    setSelectedAddons(product.addons?.map((a: any) => a.addonId) || []);
    
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await apiClient.delete(`/api/products/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <button 
          onClick={() => {
            if (showForm && editingId) {
              // If we are editing and click "Add Product", we should switch to Create mode
              resetForm();
            } else {
              setShowForm(!showForm);
              if (!showForm) resetForm();
            }
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">{editingId ? 'Edit Product' : 'Create New Product'}</h3>
            <button 
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg" required />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isTrending" checked={isTrending} onChange={e => setIsTrending(e.target.checked)} className="rounded accent-orange-600 w-4 h-4" />
                  <label htmlFor="isTrending" className="text-sm font-medium cursor-pointer">Mark as Trending (Shows in 'Trending Now')</label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg h-24" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Base Price (₹)</label>
                    <input type="number" value={basePrice} onChange={e => setBasePrice(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Offer Price (Optional)</label>
                    <input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg" placeholder="Discount price" />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg" required>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium mb-1">Dietary Preference</label>
                    <select value={dietaryPreference} onChange={e => setDietaryPreference(e.target.value as any)} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg" required>
                      <option value="VEG">Vegetarian</option>
                      <option value="NON_VEG">Non-Vegetarian</option>
                      <option value="VEGAN">Vegan</option>
                    </select>
                  </div>
                  <div className="col-span-2 lg:col-span-1 flex items-center gap-2 mt-6">
                    <input type="checkbox" id="isSpicy" checked={isSpicy} onChange={e => setIsSpicy(e.target.checked)} className="rounded accent-red-600 w-4 h-4" />
                    <label htmlFor="isSpicy" className="text-sm font-medium cursor-pointer">🌶️ Mark as Spicy</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL (Unsplash/Imgur)</label>
                  <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg" placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-6">
                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Variants (Optional)</label>
                    <button type="button" onClick={handleAddVariant} className="text-orange-600 text-sm font-medium">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input type="text" placeholder="e.g. Half" value={v.name} onChange={e => handleVariantChange(i, 'name', e.target.value)} className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg text-sm" />
                        <input type="number" placeholder="Price" value={v.price} onChange={e => handleVariantChange(i, 'price', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg text-sm" />
                        <input type="number" placeholder="Offer Price" value={v.offerPrice === null ? '' : v.offerPrice} onChange={e => handleVariantChange(i, 'offerPrice', e.target.value === '' ? null : parseFloat(e.target.value))} className="w-24 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg text-sm" />
                        <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Addons */}
                <div>
                  <label className="block text-sm font-medium mb-2">Available Addons</label>
                  <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {availableAddons.map(addon => (
                      <label key={addon.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedAddons.includes(addon.id)} onChange={() => handleAddonToggle(addon.id)} className="rounded accent-orange-600" />
                        {addon.name} (+₹{addon.price})
                      </label>
                    ))}
                    {availableAddons.length === 0 && <span className="text-sm text-neutral-500">No addons created yet.</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-8 rounded-lg disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="mb-4 flex flex-col sm:flex-row justify-end gap-4">
        <input 
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
        />
        <select 
          value={filterCategoryId} 
          onChange={e => setFilterCategoryId(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No products found.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium text-center">Trending</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {products
                .filter(p => filterCategoryId === 'ALL' || p.category?.id === filterCategoryId)
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(p => (
                <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center gap-2">
                      {p.name}
                      {p.dietaryPreference === 'VEG' && <span className="inline-block w-3 h-3 border border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>}
                      {p.dietaryPreference === 'NON_VEG' && <span className="inline-block w-3 h-3 border border-red-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>}
                      {p.dietaryPreference === 'VEGAN' && <span className="inline-block w-3 h-3 border border-emerald-500 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></span></span>}
                      {p.isSpicy && <span title="Spicy">🌶️</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">{p.category?.name || '-'}</td>
                  <td className="px-6 py-4">
                    {p.offerPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600 font-bold">₹{p.offerPrice}</span>
                        <span className="text-neutral-400 line-through text-xs">₹{p.basePrice}</span>
                      </div>
                    ) : (
                      <span>₹{p.basePrice}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {p.isTrending ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                        <Star className="w-3 h-3 fill-emerald-600" />
                      </span>
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
