import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, ZoomOut, Layout as LayoutIcon, Maximize, Minimize, Plus,
  MousePointer2, Square, Circle as CircleIcon, Eraser, Hand, Focus, Compass, Trash2, X
} from 'lucide-react';

export default function LayoutCanvas({ items, updateItem, deleteItem, templates, addInstance }) {
  const [viewBox, setViewBox] = useState({ x: -10, y: -10, w: 40, h: 40 });
  const [isDraggingNode, setIsDraggingNode] = useState(null); 
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id);
  const [drawMode, setDrawMode] = useState('select'); // 'select' | 'beam' | 'column' | 'pan'
  const [selectedId, setSelectedId] = useState(null);
  
  const [drawingSession, setDrawingSession] = useState(null); // { x1, y1 }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const SNAP_FINE = 0.02;

  // KEYBOARD HANDLING
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isPanning) setIsPanning(true);
      if (e.code === 'Escape') {
        if (drawingSession) setDrawingSession(null);
        else setSelectedId(null);
      }
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedId && !drawingSession) {
        // Prevent accidental deletion if user is typing in an input (though here it's SVG)
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          deleteItem(selectedId);
          setSelectedId(null);
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setIsPanning(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning, selectedId, drawingSession, deleteItem]);

  const getCoords = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const CTM = svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformed = pt.matrixTransform(CTM.inverse());

    let finalX = Math.round(transformed.x / SNAP_FINE) * SNAP_FINE;
    let finalY = Math.round(transformed.y / SNAP_FINE) * SNAP_FINE;

    const snapRadius = 0.4;
    for (const item of items) {
      if (Math.sqrt(Math.pow(transformed.x - item.x1, 2) + Math.pow(transformed.y - item.y1, 2)) < snapRadius) {
        finalX = item.x1; finalY = item.y1; break;
      }
      if (Math.sqrt(Math.pow(transformed.x - item.x2, 2) + Math.pow(transformed.y - item.y2, 2)) < snapRadius) {
        finalX = item.x2; finalY = item.y2; break;
      }
    }
    return { x: finalX, y: finalY };
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0 && !e.touches) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    const { x, y } = getCoords(clientX, clientY);

    if (drawMode === 'column') {
      addInstance(selectedTemplateId, x, y, x, y);
      return;
    }

    if (drawMode === 'beam') {
      if (!drawingSession) {
        setDrawingSession({ x1: x, y1: y });
      } else {
        addInstance(selectedTemplateId, drawingSession.x1, drawingSession.y1, x, y);
        setDrawingSession(null);
      }
      setIsPanning(true);
      setLastPos({ x: clientX, y: clientY });
      return;
    }

    // Determine if we cleared selection
    if (drawMode === 'select' && e.target === svgRef.current) {
      setSelectedId(null);
    }

    setIsPanning(true);
    setLastPos({ x: clientX, y: clientY });
  };

  const handlePointerMove = (e) => {
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    if (isPanning) {
       const dx = (clientX - lastPos.x) * (viewBox.w / svgRef.current.clientWidth);
       const dy = (clientY - lastPos.y) * (viewBox.h / svgRef.current.clientHeight);
       setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
       setLastPos({ x: clientX, y: clientY });
       return;
    }

    const currentCoords = getCoords(clientX, clientY);
    setMousePos(currentCoords);

    if (isDraggingNode) {
      const item = items.find(i => i.id === isDraggingNode.itemId);
      if (!item) return;
      const updates = isDraggingNode.node === 'start' ? { x1: currentCoords.x, y1: currentCoords.y } : { x2: currentCoords.x, y2: currentCoords.y };
      const x1 = updates.x1 ?? item.x1 ?? 0;
      const y1 = updates.y1 ?? item.y1 ?? 0;
      const x2 = updates.x2 ?? item.x2 ?? 0;
      const y2 = updates.y2 ?? item.y2 ?? 0;
      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      updateItem(isDraggingNode.itemId, { ...updates, length: Math.round(dist * 100) / 100 });
    }
  };

  const zoom = (factor) => {
    setViewBox(prev => {
      const newW = prev.w * factor;
      const newH = prev.h * factor;
      return { ...prev, w: newW, h: newH, x: prev.x + (prev.w - newW) / 2, y: prev.y + (prev.h - newH) / 2 };
    });
  };

  const fitView = () => {
    if (items.length === 0) {
      setViewBox({ x: -10, y: -10, w: 40, h: 40 });
      return;
    }
    const xMin = Math.min(...items.flatMap(i => [i.x1, i.x2]));
    const xMax = Math.max(...items.flatMap(i => [i.x1, i.x2]));
    const yMin = Math.min(...items.flatMap(i => [i.y1, i.y2]));
    const yMax = Math.max(...items.flatMap(i => [i.y1, i.y2]));
    const padding = 5;
    setViewBox({ x: xMin - padding, y: yMin - padding, w: (xMax - xMin) + padding * 2, h: (yMax - yMin) + padding * 2 });
  };

  const handleNodeDrag = (clientX, clientY, itemId, node) => {
    setIsDraggingNode({ itemId, node });
  };

  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <div className={`
      flex flex-col border border-slate-200 rounded-sm bg-white overflow-hidden relative select-none shadow-xl transition-all
      ${isMaximized ? 'fixed inset-0 z-[100] h-screen w-screen rounded-none' : 'h-[650px] w-full'}
      ${(drawMode === 'pan' || isPanning) ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}
    `}>
      {/* TOOLBAR */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-sm shadow-2xl border border-slate-200">
         <button onClick={() => { setDrawMode('select'); setDrawingSession(null); }} title="Selection" className={`p-2 rounded-sm ${drawMode === 'select' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
            <MousePointer2 className="w-5 h-5" />
         </button>
         <button onClick={() => { setDrawMode('pan'); setDrawingSession(null); }} title="Pan (Hold Space)" className={`p-2 rounded-sm ${drawMode === 'pan' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
            <Hand className="w-5 h-5" />
         </button>
         <div className="w-px h-8 bg-slate-200 mx-2" />
         <button onClick={() => setDrawMode('beam')} title="Draw Beam (Click-Click)" className={`p-2 rounded-sm ${drawMode === 'beam' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
            <Square className="w-5 h-5" />
         </button>
         <button onClick={() => { setDrawMode('column'); setDrawingSession(null); }} title="Place Column" className={`p-2 rounded-sm ${drawMode === 'column' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
            <CircleIcon className="w-5 h-5" />
         </button>
         <div className="w-px h-8 bg-slate-200 mx-2" />
         <button onClick={() => zoom(0.8)} className="p-2 hover:bg-slate-100 rounded-sm text-slate-500"><ZoomIn className="w-5 h-5" /></button>
         <button onClick={() => zoom(1.2)} className="p-2 hover:bg-slate-100 rounded-sm text-slate-500"><ZoomOut className="w-5 h-5" /></button>
         <button onClick={fitView} title="Fit All" className="p-2 hover:bg-slate-100 rounded-sm text-slate-500"><Focus className="w-5 h-5" /></button>
         <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-slate-100 rounded-sm text-blue-500">
            {isMaximized ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
         </button>
      </div>

      {/* DELETE TOOLTIP */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white p-2 rounded-sm shadow-2xl border border-red-100"
          >
             <div className="flex flex-col pr-3 border-r border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Selected Piece</span>
                <span className="text-[11px] font-black text-slate-900 uppercase">{selectedItem.name}</span>
             </div>
             <button 
              onClick={() => { deleteItem(selectedId); setSelectedId(null); }}
              className="bg-red-500 text-white p-2 rounded-sm hover:bg-red-600 transition-colors shadow-lg"
              title="Delete (Backspace/Del)"
             >
                <Trash2 className="w-4 h-4" />
             </button>
             <button onClick={() => setSelectedId(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawMode === 'beam' && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute top-20 left-4 z-10 pointer-events-none">
             <div className="bg-blue-600 text-white px-4 py-1.5 rounded-sm text-[10px] font-black shadow-2xl flex items-center gap-2 uppercase tracking-[0.1em]">
                <Compass className="w-3.5 h-3.5 animate-spin" />
                {drawingSession ? 'Click destination point' : 'Click to start beam'}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-16 right-4 z-10 flex flex-col gap-2">
         <span className="text-[10px] font-black text-slate-800 bg-white/80 backdrop-blur-md px-2 py-1 rounded-sm shadow-sm w-fit uppercase tracking-widest border border-slate-100 mb-1">Select Type</span>
         <div className="flex flex-col gap-1.5 p-2 bg-white/90 backdrop-blur-sm rounded-sm shadow-2xl border border-slate-200 min-w-[160px]">
            {templates.map(t => (
               <button key={t.id} onClick={() => setSelectedTemplateId(t.id)} className={`w-full text-left px-3 py-2.5 rounded-sm text-[10px] font-black transition-all flex items-center justify-between uppercase tracking-tighter ${selectedTemplateId === t.id ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {t.name}
                  {selectedTemplateId === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
               </button>
            ))}
         </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={() => { setIsDraggingNode(null); setIsPanning(false); }}
        onMouseLeave={() => { setIsDraggingNode(null); setIsPanning(false); }}
        onTouchMove={handlePointerMove}
        onTouchEnd={() => { setIsDraggingNode(null); setIsPanning(false); }}
      >
        <defs>
          <pattern id="smallGrid" width="0.1" height="0.1" patternUnits="userSpaceOnUse"><path d="M 0.1 0 L 0 0 0 0.1" fill="none" stroke="#E2E8F0" strokeWidth="0.01" /></pattern>
          <pattern id="grid" width={1} height={1} patternUnits="userSpaceOnUse"><rect width={1} height={1} fill="url(#smallGrid)" /><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#CBD5E1" strokeWidth="0.03" /></pattern>
        </defs>
        <rect x={viewBox.x - 500} y={viewBox.y - 500} width={viewBox.w + 1000} height={viewBox.h + 1000} fill="url(#grid)" />

        {drawingSession && (
          <g>
            <line x1={drawingSession.x1} y1={drawingSession.y1} x2={mousePos.x} y2={mousePos.y} stroke="#3B82F6" strokeWidth="0.3" strokeDasharray="0.5,0.2" className="animate-pulse" />
            <circle cx={drawingSession.x1} cy={drawingSession.y1} r="0.2" fill="#3B82F6" />
            <circle cx={mousePos.x} cy={mousePos.y} r="0.2" fill="white" stroke="#3B82F6" strokeWidth="0.1" />
            <g transform={`translate(${(drawingSession.x1 + mousePos.x) / 2}, ${(drawingSession.y1 + mousePos.y) / 2 - 0.5})`}>
              <rect x="-0.6" y="-0.25" width="1.2" height="0.5" fill="#3B82F6" rx="0.1" />
              <text textAnchor="middle" y="0.1" className="text-[0.4px] font-black fill-white uppercase tracking-tighter">
                {Math.sqrt(Math.pow(mousePos.x - drawingSession.x1, 2) + Math.pow(mousePos.y - drawingSession.y1, 2)).toFixed(2)}m
              </text>
            </g>
          </g>
        )}

        {items.map((item) => {
          const isColumn = item.x1 === item.x2 && item.y1 === item.y2;
          const isSelected = selectedId === item.id;
          return (
            <g 
              key={item.id} 
              className={`group cursor-pointer ${isSelected ? 'selected' : ''}`}
              onMouseDown={(e) => {
                if (drawMode === 'select' && !isDraggingNode) {
                  e.stopPropagation();
                  setSelectedId(item.id);
                }
              }}
            >
              {/* SELECTION HIGHLIGHT (Invisible large hit area + Glow when selected) */}
              {isColumn ? (
                <>
                 <circle cx={item.x1} cy={item.y1} r="0.8" fill="transparent" />
                 {isSelected && <circle cx={item.x1} cy={item.y1} r="0.6" fill="var(--primary)" fillOpacity="0.2" className="animate-pulse" />}
                 <circle cx={item.x1} cy={item.y1} r="0.4" fill={isSelected ? "var(--primary)" : "#1E293B"} className="drop-shadow-md transition-colors" vectorEffect="non-scaling-stroke" />
                </>
              ) : (
                <>
                 <line x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} stroke="transparent" strokeWidth="1.2" strokeLinecap="round" />
                 {isSelected && <line x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} stroke="var(--primary)" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.2" className="animate-pulse" />}
                 <line x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} stroke={isSelected ? "var(--primary)" : "var(--primary)"} strokeWidth={isSelected ? "0.6" : "0.3"} strokeLinecap="round" className="drop-shadow-sm transition-all" vectorEffect="non-scaling-stroke" />
                </>
              )}

              <g transform={`translate(${(item.x1 + item.x2) / 2}, ${(item.y1 + item.y2) / 2 - 0.4})`}>
                <rect x="-0.8" y="-0.3" width="1.6" height="0.6" fill={isSelected ? "var(--primary)" : "white"} fillOpacity={isSelected ? "1" : "0.9"} rx="0.05" className="pointer-events-none transition-colors" />
                <text textAnchor="middle" y="0.1" className={`text-[0.4px] font-black pointer-events-none uppercase tracking-tighter ${isSelected ? 'fill-white' : 'fill-slate-800'}`}>
                  {item.name} {isColumn ? '' : `(${item.length}m)`}
                </text>
              </g>
              
              {!isColumn && (
                <>
                <circle cx={item.x1} cy={item.y1} r="0.6" fill="transparent" className="cursor-nwse-resize" onMouseDown={(e) => { e.stopPropagation(); handleNodeDrag(e.clientX, e.clientY, item.id, 'start') }} />
                <circle cx={item.x1} cy={item.y1} r="0.2" fill="white" stroke="var(--primary)" strokeWidth="0.08" className="pointer-events-none" />
                
                <circle cx={item.x2} cy={item.y2} r="0.6" fill="transparent" className="cursor-nwse-resize" onMouseDown={(e) => { e.stopPropagation(); handleNodeDrag(e.clientX, e.clientY, item.id, 'end') }} />
                <circle cx={item.x2} cy={item.y2} r="0.2" fill="white" stroke="var(--primary)" strokeWidth="0.08" className="pointer-events-none" />
                </>
              )}
              {isColumn && (
                <circle cx={item.x1} cy={item.y1} r="0.8" fill="transparent" className="cursor-move" onMouseDown={(e) => { e.stopPropagation(); handleNodeDrag(e.clientX, e.clientY, item.id, 'start') }} />
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-sm shadow-2xl flex items-center gap-8 border border-white/10">
         <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Elements</span>
            <span className="text-base font-black">{items.length}</span>
         </div>
         <div className="w-px h-8 bg-white/10" />
         <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Length</span>
            <span className="text-base font-black text-blue-400">{items.reduce((s, i) => s + (i.length || 0), 0).toFixed(2)}m</span>
         </div>
      </div>
    </div>
  );
}
