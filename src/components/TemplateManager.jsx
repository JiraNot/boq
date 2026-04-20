import React, { useState } from 'react';
import { Layers, Plus, Trash2, Settings2, Box, ArrowDownWideNarrow, ChevronDown, ChevronUp, Construction, Ruler, Eye, LayoutGrid } from 'lucide-react';
import { DEFAULT_ASSEMBLIES, STEEL_DATA, WIRE_MESH_DATA } from '../lib/constants';
import RebarPreview from './RebarPreview';

export default function TemplateManager({ templates: fields, append, remove, register, setValue, watch }) {
  const [expandedId, setExpandedId] = useState(fields[0]?.id || null);
  const watchedTemplates = watch ? watch('templates') : [];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
           <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
             <LayoutGrid className="w-5 h-5 text-blue-600" /> Structural Types Library
           </h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define your structural standards below</p>
        </div>
        <button 
          onClick={() => append({ 
            id: `t-${Date.now()}`,
            name: 'New Type',
            assemblyId: 'a1',
            width: 0.2, depth: 0.2,
            mainBarSize: 'DB12', mainBarCount: 4,
            topMainSize: 'DB12', topMainCount: 2, 
            bottomMainSize: 'DB12', bottomMainCount: 2,
            extraTopSize: 'DB12', extraTopCount: 0, extraTopLength: 1.0,
            extraBottomSize: 'DB12', extraBottomCount: 0, extraBottomLength: 1.0,
            stirrupSize: 'RB6', stirrupSpacingEnd: 0.10, stirrupSpacingMiddle: 0.20, stirrupZoneRatio: 0.25,
            slabRebarType: 'WIREMESH', slabWireMeshSize: 'WM4', slabGridBarSize: 'RB6', slabGridSpacing: 0.20
          })}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-sm text-xs font-black shadow-xl hover:bg-blue-700 hover:translate-y-[-1px] active:translate-y-0 transition-all uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" /> Add New Spec
        </button>
      </div>

      {/* RESPONSIVE GRID OF TEMPLATES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {fields.map((field, index) => {
          const isExpanded = expandedId === field.id;
          const template = watchedTemplates[index] || field;
          const assemblyId = template.assemblyId;
          const isBeam = assemblyId === 'a2';
          const isSlab = assemblyId === 'a3';
          const isColumn = assemblyId === 'a1';

          return (
            <div 
              key={field.id} 
              className={`
                admin-card transition-all duration-300 overflow-hidden flex flex-col
                ${isExpanded ? 'lg:col-span-2 2xl:col-span-2 ring-2 ring-blue-600 shadow-2xl bg-white scale-[1.01]' : 'bg-slate-50 border-slate-200 hover:border-blue-400'}
              `}
            >
              {/* HEADER (Compact Row) */}
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-slate-900 text-white' : 'hover:bg-slate-100/50'}`}
                onClick={() => toggleExpand(field.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center shadow-lg ${isExpanded ? 'bg-blue-600' : 'bg-slate-800 text-white'}`}>
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <input 
                        {...register(`templates.${index}.name`)} 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent border-none font-black text-sm outline-none w-32 uppercase tracking-tight focus:ring-1 focus:ring-blue-400 rounded-sm"
                       />
                       {!isExpanded && <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase">{isBeam ? 'Beam' : isSlab ? 'Slab' : 'Column'}</span>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isExpanded ? 'text-slate-400' : 'text-slate-500'}`}>
                      Specs: {template.width}m x {template.depth}m | {isBeam ? `${template.topMainCount}T/${template.bottomMainCount}B` : isColumn ? `${template.mainBarCount} Bars` : template.slabRebarType}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-sm hover:bg-white/10 transition-colors">
                     {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); remove(index); }} 
                    className={`p-2 rounded-sm transition-colors ${isExpanded ? 'hover:bg-red-500 text-slate-400 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* EXPANDED CONTENT (Horizontal Split) */}
              {isExpanded && (
                <div className="p-0 border-t border-slate-700/10 flex flex-col xl:flex-row page-transition">
                  {/* LEFT: SETTINGS (2/3) */}
                  <div className="flex-1 p-6 space-y-8 bg-slate-50 border-r border-slate-200/50">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                           <label className="admin-label">Structural Category</label>
                           <select {...register(`templates.${index}.assemblyId`)} className="admin-input py-2">
                              {DEFAULT_ASSEMBLIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="admin-label">Width (m)</label>
                          <input type="number" step="0.01" {...register(`templates.${index}.width`, { valueAsNumber: true })} className="admin-input py-2 font-black" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="admin-label">{isSlab ? 'Thickness (m)' : 'Depth (m)'}</label>
                          <input type="number" step="0.01" {...register(`templates.${index}.depth`, { valueAsNumber: true })} className="admin-input py-2 font-black" />
                        </div>
                    </div>

                    <div className="space-y-5">
                       <h4 className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">
                          <Construction className="w-4 h-4" /> Reinforcement Optimization
                       </h4>

                       {isSlab ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <label className="admin-label">Rebar Mode</label>
                                <div className="flex bg-white p-1 rounded-sm border border-slate-200 w-full shadow-inner">
                                   <button type="button" onClick={() => setValue(`templates.${index}.slabRebarType`, 'WIREMESH')} className={`flex-1 py-2 text-[10px] font-black rounded-sm transition-all ${template.slabRebarType === 'WIREMESH' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>WIRE MESH</button>
                                   <button type="button" onClick={() => setValue(`templates.${index}.slabRebarType`, 'GRID')} className={`flex-1 py-2 text-[10px] font-black rounded-sm transition-all ${template.slabRebarType === 'GRID' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>STEEL GRID</button>
                                </div>
                             </div>
                             <div className="space-y-4">
                                {template.slabRebarType === 'WIREMESH' ? (
                                   <div className="space-y-1.5">
                                      <label className="admin-label">Mesh Specification</label>
                                      <select {...register(`templates.${index}.slabWireMeshSize`)} className="admin-input font-bold">
                                         {Object.entries(WIRE_MESH_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                      </select>
                                   </div>
                                ) : (
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                         <label className="admin-label">Diameter</label>
                                         <select {...register(`templates.${index}.slabGridBarSize`)} className="admin-input font-bold">
                                            {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                         </select>
                                      </div>
                                      <div className="space-y-1.5">
                                         <label className="admin-label">Spacing (m)</label>
                                         <input type="number" step="0.01" {...register(`templates.${index}.slabGridSpacing`, { valueAsNumber: true })} className="admin-input border-blue-200" />
                                      </div>
                                   </div>
                                )}
                             </div>
                          </div>
                       ) : (
                          <div className="space-y-6">
                             {/* Main Bars */}
                             <div className="grid grid-cols-2 gap-6">
                                {isBeam ? (
                                   <>
                                   <div className="space-y-2">
                                      <label className="admin-label text-slate-800">Top Main (เหล็กบน)</label>
                                      <div className="flex gap-2">
                                         <input type="number" {...register(`templates.${index}.topMainCount`, { valueAsNumber: true })} className="w-16 admin-input text-center font-black" />
                                         <select {...register(`templates.${index}.topMainSize`)} className="flex-1 admin-input font-bold">
                                            {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                         </select>
                                      </div>
                                   </div>
                                   <div className="space-y-2">
                                      <label className="admin-label text-slate-800">Bottom Main (เหล็กล่าง)</label>
                                      <div className="flex gap-2">
                                         <input type="number" {...register(`templates.${index}.bottomMainCount`, { valueAsNumber: true })} className="w-16 admin-input text-center font-black" />
                                         <select {...register(`templates.${index}.bottomMainSize`)} className="flex-1 admin-input font-bold">
                                            {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                         </select>
                                      </div>
                                   </div>
                                   </>
                                ) : (
                                   <div className="col-span-2 space-y-2">
                                      <label className="admin-label">Main Longitudinal Bars (เหล็กยืน)</label>
                                      <div className="flex gap-2 max-w-sm">
                                         <input type="number" {...register(`templates.${index}.mainBarCount`, { valueAsNumber: true })} className="w-20 admin-input text-center font-black text-lg" />
                                         <select {...register(`templates.${index}.mainBarSize`)} className="flex-1 admin-input font-bold text-lg">
                                            {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                         </select>
                                      </div>
                                   </div>
                                )}
                             </div>

                             {/* EXTRA REBAR (BEAMS) */}
                             {isBeam && (
                                <div className="grid grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-sm border border-blue-100">
                                   <div className="space-y-2">
                                      <label className="admin-label text-blue-600">Extra Top Reinforcement</label>
                                      <div className="flex gap-1.5">
                                         <input type="number" {...register(`templates.${index}.extraTopCount`, { valueAsNumber: true })} title="Count" className="w-12 admin-input py-1.5 text-center font-black" />
                                         <input type="number" step="0.01" {...register(`templates.${index}.extraTopLength`, { valueAsNumber: true })} title="Length (m)" className="w-16 admin-input py-1.5 text-center font-black" />
                                         <select {...register(`templates.${index}.extraTopSize`)} className="flex-1 admin-input py-1.5 font-bold text-[11px]">
                                            {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                         </select>
                                      </div>
                                   </div>
                                   <div className="space-y-2">
                                      <label className="admin-label text-blue-600">Extra Bottom Reinforcement</label>
                                      <div className="flex gap-1.5">
                                         <input type="number" {...register(`templates.${index}.extraBottomCount`, { valueAsNumber: true })} title="Count" className="w-12 admin-input py-1.5 text-center font-black" />
                                         <input type="number" step="0.01" {...register(`templates.${index}.extraBottomLength`, { valueAsNumber: true })} title="Length (m)" className="w-16 admin-input py-1.5 text-center font-black" />
                                         <select {...register(`templates.${index}.extraBottomSize`)} className="flex-1 admin-input py-1.5 font-bold text-[11px]">
                                            {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                         </select>
                                      </div>
                                   </div>
                                </div>
                             )}

                             {/* Stirrups (Advanced Zones) */}
                             <div className="bg-white p-4 rounded-sm border border-slate-200 space-y-4 shadow-sm">
                                <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                   <ArrowDownWideNarrow className="w-4 h-4 text-blue-500" /> Stirrup Zonation logic (ปลอก)
                                </span>
                                <div className="grid grid-cols-4 gap-4">
                                   <div className="space-y-1.5">
                                      <label className="admin-label text-[9px]">Stirrup Size</label>
                                      <select {...register(`templates.${index}.stirrupSize`)} className="admin-input py-1.5 font-black">
                                         {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                      </select>
                                   </div>
                                   <div className="space-y-1.5">
                                      <label className="admin-label text-[9px]">Zone @Ends (ถี่)</label>
                                      <input type="number" step="0.01" {...register(`templates.${index}.stirrupSpacingEnd`, { valueAsNumber: true })} className="admin-input py-1.5 font-black text-blue-600 text-center" />
                                   </div>
                                   <div className="space-y-1.5">
                                      <label className="admin-label text-[9px]">Zone @Middle (ห่าง)</label>
                                      <input type="number" step="0.01" {...register(`templates.${index}.stirrupSpacingMiddle`, { valueAsNumber: true })} className="admin-input py-1.5 font-black text-slate-600 text-center" />
                                   </div>
                                   <div className="space-y-1.5">
                                      <label className="admin-label text-[9px]">Zone Ratio (L/x)</label>
                                      <div className="flex items-center admin-input py-1 px-1.5 bg-slate-50">
                                         <span className="text-[9px] font-black text-slate-400 mr-1">1/</span>
                                         <input 
                                          type="number" 
                                          step="0.1" 
                                          value={template.stirrupZoneRatio > 0 ? (1 / template.stirrupZoneRatio).toFixed(0) : 4} 
                                          onChange={(e) => {
                                             const val = parseFloat(e.target.value);
                                             if (val > 0) setValue(`templates.${index}.stirrupZoneRatio`, 1/val);
                                          }}
                                          className="w-full bg-transparent border-none p-0 text-[11px] font-black outline-none" 
                                         />
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                  </div>

                  {/* RIGHT: PREVIEW (1/3) */}
                  <div className="w-full xl:w-[35%] p-8 bg-white flex flex-col justify-center border-l border-slate-200/50">
                     <div className="flex flex-col items-center gap-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 w-full pb-3 text-center justify-center mb-4">
                           <Eye className="w-4 h-4 text-emerald-500" /> Professional Section Preview
                        </h4>
                        <div className="bg-slate-50 rounded-full border border-slate-100 p-8 shadow-inner flex items-center justify-center w-64 h-64 hover:scale-105 transition-transform duration-500">
                           <RebarPreview 
                              width={template.width}
                              depth={template.depth}
                              isBeam={isBeam}
                              isSlab={isSlab}
                              slabType={template.slabRebarType}
                              count={template.mainBarCount}
                              topCount={template.topMainCount}
                              bottomCount={template.bottomMainCount}
                              extraTopCount={template.extraTopCount}
                              extraBottomCount={template.extraBottomCount}
                              className="bg-transparent border-none shadow-none"
                           />
                        </div>
                        <div className="space-y-3 w-full max-w-[200px]">
                           <div className="flex items-center justify-between text-[10px] font-black border-b border-slate-50 pb-1">
                              <span className="text-slate-400 uppercase">Aspect</span>
                              <span className="text-slate-900">1:{(template.depth / template.width).toFixed(1)}</span>
                           </div>
                           <div className="flex items-center justify-between text-[10px] font-black border-b border-slate-50 pb-1">
                              <span className="text-slate-400 uppercase">Area</span>
                              <span className="text-slate-900">{(template.width * template.depth).toFixed(3)} m²</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
