import React from 'react';

export default function RebarPreview({ 
  width, depth, isBeam, isSlab, slabType,
  // Column simple props
  count, mainSize,
  // Beam detailed props
  topCount, bottomCount, extraTopCount, extraBottomCount,
  stirrupSize, className 
}) {
  const maxDim = Math.max(width, depth);
  const scale = 140 / maxDim;
  
  const w = width * scale;
  const d = depth * scale;
  const x0 = (200 - w) / 2;
  const y0 = (200 - d) / 2;

  const stirrupX = x0 + 5;
  const stirrupY = y0 + 5;
  const stirrupW = w - 10;
  const stirrupD = d - 10;

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
      // BEAM LOGIC: Top vs Bottom
      for (let i = 0; i < topCount; i++) {
        const x = topCount > 1 ? stirrupX + inset + (i * (stirrupW - 2 * inset) / (topCount - 1)) : stirrupX + stirrupW / 2;
        dots.push({ x, y: stirrupY + inset, color: '#1E293B', label: 'T' });
      }
      for (let i = 0; i < bottomCount; i++) {
        const x = bottomCount > 1 ? stirrupX + inset + (i * (stirrupW - 2 * inset) / (bottomCount - 1)) : stirrupX + stirrupW / 2;
        dots.push({ x, y: stirrupY + stirrupD - inset, color: '#1E293B', label: 'B' });
      }
      for (let i = 0; i < extraTopCount; i++) {
        const x = extraTopCount > 1 ? stirrupX + inset + (i * (stirrupW - 2 * inset) / (extraTopCount - 1)) : stirrupX + stirrupW / 2;
        dots.push({ x, y: stirrupY + inset + 12, color: '#3B82F6', label: 'ET', r: 3 });
      }
      for (let i = 0; i < extraBottomCount; i++) {
        const x = extraBottomCount > 1 ? stirrupX + inset + (i * (stirrupW - 2 * inset) / (extraBottomCount - 1)) : stirrupX + stirrupW / 2;
        dots.push({ x, y: stirrupY + stirrupD - inset - 12, color: '#10B981', label: 'EB', r: 3 });
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
           {isSlab ? (slabType === 'WIREMESH' ? 'Wire Mesh Detail' : 'Slab Grid Detail') : isBeam ? 'Beam Section' : 'Column Section'}
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
             <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-sm">TOP: {topCount}</span>
             <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-sm">BOT: {bottomCount}</span>
           </>
         ) : (
           <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-sm">MAIN: {count}x {mainSize}</span>
         )}
      </div>
    </div>
  );
}
