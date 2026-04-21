import React from 'react';
import { ListTree, Box, Ruler, Hash, Construction, ArrowRight } from 'lucide-react';
import { DEFAULT_ASSEMBLIES } from '../lib/constants';

export default function DetailedTakeoff({ projectSummary }) {
  const { calculatedTemplates } = projectSummary;

  // Filter templates that actually have instances
  const activeTemplates = calculatedTemplates.filter(t => t.totalQty > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-blue-600 rounded-sm text-white shadow-lg">
              <ListTree className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Detailed Take-off List</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Itemized breakdown by piece and length</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {activeTemplates.map(template => {
          const assembly = DEFAULT_ASSEMBLIES.find(a => a.id === template.assemblyId);
          const isBeam = template.assemblyId === 'a2';
          
          return (
            <div key={template.id} className="admin-card overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="bg-slate-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-white shadow-lg">
                      <Box className="w-4 h-4" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-tight">{template.name}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{assembly?.name} | {template.width}x{template.depth}m</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Pieces</div>
                      <div className="text-lg font-black text-white leading-none">{template.totalQty} <span className="text-[9px] text-slate-500 italic">pcs</span></div>
                   </div>
                </div>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Index / Mark</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Piece Length (m)</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Quantity</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Sum Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.groupedInstances.map((group, gIdx) => (
                      <tr key={gIdx} className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors group">
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                 {gIdx + 1}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase italic">Instance Group</span>
                           </div>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                              <Ruler className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-lg font-black text-slate-800 font-mono tracking-tighter">{group.length.toFixed(2)} <span className="text-[10px] text-slate-400">m</span></span>
                           </div>
                        </td>
                        <td className="p-4 text-center">
                           <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-blue-100 transition-colors">
                              <Hash className="w-3 h-3 text-slate-400" />
                              <span className="text-sm font-black text-slate-700">{group.count} ชิ้น</span>
                           </div>
                        </td>
                        <td className="p-4 text-right">
                           <span className="text-sm font-black text-slate-500 tracking-tighter">
                              {(group.length * group.count).toFixed(2)} m
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/50">
                    <tr>
                      <td colSpan="3" className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aggregate Template Length:</td>
                      <td className="p-4 text-right">
                         <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-slate-900 tracking-tight">{template.totalLength.toFixed(2)} m</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Includes all {template.totalQty} segments</span>
                         </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-4 bg-blue-50/30 border-t border-slate-100">
                <div className="flex items-center gap-4 text-[10px] font-bold text-blue-800 uppercase tracking-widest">
                   <Construction className="w-4 h-4" /> 
                   <span>Fabrication Note:</span>
                   <ArrowRight className="w-3 h-3" />
                   <span className="italic text-blue-600">Refer to standard rebar spacing for this template in the spec library.</span>
                </div>
              </div>
            </div>
          )
        })}
        
        {activeTemplates.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-sm">
             <ListTree className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <h3 className="text-sm font-black text-slate-300 uppercase italic">Draw elements on canvas to generate itemized takeoff</h3>
          </div>
        )}
      </div>
    </div>
  );
}
