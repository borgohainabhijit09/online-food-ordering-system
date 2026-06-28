'use client';

import React, { useState, useEffect } from 'react';
import FeatureGate from '../../../components/FeatureGate';
import { Search, Plus, AlertTriangle, Layers, Edit2, ShieldAlert, Trash2, X, PlusCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
}

interface RecipeIngredient {
  id?: string;
  rawMaterialId: string;
  quantity: number;
  rawMaterial?: RawMaterial;
}

interface Recipe {
  id: string;
  productId: string;
  product: Product;
  ingredients: RecipeIngredient[];
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'RAW_MATERIALS' | 'RECIPES'>('RAW_MATERIALS');
  const [searchQuery, setSearchQuery] = useState('');
  const [rmStatusFilter, setRmStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW'>('ALL');
  
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isRawMaterialModalOpen, setIsRawMaterialModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  
  // Forms
  const [rmForm, setRmForm] = useState({ id: '', name: '', unit: 'g', currentStock: 0, minimumStock: 0, costPerUnit: 0 });
  
  const [recipeForm, setRecipeForm] = useState<{productId: string, ingredients: {rawMaterialId: string, quantity: number}[]}>({
    productId: '',
    ingredients: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rmRes, recRes, prodRes] = await Promise.all([
        apiClient.get('/api/inventory/raw-materials'),
        apiClient.get('/api/inventory/recipes'),
        apiClient.get('/api/products') // Assuming this endpoint exists to get menu items
      ]);
      if (rmRes.ok) setRawMaterials(await rmRes.json());
      if (recRes.ok) setRecipes(await recRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Raw Material Functions
  const openRmModal = (rm?: RawMaterial) => {
    if (rm) {
      setRmForm(rm);
    } else {
      setRmForm({ id: '', name: '', unit: 'g', currentStock: 0, minimumStock: 0, costPerUnit: 0 });
    }
    setIsRawMaterialModalOpen(true);
  };

  const saveRawMaterial = async () => {
    try {
      let res;
      if (rmForm.id) {
        res = await apiClient.put(`/api/inventory/raw-materials/${rmForm.id}`, rmForm);
      } else {
        res = await apiClient.post('/api/inventory/raw-materials', rmForm);
      }
      
      if (res && !res.ok) throw new Error('Failed to save');
      
      setIsRawMaterialModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save raw material');
    }
  };

  const deleteRawMaterial = async (id: string) => {
    if (!confirm('Are you sure? This will break recipes using it.')) return;
    try {
      const res = await apiClient.delete(`/api/inventory/raw-materials/${id}`);
      if (res && !res.ok) throw new Error('Failed to delete');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Recipe Functions
  const openRecipeModal = (recipe?: Recipe) => {
    if (recipe) {
      setRecipeForm({
        productId: recipe.productId,
        ingredients: recipe.ingredients.map(i => ({ rawMaterialId: i.rawMaterialId, quantity: i.quantity }))
      });
    } else {
      setRecipeForm({ productId: '', ingredients: [] });
    }
    setIsRecipeModalOpen(true);
  };

  const addIngredientToForm = () => {
    setRecipeForm({
      ...recipeForm,
      ingredients: [...recipeForm.ingredients, { rawMaterialId: '', quantity: 0 }]
    });
  };

  const removeIngredientFromForm = (index: number) => {
    const newIngredients = [...recipeForm.ingredients];
    newIngredients.splice(index, 1);
    setRecipeForm({ ...recipeForm, ingredients: newIngredients });
  };

  const saveRecipe = async () => {
    if (!recipeForm.productId) return alert('Select a product');
    if (recipeForm.ingredients.length === 0) return alert('Add at least one ingredient');
    
    try {
      const res = await apiClient.post('/api/inventory/recipes', recipeForm);
      if (res && !res.ok) throw new Error('Failed to save recipe');
      setIsRecipeModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save recipe');
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!confirm('Delete this recipe?')) return;
    try {
      const res = await apiClient.delete(`/api/inventory/recipes/${id}`);
      if (res && !res.ok) throw new Error('Failed to delete recipe');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <FeatureGate 
      feature="INVENTORY" 
      featureName="Recipe Based Inventory"
      featureDescription="Set up recipes for each menu item to automatically deduct raw material stocks in real-time as orders are placed. Prevent stockouts and track waste."
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Inventory Management</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Track raw materials and set up automatic deductions.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => openRmModal()}
              className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Raw Material
            </button>
            <button 
              onClick={() => openRecipeModal()}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Recipe
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-800">
          <button 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'RAW_MATERIALS' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'}`}
            onClick={() => setActiveTab('RAW_MATERIALS')}
          >
            Raw Materials ({rawMaterials.length})
          </button>
          <button 
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'RECIPES' ? 'border-orange-500 text-orange-600 dark:text-orange-400' : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'}`}
            onClick={() => setActiveTab('RECIPES')}
          >
            Recipes ({recipes.length})
          </button>
        </div>
        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder={activeTab === 'RAW_MATERIALS' ? "Search raw materials..." : "Search recipes..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
            />
          </div>
          {activeTab === 'RAW_MATERIALS' && (
            <select
              value={rmStatusFilter}
              onChange={e => setRmStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[150px]"
            >
              <option value="ALL">All Status</option>
              <option value="NORMAL">Normal Stock</option>
              <option value="LOW">Low Stock</option>
            </select>
          )}
        </div>

        {/* RAW MATERIALS TAB */}
        {activeTab === 'RAW_MATERIALS' && (
          <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs uppercase text-neutral-500 font-bold border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Cost/Unit</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Min Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {rawMaterials
                    .filter(rm => {
                      if (!rm.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                      const isLow = rm.currentStock <= rm.minimumStock;
                      if (rmStatusFilter === 'LOW' && !isLow) return false;
                      if (rmStatusFilter === 'NORMAL' && isLow) return false;
                      return true;
                    })
                    .map(rm => {
                    const isLow = rm.currentStock <= rm.minimumStock;
                    return (
                      <tr key={rm.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">{rm.name}</td>
                        <td className="px-6 py-4">{rm.unit}</td>
                        <td className="px-6 py-4">₹{rm.costPerUnit}</td>
                        <td className="px-6 py-4 font-black">{rm.currentStock}</td>
                        <td className="px-6 py-4">{rm.minimumStock}</td>
                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openRmModal(rm)} className="p-2 text-neutral-400 hover:text-blue-500 transition-colors bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteRawMaterial(rm.id)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rawMaterials.filter(rm => rm.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-neutral-500 font-medium">
                        No raw materials found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === 'RECIPES' && (
          <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs uppercase text-neutral-500 font-bold border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 w-1/4">Menu Item</th>
                    <th className="px-6 py-4 w-1/3">Ingredients & Quantities</th>
                    <th className="px-6 py-4">Recipe Cost</th>
                    <th className="px-6 py-4">Est. Margin</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {recipes
                    .filter(r => r.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(recipe => {
                      const cost = recipe.ingredients.reduce((acc, ing) => acc + (ing.quantity * (ing.rawMaterial?.costPerUnit || 0)), 0);
                      const margin = recipe.product?.basePrice ? recipe.product.basePrice - cost : 0;
                      return (
                      <tr key={recipe.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-neutral-900 dark:text-white text-base">
                            {recipe.product?.name || 'Unknown Product'}
                          </span>
                          {recipe.product?.basePrice !== undefined && (
                            <div className="text-xs text-neutral-500 mt-1">Selling Price: ₹{recipe.product.basePrice}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {recipe.ingredients.map((ing, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800">
                                <span className="text-neutral-700 dark:text-neutral-300">{ing.rawMaterial?.name}</span>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                  {ing.quantity}{ing.rawMaterial?.unit}
                                </span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">
                          ₹{cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${margin > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            ₹{margin.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openRecipeModal(recipe)} className="p-2 text-neutral-400 hover:text-blue-500 transition-colors bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteRecipe(recipe.id)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  }
                  {recipes.filter(r => r.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-neutral-500 font-medium">
                        No recipes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Raw Material Modal */}
      {isRawMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{rmForm.id ? 'Edit Raw Material' : 'Add Raw Material'}</h2>
              <button onClick={() => setIsRawMaterialModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">Ingredient Name</label>
                <input 
                  type="text" 
                  value={rmForm.name} 
                  onChange={e => setRmForm({...rmForm, name: e.target.value})}
                  className="w-full border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" 
                  placeholder="e.g. Flour, Sugar, Tomato Sauce"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">Unit</label>
                  <select 
                    value={rmForm.unit} 
                    onChange={e => setRmForm({...rmForm, unit: e.target.value})}
                    className="w-full border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="l">Liters (L)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">Cost per Unit (₹)</label>
                  <input 
                    type="number" 
                    value={rmForm.costPerUnit} 
                    onChange={e => setRmForm({...rmForm, costPerUnit: Number(e.target.value)})}
                    className="w-full border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">Current Stock</label>
                  <input 
                    type="number" 
                    value={rmForm.currentStock} 
                    onChange={e => setRmForm({...rmForm, currentStock: Number(e.target.value)})}
                    className="w-full border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">Low Stock Alert At</label>
                  <input 
                    type="number" 
                    value={rmForm.minimumStock} 
                    onChange={e => setRmForm({...rmForm, minimumStock: Number(e.target.value)})}
                    className="w-full border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex justify-end gap-3">
              <button onClick={() => setIsRawMaterialModalOpen(false)} className="px-4 py-2 font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors">Cancel</button>
              <button onClick={saveRawMaterial} className="px-5 py-2 font-bold bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/20">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Recipe Builder</h2>
              <button onClick={() => setIsRecipeModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-6 bg-neutral-50 dark:bg-neutral-950/50">
              
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Menu Item</label>
                <select 
                  value={recipeForm.productId} 
                  onChange={e => setRecipeForm({...recipeForm, productId: e.target.value})}
                  className="w-full border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm font-semibold text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-2">When this item is ordered, the ingredients below will be deducted from inventory.</p>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-neutral-900 dark:text-white">Ingredients</h3>
                  <button onClick={addIngredientToForm} className="text-orange-600 hover:text-orange-500 font-bold text-sm flex items-center gap-1">
                    <PlusCircle className="w-4 h-4" /> Add Row
                  </button>
                </div>
                
                {recipeForm.ingredients.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 text-sm font-medium border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                    No ingredients added yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recipeForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="flex-1">
                          <select 
                            value={ing.rawMaterialId} 
                            onChange={e => {
                              const newIng = [...recipeForm.ingredients];
                              newIng[idx].rawMaterialId = e.target.value;
                              setRecipeForm({...recipeForm, ingredients: newIng});
                            }}
                            className="w-full border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 px-3 py-2 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select raw material...</option>
                            {rawMaterials.map(rm => (
                              <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <div className="relative">
                            <input 
                              type="number" 
                              value={ing.quantity || ''} 
                              onChange={e => {
                                const newIng = [...recipeForm.ingredients];
                                newIng[idx].quantity = Number(e.target.value);
                                setRecipeForm({...recipeForm, ingredients: newIng});
                              }}
                              placeholder="Qty"
                              className="w-full border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-950 px-3 py-2 text-sm font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 pr-10" 
                            />
                            <span className="absolute right-3 top-2 text-xs font-bold text-neutral-400">
                              {rawMaterials.find(rm => rm.id === ing.rawMaterialId)?.unit || '-'}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => removeIngredientFromForm(idx)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
            
            <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsRecipeModalOpen(false)} className="px-4 py-2 font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">Cancel</button>
              <button onClick={saveRecipe} className="px-6 py-2 font-bold bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/20">Save Recipe</button>
            </div>
          </div>
        </div>
      )}

    </FeatureGate>
  );
}
