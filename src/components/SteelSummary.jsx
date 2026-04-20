import React from 'react';
import { Layers, Activity } from 'lucide-react';

export function SteelSummary({ projectSummary }) {
  // Aggregated weights from projectSummary.resourceTotals
  const rb6Weight = projectSummary.resourceTotals?.r4?.totalQty || 0;
  const db12Weight = projectSummary.resourceTotals?.r5?.totalQty || 0;
  const db16Weight = projectSummary.resourceTotals?.r6?.totalQty || 0;

  const totalSteel = rb6Weight + db12Weight + db16Weight;

  return (
    <div className="admin-card">
       <div className="px-7 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
             <Layers className="w-4 h-4 text-[var(--primary)]" /> Steel Requirements
          </h3>
          <span className="text-xs font-bold text-slate-400">UNIT: KG</span>
       </div>
       <div className="p-7 space-y-5">
          <div className="space-y-2">
             <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-500">RB6 (Stirrups)</span>
                <span className="font-bold text-slate-900">{rb6Weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400" style={{ width: `${(rb6Weight / totalSteel) * 100 || 0}%` }} />
             </div>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-500">DB12 (Main Bars)</span>
                <span className="font-bold text-slate-900">{db12Weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${(db12Weight / totalSteel) * 100 || 0}%` }} />
             </div>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-500">DB16 (Structural)</span>
                <span className="font-bold text-slate-900">{db16Weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-700" style={{ width: `${(db16Weight / totalSteel) * 100 || 0}%` }} />
             </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
             <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-sm flex items-center justify-center">
                <Activity className="w-4 h-4" />
             </div>
             <div className="flex-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Total Weight</span>
                <span className="block text-lg font-bold text-slate-900 leading-none">{totalSteel.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</span>
             </div>
          </div>
       </div>
    </div>
  );
}
