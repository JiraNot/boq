import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Copy, Trash2, Settings2, Box, ArrowDownWideNarrow, ChevronDown, ChevronUp, Construction, Ruler, Eye, LayoutGrid, Layout as LayoutIcon } from 'lucide-react';
import { DEFAULT_ASSEMBLIES, STEEL_DATA, WIRE_MESH_DATA } from '../lib/constants';
import { useFieldArray, useWatch } from 'react-hook-form';
import Tooltip from './Tooltip';
import RebarPreview from './RebarPreview';
import LibraryModal from './LibraryModal';

function RebarGroupEditor({ control, register, name, label, showLength = false, autoLabel = null }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name
  });

  return (
    <div className="space-y-3 bg-white/50 p-3 rounded-sm border border-slate-200 shadow-inner">
      <div className="flex items-center justify-between">
         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
         <button 
          type="button" 
          onClick={() => append(showLength ? { count: 2, size: 'DB12', length: 1.0 } : { count: 2, size: 'DB12' })}
          className="text-[9px] font-black text-blue-600 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-sm transition-all border border-blue-600/20"
         >
           + ADD ROW
         </button>
      </div>
      
      <div className="space-y-2">
        {fields.length > 0 && (
          <div className="flex gap-1.5 px-1 border-b border-slate-100 pb-1">
             <span className="w-12 text-[8px] font-black text-slate-400 uppercase text-center">จำนวน</span>
             {(showLength || autoLabel) && <span className="w-16 text-[8px] font-black text-slate-400 uppercase text-center">ยาว (m)</span>}
             <span className="flex-1 text-[8px] font-black text-slate-400 uppercase ml-2">ขนาดเหล็ก</span>
          </div>
        )}
        {fields.map((item, index) => (
          <div key={item.id} className="flex gap-1.5 items-center">
            <input 
              type="number" 
              {...register(`${name}.${index}.count`, { valueAsNumber: true })} 
              className="w-12 admin-input py-1 text-center font-black" 
              placeholder="Qty"
              title="จำนวนเส้น"
            />
            {showLength ? (
              <input 
                type="number" 
                step="0.01" 
                {...register(`${name}.${index}.length`, { valueAsNumber: true })} 
                className="w-16 admin-input py-1 text-center font-black" 
                placeholder="Length"
                title="ความยาวเหล็กเสริม (m)"
              />
            ) : autoLabel ? (
              <div className="w-16 bg-blue-50 border border-blue-100 rounded-sm py-1 text-[8px] font-black text-blue-600 text-center flex items-center justify-center">
                 {autoLabel}
              </div>
            ) : null}
            <select 
              {...register(`${name}.${index}.size`)} 
              className="flex-1 admin-input py-1 font-bold text-[11px]"
              title="เลือกขนาดเหล็ก"
            >
              {Object.entries(STEEL_DATA).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button 
              type="button" 
              onClick={() => remove(index)}
              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {fields.length === 0 && (
          <div className="text-center py-2 text-[9px] font-bold text-slate-300 uppercase italic">No reinforcement added</div>
        )}
      </div>
    </div>
  );
}

// NEW: Separate component to handle individual template reactivity
const TemplateItem = React.memo(({ 
  field, index, isExpanded, toggleExpand, remove, append, register, setValue, control, showExtraRebar, toggleExtraRebar, fields 
}) => {
  // Use useWatch to get LIVE reactive data for THIS specific template only
  const template = useWatch({
    control,
    name: `templates.${index}`,
    defaultValue: field
  });

  const assemblyId = template.assemblyId;
  const isBeam = assemblyId === 'a2';
  const isSlab = assemblyId === 'a3';
  const isColumn = assemblyId === 'a1';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        admin-card transition-all duration-300 overflow-hidden flex flex-col
        ${isExpanded ? 'lg:col-span-2 2xl:col-span-2 ring-2 ring-blue-600 shadow-2xl bg-white scale-[1.01]' : 'bg-slate-50 border-slate-200 hover:border-blue-400'}
      `}
    >
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
              Specs: {template.width}m x {template.depth}m | {isBeam ? 'Multiple Layers' : isColumn ? `${template.mainBarCount} Bars` : template.slabRebarType}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm hover:bg-white/10 transition-colors">
             {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
          <Tooltip text="Duplicate" subtext="คัดลอกมาตรฐานนี้และรันเลข ID ถัดไป">
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                const prefix = DEFAULT_ASSEMBLIES.find(a => a.id === template.assemblyId)?.prefix || 'X';
                const existingInCat = fields.filter(f => f.assemblyId === template.assemblyId).length;
                const clone = { ...template, id: `t-${Date.now()}`, name: `${prefix}${existingInCat + 1}` };
                append(clone);
              }} 
              className={`p-2 rounded-sm transition-colors ${isExpanded ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'text-slate-300 hover:text-blue-500'}`}
            >
              <Copy className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip text="Delete" subtext="ลบมาตรฐานนี้ออกจาก Library">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(index); }} 
              className={`p-2 rounded-sm transition-colors ${isExpanded ? 'hover:bg-red-500 text-slate-400 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {isExpanded && (
        <div className="p-0 border-t border-slate-700/10 flex flex-col xl:flex-row page-transition">
          <div className="flex-1 p-6 space-y-8 bg-slate-50 border-r border-slate-200/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-1.5">
                   <label className="admin-label">Structural Category</label>
                    <select 
                      {...register(`templates.${index}.assemblyId`)} 
                      onChange={(e) => {
                         const newId = e.target.value;
                         setValue(`templates.${index}.assemblyId`, newId);
                         const currentName = template.name;
                         const isDefaultName = /^[A-Z]\d+$/.test(currentName) || currentName === "New Type";
                         if (isDefaultName) {
                            const prefix = DEFAULT_ASSEMBLIES.find(a => a.id === newId)?.prefix || 'X';
                            const existingInCat = fields.filter(f => f.assemblyId === newId).length;
                            setValue(`templates.${index}.name`, `${prefix}${existingInCat + 1}`);
                         }
                      }}
                      className="admin-input py-2"
                    >
                       {DEFAULT_ASSEMBLIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                {!isSlab ? (
                  <div className="space-y-1.5">
                    <label className="admin-label">Width (m)</label>
                    <input type="number" step="0.01" {...register(`templates.${index}.width`, { valueAsNumber: true })} className="admin-input py-2 font-black" />
                  </div>
                ) : (
                  <div className="space-y-1.5 opacity-60">
                    <label className="admin-label">Drawing Mode</label>
                    <div className="admin-input py-2 bg-slate-100 flex items-center gap-2 text-blue-600 font-black italic">
                       <LayoutIcon className="w-3.5 h-3.5" /> RECTANGLE AREA
                    </div>
                  </div>
                )}
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
                    {isBeam ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <RebarGroupEditor control={control} register={register} name={`templates.${index}.topBars`} label="Main Top Reinforcement (เหล็กยืนบน)" />
                          <RebarGroupEditor control={control} register={register} name={`templates.${index}.bottomBars`} label="Main Bottom Reinforcement (เหล็กยืนล่าง)" />
                       </div>
                    ) : (
                       <div className="space-y-1.5">
                          <label className="admin-label">Main Vertical Rebar</label>
                          <div className="flex gap-2">
                             <input type="number" {...register(`templates.${index}.mainBarCount`, { valueAsNumber: true })} className="w-20 admin-input text-center font-black text-lg" />
                             <select {...register(`templates.${index}.mainBarSize`)} className="flex-1 admin-input font-bold text-lg">
                                {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                             </select>
                          </div>
                       </div>
                    )}

                    {isBeam && (
                       <div className="flex flex-col gap-4">
                         <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-sm border border-blue-100">
                            <button 
                              type="button" 
                              onClick={() => toggleExtraRebar(field.id)}
                              className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                            >
                               {showExtraRebar[field.id] ? '− Hide Special Reinforcement' : '+ Add Special Reinforcement (เสริมพิเศษ)'}
                            </button>
                            {showExtraRebar[field.id] && (
                              <label className="flex items-center gap-2 cursor-pointer group">
                                 <input 
                                   type="checkbox" 
                                   {...register(`templates.${index}.useZonedReinforcement`)}
                                   className="w-3.5 h-3.5 rounded-sm border-blue-300 text-blue-600 focus:ring-blue-500"
                                 />
                                 <span className="text-[10px] font-bold text-blue-800 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">Auto-Calculate lengths (L/4 Standard)</span>
                              </label>
                            )}
                         </div>

                         {showExtraRebar[field.id] && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                              <RebarGroupEditor 
                                 control={control} register={register} 
                                 name={`templates.${index}.supportBars`} 
                                 label="Support Reinforcement (เสริมพิเศษหัวเสา)" 
                                 showLength={!template.useZonedReinforcement} 
                                 autoLabel={template.useZonedReinforcement ? "Auto (2 x L/4)" : null}
                              />
                              <RebarGroupEditor 
                                 control={control} register={register} 
                                 name={`templates.${index}.spanBars`} 
                                 label="Span Reinforcement (เสริมพิเศษกลางคาน)" 
                                 showLength={!template.useZonedReinforcement}
                                 autoLabel={template.useZonedReinforcement ? "Auto (L/2)" : null}
                              />
                           </div>
                         )}
                       </div>
                     )}

                    <div className="bg-white p-4 rounded-sm border border-slate-200 space-y-4 shadow-sm">
                       <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                          <ArrowDownWideNarrow className="w-4 h-4 text-blue-500" /> Stirrup Zonation logic (ปลอก)
                       </span>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                             <label className="admin-label text-[9px]">Stirrup Size</label>
                             <select {...register(`templates.${index}.stirrupSize`)} className="admin-input py-1.5 font-black">
                                {Object.entries(STEEL_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                             </select>
                          </div>
                          <div className="space-y-1.5">
                             <label className="admin-label text-[9px]">Zone @Ends</label>
                             <input type="number" step="0.01" {...register(`templates.${index}.stirrupSpacingEnd`, { valueAsNumber: true })} className="admin-input py-1.5 font-black text-blue-600 text-center" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="admin-label text-[9px]">Zone @Mid</label>
                             <input type="number" step="0.01" {...register(`templates.${index}.stirrupSpacingMiddle`, { valueAsNumber: true })} className="admin-input py-1.5 font-black text-slate-600 text-center" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="admin-label text-[9px]">Zone Ratio (1/x)</label>
                             <input 
                               type="number" 
                               step="0.1" 
                               defaultValue={4}
                               onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (val > 0) setValue(`templates.${index}.stirrupZoneRatio`, 1/val);
                               }}
                               className="admin-input py-1.5 font-black text-center" 
                             />
                          </div>
                       </div>
                    </div>
                  </div>
               )}
            </div>
          </div>

          <div className="w-full xl:w-[30%] p-4 md:p-6 bg-white flex flex-col justify-center border-l border-slate-200/50">
             <div className="flex flex-col items-center gap-4 text-center">
                <h4 className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 w-full pb-2 justify-center">
                   <Eye className="w-3.5 h-3.5 text-emerald-500" /> Section Preview
                </h4>
                <div className="bg-slate-50 rounded-full border border-slate-100 p-6 shadow-inner flex items-center justify-center w-40 h-40 md:w-48 md:h-48">
                   <RebarPreview 
                      width={template.width || 0.1}
                      depth={template.depth || 0.1}
                      isBeam={isBeam}
                      isSlab={isSlab}
                      slabType={template.slabRebarType}
                      count={template.mainBarCount || 4}
                      topBars={template.topBars || []}
                      bottomBars={template.bottomBars || []}
                      supportBars={template.supportBars || []}
                      spanBars={template.spanBars || []}
                      className="bg-transparent border-none shadow-none"
                   />
                </div>
                <div className="space-y-2 w-full max-w-[160px]">
                   <div className="flex items-center justify-between text-[10px] font-black border-b border-slate-50 pb-1">
                      <span className="text-slate-400 uppercase">Aspect</span>
                      <span className="text-slate-900">1:{((template.depth || 0.1) / (template.width || 0.1)).toFixed(1)}</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-black">
                      <span className="text-slate-400 uppercase">Area</span>
                      <span className="text-slate-900">{((template.width || 0) * (template.depth || 0)).toFixed(3)} m²</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});

const TemplateManager = React.memo(({ templates: fields, append, remove, register, setValue, watch, control }) => {
  const [expandedId, setExpandedId] = useState(fields[0]?.id || null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showExtraRebar, setShowExtraRebar] = useState({}); // { id: boolean }

  const handleImportFromLibrary = (preset) => {
    const newTemplate = {
      ...preset,
      id: `t-lib-${Date.now()}`,
    };
    append(newTemplate);
    setExpandedId(newTemplate.id);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleExtraRebar = (id) => {
    setShowExtraRebar(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addSpec = (assemblyId) => {
    const assembly = DEFAULT_ASSEMBLIES.find(a => a.id === assemblyId);
    const prefix = assembly?.prefix || 'X';
    const existingInCat = fields.filter(f => f.assemblyId === assemblyId).length;
    
    append({ 
      id: `t-${Date.now()}`,
      name: `${prefix}${existingInCat + 1}`,
      assemblyId: assemblyId,
      width: 0.2, depth: 0.2,
      topBars: [{ count: 2, size: 'DB12' }],
      bottomBars: [{ count: 2, size: 'DB12' }],
      supportBars: [],
      spanBars: [],
      mainBarSize: 'DB12', mainBarCount: 4,
      stirrupSize: 'RB6', stirrupSpacingEnd: 0.10, stirrupSpacingMiddle: 0.20, stirrupZoneRatio: 0.25,
      slabRebarType: 'WIREMESH', slabWireMeshSize: 'WM4', slabGridBarSize: 'RB6', slabGridSpacing: 0.20
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex flex-col">
           <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
             <LayoutGrid className="w-5 h-5 text-blue-600" /> Structural Types Library
           </h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define your structural standards below</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-sm border border-slate-200">
          <Tooltip text="Add Column" subtext="เพิ่มมาตราฐานเสาต้นใหม่">
            <button type="button" onClick={() => addSpec('a1')} className="flex items-center gap-1.5 bg-white text-slate-700 px-3 py-2 rounded-sm text-[10px] font-black shadow-sm hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">
              <Plus className="w-3 h-3" /> Column
            </button>
          </Tooltip>
          <Tooltip text="Add Beam" subtext="เพิ่มมาตราฐานคานใหม่">
            <button type="button" onClick={() => addSpec('a2')} className="flex items-center gap-1.5 bg-white text-slate-700 px-3 py-2 rounded-sm text-[10px] font-black shadow-sm hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">
              <Plus className="w-3 h-3" /> Beam
            </button>
          </Tooltip>
          <Tooltip text="Add Slab" subtext="เพิ่มมาตราฐานพื้นใหม่">
            <button type="button" onClick={() => addSpec('a3')} className="flex items-center gap-1.5 bg-white text-slate-700 px-3 py-2 rounded-sm text-[10px] font-black shadow-sm hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">
              <Plus className="w-3 h-3" /> Slab
            </button>
          </Tooltip>
        </div>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6"
      >
        {fields.map((field, index) => {
          return (
            <TemplateItem 
              key={field.id}
              field={field}
              index={index}
              isExpanded={expandedId === field.id}
              toggleExpand={toggleExpand}
              remove={remove}
              append={append}
              register={register}
              setValue={setValue}
              control={control}
              showExtraRebar={showExtraRebar}
              toggleExtraRebar={toggleExtraRebar}
              fields={fields}
            />
          );
        })}
      </motion.div>
    </div>
  );
});

export default TemplateManager;
