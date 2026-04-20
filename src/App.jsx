import React, { useMemo, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useBoqStore } from './hooks/use-boq-store';
import { evaluateFormula } from './lib/calculator';
import { DEFAULT_RESOURCES, DEFAULT_ASSEMBLIES, STEEL_DATA, WIRE_MESH_DATA } from './lib/constants';
import { generatePDF } from './lib/pdf-export';

// Layout
import AdminLayout from './components/AdminLayout';

// UI Components
import { Header } from './components/SummaryCards';
import { BoqGrid } from './components/BoqGrid';
import LayoutCanvas from './components/LayoutCanvas';
import TemplateManager from './components/TemplateManager';
import SettingsModal from './components/SettingsModal';
import ProjectReport from './components/ProjectReport';

// Icons
import { Table as TableIcon, Layout as LayoutIcon, FileText, Settings as CategoryIcon } from 'lucide-react';

export default function App() {
  const { form, data } = useBoqStore();
  const { register, control, setValue } = form;
  
  const { fields: templates, append: appendTemplate, remove: removeTemplate } = useFieldArray({ control, name: "templates" });
  const { fields: instances, append: appendInstance, remove: removeInstance, update: updateInstance } = useFieldArray({ control, name: "instances" });
  
  const [activeTab, setActiveTab] = useState('layout'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { templates: watchTemplates, instances: watchInstances, profitRate, taxRate, overheadRate } = data;

  const compositeFactorF = useMemo(() => 1 + (profitRate / 100) + (taxRate / 100) + (overheadRate / 100), [profitRate, taxRate, overheadRate]);

  // V2 CALCULATION ENGINE
  const projectSummary = useMemo(() => {
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    const resourceTotals = {};

    const templateSummaries = (watchTemplates || []).map(template => {
      const assembly = DEFAULT_ASSEMBLIES.find(a => a.id === template.assemblyId);
      const myInstances = (watchInstances || []).filter(inst => inst.templateId === template.id);
      
      const totalLength = myInstances.reduce((sum, inst) => sum + (inst.length || 0), 0);
      const totalQty = myInstances.length || 0;

      if (!assembly || totalQty === 0) return { ...template, cost: 0, totalLength, totalQty };

      let templateMaterial = 0;
      let templateLabor = 0;

      const addSteel = (specId, qty) => {
        if (!qty || qty <= 0) return;
        const specResource = DEFAULT_RESOURCES.find(r => r.id === specId);
        const cost = qty * (specResource?.basePrice || 0);
        
        if (!resourceTotals[specId]) {
          resourceTotals[specId] = { ...specResource, totalQty: 0, totalCost: 0 };
        }
        resourceTotals[specId].totalQty += qty;
        resourceTotals[specId].totalCost += cost;
        templateMaterial += cost;
      };

      assembly.components.forEach(comp => {
        const resource = DEFAULT_RESOURCES.find(r => r.id === comp.resourceId);
        if (!resource) return;

        const qtyForTemplate = evaluateFormula(comp.formula, {
          width: Number(template.width),
          depth: Number(template.depth),
          height: Number(template.height),
          length: totalLength,
          quantity: totalQty
        });
        
        const cost = qtyForTemplate * resource.basePrice;
        if (!resourceTotals[resource.id]) {
          resourceTotals[resource.id] = { ...resource, totalQty: 0, totalCost: 0 };
        }
        resourceTotals[resource.id].totalQty += qtyForTemplate;
        resourceTotals[resource.id].totalCost += cost;

        if (resource.type === 'MATERIAL') templateMaterial += cost;
        else templateLabor += cost;
      });

      if (assembly.hasRebar) {
        if (assembly.isSlab) {
           const totalArea = template.width * totalLength;
           if (template.slabRebarType === 'WIREMESH') {
              const meshSpec = WIRE_MESH_DATA[template.slabWireMeshSize];
              if (meshSpec) addSteel(meshSpec.id, totalArea * 1.10 * meshSpec.weightPerSqm);
           } else {
              const spacing = template.slabGridSpacing || 0.2;
              const gridSpec = STEEL_DATA[template.slabGridBarSize];
              if (gridSpec) addSteel(gridSpec.id, totalArea * (1/spacing * 2) * gridSpec.weight * 1.05);
           }
        } else {
           const isBeam = assembly.id === 'a2';
           if (isBeam) {
             const topSpec = STEEL_DATA[template.topMainSize];
             if (topSpec) addSteel(topSpec.id, template.topMainCount * totalLength * topSpec.weight * 1.05);
             const botSpec = STEEL_DATA[template.bottomMainSize];
             if (botSpec) addSteel(botSpec.id, template.bottomMainCount * totalLength * botSpec.weight * 1.05);

             // EXTRA REBAR (Beams)
             const extraTopSpec = STEEL_DATA[template.extraTopSize];
             if (extraTopSpec && template.extraTopCount > 0) {
                addSteel(extraTopSpec.id, template.extraTopCount * template.extraTopLength * totalQty * extraTopSpec.weight * 1.05);
             }
             const extraBotSpec = STEEL_DATA[template.extraBottomSize];
             if (extraBotSpec && template.extraBottomCount > 0) {
                addSteel(extraBotSpec.id, template.extraBottomCount * template.extraBottomLength * totalQty * extraBotSpec.weight * 1.05);
             }
           } else {
             const mainSpec = STEEL_DATA[template.mainBarSize];
             if (mainSpec) addSteel(mainSpec.id, template.mainBarCount * totalLength * mainSpec.weight * 1.05);
           }

           const stirrupSpec = STEEL_DATA[template.stirrupSize];
           if (stirrupSpec) {
             const sEnd = template.stirrupSpacingEnd || 0.10;
             const sMid = template.stirrupSpacingMiddle || 0.20;
             const ratio = template.stirrupZoneRatio || 0.25;
             const stirrupLength = 2 * (template.width + template.depth);
             const lengthEndTotal = totalLength * ratio * 2;
             const lengthMidTotal = totalLength - lengthEndTotal;
             const totalStirrupWeight = (lengthEndTotal/sEnd + lengthMidTotal/sMid) * stirrupLength * stirrupSpec.weight * 1.05;
             addSteel(stirrupSpec.id, totalStirrupWeight);
           }
        }
      }

      totalMaterialCost += templateMaterial;
      totalLaborCost += templateLabor;
      return { ...template, cost: templateMaterial + templateLabor, materialCost: templateMaterial, laborCost: templateLabor, totalLength, totalQty, instances: myInstances };
    });

    const directCost = totalMaterialCost + totalLaborCost;
    const totalSale = directCost * compositeFactorF;
    return { calculatedTemplates: templateSummaries, resourceTotals, totalMaterialCost, totalLaborCost, directCost, totalSale, margin: totalSale - directCost };
  }, [watchTemplates, watchInstances, compositeFactorF]);

  const updateInstanceLayout = (id, updates) => {
    const index = watchInstances.findIndex(i => i.id === id);
    if (index !== -1) {
      updateInstance(index, { ...watchInstances[index], ...updates });
    }
  };

  const deleteInstance = (id) => {
    const index = watchInstances.findIndex(inst => inst.id === id);
    if (index !== -1) {
      removeInstance(index);
    }
  };

  const addInstance = (templateId, x1=0, y1=0, x2=2, y2=0) => {
    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    appendInstance({
      id: `inst-${Date.now()}`,
      templateId, x1, y1, x2, y2, 
      length: Math.round(dist * 100) / 100,
      isPlaced: true
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Header 
          projectSummary={projectSummary} 
          onExport={() => {}} 
          onExportPDF={() => generatePDF(projectSummary, compositeFactorF)} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-sm w-fit border border-slate-200 shadow-sm">
           <button onClick={() => setActiveTab('layout')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'layout' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
             <LayoutIcon className="w-3.5 h-3.5" /> 1. PLAN TAKEOFF
           </button>
           <button onClick={() => setActiveTab('table')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'table' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
             <TableIcon className="w-3.5 h-3.5" /> 2. BOQ SUMMARY
           </button>
           <button onClick={() => setActiveTab('report')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'report' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
             <FileText className="w-3.5 h-3.5" /> 3. PROJECT REPORT
           </button>
        </div>

        <div className="space-y-8">
          {/* MAIN VIEW */}
          <div className="w-full">
            {activeTab === 'layout' && (
               <div className="space-y-8 page-transition">
                  <LayoutCanvas 
                    items={watchInstances.map(inst => ({ ...inst, name: watchTemplates.find(t => t.id === inst.templateId)?.name }))} 
                    updateItem={updateInstanceLayout} 
                    deleteItem={deleteInstance}
                    templates={watchTemplates}
                    addInstance={addInstance}
                  />
                  <div className="pt-4 border-t border-slate-200">
                    <TemplateManager templates={templates} append={appendTemplate} remove={removeTemplate} register={register} setValue={setValue} watch={form.watch} />
                  </div>
               </div>
            )}
            {activeTab === 'table' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 page-transition">
                <div className="xl:col-span-3">
                  <TemplateManager templates={templates} append={appendTemplate} remove={removeTemplate} register={register} setValue={setValue} />
                </div>
                <div className="xl:col-span-9">
                  <BoqGrid 
                    templates={projectSummary.calculatedTemplates}
                    allInstances={watchInstances}
                    register={register}
                    control={control}
                    setValue={setValue}
                    compositeFactorF={compositeFactorF}
                    assemblies={DEFAULT_ASSEMBLIES}
                    onDeleteItem={deleteInstance}
                  />
                </div>
              </div>
            )}
            {activeTab === 'report' && (
              <ProjectReport projectSummary={projectSummary} compositeFactorF={compositeFactorF} />
            )}
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        register={register}
        compositeFactorF={compositeFactorF}
      />
    </AdminLayout>
  );
}
