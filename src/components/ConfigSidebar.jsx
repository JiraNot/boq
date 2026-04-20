import React from 'react';
import { Settings, Info, Percent } from 'lucide-react';
import { SteelSummary } from './SteelSummary';

export function ConfigSidebar({ register, compositeFactorF, projectSummary }) {
  return (
    <div className="space-y-6">
       {/* PROJECT IDENTITY CARD */}
       <div className="admin-card">
          <div className="px-7 py-4 border-b border-slate-200">
             <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--primary)]" /> Basic Information
             </h3>
          </div>
          <div className="p-7 space-y-4">
             <div>
                <label className="admin-label">Project Name</label>
                <input {...register("projectName")} className="admin-input" placeholder="Enter project title..." />
             </div>
          </div>
       </div>

       {/* FACTOR F SETTINGS CARD */}
       <div className="admin-card">
          <div className="px-7 py-4 border-b border-slate-200 flex items-center justify-between">
             <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-[var(--primary)]" /> Factor F Markup
             </h3>
             <span className="text-[var(--primary)] font-bold">{compositeFactorF.toFixed(2)}x</span>
          </div>
          <div className="p-7 space-y-6">
             <div>
                <label className="admin-label">Profit Rate (%)</label>
                <input type="number" {...register("profitRate", { valueAsNumber: true })} className="admin-input" />
             </div>
             <div>
                <label className="admin-label">Tax (VAT) (%)</label>
                <input type="number" {...register("taxRate", { valueAsNumber: true })} className="admin-input" />
             </div>
             <div>
                <label className="admin-label">Overhead Rate (%)</label>
                <input type="number" {...register("overheadRate", { valueAsNumber: true })} className="admin-input" />
             </div>
          </div>
       </div>

       {/* ANALYTICS / CHART CARD */}
       <div className="admin-card">
          <div className="px-7 py-4 border-b border-slate-200">
             <h3 className="font-semibold text-slate-900 grow">Cost Distribution</h3>
          </div>
          <div className="p-7 flex flex-col items-center">
             <div className="relative w-40 h-40">
                <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                   <circle r="16" cx="16" cy="16" fill="#F1F5F9" />
                   <circle r="16" cx="16" cy="16" fill="transparent"
                           stroke="var(--primary)" strokeWidth="3" 
                           strokeDasharray={`${(projectSummary.totalMaterialCost / projectSummary.directCost) * 100 || 0} 100`} />
                   <circle r="16" cx="16" cy="16" fill="transparent"
                           stroke="#10B981" strokeWidth="3"
                           strokeDasharray={`${(projectSummary.totalLaborCost / projectSummary.directCost) * 100 || 0} 100`}
                           strokeDashoffset={`-${(projectSummary.totalMaterialCost / projectSummary.directCost) * 100 || 0}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-xs font-bold text-slate-500 uppercase">Ratio</span>
                </div>
             </div>
             <div className="mt-6 w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[var(--primary)] rounded-full"></div> Material</div>
                   <span className="font-bold">{((projectSummary.totalMaterialCost / projectSummary.directCost) * 100 || 0).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#10B981] rounded-full"></div> Labor</div>
                   <span className="font-bold">{((projectSummary.totalLaborCost / projectSummary.directCost) * 100 || 0).toFixed(0)}%</span>
                </div>
             </div>
          </div>
       </div>

       <SteelSummary projectSummary={projectSummary} />
    </div>
  );
}
