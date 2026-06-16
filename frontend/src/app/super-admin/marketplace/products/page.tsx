'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: 'PHYSICAL' | 'SERVICE';
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function MarketplaceProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState<'PHYSICAL'|'SERVICE'>('PHYSICAL');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/api/super-admin/marketplace/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setTitle(product.title);
      setDescription(product.description);
      setPrice(product.price.toString());
      setCategory(product.category);
      setImageUrl(product.imageUrl || '');
      setType(product.type);
      setIsActive(product.isActive);
    } else {
      setEditingProduct(null);
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setImageUrl('');
      setType('PHYSICAL');
      setIsActive(true);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        price: parseFloat(price),
        category,
        imageUrl: imageUrl || undefined,
        type,
        isActive
      };

      let res;
      if (editingProduct) {
        res = await apiClient.put(`/api/super-admin/marketplace/products/${editingProduct.id}`, payload);
      } else {
        res = await apiClient.post('/api/super-admin/marketplace/products', payload);
      }

      if (res.ok) {
        setShowModal(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to save product', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await apiClient.delete(`/api/super-admin/marketplace/products/${id}`);
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  const categories = Array.from(
    new Set(
      products
        .filter(p => typeFilter === 'ALL' || p.type === typeFilter)
        .map(p => p.category)
    )
  );

  const filteredProducts = products.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    return true;
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search products..."
            className="px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors text-sm w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors text-sm"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCategoryFilter('ALL'); // Reset category when type changes
            }}
          >
            <option value="ALL">All Types</option>
            <option value="PHYSICAL">Physical Goods</option>
            <option value="SERVICE">Services</option>
          </select>
          <select
            className="px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold text-right">Price</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-500">No products found.</td></tr>
            ) : filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-black">{product.title}</div>
                  <div className="text-xs text-neutral-500 truncate max-w-xs">{product.description}</div>
                </td>
                <td className="px-6 py-4 text-neutral-600">{product.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${product.type === 'SERVICE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {product.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium">₹{product.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openModal(product)} className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors" placeholder="e.g. Digital Marketing Setup" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors h-24 resize-none" placeholder="Details about what they get..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Image URL (Optional)</label>
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors" placeholder="https://images.unsplash.com/..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Price (₹)</label>
                  <input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                  <input required type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors" placeholder="e.g. Marketing" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-black transition-colors">
                    <option value="PHYSICAL">Physical Goods</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <div className="mt-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      <span className="ms-3 text-sm font-medium text-gray-900">{isActive ? 'Active' : 'Hidden'}</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProduct ? 'Save Changes' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
