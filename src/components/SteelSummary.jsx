import React from 'react';
import RebarPreview from './RebarPreview';
import { Layout, Grid, FileText, ChevronRight } from 'lucide-react';

export default function SteelSummary({ templates }) {
  const beamTemplates = templates.filter(t => t.assemblyId === 'a2');

  if (beamTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        <Layout className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium">No beam templates defined yet.</p>
        <p className="text-slate-400 text-xs mt-1">Add beam templates in the Library to see cross-sections here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Structural Cross-Section Summary
          </h2>
          <p className="text-slate-500 text-sm mt-1">Visual overview of reinforcement details for all beam types in this project.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <span className="text-blue-700 font-bold text-sm">{beamTemplates.length} Beam Types Found</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {beamTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
                  {template.name.split(' ')[1] || template.name}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{template.name}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Section: {template.width} x {template.depth} m
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase">Stirrup: {template.stirrupSize}@{template.stirrupSpacingEnd}</span>
              </div>
            </div>

            {/* Preview Grid */}
            <div className="p-6 grid grid-cols-2 gap-8 bg-gradient-to-br from-white to-slate-50/30">
              {/* Support View */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-100 pb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Support Section (L/4)
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-inner h-[280px] flex items-center justify-center overflow-hidden">
                  <RebarPreview template={template} view="sup" />
                </div>
              </div>

              {/* Mid-span View */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter border-b border-slate-100 pb-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  Mid-Span Section (L/2)
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-inner h-[280px] flex items-center justify-center overflow-hidden">
                  <RebarPreview template={template} view="mid" />
                </div>
              </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 grid grid-cols-3 gap-4">
               <div className="text-center">
                  <span className="block text-[8px] font-black text-slate-400 uppercase">Top Bars</span>
                  <span className="text-xs font-bold text-slate-700">
                    {template.topBars?.[0]?.count || template.topMainCount} {template.topBars?.[0]?.size || template.topMainSize}
                    {template.supportBars?.length > 0 && <span className="text-blue-500 ml-1">+{template.supportBars[0].count}</span>}
                  </span>
               </div>
               <div className="text-center border-x border-slate-200">
                  <span className="block text-[8px] font-black text-slate-400 uppercase">Bottom Bars</span>
                  <span className="text-xs font-bold text-slate-700">
                    {template.bottomBars?.[0]?.count || template.bottomMainCount} {template.bottomBars?.[0]?.size || template.bottomMainSize}
                    {template.spanBars?.length > 0 && <span className="text-indigo-500 ml-1">+{template.spanBars[0].count}</span>}
                  </span>
               </div>
               <div className="text-center">
                  <span className="block text-[8px] font-black text-slate-400 uppercase">Stirrups</span>
                  <span className="text-xs font-bold text-slate-700">{template.stirrupSize} @ {template.stirrupSpacingMiddle}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
