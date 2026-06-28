'use client';

import React from 'react';
import { 
  Store, UtensilsCrossed, Sparkles, ChefHat, Users, Smile, ScrollText, 
  Flame, HandPlatter, Salad, Pizza, ShoppingBag, Heart, 
  MessageSquareHeart, ArrowRightLeft, PaintBucket, UserCircle2, Coffee, 
  HelpCircle, Percent, BellRing, Star, PackageOpen, Bike, 
  Users2, ThumbsUp, Eye, PhoneCall, CheckCircle2, Music, SunMedium, Smartphone
} from 'lucide-react';

const CALENDAR_DATA = [
  {
    week: 'WEEK 1',
    theme: 'Introduce Your Restaurant',
    days: [
      { day: 1, title: 'Restaurant Exterior', desc: 'Show your outlet from outside', icon: Store, color: 'text-blue-500', bg: 'bg-blue-50' },
      { day: 2, title: 'Signature Dish', desc: 'Show your best selling dish', icon: UtensilsCrossed, color: 'text-orange-500', bg: 'bg-orange-50' },
      { day: 3, title: 'Inside Ambience', desc: 'Show seating, lighting, vibe', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
      { day: 4, title: 'Food Preparation', desc: 'Short clip of food being prepared', icon: ChefHat, color: 'text-red-500', bg: 'bg-red-50' },
      { day: 5, title: 'Behind The Scenes', desc: 'Show your team in action', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
      { day: 6, title: 'Happy Customers', desc: 'Capture natural customer moments', icon: Smile, color: 'text-green-500', bg: 'bg-green-50' },
      { day: 7, title: 'Menu Highlights', desc: 'Show different items from menu', icon: ScrollText, color: 'text-purple-500', bg: 'bg-purple-50' },
    ]
  },
  {
    week: 'WEEK 2',
    theme: 'Show Your Food & People',
    days: [
      { day: 8, title: 'Chef Special Of The Day', desc: "Today's special dish", icon: ChefHat, color: 'text-rose-500', bg: 'bg-rose-50' },
      { day: 9, title: 'Food Plating', desc: 'Beautiful plating close up', icon: HandPlatter, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      { day: 10, title: 'Ingredients In Action', desc: 'Fresh ingredients short clip', icon: Salad, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { day: 11, title: 'Sizzling / Steaming', desc: 'Sizzling platters, cheese pull', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
      { day: 12, title: 'Weekend Preparation', desc: 'Prep for weekend rush', icon: ShoppingBag, color: 'text-cyan-500', bg: 'bg-cyan-50' },
      { day: 13, title: 'Best Selling Combo', desc: 'Show combo offers', icon: Pizza, color: 'text-red-500', bg: 'bg-red-50' },
      { day: 14, title: 'Customer Reactions', desc: 'Real reactions, real smiles', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
    ]
  },
  {
    week: 'WEEK 3',
    theme: 'Build Trust & Engagement',
    days: [
      { day: 15, title: 'Testimonial (Short Clip)', desc: 'Happy customer saying few words', icon: MessageSquareHeart, color: 'text-sky-500', bg: 'bg-sky-50' },
      { day: 16, title: 'Before & After', desc: 'Before cooking vs after', icon: ArrowRightLeft, color: 'text-violet-500', bg: 'bg-violet-50' },
      { day: 17, title: 'Restaurant Decor', desc: 'Show wall art, decor, details', icon: PaintBucket, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
      { day: 18, title: 'Staff Spotlight', desc: 'Introduce your team member', icon: UserCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
      { day: 19, title: 'Food On The Table', desc: 'Spread of food on table', icon: Coffee, color: 'text-stone-500', bg: 'bg-stone-50' },
      { day: 20, title: 'Live Kitchen Action', desc: 'High flame, tossing, action', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
      { day: 21, title: 'Q&A / Poll Sticker', desc: 'Use poll sticker in stories', icon: HelpCircle, color: 'text-teal-500', bg: 'bg-teal-50' },
    ]
  },
  {
    week: 'WEEK 4',
    theme: 'Drive Orders & Loyalty',
    days: [
      { day: 22, title: 'Limited Time Offer', desc: 'Show offer on screen', icon: Percent, color: 'text-red-600', bg: 'bg-red-50' },
      { day: 23, title: 'New Dish Alert', desc: 'Introduce newly added item', icon: BellRing, color: 'text-amber-500', bg: 'bg-amber-50' },
      { day: 24, title: 'Why We\'re Special', desc: 'What makes your restaurant unique', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      { day: 25, title: 'Packing Orders', desc: 'Show order packing', icon: PackageOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { day: 26, title: 'Delivery On The Way', desc: 'Orders out for delivery', icon: Bike, color: 'text-blue-500', bg: 'bg-blue-50' },
      { day: 27, title: 'Family Time', desc: 'Families enjoying together', icon: Users2, color: 'text-purple-500', bg: 'bg-purple-50' },
      { day: 28, title: 'Thank You Customers', desc: 'Thank your customers', icon: ThumbsUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    ]
  },
];

const BONUS_DAYS = [
  { day: 29, title: 'Sneak Peek Tomorrow', desc: 'Tease something new tomorrow', icon: Eye, color: 'text-orange-500', bg: 'bg-orange-50' },
  { day: 30, title: 'Call To Order Now', desc: 'Show menu link / QR / Order Now', icon: PhoneCall, color: 'text-green-500', bg: 'bg-green-50' },
];

export default function MarketingCalendarPage() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner */}
      <div className="bg-neutral-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 font-bold tracking-widest text-xs rounded-full mb-4 border border-orange-500/30">
            MARKETING STRATEGY
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
            30-Day Content Calendar <br />
            <span className="text-orange-500">For Restaurants</span>
          </h1>
          <p className="text-neutral-400 text-lg">
            Simple. In-House. No Voiceover. Just Real Food, Real People, Real Stories.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex flex-col gap-2 w-full md:w-auto min-w-[280px]">
          <div className="flex items-center gap-3 text-white font-bold text-lg mb-2">
            <Smartphone className="w-6 h-6 text-orange-400" />
            <span>1 REEL | 30 SEC | EVERY DAY</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            No Voiceover Needed
          </div>
          <div className="flex items-center gap-2 text-neutral-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Use Trending Music
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Grid (Left 3 Columns) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Days of Week Header */}
          <div className="hidden md:grid grid-cols-8 gap-4 mb-4">
            <div className="col-span-1"></div> {/* Empty corner */}
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
              <div key={day} className="text-center font-bold text-[10px] text-neutral-400 tracking-widest uppercase bg-white border border-neutral-200 rounded-lg py-2 shadow-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {CALENDAR_DATA.map((weekData, wIdx) => (
            <div key={wIdx} className="grid grid-cols-1 md:grid-cols-8 gap-4 group">
              {/* Week Label */}
              <div className="col-span-1 flex flex-col justify-center items-center md:items-start text-center md:text-left bg-orange-50/50 md:bg-transparent p-4 md:p-0 rounded-xl">
                <span className="font-black text-neutral-900 text-lg">{weekData.week}</span>
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider mt-1">{weekData.theme}</span>
              </div>
              
              {/* Days */}
              {weekData.days.map((day) => {
                const Icon = day.icon;
                return (
                  <div key={day.day} className="col-span-1 bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group-hover:bg-white relative overflow-hidden flex flex-col cursor-crosshair">
                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 font-black text-[10px] px-2 py-1 rounded-bl-lg">
                      DAY {day.day}
                    </div>
                    
                    <div className={`w-10 h-10 rounded-xl ${day.bg} ${day.color} flex items-center justify-center mb-3 mt-2`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <h3 className="font-bold text-neutral-900 text-sm leading-tight mb-1">{day.title}</h3>
                    <p className="text-[11px] text-neutral-500 leading-snug flex-1">{day.desc}</p>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Bonus Row */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
            <div className="col-span-1 flex flex-col justify-center items-center md:items-start text-center md:text-left bg-emerald-50/50 md:bg-transparent p-4 md:p-0 rounded-xl">
              <span className="font-black text-emerald-700 text-lg">BONUS</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Extra Ideas<br/>(Use Anytime)</span>
            </div>
            
            {BONUS_DAYS.map((day) => {
              const Icon = day.icon;
              return (
                <div key={day.day} className="col-span-1 bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 font-black text-[10px] px-2 py-1 rounded-bl-lg">
                    DAY {day.day}
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${day.bg} ${day.color} flex items-center justify-center mb-3 mt-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm leading-tight mb-1">{day.title}</h3>
                  <p className="text-[11px] text-neutral-500 leading-snug flex-1">{day.desc}</p>
                </div>
              );
            })}
            
            {/* Tips Panels */}
            <div className="col-span-1 md:col-span-3 bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <h4 className="font-black text-red-600 text-sm mb-3 uppercase tracking-wider">Tips For Shooting In-House</h4>
              <div className="grid grid-cols-2 gap-3 text-[11px] font-medium text-red-900/80">
                <div className="flex items-start gap-2">
                  <SunMedium className="w-4 h-4 shrink-0 text-red-500" />
                  Use natural lighting near windows
                </div>
                <div className="flex items-start gap-2">
                  <Music className="w-4 h-4 shrink-0 text-red-500" />
                  Use trending music (no copyright issues)
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 shrink-0 text-red-500" />
                  Keep phone steady (use a stand)
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-red-500" />
                  Keep it short, crisp & engaging
                </div>
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-3 bg-emerald-600 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-center">
              <h4 className="font-black text-emerald-100 text-sm mb-3 uppercase tracking-wider">Why This Works</h4>
              <ul className="space-y-2 text-xs font-medium text-emerald-50">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0"/> Builds daily visibility</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0"/> Shows real food, real people</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0"/> Creates connection & trust</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0"/> Drives orders directly through your menu link</li>
              </ul>
            </div>
            
          </div>

        </div>

        {/* Right Sidebar Panels */}
        <div className="space-y-6">
          {/* Panel 1 */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-lg text-neutral-900 mb-4 uppercase text-center border-b pb-4">
              Yes, 30 Sec Reel Everyday Is Enough!
            </h3>
            <ul className="space-y-4 text-sm font-medium text-neutral-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                Consistency builds recognition
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                Short, real videos work best
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                No voiceover needed
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                Customers love authentic content
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                Reels bring reach, reach brings orders
              </li>
            </ul>
          </div>

          {/* Panel 2 */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-lg text-stone-900 mb-4 uppercase text-center border-b border-stone-200 pb-4">
              What To Focus On
            </h3>
            <ul className="space-y-4 text-sm font-bold text-stone-700">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-stone-500"><UtensilsCrossed className="w-4 h-4" /></div>
                Food
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-stone-500"><Users className="w-4 h-4" /></div>
                People
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-stone-500"><Sparkles className="w-4 h-4" /></div>
                Ambience
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-stone-500"><Percent className="w-4 h-4" /></div>
                Offers
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-stone-500"><PaintBucket className="w-4 h-4" /></div>
                Behind the Scenes
              </li>
            </ul>
          </div>

          {/* Panel 3 */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            
            <h3 className="font-black text-lg text-neutral-900 mb-4 uppercase relative z-10 border-b pb-4">
              Posting Checklist
            </h3>
            <div className="space-y-3 relative z-10">
              <label className="flex items-center gap-3 cursor-pointer group/item">
                <input type="checkbox" className="w-5 h-5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-sm font-semibold text-neutral-700 group-hover/item:text-black transition-colors">Did I post today?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group/item">
                <input type="checkbox" className="w-5 h-5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-sm font-semibold text-neutral-700 group-hover/item:text-black transition-colors">Is my menu link in bio?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group/item">
                <input type="checkbox" className="w-5 h-5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-sm font-semibold text-neutral-700 group-hover/item:text-black transition-colors">Am I responding to DMs?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group/item">
                <input type="checkbox" className="w-5 h-5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-sm font-semibold text-neutral-700 group-hover/item:text-black transition-colors">Am I running any offers?</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group/item">
                <input type="checkbox" className="w-5 h-5 rounded border-neutral-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-sm font-semibold text-neutral-700 group-hover/item:text-black transition-colors">Did I capture customer data?</span>
              </label>
            </div>
            
            <div className="mt-6 pt-4 border-t border-neutral-100 relative z-10">
              <button className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Save Today's Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
