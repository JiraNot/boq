import React from 'react';

export default function RebarPreview({ 
  width, depth, isBeam, isSlab, slabType,
  // Column simple props
  count, mainSize,
  // Beam detailed arrays
  topBars = [], bottomBars = [], supportBars = [], spanBars = [],
  stirrupSize, className 
}) {
  const [currentView, setCurrentView] = React.useState('sup'); // 'sup' | 'mid'
  const maxDim = Math.max(width, depth);
  const scale = 140 / maxDim;
  
  const w = width * scale;
  const d = depth * scale;
  const x0 = (200 - w) / 2;
  const y0 = (200 - d) / 2;

  const stirrupX = x0 + 5;
  const stirrupY = y0 + 5;
  const stirrupW = Math.max(2, w - 10);
  const stirrupD = Math.max(2, d - 10);

  const topCountTotal = topBars.reduce((sum, b) => sum + (b.count || 0), 0);
  const bottomCountTotal = bottomBars.reduce((sum, b) => sum + (b.count || 0), 0);
  const supportCountTotal = supportBars.reduce((sum, b) => sum + (b.count || 0), 0);
  const spanCountTotal = spanBars.reduce((sum, b) => sum + (b.count || 0), 0);

  const generateDots = () => {
    const dots = [];
    const inset = 6;

    if (isSlab) {
      // SLAB LOGIC: Render a Lattice Grid
      const step = 20; // Visual step for grid
      for (let x = x0 + step; x < x0 + w; x += step) {
        dots.push({ x, y: y0, type: 'VL' }); // Visual Vertical Line point
      }
      for (let y = y0 + step; y < y0 + d; y += step) {
        dots.push({ x: x0, y, type: 'HL' }); // Visual Horizontal Line point
      }
    } else if (isBeam) {
      // BEAM LOGIC: Sum counts from arrays
      for (let i = 0; i < topCountTotal; i++) {
        const x = topCountTotal > 1 ? stirrupX + inset + (i * (stirrupW - 2 * inset) / (topCountTotal - 1)) : stirrupX + stirrupW / 2;
        dots.push({ x, y: stirrupY + inset, color: '#1E293B', label: 'T' });
      }
      for (let i = 0; i < bottomCountTotal; i++) {
        const x = bottomCountTotal > 1 ? stirrupX + inset + (i * (stirrupW - 2 * inset) / (bottomCountTotal - 1)) : stirrupX + stirrupW / 2;
        dots.push({ x, y: stirrupY + stirrupD - inset, color: '#1E293B', label: 'B' });
      }
      
      // SHOW SUPPORT BARS ONLY IN SUP VIEW
      if (currentView === 'sup') {
        for (let i = 0; i < supportCountTotal; i++) {
          const x = supportCountTotal > 1 ? stirrupX + inset + (i * (stirrupW - 2 * inset) / (supportCountTotal - 1)) : stirrupX + stirrupW / 2;
          dots.push({ x, y: stirrupY + inset + 12, color: '#3B82F6', label: 'ET', r: 3 });
        }
      }
      
      // SHOW SPAN BARS ONLY IN MID VIEW
      if (currentView === 'mid') {
        for (let i = 0; i < spanCountTotal; i++) {
          const x = spanCountTotal > 1 ? stirrupX + inset + (i * (stirrupW - 2 * inset) / (spanCountTotal - 1)) : stirrupX + stirrupW / 2;
          dots.push({ x, y: stirrupY + stirrupD - inset - 12, color: '#10B981', label: 'EB', r: 3 });
        }
      }
    } else {
      // COLUMN LOGIC
      const corners = [
        { x: stirrupX + inset, y: stirrupY + inset },
        { x: stirrupX + stirrupW - inset, y: stirrupY + inset },
        { x: stirrupX + inset, y: stirrupY + stirrupD - inset },
        { x: stirrupX + stirrupW - inset, y: stirrupY + stirrupD - inset },
      ];
      if (count >= 1) dots.push(corners[0]);
      if (count >= 2) dots.push(corners[1]);
      if (count >= 3) dots.push(corners[2]);
      if (count >= 4) dots.push(corners[3]);
      if (count > 4) {
         const remaining = count - 4;
         if (remaining >= 1) dots.push({ x: stirrupX + stirrupW/2, y: stirrupY + inset });
         if (remaining >= 2) dots.push({ x: stirrupX + stirrupW/2, y: stirrupY + stirrupD - inset });
         if (remaining >= 3) dots.push({ x: stirrupX + inset, y: stirrupY + stirrupD/2 });
         if (remaining >= 4) dots.push({ x: stirrupX + stirrupW - inset, y: stirrupY + stirrupD/2 });
      }
    }
    return dots;
  };

  const rebarSize = 4;
  const dotsData = generateDots();

  return (
    <div className={`flex flex-col items-center bg-white p-4 rounded-sm border border-slate-200 shadow-inner ${className}`}>
      {isBeam && (
        <div className="flex bg-slate-100 p-1 rounded-sm w-full mb-4">
           <button 
             onClick={() => setCurrentView('sup')}
             className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-sm transition-all ${currentView === 'sup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
              Support (L/4)
           </button>
           <button 
             onClick={() => setCurrentView('mid')}
             className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-sm transition-all ${currentView === 'mid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
              Mid-Span (L/2)
           </button>
        </div>
      )}

      <svg viewBox="0 0 200 200" className="w-56 h-56 drop-shadow-sm">
        <rect x={x0} y={y0} width={w} height={d} fill={isSlab ? "#F1F5F9" : "#F8FAFC"} stroke="#CBD5E1" strokeWidth="2" />
        
        {isSlab ? (
           <>
              {/* Render lattice grid for slabs */}
              {dotsData.filter(d => d.type === 'VL').map((line, i) => (
                <line key={`v-${i}`} x1={line.x} y1={y0} x2={line.x} y2={y0 + d} stroke={slabType === 'WIREMESH' ? "#94A3B8" : "var(--primary)"} strokeWidth={slabType === 'WIREMESH' ? "0.5" : "1"} strokeDasharray={slabType === 'WIREMESH' ? "2,2" : "none"} />
              ))}
              {dotsData.filter(d => d.type === 'HL').map((line, i) => (
                <line key={`h-${i}`} x1={x0} y1={line.y} x2={x0 + w} y2={line.y} stroke={slabType === 'WIREMESH' ? "#94A3B8" : "var(--primary)"} strokeWidth={slabType === 'WIREMESH' ? "0.5" : "1"} strokeDasharray={slabType === 'WIREMESH' ? "2,2" : "none"} />
              ))}
           </>
        ) : (
           <>
              <rect x={stirrupX} y={stirrupY} width={stirrupW} height={stirrupD} fill="none" stroke="#94A3B8" strokeWidth="1.5" />
              {dotsData.map((dot, i) => (
                <circle 
                  key={i} 
                  cx={dot.x} cy={dot.y} 
                  r={dot.r || rebarSize} 
                  fill={dot.color || '#1E293B'} 
                  stroke="white" strokeWidth="0.5" 
                />
              ))}
           </>
        )}

        <text x="100" y="20" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest">
           {isSlab ? (slabType === 'WIREMESH' ? 'Wire Mesh Detail' : 'Slab Grid Detail') : isBeam ? (currentView === 'sup' ? 'End Section (Sup)' : 'Mid Section (Mid)') : 'Column Section'}
        </text>
        <text x="10" y="190" className="text-[8px] font-bold fill-slate-300 uppercase">
           {isSlab ? `Area: ${(width * depth).toFixed(2)}sq.m.` : `W: ${width}m x D: ${depth}m`}
        </text>
      </svg>
      <div className="mt-2 text-center flex flex-wrap gap-2 justify-center">
         {isSlab ? (
           <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${slabType === 'WIREMESH' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
              MODE: {slabType}
           </span>
         ) : isBeam ? (
           <>
             <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-sm uppercase tracking-tighter">View: {currentView}</span>
             <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-sm">TOP: {topCountTotal + (currentView === 'sup' ? supportCountTotal : 0)}</span>
             <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-sm">BOT: {bottomCountTotal + (currentView === 'mid' ? spanCountTotal : 0)}</span>
           </>
         ) : (
           <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-sm">MAIN: {count}x {mainSize}</span>
         )}
      </div>
    </div>
  );
}
