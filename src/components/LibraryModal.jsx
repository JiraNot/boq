import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Filter, Box, Construction, Layers, Grid, Hexagon, Plus, Check,
  ChevronRight, ArrowRight
} from 'lucide-react';
import { PRESETS, PRESET_CATEGORIES } from '../lib/presets';
import RebarPreview from './RebarPreview';

const IconMap = {
  Construction: ManagedConstruction,
  Layers: Layers,
  Grid: Grid,
  Hexagon: Hexagon,
  Box: Box
};

function ManagedConstruction(props) { return <Construction {...props} />; }

export default function LibraryModal({ isOpen, onClose, onAddTemplate }) {
  const [selectedCategory, setSelectedCategory] = useState(PRESET_CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPresets = PRESETS.filter(p => 
    p.categoryId === selectedCategory && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-sm shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Box className="w-6 h-6 text-blue-600" />
              Structural Template Library
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">
              Select standard engineering specs to import into your project
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-sm transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR: CATEGORIES */}
          <div className="w-64 border-r border-slate-100 bg-slate-50/30 p-4 space-y-2 overflow-y-auto">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block px-2">Categories</label>
             {PRESET_CATEGORIES.map(cat => {
                const Icon = IconMap[cat.icon] || Box;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-black uppercase tracking-tight transition-all ${
                      isActive ? 'bg-white text-blue-600 shadow-md border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
             })}
          </div>

          {/* MAIN CONTENT: GRID */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-50 bg-white/50 flex items-center gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search templates (e.g. GB1...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 border-none rounded-sm py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500/20"
                  />
               </div>
               <div className="text-[10px] font-black text-slate-400 uppercase">
                  {filteredPresets.length} Templates Found
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPresets.map(preset => (
                    <motion.div 
                      key={preset.id}
                      whileHover={{ y: -4 }}
                      className="group bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col"
                    >
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                         <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase">{preset.name}</h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                               {preset.width * 100} x {preset.depth * 100} cm
                            </p>
                         </div>
                         <button 
                          onClick={() => onAddTemplate(preset)}
                          className="bg-blue-600 text-white p-2 rounded-sm hover:bg-black transition-all shadow-lg"
                         >
                            <Plus className="w-4 h-4" />
                         </button>
                      </div>
                      
                      <div className="p-6 flex items-center justify-center bg-white h-48 border-b border-slate-50">
                         <div className="w-full h-full transform scale-75">
                            <RebarPreview spec={preset} isLibraryCard />
                         </div>
                      </div>

                      <div className="p-4 space-y-2 mt-auto">
                         <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-slate-400">
                            <span>Reinforcement</span>
                            <span className="text-slate-600">Standard Spec</span>
                         </div>
                         <div className="flex flex-wrap gap-1">
                            {preset.topMainCount > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] font-bold uppercase">Top: {preset.topMainCount}-{preset.topMainSize}</span>}
                            {preset.bottomMainCount > 0 && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-bold uppercase">Bot: {preset.bottomMainCount}-{preset.bottomMainSize}</span>}
                            {preset.mainBarCount > 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[8px] font-bold uppercase">{preset.mainBarCount}-{preset.mainBarSize}</span>}
                            {preset.slabWireMeshSize && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[8px] font-bold uppercase">{preset.slabWireMeshSize} @{preset.slabGridSpacing*100}</span>}
                         </div>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Connected to AutoCAD/Engineering Dataset</span>
           </div>
           <p className="text-[10px] font-bold opacity-60">Templates are based on Civil Engineering standards for mid-size residential projects.</p>
        </div>
      </motion.div>
    </div>
  );
}
