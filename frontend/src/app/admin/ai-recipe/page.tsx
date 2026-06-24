'use client';

import React, { useState } from 'react';
import FeatureGate from '../../../components/FeatureGate';
import { Sparkles, Brain, ArrowRight, CheckCircle2, RotateCw } from 'lucide-react';

const mockSuggestions = [
  {
    title: 'Rich Tomato & Basil Soup',
    description: 'Use surplus tomatoes and fresh basil reaching expiration within 2 days.',
    yield: '25 portions',
    margin: 'High (82%)',
    ingredients: [
      { name: 'Overripe Tomatoes', qty: '5 kg' },
      { name: 'Fresh Basil', qty: '200 g' },
      { name: 'Garlic Bulbs', qty: '5 pcs' },
      { name: 'Olive Oil', qty: '150 ml' }
    ],
    instructions: 'Slow roast tomatoes with garlic, blend with fresh basil and vegetable stock. Simmer for 20 minutes.'
  },
  {
    title: 'Rustic Garlic Mushroom Crostini',
    description: 'Perfect utilization of surplus button mushrooms and day-old baguette bread.',
    yield: '15 portions',
    margin: 'Premium (88%)',
    ingredients: [
      { name: 'Button Mushrooms', qty: '1.5 kg' },
      { name: 'Baguettes', qty: '3 pcs' },
      { name: 'Butter', qty: '250 g' },
      { name: 'Parsley', qty: '50 g' }
    ],
    instructions: 'Slice baguettes, brush with olive oil and toast. Sauté sliced mushrooms in butter, garlic, and parsley. Spoon over toast.'
  }
];

export default function AiRecipePage() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(mockSuggestions);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulate regeneration
      setSuggestions([...mockSuggestions].reverse());
    }, 1500);
  };

  return (
    <FeatureGate
      feature="AI_RECIPE_SUGGESTIONS"
      featureName="AI Recipe Suggestions"
      featureDescription="Leverage AI to scan your inventory for expiring raw materials or surplus stock and generate high-margin daily specials, reducing food waste and increasing profitability."
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-orange-500 fill-orange-500/15" /> AI Recipe Suggestions
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Smart menu suggestions based on surplus raw materials.</p>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" /> Run AI Scan
              </>
            )}
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 dark:border-orange-500/10 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 bg-white dark:bg-neutral-950 rounded-2xl flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white">Active Waste Reduction</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
              Our AI algorithm detected that your stock of **Tomatoes** and **Mushrooms** is currently 35% higher than normal historical weekly demand. We recommend running a special menu item today to liquidate surplus inventory before expiration.
            </p>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="space-y-6">
          <h3 className="font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-xs">Generated Suggestions</h3>
          
          <div className="grid grid-cols-1 gap-6">
            {suggestions.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 relative overflow-hidden"
              >
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-xl font-bold text-neutral-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 rounded-full">
                      Yield: {item.yield}
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 rounded-full">
                      Estimated Margin: {item.margin}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Ingredients Needed</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {item.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{ing.name} ({ing.qty})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 pt-6 lg:pt-0 lg:pl-6 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">AI Instructions</h5>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {item.instructions}
                    </p>
                  </div>

                  <button className="mt-6 w-full inline-flex items-center justify-center gap-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold py-2.5 rounded-xl text-xs transition-colors">
                    Add to Today's Specials <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </FeatureGate>
  );
}
