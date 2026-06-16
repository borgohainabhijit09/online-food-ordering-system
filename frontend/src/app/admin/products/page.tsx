'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Image as ImageIcon, Star, X, Upload, Download } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Category { id: string; name: string; }
interface Addon { id: string; name: string; price: number; }
interface Variant { name: string; price: number; offerPrice?: number | null; }
interface Product { id: string; name: string; basePrice: number; offerPrice?: number | null; category: Category; isTrending: boolean; dietaryPreference: 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGG'; isSpicy: boolean; isActive: boolean; }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filter State
  const [filterCategoryId, setFilterCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Action State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isTrending, setIsTrending] = useState(false);
  const [dietaryPreference, setDietaryPreference] = useState<'VEG' | 'NON_VEG' | 'VEGAN' | 'EGG'>('VEG');
  const [isSpicy, setIsSpicy] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
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

  const handleVariantChange = (index: number, field: keyof Variant, value: string | number | null) => {
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
        isActive,
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
    setIsActive(true);
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
    setIsActive(product.isActive ?? true);
    
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
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) return;
    try {
      const res = await apiClient.post('/api/products/bulk-delete', { ids: selectedIds });
      if (res.ok) {
        setSelectedIds([]);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete products');
      }
    } catch (error) {
      console.error('Failed to bulk delete', error);
      alert('Network error while deleting products');
    }
  };

  const handleBulkDownload = () => {
    const productsToDownload = selectedIds.length > 0 
      ? products.filter(p => selectedIds.includes(p.id))
      : products.filter(p => filterCategoryId === 'ALL' || p.category?.id === filterCategoryId).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (productsToDownload.length === 0) return alert('No products to download');

    const headers = ["CategoryName", "ProductName", "Description", "BasePrice", "OfferPrice", "DietaryPreference", "IsSpicy", "IsActive", "ImageUrl"];
    
    const rows = productsToDownload.map(p => {
      // Need description/image from product, wait some might not be fetched in the list
      // But we can export what we have
      return [
        `"${p.category?.name || ''}"`,
        `"${p.name}"`,
        `""`, // Description not in summary list
        p.basePrice,
        p.offerPrice || '',
        p.dietaryPreference,
        p.isSpicy ? 'TRUE' : 'FALSE',
        p.isActive ? 'TRUE' : 'FALSE',
        `""`
      ].join(',');
    });

    const csvContent = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const res = await apiClient.patch(`/api/products/${product.id}/status`, { isActive: !product.isActive });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle status', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
                        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={handleBulkDownload}
            className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'}
          </button>
          <button 
            onClick={() => setShowBulkUpload(true)}
            className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
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
      </div>

      <AnimatePresence>
      {showForm && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-neutral-900 pb-4 z-10 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-lg">{editingId ? 'Edit Product' : 'Create New Product'}</h3>
              <button 
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Dietary Preference</label>
                    <select 
                      value={dietaryPreference}
                      onChange={e => setDietaryPreference(e.target.value as any)}
                      className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" 
                    >
                      <option value="VEG">Vegetarian</option>
                      <option value="NON_VEG">Non-Vegetarian</option>
                      <option value="VEGAN">Vegan</option>
                      <option value="EGG">Contains Egg</option>
                    </select>
                  </div>
                  <div className="col-span-2 lg:col-span-1 flex items-center gap-4 mt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isSpicy} onChange={e => setIsSpicy(e.target.checked)} className="rounded accent-red-600 w-4 h-4" />
                      <span className="text-sm font-medium">🌶️ Spicy</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded accent-orange-600 w-4 h-4" />
                      <span className="text-sm font-medium">Available</span>
                    </label>
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
                      <div key={i} className="flex gap-2 items-center w-full">
                        <input type="text" placeholder="e.g. Half" value={v.name} onChange={e => handleVariantChange(i, 'name', e.target.value)} className="flex-[2] min-w-[80px] px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg text-sm" />
                        <input type="number" placeholder="Price" value={v.price} onChange={e => handleVariantChange(i, 'price', parseFloat(e.target.value) || 0)} className="flex-1 min-w-[70px] px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg text-sm" />
                        <input type="number" placeholder="Offer Price" value={v.offerPrice === null ? '' : v.offerPrice} onChange={e => handleVariantChange(i, 'offerPrice', e.target.value === '' ? null : parseFloat(e.target.value))} className="flex-1 min-w-[70px] px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border rounded-lg text-sm" />
                        <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shrink-0">
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

            <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800 sticky bottom-0 bg-white dark:bg-neutral-900 pb-2 z-10">
              <button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-8 rounded-lg disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
              <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded accent-orange-600 w-4 h-4 cursor-pointer"
                      checked={products.length > 0 && selectedIds.length === products.filter(p => filterCategoryId === 'ALL' || p.category?.id === filterCategoryId).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length}
                      onChange={(e) => {
                        const filtered = products.filter(p => filterCategoryId === 'ALL' || p.category?.id === filterCategoryId).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
                        if (e.target.checked) {
                          setSelectedIds(filtered.map(p => p.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Price</th>
                  <th className="px-4 py-2.5 font-medium text-center">Status</th>
                  <th className="px-4 py-2.5 font-medium text-center">Trending</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {products
                  .filter(p => filterCategoryId === 'ALL' || p.category?.id === filterCategoryId)
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(p => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-2.5 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded accent-orange-600 w-4 h-4 cursor-pointer"
                        checked={selectedIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, p.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== p.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        {p.name}
                        {p.dietaryPreference === 'VEG' && <span className="inline-block w-3 h-3 border border-green-600 rounded-sm flex items-center justify-center" title="Vegetarian"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>}
                        {p.dietaryPreference === 'NON_VEG' && <span className="inline-block w-3 h-3 border border-red-600 rounded-sm flex items-center justify-center" title="Non-Vegetarian"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>}
                        {p.dietaryPreference === 'VEGAN' && <span className="inline-block w-3 h-3 border border-emerald-500 rounded-sm flex items-center justify-center" title="Vegan"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></span></span>}
                        {p.dietaryPreference === 'EGG' && <span className="inline-block w-3 h-3 border border-yellow-500 rounded-sm flex items-center justify-center" title="Contains Egg"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span></span>}
                        {p.isSpicy && <span title="Spicy">🌶️</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{p.category?.name || '-'}</td>
                    <td className="px-4 py-2.5">
                      {p.offerPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-orange-600 font-bold">₹{p.offerPrice}</span>
                          <span className="text-neutral-400 line-through text-xs">₹{p.basePrice}</span>
                        </div>
                      ) : (
                        <span>₹{p.basePrice}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${p.isActive ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                        title={p.isActive ? 'Available' : 'Unavailable'}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${p.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {p.isTrending ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                          <Star className="w-3 h-3 fill-emerald-600" />
                        </span>
                      ) : (
                        <span className="text-neutral-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
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
          </div>
        )}
      </div>
      <BulkUploadModal 
        isOpen={showBulkUpload} 
        onClose={() => setShowBulkUpload(false)} 
        onSuccess={() => { setShowBulkUpload(false); fetchData(); }} 
      />
    </div>
  );
}

function BulkUploadModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number, errors: number } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = "CategoryName,ProductName,Description,BasePrice,OfferPrice,DietaryPreference,IsSpicy,IsActive,ImageUrl\nMain Course,Butter Chicken,Creamy curry,350,,NON_VEG,FALSE,TRUE,";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/api/products/bulk-upload', formData);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Bulk Upload Menu</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"><X className="w-5 h-5"/></button>
        </div>

        {!result ? (
          <div className="space-y-6">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              Download the template, fill in your products, and upload the CSV file. Categories will be automatically created if they don't exist.
            </div>

            <button 
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Download className="w-4 h-4" /> Download CSV Template
            </button>

            <div>
              <label className="block text-sm font-medium mb-2">Upload Completed CSV</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-neutral-200 dark:border-neutral-800 rounded-lg p-2"
              />
            </div>

            <button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload & Import'}
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold">Import Complete!</h4>
            <div className="text-neutral-600 dark:text-neutral-400">
              Successfully imported <strong>{result.imported}</strong> products.
              {result.errors > 0 && (
                <div className="text-red-500 mt-2 text-left">
                  <p>Failed to import {result.errors} rows. Check if required fields were missing.</p>
                  {result.firstErrorRow && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs overflow-auto">
                      <strong>Debug Info (First failed row):</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(result.firstErrorRow, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={onSuccess}
              className="mt-6 w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium"
            >
              Close & Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
