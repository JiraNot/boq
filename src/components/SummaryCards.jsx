import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Download, 
  FileText,
  PieChart,
  Box,
  Coins,
  Settings as SettingsIcon,
  ChevronRight,
  Save,
  FolderOpen,
  FilePlus,
  User,
  Cloud
} from 'lucide-react';
import CloudSyncStatus from './CloudSyncStatus';

export function Header({ 
  projectSummary, onExportPDF, onOpenSettings, onSave, onOpen, onNew,
  user, isSyncing, lastSync, onOpenAuth, onSignOut 
}) {
  const { totalSale, margin, directCost, resourceTotals } = projectSummary;
  const marginPercent = ((margin / (totalSale || 1)) * 100).toFixed(1);

  // Summarize main materials for the strip
  const concreteQty = resourceTotals['r1']?.totalQty || 0;
  
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* LEFT: Project Quick Info */}
      <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
         <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
            <button 
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-sm bg-slate-900 flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-md group"
            >
               <SettingsIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
            </button>
            <div className="whitespace-nowrap">
               <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-tighter">Budget Sale</span>
               <span className="text-sm font-black text-slate-800">฿{totalSale.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
         </div>

          {/* CLOUD STATUS */}
          <div className="hidden lg:block border-r border-slate-100 pr-4">
            <CloudSyncStatus 
              isSyncing={isSyncing} 
              lastSync={lastSync} 
              isAuthenticated={!!user} 
            />
          </div>

         <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
            <div className="whitespace-nowrap">
               <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-tighter leading-none">Net Margin</span>
               <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-emerald-600">฿{margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1 rounded-sm">{marginPercent}%</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
            <div className="whitespace-nowrap">
               <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-tighter">Concrete</span>
               <span className="text-sm font-bold text-slate-600">{concreteQty.toFixed(2)} <span className="text-[10px] font-normal">m³</span></span>
            </div>
         </div>
         
         <div className="flex items-center gap-2">
            <div className="whitespace-nowrap">
               <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-tighter">Direct Cost</span>
               <span className="text-sm font-bold text-slate-500">฿{directCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
         </div>
      </div>

       {/* RIGHT: Actions */}
       <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-sm gap-1 mr-2">
            <button 
              onClick={onNew}
              title="New Project"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-sm transition-all"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button 
              onClick={onOpen}
              title="Open Project (.boq)"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-sm transition-all"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button 
              onClick={onSave}
              title="Save Project"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-sm transition-all"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold text-white bg-slate-900 hover:bg-black rounded-sm transition-all shadow-md group"
          >
            <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" /> PDF REPORT
          </button>

          <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2" />

          {/* USER ACTIONS */}
          {user ? (
            <div className="flex items-center gap-2">
               <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-black text-slate-900 leading-none truncate max-w-[100px]">{user.name || user.email}</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Civil Engineer</p>
               </div>
               <button 
                onClick={onSignOut}
                className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all overflow-hidden"
                title="Sign Out"
               >
                 <User className="w-4 h-4" />
               </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-sm transition-all uppercase tracking-widest border border-blue-100"
            >
               <Cloud className="w-3.5 h-3.5" /> Cloud Sync
            </button>
          )}
       </div>
    </div>
  );
}

export function SummaryCard({ title, value, icon: Icon, trend, colorClass = "text-blue-600" }) {
  return (
    <div className="admin-card p-4 transition-all hover:translate-y-[-2px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h4 className="text-xl font-black text-slate-900 tracking-tight">{value}</h4>
          {trend && (
            <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
              <TrendingUp className="w-3 h-3" /> {trend} since baseline
            </p>
          )}
        </div>
        <div className={`p-2 rounded-sm bg-slate-50 ${colorClass}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
