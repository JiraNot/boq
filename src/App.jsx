import React, { useMemo, useState, useRef, useEffect } from 'react';
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
import ProcurementSummary from './components/ProcurementSummary';
import DetailedTakeoff from './components/DetailedTakeoff';
import AuthModal from './components/AuthModal';
import CloudSyncStatus from './components/CloudSyncStatus';
import AIVisionAssistant from './components/AIVisionAssistant';
import SteelSummary from './components/SteelSummary';
import { signOut } from './lib/pocketbase';
import { Sparkles } from 'lucide-react';


// Icons
import { Table as TableIcon, Layout as LayoutIcon, FileText, ShoppingCart, Settings as CategoryIcon, ListTree, ScrollText } from 'lucide-react';

export default function App() {
  const { form, data, resetToDefault } = useBoqStore();
  const { register, control, setValue, reset } = form;
  const projectFileInputRef = useRef(null);
  
  const { fields: templates, append: appendTemplate, remove: removeTemplate } = useFieldArray({ control, name: "templates" });
  const { fields: instances, append: appendInstance, remove: removeInstance, update: updateInstance } = useFieldArray({ control, name: "instances" });
  
  const [activeTab, setActiveTab] = useState('layout'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const { user, isSyncing, lastSync } = useBoqStore();
  
  const { templates: watchTemplates, instances: watchInstances, profitRate, taxRate, overheadRate } = data;

  const compositeFactorF = useMemo(() => 1 + (profitRate / 100) + (taxRate / 100) + (overheadRate / 100), [profitRate, taxRate, overheadRate]);

  // V2 CALCULATION ENGINE
  const projectSummary = useMemo(() => {
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    const resourceTotals = {};
    const stirrupGroups = {};

    const templateSummaries = (watchTemplates || []).map(template => {
      const assembly = DEFAULT_ASSEMBLIES.find(a => a.id === template.assemblyId);
      const myInstances = (watchInstances || []).filter(inst => inst.templateId === template.id);
      
      const totalLength = myInstances.reduce((sum, inst) => sum + (inst.length || 0), 0);
      const totalQty = myInstances.length || 0;

      // SAFETY FILTER: If no instances drawn, skip all calculations for this template
      if (!assembly || totalQty === 0) {
        return { ...template, cost: 0, materialCost: 0, laborCost: 0, totalLength: 0, totalQty: 0, instances: [] };
      }

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
           // REVT-STYLE: Calculate area from rectangle coordinates
           const totalArea = myInstances.reduce((sum, inst) => {
              const w = Math.abs(inst.x2 - inst.x1);
              const h = Math.abs(inst.y2 - inst.y1);
              return sum + (w * h);
           }, 0);

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
              // TOP BARS
              const topBars = template.topBars || [{ count: template.topMainCount, size: template.topMainSize }];
              topBars.forEach(grp => {
                const spec = STEEL_DATA[grp.size];
                if (spec && grp.count > 0) addSteel(spec.id, grp.count * totalLength * spec.weight * 1.05);
              });

              // BOTTOM BARS
              const bottomBars = template.bottomBars || [{ count: template.bottomMainCount, size: template.bottomMainSize }];
              bottomBars.forEach(grp => {
                const spec = STEEL_DATA[grp.size];
                if (spec && grp.count > 0) addSteel(spec.id, grp.count * totalLength * spec.weight * 1.05);
              });

              // SUPPORT BARS (Extra Top)
              const supportBars = template.supportBars || (template.extraTopCount > 0 ? [{ count: template.extraTopCount, size: template.extraTopSize, length: template.extraTopLength }] : []);
              supportBars.forEach(grp => {
                const spec = STEEL_DATA[grp.size];
                if (spec && grp.count > 0) {
                  const effectiveLength = template.useZonedReinforcement ? (totalLength * 0.5) : ((grp.length || 0) * totalQty);
                  addSteel(spec.id, grp.count * effectiveLength * spec.weight * 1.05);
                }
              });

              // SPAN BARS (Extra Bottom)
              const spanBars = template.spanBars || (template.extraBottomCount > 0 ? [{ count: template.extraBottomCount, size: template.extraBottomSize, length: template.extraBottomLength }] : []);
              spanBars.forEach(grp => {
                const spec = STEEL_DATA[grp.size];
                if (spec && grp.count > 0) {
                  const effectiveLength = template.useZonedReinforcement ? (totalLength * 0.5) : ((grp.length || 0) * totalQty);
                  addSteel(spec.id, grp.count * effectiveLength * spec.weight * 1.05);
                }
              });
            } else {
             const mainSpec = STEEL_DATA[template.mainBarSize];
             if (mainSpec) addSteel(mainSpec.id, template.mainBarCount * totalLength * mainSpec.weight * 1.05);
           }

           const stirrupSpec = STEEL_DATA[template.stirrupSize];
           if (stirrupSpec) {
             const sEnd = template.stirrupSpacingEnd || 0.10;
             const sMid = template.stirrupSpacingMiddle || 0.20;
             const ratio = template.stirrupZoneRatio || 0.25;
             
             // Calculate actual stirrup dimensions (e.g. 15x30 cm)
             // Default covering is 2.5cm each side -> total 5cm (0.05m) reduction
             const sW = Math.max(0, (template.width || 0) - 0.05);
             const sD = Math.max(0, (template.depth || 0) - 0.05);
             const dimKey = `${Math.round(sW * 100)}x${Math.round(sD * 100)}`;
             
             const stirrupLength = 2 * (sW + sD);
             const lengthEndTotal = totalLength * ratio * 2;
             const lengthMidTotal = totalLength - lengthEndTotal;
             const totalStirrups = Math.ceil(lengthEndTotal/sEnd + lengthMidTotal/sMid);
             const totalStirrupWeight = totalStirrups * stirrupLength * stirrupSpec.weight * 1.05;
             addSteel(stirrupSpec.id, totalStirrupWeight);

             // Track for Procurement
             const groupKey = `${template.stirrupSize}_${dimKey}`;
             if (!stirrupGroups[groupKey]) {
               stirrupGroups[groupKey] = { 
                 size: template.stirrupSize, 
                 dim: dimKey, 
                 count: 0, 
                 label: `ปลอก ${stirrupSpec.label} ขนาด ${dimKey} ซม.`,
                 spec: stirrupSpec
               };
             }
             stirrupGroups[groupKey].count += totalStirrups;
           }
        }
      }

      totalMaterialCost += templateMaterial;
      totalLaborCost += templateLabor;

      // Detailed Breakdown for Takeoff
      const groupedByLength = myInstances.reduce((acc, inst) => {
        const len = (inst.length || 0).toFixed(2);
        if (!acc[len]) acc[len] = { length: parseFloat(len), count: 0, instances: [] };
        acc[len].count += 1;
        acc[len].instances.push(inst);
        return acc;
      }, {});

      return { 
        ...template, 
        cost: templateMaterial + templateLabor, 
        materialCost: templateMaterial, 
        laborCost: templateLabor, 
        totalLength, 
        totalQty, 
        instances: myInstances,
        groupedInstances: Object.values(groupedByLength).sort((a,b) => b.length - a.length)
      };
    });

    const directCost = totalMaterialCost + totalLaborCost;
    const totalSale = directCost * compositeFactorF;
    return { 
      calculatedTemplates: templateSummaries, 
      resourceTotals, 
      stirrupGroups: Object.values(stirrupGroups),
      totalMaterialCost, 
      totalLaborCost, 
      directCost, 
      totalSale, 
      margin: totalSale - directCost 
    };
  }, [watchTemplates, watchInstances, compositeFactorF]);

  const updateInstanceLayout = React.useCallback((id, updates) => {
    const index = watchInstances.findIndex(i => i.id === id);
    if (index !== -1) {
      updateInstance(index, { ...watchInstances[index], ...updates });
    }
  }, [watchInstances, updateInstance]);

  const deleteInstance = React.useCallback((id) => {
    const index = watchInstances.findIndex(inst => inst.id === id);
    if (index !== -1) {
      removeInstance(index);
    }
  }, [watchInstances, removeInstance]);

  const addInstance = React.useCallback((templateId, x1=0, y1=0, x2=2, y2=0) => {
    const template = watchTemplates.find(t => t.id === templateId);
    const isSlab = template?.assemblyId === 'a3';
    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    appendInstance({
      id: `inst-${Date.now()}`,
      templateId, x1, y1, x2, y2, 
      type: isSlab ? 'slab' : 'line',
      length: isSlab ? 0 : Math.round(dist * 100) / 100,
      isPlaced: true
    });
  }, [watchTemplates, appendInstance]);

  const setRefImageValue = React.useCallback((key, val) => setValue(key, val), [setValue]);

  const memoizedInstances = React.useMemo(() => {
    return watchInstances.map(inst => ({
      ...inst,
      name: watchTemplates.find(t => t.id === inst.templateId)?.name
    }));
  }, [watchInstances, watchTemplates]);

  const handleSaveProject = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `${data.projectName.replace(/\s+/g, '_')}_${date}.boq`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenProject = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        // Basic validation: must have templates and instances
        if (!parsed.templates || !parsed.instances) throw new Error("Invalid file format");
        reset(parsed);
        alert("Project loaded successfully!");
      } catch (err) {
        alert("Error loading project: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleNewProject = () => {
    if (confirm("Start a new project? This will clear all current work. Make sure you have saved your progress.")) {
      resetToDefault();
      alert("New project started.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Header 
          projectSummary={projectSummary} 
          onExportPDF={() => generatePDF(projectSummary, compositeFactorF)} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSave={handleSaveProject}
          onOpen={() => projectFileInputRef.current?.click()}
          onNew={handleNewProject}
          user={user}
          isSyncing={isSyncing}
          lastSync={lastSync}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={() => signOut()}
        />
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
        />
        <input 
          type="file" 
          ref={projectFileInputRef} 
          onChange={handleOpenProject} 
          accept=".boq,application/json" 
          className="hidden" 
        />

        <div className="w-full overflow-x-auto scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-sm w-fit border border-slate-200 shadow-sm whitespace-nowrap">
             <button onClick={() => setActiveTab('layout')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'layout' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
               <LayoutIcon className="w-3.5 h-3.5" /> 1. PLAN TAKEOFF
             </button>
             <button onClick={() => setActiveTab('table')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'table' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
               <TableIcon className="w-3.5 h-3.5" /> 2. BOQ SUMMARY
             </button>
             <button onClick={() => setActiveTab('report')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'report' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
               <FileText className="w-3.5 h-3.5" /> 3. PROJECT REPORT
             </button>
              <button onClick={() => setActiveTab('procurement')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'procurement' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                <ShoppingCart className="w-3.5 h-3.5" /> 4. MATERIAL LIST
              </button>
              <button onClick={() => setActiveTab('takeoff')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'takeoff' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                <ListTree className="w-3.5 h-3.5" /> 5. DETAILED TAKEOFF
              </button>
              <button onClick={() => setActiveTab('drawings')} className={`flex items-center gap-2 px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${activeTab === 'drawings' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                <ScrollText className="w-3.5 h-3.5" /> 6. DRAWING SUMMARY
              </button>
              <div className="flex-1" />
              <button 
                onClick={() => setIsAIAssistantOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-[10px] font-black rounded-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all uppercase tracking-widest"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Takeoff
              </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* MAIN VIEW */}
          <div className="w-full">
            {activeTab === 'layout' && (
               <div className="space-y-8 page-transition">
                  <LayoutCanvas 
                    items={memoizedInstances} 
                    updateItem={updateInstanceLayout} 
                    deleteItem={deleteInstance}
                    templates={watchTemplates}
                    addInstance={addInstance}
                    refImage={data.refImage}
                    refImageX={data.refImageX}
                    refImageY={data.refImageY}
                    refImageScale={data.refImageScale}
                    refImageOpacity={data.refImageOpacity}
                    isRefImageLocked={data.isRefImageLocked}
                    setRefImageValue={setRefImageValue}
                  />
                  <div className="pt-4 border-t border-slate-200">
                    <TemplateManager templates={templates} append={appendTemplate} remove={removeTemplate} register={register} setValue={setValue} watch={form.watch} control={control} />
                  </div>
               </div>
            )}
            {activeTab === 'table' && (
              <div className="space-y-8 page-transition">
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
                <div className="pt-8 border-t border-slate-200">
                  <TemplateManager templates={templates} append={appendTemplate} remove={removeTemplate} register={register} setValue={setValue} watch={form.watch} control={control} />
                </div>
              </div>
            )}
            {activeTab === 'report' && (
              <ProjectReport projectSummary={projectSummary} compositeFactorF={compositeFactorF} />
            )}
            {activeTab === 'procurement' && (
              <ProcurementSummary projectSummary={projectSummary} />
            )}
            {activeTab === 'takeoff' && (
              <DetailedTakeoff projectSummary={projectSummary} />
            )}
            {activeTab === 'drawings' && (
              <div className="page-transition">
                <SteelSummary templates={watchTemplates} />
              </div>
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

      {isAIAssistantOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAIAssistantOpen(false)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
             <AIVisionAssistant 
               data={data} 
               setValue={setValue} 
               templates={templates} 
             />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
