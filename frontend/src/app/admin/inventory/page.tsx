'use client';

import React, { useState } from 'react';
import FeatureGate from '../../../components/FeatureGate';
import { Search, Plus, AlertTriangle, Layers, Edit2, ShieldAlert } from 'lucide-react';

const mockRecipes = [
  {
    id: '1',
    name: 'Classic Cheeseburger',
    category: 'Burgers',
    stock: 45,
    minStock: 15,
    ingredients: [
      { name: 'Burger Bun', qty: 1, unit: 'pcs' },
      { name: 'Beef Patty', qty: 1, unit: 'pcs' },
      { name: 'Cheddar Cheese Slice', qty: 1, unit: 'pcs' },
      { name: 'Lettuce Leaf', qty: 2, unit: 'pcs' },
      { name: 'Special Sauce', qty: 15, unit: 'ml' }
    ]
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    category: 'Pizza',
    stock: 12,
    minStock: 20,
    ingredients: [
      { name: 'Pizza Dough', qty: 1, unit: 'pcs' },
      { name: 'Mozzarella Cheese', qty: 150, unit: 'g' },
      { name: 'Tomato Sauce', qty: 100, unit: 'ml' },
      { name: 'Fresh Basil', qty: 5, unit: 'leaves' }
    ]
  },
  {
    id: '3',
    name: 'Truffle Mushroom Pasta',
    category: 'Pasta',
    stock: 28,
    minStock: 10,
    ingredients: [
      { name: 'Penne Pasta', qty: 120, unit: 'g' },
      { name: 'Wild Mushrooms', qty: 80, unit: 'g' },
      { name: 'Truffle Oil', qty: 10, unit: 'ml' },
      { name: 'Heavy Cream', qty: 50, unit: 'ml' }
    ]
  }
];

export default function InventoryPage() {
  const [search, setSearch] = useState('');

  const filtered = mockRecipes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FeatureGate 
      feature="INVENTORY" 
      featureName="Recipe Based Inventory"
      featureDescription="Set up recipes for each menu item to automatically deduct raw material stocks in real-time as orders are placed. Prevent stockouts and track waste."
    >
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Recipe Based Inventory</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Automatic raw material stock deduction based on customer orders.</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Recipe
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 text-orange-600 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Active Recipes</p>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-0.5">{mockRecipes.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Low Stock Alerts</p>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
                {mockRecipes.filter(r => r.stock < r.minStock).length}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Stock Status</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-500 mt-0.5">Healthy</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(recipe => {
            const isLow = recipe.stock < recipe.minStock;
            return (
              <div 
                key={recipe.id}
                className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Low Stock Indicator */}
                {isLow && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white flex items-center gap-1 px-3 py-1 rounded-bl-xl text-[10px] font-extrabold uppercase tracking-wide">
                    <ShieldAlert className="w-3.5 h-3.5" /> Low Stock
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded">
                      {recipe.category}
                    </span>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-1.5">{recipe.name}</h3>
                  </div>
                  <button className="p-2 text-neutral-400 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock levels */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-3.5 mb-4 text-xs">
                  <div>
                    <span className="text-neutral-400 font-medium">Batch Stock:</span>
                    <span className={`ml-1.5 font-bold ${isLow ? 'text-red-500' : 'text-neutral-950 dark:text-white'}`}>
                      {recipe.stock} servings
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium">Min Threshold:</span>
                    <span className="ml-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                      {recipe.minStock} servings
                    </span>
                  </div>
                </div>

                {/* Ingredient list */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Recipe Breakdown</h4>
                  <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                    {recipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="py-2 flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                        <span>{ing.name}</span>
                        <span className="font-semibold">{ing.qty} {ing.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </FeatureGate>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
