import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Info, Percent, Save, Briefcase, Sparkles } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, register, compositeFactorF }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-sm shadow-2xl overflow-hidden"
        >
           {/* Header */}
           <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                 <Settings className="w-5 h-5 text-blue-400" />
                 <h3 className="font-black text-sm uppercase tracking-widest">Project Configuration</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-sm transition-colors">
                 <X className="w-5 h-5" />
              </button>
           </div>

           <div className="p-6 space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                 <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Briefcase className="w-3.5 h-3.5" /> Project Identity
                 </h4>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">Project Name / Reference</label>
                       <input 
                         {...register("projectName")} 
                         className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all"
                         placeholder="e.g., Luxury Villa Phase 1" 
                       />
                    </div>
                 </div>
              </div>

              {/* Factor F */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Percent className="w-3.5 h-3.5" /> Factor F Markup
                    </h4>
                    <div className="bg-blue-600 text-white px-2 py-0.5 rounded-sm text-[10px] font-black">
                       CURRENT: {compositeFactorF.toFixed(3)}x
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">Profit (%)</label>
                       <input type="number" step="0.1" {...register("profitRate", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-sm font-black text-blue-600" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">Tax (%)</label>
                       <input type="number" step="0.1" {...register("taxRate", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-sm font-black text-blue-600" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">Overhead (%)</label>
                       <input type="number" step="0.1" {...register("overheadRate", { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-sm font-black text-blue-600" />
                    </div>
                 </div>
                 
                 <div className="bg-slate-50 p-3 rounded-sm border border-dashed border-slate-200 mt-2">
                    <p className="text-[9px] text-slate-500 leading-relaxed italic">
                      * Factor F is applied as a multiplier to the Direct Cost (Material + Labor) to calculate the final Tender/Sale Price. 
                      Standard Formula: [1 + (Profit + Tax + Overhead) / 100].
                    </p>
                 </div>
              </div>

              {/* AI Configuration */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Intelligence (Gemini)
                  </h4>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter flex items-center justify-between">
                        Google Gemini API Key
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Get Key</a>
                     </label>
                     <input 
                       type="password"
                       {...register("geminiApiKey")} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-xs font-mono text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all"
                       placeholder="AI... (Paste your key here)" 
                     />
                  </div>
               </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <button 
                  onClick={onClose}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-sm shadow-xl hover:bg-blue-700 hover:translate-y-[-1px] transition-all"
                 >
                    <Save className="w-4 h-4" /> Save & Close
                 </button>
              </div>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
