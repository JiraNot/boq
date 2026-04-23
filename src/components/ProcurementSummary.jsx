import React, { useState } from 'react';
import { ShoppingCart, Package, Info, CheckCircle2, ChevronRight, Hash, Ruler } from 'lucide-react';
import { STEEL_DATA, WIRE_MESH_DATA } from '../lib/constants';
import Tooltip from './Tooltip';

export default function ProcurementSummary({ projectSummary }) {
  const { resourceTotals } = projectSummary;
  const [barLength, setBarLength] = useState(10); // Standard 10m or 12m bars

  const getSteelOrder = () => {
    // Calculate total weight of stirrups to subtract from main list
    const stirrupWeights = (projectSummary.stirrupGroups || []).reduce((acc, group) => {
      const weight = group.count * (2 * (parseFloat(group.dim.split('x')[0])/100 + parseFloat(group.dim.split('x')[1])/100)) * group.spec.weight * 1.05;
      acc[group.spec.id] = (acc[group.spec.id] || 0) + weight;
      return acc;
    }, {});

    return Object.entries(STEEL_DATA).map(([key, data]) => {
      const totalWeight = resourceTotals[data.id]?.totalQty || 0;
      const stirrupWeight = stirrupWeights[data.id] || 0;
      const netWeight = Math.max(0, totalWeight - stirrupWeight);
      
      if (netWeight < 0.1) return null; // Hide if basically zero
      
      const weightPerBar = data.weight * barLength;
      const barCount = Math.ceil(netWeight / weightPerBar);
      
      return {
        ...data,
        key,
        totalWeight: netWeight,
        barCount: barCount,
        unit: 'Bars'
      };
    }).filter(Boolean);
  };

  const getMeshOrder = () => {
    return Object.entries(WIRE_MESH_DATA).map(([key, data]) => {
      const weight = resourceTotals[data.id]?.totalQty || 0;
      if (weight === 0) return null;
      
      // Wire mesh weight in kg -> Area in sqm
      const area = weight / data.weightPerSqm;
      const rollCount = Math.ceil(area / 100); // 100 sqm per roll (Standard 2x50m)
      
      return {
        ...data,
        key,
        totalArea: area,
        rollCount: rollCount,
        unit: 'Rolls'
      };
    }).filter(p => p !== null && p.rollCount > 0);
  };

  const steelItems = getSteelOrder();
  const meshItems = getMeshOrder();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-slate-200 rounded-sm shadow-xl p-4 md:p-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 border-b border-slate-100 pb-8 relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-sm flex items-center justify-center shadow-2xl shadow-slate-200">
                 <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Material Ordering List</h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Converted from BOQ weights to retail units</p>
              </div>
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 shadow-inner h-fit">
              <button 
                onClick={() => setBarLength(10)} 
                className={`px-4 py-2 text-[10px] font-black rounded-sm transition-all flex items-center gap-2 ${barLength === 10 ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Ruler className="w-3 h-3" /> 10M BAR
              </button>
              <button 
                onClick={() => setBarLength(12)} 
                className={`px-4 py-2 text-[10px] font-black rounded-sm transition-all flex items-center gap-2 ${barLength === 12 ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Ruler className="w-3 h-3" /> 12M BAR
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
          {/* Main List Section */}
          <div className="xl:col-span-8 space-y-10">
            {/* STEEL REBAR SECTION */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <Package className="w-4 h-4 text-blue-600" /> Steel Reinforcement (Rebar)
                 </h3>
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm uppercase">Standard Length: {barLength}m</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {steelItems.map(item => (
                    <div key={item.key} className="group relative bg-white border border-slate-200 rounded-sm p-6 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex flex-col">
                             <span className="text-2xl font-black text-slate-900 font-mono tracking-tighter uppercase">{item.label}</span>
                             <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm w-fit mt-1">Ordering Unit: {barLength}M Bar</span>
                          </div>
                          <div className="w-12 h-12 bg-slate-900 rounded-sm flex items-center justify-center text-white shadow-lg">
                             <Hash className="w-6 h-6" />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                             <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Weight</div>
                             <div className="text-md font-black text-slate-700">{item.totalWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-sm border border-slate-100">
                             <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Length</div>
                             <div className="text-md font-black text-slate-700">{(item.totalWeight / item.weight).toLocaleString(undefined, { maximumFractionDigits: 1 })} m</div>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Order Quantity</div>
                          <div className="text-[32px] font-black text-slate-900 leading-tight flex items-baseline gap-2 group-hover:text-blue-600 transition-colors">
                             {item.barCount} <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Bars</span>
                          </div>
                       </div>
                       <div className="absolute bottom-0 left-0 h-1.5 bg-blue-600 transition-all duration-300 w-0 group-hover:w-full" />
                    </div>
                ))}
                {steelItems.length === 0 && (
                   <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-100 rounded-sm">
                      <p className="text-xs font-black text-slate-300 uppercase italic">No steel data in currently drawn plan</p>
                   </div>
                )}
              </div>
            </section>

            {/* STIRRUP SECTION (NEW) */}
            {(projectSummary.stirrupGroups || []).length > 0 && (
              <section className="space-y-6">
                <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                   <ShoppingCart className="w-4 h-4 text-orange-500" /> Pre-made Stirrups (เหล็กปลอกสำเร็จรูป)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectSummary.stirrupGroups.map((group, idx) => (
                    <div key={idx} className="group relative bg-white border border-slate-200 rounded-sm p-6 hover:border-orange-500 hover:shadow-2xl transition-all duration-300">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex flex-col">
                             <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">{group.label}</span>
                             <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-sm w-fit mt-1">Ready to Order</span>
                          </div>
                          <div className="w-12 h-12 bg-orange-500 rounded-sm flex items-center justify-center text-white shadow-lg">
                             <Ruler className="w-6 h-6" />
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Order Quantity</div>
                          <div className="text-[32px] font-black text-slate-900 leading-tight flex items-baseline gap-2 group-hover:text-orange-600 transition-colors">
                             {group.count.toLocaleString()} <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Pieces (ตัว)</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* WIRE MESH SECTION */}
            <section className="space-y-6">
              <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                 <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Surface Reinforcement (Wire Mesh)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meshItems.map(item => (
                  <div key={item.key} className="group relative bg-white border border-slate-200 rounded-sm p-5 hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                           <span className="text-lg font-black text-slate-900 font-mono tracking-tighter leading-tight">{item.label}</span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase">Roll Size 2.0 x 50.0 m</span>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                           <Package className="w-5 h-5" />
                        </div>
                     </div>
                     
                     <div className="flex items-end justify-between">
                        <div className="space-y-1">
                           <div className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              Covered Area <ChevronRight className="w-2.5 h-2.5" /> 
                           </div>
                           <div className="text-sm font-black text-slate-600">{item.totalArea.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[28px] font-black text-slate-900 leading-tight flex items-baseline gap-1 group-hover:text-emerald-600 transition-colors">
                              {item.rollCount} <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rolls</span>
                           </div>
                        </div>
                     </div>
                     <div className="absolute bottom-0 left-0 h-1 bg-emerald-600 transition-all duration-300 w-0 group-hover:w-full" />
                  </div>
                ))}
                {meshItems.length === 0 && (
                   <div className="col-span-2 py-8 text-center border-2 border-dashed border-slate-100 rounded-sm">
                      <p className="text-xs font-black text-slate-300 uppercase italic">No wire mesh data detected</p>
                   </div>
                )}
              </div>
            </section>
          </div>

          {/* Guidelines / Sidebar Info */}
          <div className="xl:col-span-4 space-y-6">
             <div className="bg-slate-900 text-white p-7 rounded-sm shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-tl-full -mr-8 -mb-8" />
                <Tooltip text="Estimation Logic" subtext="คำนวณโดยรวมค่าเผื่อเศษเหล็ก 5% และการซ้อนทับตะแกรงเหล็ก 10% ตามมาตรฐานงานก่อสร้าง" position="left">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" /> Estimation Logic
                   </h4>
                </Tooltip>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Cutting Waste (เผื่อตัด)</p>
                      <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                        Includes a **5% allowance** automatically for rebar and **10%** for mesh overlap.
                      </p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Bar Rounding (ปัดเศษเส้น)</p>
                      <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                        Calculated by `Ceil(TotalWeight / BarWeight)`. We always round up to the nearest full bar.
                      </p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Retail Units (หน่วยจัดซื้อ)</p>
                      <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
                        Standard retail units for Thailand markets (10m bars / 100sqm rolls).
                      </p>
                   </div>
                </div>
             </div>
             
             <div className="p-6 border border-slate-200 rounded-sm bg-blue-50/30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Export Status</p>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" /> Ready for Procurement Export
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
