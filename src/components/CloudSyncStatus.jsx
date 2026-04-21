import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';

export default function CloudSyncStatus({ isSyncing, lastSync, isAuthenticated }) {
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-sm">
        <CloudOff className="w-3 h-3 text-slate-400" />
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Offline Mode</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm border transition-all ${isSyncing ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
      {isSyncing ? (
        <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
      )}
      <div className="flex flex-col leading-none">
        <span className={`text-[8px] font-black uppercase tracking-tighter ${isSyncing ? 'text-blue-600' : 'text-emerald-600'}`}>
          {isSyncing ? 'Syncing...' : 'Cloud Synced'}
        </span>
        {!isSyncing && lastSync && (
          <span className="text-[7px] font-bold text-emerald-500/80 uppercase">
             {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
