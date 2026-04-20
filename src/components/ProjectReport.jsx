import React from 'react';
import { 
  PieChart, 
  BarChart, 
  TrendingUp, 
  Box, 
  Coins, 
  Database, 
  CheckCircle2,
  FileText,
  Activity
} from 'lucide-react';

export default function ProjectReport({ projectSummary, compositeFactorF }) {
  const { 
    totalMaterialCost, 
    totalLaborCost, 
    directCost, 
    totalSale, 
    margin, 
    resourceTotals,
    calculatedTemplates 
  } = projectSummary;

  const matPercent = ((totalMaterialCost / (directCost || 1)) * 100).toFixed(0);
  const laborPercent = ((totalLaborCost / (directCost || 1)) * 100).toFixed(0);

  // Group resources by category for sub-tables
  const steelResources = Object.values(resourceTotals).filter(r => r.id.startsWith('s'));
  const concreteResources = Object.values(resourceTotals).filter(r => r.id.startsWith('r1'));

  return (
    <div className="space-y-8 page-transition pb-20">
      {/* EXECUTIVE SUMMARY STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="admin-card p-6 border-l-4 border-l-blue-600">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Project Value</span>
            <div className="text-2xl font-black text-slate-900">฿{totalSale.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] font-bold text-blue-600 mt-1 flex items-center gap-1">
               <TrendingUp className="w-3 h-3" /> Includes {((compositeFactorF - 1) * 100).toFixed(1)}% Markup
            </div>
         </div>
         <div className="admin-card p-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estimated Net Profit</span>
            <div className="text-2xl font-black text-emerald-600">฿{margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1">Based on Factor F targets</div>
         </div>
         <div className="admin-card p-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Direct Costs</span>
            <div className="text-2xl font-black text-slate-400">฿{directCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1">{matPercent}% Materials | {laborPercent}% Labor</div>
         </div>
         <div className="admin-card p-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Steel Weight</span>
            <div className="text-2xl font-black text-blue-800">
               {(steelResources.reduce((sum, r) => sum + (r.totalQty || 0), 0) / 1000).toFixed(2)} <span className="text-xs">TONS</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-1">Across all structural nodes</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* COST ANALYTICS */}
         <div className="lg:col-span-4 space-y-6">
            <div className="admin-card p-8 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 self-start flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> Cost Distribution
               </h3>
               <div className="relative w-48 h-48">
                  <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                     <circle r="16" cx="16" cy="16" fill="#F1F5F9" />
                     <circle r="16" cx="16" cy="16" fill="transparent"
                             stroke="#3C50E0" strokeWidth="4" 
                             strokeDasharray={`${matPercent} 100`} />
                     <circle r="16" cx="16" cy="16" fill="transparent"
                             stroke="#10B981" strokeWidth="4"
                             strokeDasharray={`${laborPercent} 100`}
                             strokeDashoffset={`-${matPercent}`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Ratio</span>
                     <span className="text-xl font-black text-slate-800">{matPercent}:{laborPercent}</span>
                  </div>
               </div>
               <div className="mt-8 w-full space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm">
                     <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                        <span className="text-xs font-bold text-slate-600 uppercase">Materials</span>
                     </div>
                     <span className="text-sm font-black text-slate-800">฿{totalMaterialCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-sm">
                     <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs font-bold text-slate-600 uppercase">Labor</span>
                     </div>
                     <span className="text-sm font-black text-slate-800">฿{totalLaborCost.toLocaleString()}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* MATERIAL REQUIREMENTS */}
         <div className="lg:col-span-8 space-y-6">
            <div className="admin-card">
               <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                     <Database className="w-4 h-4 text-blue-600" /> Steel Requirements (by Diameter)
                  </h3>
                  <div className="text-[10px] font-bold text-slate-400">Values include 5-10% Laps/Waste</div>
               </div>
               <div className="p-0">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50">
                        <tr>
                           <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase">Description</th>
                           <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-center">Unit</th>
                           <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-right">Total Weight</th>
                           <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-right">Material Cost</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {steelResources.map(res => (
                           <tr key={res.id} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 font-black text-[10px] flex items-center justify-center rounded-sm">
                                       #{(res.name.match(/\d+/) || [res.id])[0]}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{res.name}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center text-xs font-medium text-slate-500">KGS</td>
                              <td className="px-6 py-4 text-right text-sm font-black text-slate-900">{res.totalQty.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right text-sm font-bold text-slate-500">฿{res.totalCost.toLocaleString()}</td>
                           </tr>
                        ))}
                        {steelResources.length === 0 && (
                           <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic text-xs">No steel requirements calculated. Draw on the plan first.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* CONCRETE VOLUME SUMMARY */}
            <div className="admin-card">
               <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                     <Box className="w-4 h-4 text-emerald-600" /> Concrete Strategy
                  </h3>
               </div>
               <div className="p-6 grid grid-cols-2 gap-8">
                  {concreteResources.map(res => (
                     <div key={res.id} className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-50 rounded-sm">
                           <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Total {res.name}</div>
                           <div className="text-xl font-black text-slate-900">{res.totalQty.toFixed(2)} <span className="text-xs">m³</span></div>
                           <p className="text-[10px] text-slate-500 mt-1 italic">Ready-mix estimate based on net geometric volume + 5% waste factor.</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
