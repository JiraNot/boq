// VERSION: 1.0.2 - REPAIRED IMAGE UPLOAD
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer2, Hand, Square, Circle as CircleIcon, Eraser, Maximize2, Minimize2, 
  ZoomIn, ZoomOut, Target, Trash, Magnet, Construction, Image as ImageIcon, Settings2, Sliders, X, Eye, EyeOff, Trash2, Compass, Layout, Ruler, ChevronDown, Check,
  Repeat
} from 'lucide-react';
import Tooltip from './Tooltip';

const LayoutCanvas = React.memo(({ 
  items = [], updateItem, deleteItem, templates = [], addInstance,
  refImage, refImageX = 0, refImageY = 0, refImageScale = 1, refImageOpacity = 0.5, isRefImageLocked = false, setRefImageValue
}) => {
  const [viewBox, setViewBox] = useState({ x: -10, y: -10, w: 40, h: 40 });
  const [isDraggingNode, setIsDraggingNode] = useState(null); 
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id);
  const [drawMode, setDrawMode] = useState('select'); // 'select' | 'beam' | 'slab' | 'pan' | 'eraser' | 'calibrate_image'
  const [selectedId, setSelectedId] = useState(null);
  const [isOrthoMode, setIsOrthoMode] = useState(false);
  const [isMagnetActive, setIsMagnetActive] = useState(true);
  const [isShiftDown, setIsShiftDown] = useState(false);
  const [isDraggingObject, setIsDraggingObject] = useState(null);
  const [editingLengthId, setEditingLengthId] = useState(null);
  const [lengthInput, setLengthInput] = useState("");
  
  const [drawingSession, setDrawingSession] = useState(null); 
  const [calibrationPoints, setCalibrationPoints] = useState(null); 
  const [isDraggingRefImage, setIsDraggingRefImage] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isRefSettingsOpen, setIsRefSettingsOpen] = useState(false);
  const [isRefVisible, setIsRefVisible] = useState(true);
  const SNAP_FINE = 0.02;

  const selectedItem = useMemo(() => items.find(i => i.id === selectedId), [items, selectedId]);

  const handleZoom = (factor, mouseX, mouseY) => {
    setViewBox(prev => {
      const newW = prev.w * factor;
      const newH = prev.h * factor;
      const focusX = mouseX !== undefined ? mouseX : prev.x + prev.w / 2;
      const focusY = mouseY !== undefined ? mouseY : prev.y + prev.h / 2;
      const newX = focusX - (focusX - prev.x) * factor;
      const newY = focusY - (focusY - prev.y) * factor;
      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  const handleFitScreen = () => {
    if (!items || items.length === 0) {
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

  const getCoords = (clientX, clientY) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    
    let x = svgP.x;
    let y = svgP.y;

    if (isMagnetActive) {
      x = Math.round(x * 5) / 5;
      y = Math.round(y * 5) / 5;
    }
    return { x, y };
  };

  // APPLY SHIFT LOCK LOGIC
  const applyModifiers = (x, y, startX, startY) => {
    if (isShiftDown || isOrthoMode) {
      const dx = Math.abs(x - startX);
      const dy = Math.abs(y - startY);
      if (dx > dy) return { x, y: startY };
      else return { x: startX, y };
    }
    return { x, y };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please use an image under 2MB to ensure project performance.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setRefImageValue('refImage', event.target.result);
      setIsRefSettingsOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (e) => {
    const { x, y } = getCoords(e.clientX || e.touches?.[0].clientX, e.clientY || e.touches?.[0].clientY);

    if (drawMode === 'pan' || isPanning) {
      setIsPanning(true);
      setLastPos({ x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY });
      return;
    }

    if (drawMode === 'beam' || drawMode === 'slab') {
      if (!drawingSession) {
        setDrawingSession({ x1: x, y1: y });
      } else {
        // APPLY MODIFIERS ON FINAL CLICK
        const finalCoords = applyModifiers(x, y, drawingSession.x1, drawingSession.y1);
        addInstance(selectedTemplateId, drawingSession.x1, drawingSession.y1, finalCoords.x, finalCoords.y);
        setDrawingSession(null);
      }
      return;
    }

    if (drawMode === 'calibrate_image') {
      if (!calibrationPoints) {
        setCalibrationPoints([{ x, y }]);
      } else {
        const p1 = calibrationPoints[0];
        const p2 = { x, y };
        const distPx = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const realDist = prompt("Enter the real-world distance between these two points (meters):", "1.0");
        if (realDist && !isNaN(realDist)) {
          const ratio = parseFloat(realDist) / distPx;
          const currentScale = refImageScale || 1;
          setRefImageValue('refImageScale', currentScale * ratio);
          alert(`Calibration complete! New scale: ${ratio.toFixed(4)}x`);
        }
        setCalibrationPoints(null);
        setDrawMode('select');
      }
      return;
    }

    if (drawMode === 'select') {
      // Background click deselects
      if (e.target === svgRef.current) {
        setSelectedId(null);
      }
    }
  };

  const handlePointerMove = (e) => {
    const rawPos = getCoords(e.clientX || (e.touches?.[0].clientX), e.clientY || (e.touches?.[0].clientY));
    let { x, y } = rawPos;

    if (drawingSession) {
      const fixed = applyModifiers(x, y, drawingSession.x1, drawingSession.y1);
      x = fixed.x;
      y = fixed.y;
    }
    setMousePos({ x, y });

    if (isPanning) {
      const dx = (e.clientX || e.touches?.[0].clientX) - lastPos.x;
      const dy = (e.clientY || e.touches?.[0].clientY) - lastPos.y;
      const scaleX = viewBox.w / svgRef.current.clientWidth;
      const scaleY = viewBox.h / svgRef.current.clientHeight;
      setViewBox(prev => ({ ...prev, x: prev.x - dx * scaleX, y: prev.y - dy * scaleY }));
      setLastPos({ x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY });
      return;
    }

    if (isDraggingNode) {
      const { itemId, nodeType } = isDraggingNode;
      const item = items.find(i => i.id === itemId);
      if (item) {
        const updates = nodeType === 'start' ? { x1: x, y1: y } : { x2: x, y2: y };
        updateItem(itemId, updates);
      }
    }

    if (isDraggingObject) {
      const { itemId, startX, startY } = isDraggingObject;
      const dx = x - startX;
      const dy = y - startY;
      const item = items.find(i => i.id === itemId);
      if (item) {
        updateItem(itemId, { 
          x1: item.x1 + dx, y1: item.y1 + dy, 
          x2: item.x2 + dx, y2: item.y2 + dy 
        });
        setIsDraggingObject({ itemId, startX: x, startY: y });
      }
    }

    if (isDraggingRefImage && !isRefImageLocked) {
      const dx = x - lastPos.x;
      const dy = y - lastPos.y;
      setRefImageValue('refImageX', (refImageX || 0) + dx);
      setRefImageValue('refImageY', (refImageY || 0) + dy);
      setLastPos({ x, y });
    }
  };

  const handleNodeDrag = (clientX, clientY, itemId, nodeType) => {
    setIsDraggingNode({ itemId, nodeType });
  };

  const handleLengthSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const val = parseFloat(lengthInput);
      if (!isNaN(val) && editingLengthId) {
        const item = items.find(i => i.id === editingLengthId);
        if (item) {
          const dx = item.x2 - item.x1;
          const dy = item.y2 - item.y1;
          const currentLen = Math.sqrt(dx * dx + dy * dy);
          if (currentLen > 0) {
            const ratio = val / currentLen;
            updateItem(editingLengthId, { x2: item.x1 + dx * ratio, y2: item.y1 + dy * ratio });
          }
        }
      }
      setEditingLengthId(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') { e.preventDefault(); setIsPanning(true); }
      if (e.shiftKey) setIsShiftDown(true);
      if (e.code === 'Escape') { setDrawingSession(null); setCalibrationPoints(null); setSelectedId(null); }
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedId && !drawingSession) {
        if (document.activeElement.tagName !== 'INPUT') {
          deleteItem(selectedId);
          setSelectedId(null);
        }
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setIsPanning(false);
      if (!e.shiftKey) setIsShiftDown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [selectedId, deleteItem, drawingSession]);

  return (
    <div className={`relative w-full overflow-hidden bg-slate-200 border border-slate-300 shadow-inner group/canvas transition-all duration-500 ${isMaximized ? 'fixed inset-0 z-[100]' : 'h-[600px] rounded-sm'}`}>
      
      {/* TOP TOOLBAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-sm shadow-2xl border border-white/20">
         <div className="flex bg-slate-100 p-0.5 rounded-sm mr-2 border border-slate-200 shadow-inner">
            <Tooltip text="Select Tool" subtext="V (Drag and select elements)">
              <button onClick={() => setDrawMode('select')} className={`p-2 rounded-sm transition-all ${drawMode === 'select' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}><MousePointer2 className="w-4 h-4" /></button>
            </Tooltip>
            <Tooltip text="Beam Tool" subtext="B (Draw linear structural elements)">
              <button onClick={() => setDrawMode('beam')} className={`p-2 rounded-sm transition-all ${drawMode === 'beam' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}><Construction className="w-4 h-4" /></button>
            </Tooltip>
            <Tooltip text="Slab Tool" subtext="S (Draw area structural elements)">
              <button onClick={() => setDrawMode('slab')} className={`p-2 rounded-sm transition-all ${drawMode === 'slab' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}><Square className="w-4 h-4" /></button>
            </Tooltip>
            <Tooltip text="Pan Tool" subtext="Space (Move around the canvas)">
              <button onClick={() => setDrawMode('pan')} className={`p-2 rounded-sm transition-all ${drawMode === 'pan' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}><Hand className="w-4 h-4" /></button>
            </Tooltip>
            <Tooltip text="Eraser Tool" subtext="E (Quick delete elements)">
              <button onClick={() => setDrawMode('eraser')} className={`p-2 rounded-sm transition-all ${drawMode === 'eraser' ? 'bg-white text-red-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}><Eraser className="w-4 h-4" /></button>
            </Tooltip>
         </div>

         <div className="h-6 w-px bg-slate-300 mx-1" />

         <div className="flex gap-1">
            <Tooltip text="Zoom In">
              <button onClick={() => handleZoom(0.8)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-sm"><ZoomIn className="w-4 h-4" /></button>
            </Tooltip>
            <Tooltip text="Zoom Out">
              <button onClick={() => handleZoom(1.2)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-sm"><ZoomOut className="w-4 h-4" /></button>
            </Tooltip>
            <Tooltip text="Reset View">
              <button onClick={handleFitScreen} className="p-2 text-slate-500 hover:bg-slate-100 rounded-sm"><Target className="w-4 h-4" /></button>
            </Tooltip>
            <Tooltip text={isMagnetActive ? "Magnet ON" : "Magnet OFF"}>
              <button onClick={() => setIsMagnetActive(!isMagnetActive)} className={`p-2 rounded-sm transition-colors ${isMagnetActive ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><Magnet className="w-4 h-4" /></button>
            </Tooltip>
         </div>

         <div className="h-6 w-px bg-slate-300 mx-1" />

         <Tooltip text="Maximize Canvas">
           <button onClick={() => setIsMaximized(!isMaximized)} className={`p-2 rounded-sm transition-all ${isMaximized ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
           </button>
         </Tooltip>
      </div>

      {/* QUICK SWITCHER - ON-CANVAS COMPONENT */}
      <AnimatePresence>
        {selectedId && drawMode === 'select' && (
          <motion.div 
            initial={{ y: 20, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 20, opacity: 0, x: '-50%' }}
            className="absolute bottom-20 left-1/2 z-50 bg-slate-900 text-white p-1.5 rounded-sm shadow-2xl border border-white/10 flex items-center gap-2"
          >
             <div className="flex flex-col px-3 border-r border-white/10">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Swap Type</span>
                <span className="text-[10px] font-black">{selectedItem?.name}</span>
             </div>
             <div className="flex gap-1 max-w-[200px] overflow-x-auto scrollbar-hide py-0.5">
                {templates.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => updateItem(selectedId, { templateId: t.id })}
                    className={`px-3 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all whitespace-nowrap ${selectedItem?.templateId === t.id ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/10 text-slate-400'}`}
                  >
                    {t.name}
                  </button>
                ))}
             </div>
             <button 
                onClick={() => { deleteItem(selectedId); setSelectedId(null); }}
                className="ml-2 bg-red-600 text-white p-2 rounded-sm hover:bg-red-700 transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REFERENCE IMAGE SETTINGS FLOATING PANEL */}
      <AnimatePresence>
        {isRefSettingsOpen && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-20 right-4 z-30 w-72 bg-white/95 backdrop-blur-md rounded-sm shadow-2xl border border-slate-200 p-5 space-y-6"
          >
             <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                   <ImageIcon className="w-4 h-4 text-blue-600" />
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Image Overlay</h4>
                </div>
                <button onClick={() => setIsRefSettingsOpen(false)} className="p-1 hover:bg-slate-100 rounded-sm"><X className="w-4 h-4 text-slate-400" /></button>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Opacity</span>
                      <span className="text-blue-600">{(refImageOpacity * 100).toFixed(0)}%</span>
                   </div>
                   <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={refImageOpacity} 
                      onChange={(e) => setRefImageValue('refImageOpacity', parseFloat(e.target.value))} 
                      className="w-full h-1.5 bg-slate-100 rounded-sm appearance-none cursor-pointer accent-blue-600"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Scale Size</label>
                       <div className="relative">
                          <input 
                            type="number" step="0.0001" 
                            value={refImageScale || 1} 
                            onChange={(e) => setRefImageValue('refImageScale', parseFloat(e.target.value))} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs font-black pr-10"
                          />
                          <button 
                            onClick={() => { setDrawMode('calibrate_image'); setIsRefSettingsOpen(false); }}
                            className="absolute right-1 top-1 p-1.5 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 shadow-sm transition-all"
                            title="Calibrate Scale (Revit-style)"
                          >
                             <Ruler className="w-3 h-3" />
                          </button>
                       </div>
                   </div>
                   <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Placement</label>
                       <button 
                         onClick={() => setRefImageValue('isRefImageLocked', !isRefImageLocked)}
                         className={`w-full flex items-center justify-center gap-2 py-2 rounded-sm border transition-all text-[10px] font-black uppercase ${!isRefImageLocked ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                       >
                         {!isRefImageLocked ? <><Compass className="w-3.5 h-3.5 animate-spin-slow" /> Unlocked</> : <><Target className="w-3.5 h-3.5" /> Locked</>}
                       </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <button 
                         onClick={() => setIsRefVisible(!isRefVisible)}
                         className={`w-full flex items-center justify-center gap-2 py-2 rounded-sm border transition-all text-[10px] font-black uppercase ${isRefVisible ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                       >
                         {isRefVisible ? <><Eye className="w-3.5 h-3.5" /> Visibility</> : <><EyeOff className="w-3.5 h-3.5" /> Invisible</>}
                       </button>
                    </div>
                    <div className="space-y-2">
                       <button 
                         onClick={() => { setRefImageValue('refImageX', 0); setRefImageValue('refImageY', 0); }}
                         className="w-full h-full flex items-center justify-center gap-2 py-2 rounded-sm border border-slate-200 bg-white text-slate-500 text-[10px] font-black uppercase hover:bg-slate-50"
                       >
                          Reset Pos
                       </button>
                    </div>
                 </div>

                <div className="pt-2 flex gap-2">
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-sm text-[9px] font-black uppercase hover:bg-slate-50 transition-colors"
                   >
                     Replace Image
                   </button>
                   <button 
                     onClick={() => { if(confirm('Remove reference image?')) setRefImageValue('refImage', null); }}
                     className="px-3 bg-red-50 text-red-600 border border-red-100 py-2 rounded-sm hover:bg-red-600 hover:text-white transition-all"
                   >
                     <Trash className="w-3.5 h-3.5" />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full touch-none"
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={() => { setIsDraggingNode(null); setIsDraggingObject(null); setIsPanning(false); setIsDraggingRefImage(false); }}
        onMouseLeave={() => { setIsDraggingNode(null); setIsDraggingObject(null); setIsPanning(false); setIsDraggingRefImage(false); }}
        onTouchMove={handlePointerMove}
        onTouchEnd={() => { setIsDraggingNode(null); setIsDraggingObject(null); setIsPanning(false); setIsDraggingRefImage(false); }}
      >
        <defs>
          <pattern id="smallGrid" width={0.2} height={0.2} patternUnits="userSpaceOnUse"><path d="M 0.2 0 L 0 0 0 0.2" fill="none" stroke="#E2E8F0" strokeWidth="0.015" /></pattern>
          <pattern id="grid" width={1} height={1} patternUnits="userSpaceOnUse"><rect width={1} height={1} fill="url(#smallGrid)" /><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#CBD5E1" strokeWidth="0.03" /></pattern>
          <pattern id="slabPattern" width="1" height="1" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="1" stroke="#10B981" strokeWidth="0.1" opacity="0.3" />
          </pattern>
        </defs>
        
        <rect x={viewBox.x - 500} y={viewBox.y - 500} width={viewBox.w + 1000} height={viewBox.h + 1000} fill="white" />

        {/* REFERENCE IMAGE LAYER */}
        {refImage && isRefVisible && (
          <image 
            href={refImage}
            x={refImageX || 0} 
            y={refImageY || 0} 
            width={100 * (refImageScale || 1)} 
            height={100 * (refImageScale || 1)} 
            style={{ opacity: refImageOpacity ?? 0.5, pointerEvents: 'none' }}
          />
        )}

        <rect x={viewBox.x - 500} y={viewBox.y - 500} width={viewBox.w + 1000} height={viewBox.h + 1000} fill="url(#grid)" fillOpacity="0.4" pointerEvents="none" />

        {drawingSession && (
          <g>
            {drawMode === 'slab' ? (
              <rect 
                x={Math.min(drawingSession.x1, mousePos.x)} y={Math.min(drawingSession.y1, mousePos.y)}
                width={Math.abs(mousePos.x - drawingSession.x1)} height={Math.abs(mousePos.y - drawingSession.y1)}
                fill="none" stroke="#10B981" strokeWidth="0.1" strokeDasharray="0.3,0.1"
              />
            ) : (
              <line x1={drawingSession.x1} y1={drawingSession.y1} x2={mousePos.x} y2={mousePos.y} stroke="#3B82F6" strokeWidth="0.3" strokeDasharray="0.5,0.2" className="animate-pulse" />
            )}
            <circle cx={drawingSession.x1} cy={drawingSession.y1} r="0.2" fill={drawMode === 'slab' ? "#10B981" : "#3B82F6"} />
            <circle cx={mousePos.x} cy={mousePos.y} r="0.2" fill="white" stroke={drawMode === 'slab' ? "#10B981" : "#3B82F6"} strokeWidth="0.1" />
          </g>
        )}

        {calibrationPoints && (
          <g>
            <line x1={calibrationPoints[0].x} y1={calibrationPoints[0].y} x2={mousePos.x} y2={mousePos.y} stroke="#10B981" strokeWidth="0.15" strokeDasharray="0.3,0.1" />
            <circle cx={calibrationPoints[0].x} cy={calibrationPoints[0].y} r="0.3" fill="#10B981" />
            <circle cx={mousePos.x} cy={mousePos.y} r="0.3" fill="white" stroke="#10B981" strokeWidth="0.1" />
          </g>
        )}

        {items.map((item) => {
          const isSelected = selectedId === item.id;
          const isSlab = item.type === 'slab';
          return (
            <g 
              key={item.id} 
              onMouseDown={(e) => {
                if (drawMode === 'eraser') { e.stopPropagation(); deleteItem(item.id); return; }
                if (drawMode === 'select') {
                  e.stopPropagation();
                  setSelectedId(item.id);
                  const { x, y } = getCoords(e.clientX, e.clientY);
                  setIsDraggingObject({ itemId: item.id, startX: x, startY: y });
                }
              }}
            >
              {isSlab ? (
                <rect 
                  x={Math.min(item.x1, item.x2)} y={Math.min(item.y1, item.y2)}
                  width={Math.abs(item.x2 - item.x1)} height={Math.abs(item.y2 - item.y1)}
                  fill={isSelected ? "#10B98133" : "url(#slabPattern)"}
                  stroke={isSelected ? "#10B981" : "#34D399"} strokeWidth={isSelected ? "0.3" : "0.15"}
                />
              ) : (
                <line 
                  x1={item.x1} y1={item.y1} x2={item.x2} y2={item.y2} 
                  stroke={isSelected ? "#3B82F6" : "#475569"} 
                  strokeWidth={isSelected ? "0.5" : "0.3"} strokeLinecap="round"
                />
              )}
              
              {isSelected && !isSlab && (
                <>
                  <circle cx={item.x1} cy={item.y1} r="0.6" fill="transparent" className="cursor-move" onMouseDown={(e) => { e.stopPropagation(); handleNodeDrag(e.clientX, e.clientY, item.id, 'start'); }} />
                  <circle cx={item.x1} cy={item.y1} r="0.25" fill="white" stroke="#3B82F6" strokeWidth="0.1" />
                  <circle cx={item.x2} cy={item.y2} r="0.6" fill="transparent" className="cursor-move" onMouseDown={(e) => { e.stopPropagation(); handleNodeDrag(e.clientX, e.clientY, item.id, 'end'); }} />
                  <circle cx={item.x2} cy={item.y2} r="0.25" fill="white" stroke="#3B82F6" strokeWidth="0.1" />
                </>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 z-10 flex gap-4">
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-sm shadow-2xl flex items-center gap-8 border border-white/10">
           <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Elements</span>
              <span className="text-base font-black">{items.length}</span>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="flex flex-col">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Length</span>
              <span className="text-base font-black text-blue-400">{items.reduce((s, i) => s + (i.length || 0), 0).toFixed(2)}m</span>
           </div>
        </div>
        <button 
          onClick={() => setIsRefSettingsOpen(true)}
          className={`px-4 py-3 rounded-sm shadow-2xl font-black text-[10px] uppercase tracking-widest transition-all ${refImage ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-slate-400 hover:text-slate-600'}`}
        >
           Ref Settings
        </button>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
    </div>
  );
});

export default LayoutCanvas;
