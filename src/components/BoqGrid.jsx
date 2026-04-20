import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Database, 
  Layers, 
  Box, 
  ArrowRight, 
  Grid3X3,
  ListFilter
} from 'lucide-react';
import { useWatch } from 'react-hook-form';

export function BoqGrid({ 
  templates, 
  allInstances,
  register, 
  control,
  setValue,
  compositeFactorF, 
  assemblies 
}) {
  return (
    <div className="admin-card">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
             <ListFilter className="w-4 h-4 text-blue-600" /> BOQ Summary (Grouped by Type)
          </h3>
          <div className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-sm shadow-sm uppercase">
             {allInstances.length} Total Elements Detected
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-12">No.</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">Structural Type</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Plan Qty</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Total Dim</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Sum Direct Cost</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Final Proposal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map((template, index) => (
                <TemplateSummaryRow 
                  key={template.id}
                  index={index}
                  template={template}
                  compositeFactorF={compositeFactorF}
                  instances={allInstances.filter(i => i.templateId === template.id)}
                />
              ))}
              {templates.length === 0 && (
                <tr>
                   <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      No structural types defined. Start by drawing on the Plan.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}

function TemplateSummaryRow({ index, template, compositeFactorF, instances }) {
  const isBeam = template.assemblyId === 'a2';
  const isSlab = template.assemblyId === 'a3';
  
  const totalLength = instances.reduce((s, i) => s + (i.length || 0), 0);
  const totalQty = instances.length;

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="py-3 px-4 text-center">
         <span className="text-xs font-bold text-slate-400">{index + 1}</span>
      </td>
      <td className="py-3 px-4">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-blue-50 flex items-center justify-center border border-blue-100">
               <Box className="w-4 h-4 text-blue-600" />
            </div>
            <div>
               <div className="text-xs font-black text-slate-800 uppercase leading-none mb-1">{template.name}</div>
               <div className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5 leading-none">
                  <span className="bg-slate-100 px-1 py-0.5 rounded-sm">{isBeam ? 'Beam' : isSlab ? 'Slab' : 'Column'}</span>
                  <span>•</span>
                  <span>{template.width}x{template.depth}m</span>
               </div>
            </div>
         </div>
      </td>
      <td className="py-3 px-4 text-center">
         <span className="bg-blue-600 text-white px-2 py-0.5 rounded-sm text-[10px] font-black">{totalQty || 0}</span>
      </td>
      <td className="py-3 px-4 text-center font-mono text-[11px] font-bold text-slate-600">
         {isSlab ? `${(template.width * totalLength).toFixed(2)} m²` : `${totalLength.toFixed(2)} m`}
      </td>
      <td className="py-3 px-4 text-right">
         <div className="text-xs font-bold text-slate-700">฿{(template.cost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      </td>
      <td className="py-3 px-4 text-right">
         <div className="text-sm font-black text-slate-900">฿{((template.cost || 0) * compositeFactorF).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      </td>
    </tr>
  );
}
