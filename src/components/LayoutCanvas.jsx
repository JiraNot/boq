import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer2, Hand, Square, Circle as CircleIcon, Eraser, Maximize2, Minimize2, 
  ZoomIn, ZoomOut, Target, Trash, Magnet, Construction, Image as ImageIcon, Settings2, Sliders, X, Eye, EyeOff, Trash2, Compass
} from 'lucide-react';
import Tooltip from './Tooltip';

export default function LayoutCanvas({ 
  items, updateItem, deleteItem, templates, addInstance,
  refImage, refImageX, refImageY, refImageScale, refImageOpacity, setRefImageValue
}) {
  const [viewBox, setViewBox] = useState({ x: -10, y: -10, w: 40, h: 40 });
  const [isDraggingNode, setIsDraggingNode] = useState(null); 
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id);
  const [drawMode, setDrawMode] = useState('select'); // 'select' | 'beam' | 'column' | 'pan' | 'eraser'
  const [selectedId, setSelectedId] = useState(null);
  const [isOrthoMode, setIsOrthoMode] = useState(false);
  const [isMagnetActive, setIsMagnetActive] = useState(true);
  const [isShiftDown, setIsShiftDown] = useState(false);
  const [isDraggingObject, setIsDraggingObject] = useState(null); // { itemId, offset: {x, y} }
  const [editingLengthId, setEditingLengthId] = useState(null);
  const [lengthInput, setLengthInput] = useState("");
  
  const [drawingSession, setDrawingSession] = useState(null); // { x1, y1 }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isRefSettingsOpen, setIsRefSettingsOpen] = useState(false);
  const [isRefVisible, setIsRefVisible] = useState(true);
  const SNAP_FINE = 0.02;

  const handleZoom = (factor, mouseX, mouseY) => {
    setViewBox(prev => {
      const newW = prev.w * factor;
      const newH = prev.h * factor;
      
      // If mouse coordinates are provided, zoom relative to mouse
      // Otherwise zoom relative to center
      const focusX = mouseX !== undefined ? mouseX : prev.x + prev.w / 2;
      const focusY = mouseY !== undefined ? mouseY : prev.y + prev.h / 2;

      const newX = focusX - (focusX - prev.x) * factor;
      const newY = focusY - (focusY - prev.y) * factor;

      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  const handleFitScreen = () => {
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

  // KEYBOARD HANDLING
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isPanning) setIsPanning(true);
      if (e.shiftKey) setIsShiftDown(true);
      if (e.code === 'Escape') {
        if (drawingSession) setDrawingSession(null);
        else setSelectedId(null);
      }
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedId && !drawingSession) {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          deleteItem(selectedId);
          setSelectedId(null);
        }
      }
      // ZOOM SHORTCUTS
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleZoom(0.9);
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoom(1.1);
      }
      if (e.key === '0') {
        e.preventDefault();
        handleFitScreen();
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setIsPanning(false);
      if (!e.shiftKey) setIsShiftDown(false);
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

    if (isMagnetActive) {
      const snapRadius = 0.6; // Increased from 0.4
      for (const item of items) {
        if (Math.sqrt(Math.pow(transformed.x - item.x1, 2) + Math.pow(transformed.y - item.y1, 2)) < snapRadius) {
          finalX = item.x1; finalY = item.y1; break;
        }
        if (Math.sqrt(Math.pow(transformed.x - item.x2, 2) + Math.pow(transformed.y - item.y2, 2)) < snapRadius) {
          finalX = item.x2; finalY = item.y2; break;
        }
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

    if (drawMode === 'eraser') {
       setSelectedId(null);
       return;
    }

    if (drawMode === 'beam') {
      // RIGHT CLICK TO CANCEL/FINISH CHAIN
      if (e.button === 2) {
        e.preventDefault();
        setDrawingSession(null);
        return;
      }

      if (!drawingSession) {
        setDrawingSession({ x1: x, y1: y });
      } else {
        addInstance(selectedTemplateId, drawingSession.x1, drawingSession.y1, x, y);
        // CHAIN DRAWING: Set head to current tail
        setDrawingSession({ x1: x, y1: y });
      }
      setIsPanning(true);
      setLastPos({ x: clientX, y: clientY });
      return;
    }

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
    let finalCoords = currentCoords;

    const orthoActive = isOrthoMode || isShiftDown;

    if (orthoActive) {
      if (drawingSession) {
        const dx = Math.abs(currentCoords.x - drawingSession.x1);
        const dy = Math.abs(currentCoords.y - drawingSession.y1);
        if (dx > dy) finalCoords = { x: currentCoords.x, y: drawingSession.y1 };
        else finalCoords = { x: drawingSession.x1, y: currentCoords.y };
      } else if (isDraggingNode) {
         const item = items.find(i => i.id === isDraggingNode.itemId);
         const pivot = isDraggingNode.node === 'start' ? { x: item.x2, y: item.y2 } : { x: item.x1, y: item.y1 };
         const dx = Math.abs(currentCoords.x - pivot.x);
         const dy = Math.abs(currentCoords.y - pivot.y);
         if (dx > dy) finalCoords = { x: currentCoords.x, y: pivot.y };
         else finalCoords = { x: pivot.x, y: currentCoords.y };
      }
    }

    setMousePos(finalCoords);

    if (isDraggingObject) {
       const dx = currentCoords.x - isDraggingObject.startX;
       const dy = currentCoords.y - isDraggingObject.startY;
       const item = items.find(i => i.id === isDraggingObject.itemId);
       if (item) {
         updateItem(item.id, { 
           x1: item.x1 + dx, y1: item.y1 + dy, 
           x2: item.x2 + dx, y2: item.y2 + dy 
         });
         setIsDraggingObject(prev => ({ ...prev, startX: currentCoords.x, startY: currentCoords.y }));
       }
       return;
    }

    if (isDraggingNode) {
      const item = items.find(i => i.id === isDraggingNode.itemId);
      if (!item) return;
      const updates = isDraggingNode.node === 'start' ? { x1: finalCoords.x, y1: finalCoords.y } : { x2: finalCoords.x, y2: finalCoords.y };
      const x1 = updates.x1 ?? item.x1 ?? 0;
      const y1 = updates.y1 ?? item.y1 ?? 0;
      const x2 = updates.x2 ?? item.x2 ?? 0;
      const y2 = updates.y2 ?? item.y2 ?? 0;
      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      updateItem(isDraggingNode.itemId, { ...updates, length: Math.round(dist * 100) / 100 });
      return;
    }
  };

  const handleNodeDrag = (clientX, clientY, itemId, node) => {
    setIsDraggingNode({ itemId, node });
  };

  const handleLengthSubmit = (e) => {
    if (e.key && e.key !== 'Enter') return;
    const newLen = parseFloat(lengthInput);
    if (!isNaN(newLen) && newLen > 0 && editingLengthId) {
       const item = items.find(i => i.id === editingLengthId);
       if (item) {
          const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
          const nx2 = item.x1 + Math.cos(angle) * newLen;
          const ny2 = item.y1 + Math.sin(angle) * newLen;
          updateItem(editingLengthId, { x2: nx2, y2: ny2, length: newLen });
       }
    }
    setEditingLengthId(null);
  };

  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <div className={`
      flex flex-col border border-slate-200 rounded-sm bg-white overflow-hidden relative select-none shadow-xl transition-all
      ${isMaximized ? 'fixed inset-0 z-[100] h-screen w-screen rounded-none' : 'min-h-[450px] h-[70vh] md:h-[650px] w-full'}
      ${(drawMode === 'pan' || isPanning) ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}
    `}>
      {/* TOOLBAR */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex flex-wrap md:flex-nowrap items-center gap-1 md:gap-2 bg-white/95 backdrop-blur-sm p-1.5 md:p-2 rounded-sm shadow-2xl border border-slate-200 max-w-[calc(100%-16px)]">
         <Tooltip text="Select Tool" subtext="เลือกและย้ายวัตถุ (คลิกขวาหรือกด Delete เพื่อลบ)">
            <button onClick={() => { setDrawMode('select'); setDrawingSession(null); }} className={`p-2 rounded-sm ${drawMode === 'select' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
               <MousePointer2 className="w-5 h-5" />
            </button>
         </Tooltip>
         
         <Tooltip text="Pan Tool" subtext="เลื่อนหน้าจอ (หรือกด Space ค้างไว้ขณะใช้เครื่องมืออื่น)">
            <button onClick={() => { setDrawMode('pan'); setDrawingSession(null); }} className={`p-2 rounded-sm ${drawMode === 'pan' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
               <Hand className="w-5 h-5" />
            </button>
         </Tooltip>

         <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2" />
         
         <Tooltip text="Draw Beam" subtext="คลิกเพื่อเริ่ม และคลิกอีกจุดเพื่อวางคาน">
            <button onClick={() => setDrawMode('beam')} className={`p-2 rounded-sm ${drawMode === 'beam' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
               <Square className="w-5 h-5" />
            </button>
         </Tooltip>

         <Tooltip text="Place Column" subtext="คลิกหนึ่งครั้งเพื่อวางเสา">
            <button onClick={() => { setDrawMode('column'); setDrawingSession(null); }} className={`p-2 rounded-sm ${drawMode === 'column' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
               <CircleIcon className="w-5 h-5" />
            </button>
         </Tooltip>

         <Tooltip text="Eraser" subtext="คลิกที่วัตถุเพื่อลบออกรายชิ้น">
            <button onClick={() => { setDrawMode('eraser'); setDrawingSession(null); }} className={`p-2 rounded-sm ${drawMode === 'eraser' ? 'bg-red-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
               <Eraser className="w-5 h-5" />
            </button>
         </Tooltip>

         <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2" />

         <Tooltip text="Zoom In" subtext="ขยายหน้าจอ">
            <button onClick={() => handleZoom(0.9)} className="p-2 rounded-sm hover:bg-slate-100 text-slate-500"><ZoomIn className="w-5 h-5" /></button>
         </Tooltip>
         <Tooltip text="Zoom Out" subtext="ย่อหน้าจอ">
            <button onClick={() => handleZoom(1.1)} className="p-2 rounded-sm hover:bg-slate-100 text-slate-500"><ZoomOut className="w-5 h-5" /></button>
         </Tooltip>
         <Tooltip text="Fit Screen" subtext="แสดงทั้งหมด (กด 0)">
            <button onClick={handleFitScreen} className="p-2 rounded-sm hover:bg-slate-100 text-slate-500"><Target className="w-5 h-5" /></button>
         </Tooltip>

         <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2" />

         <Tooltip text="Ortho Mode" subtext="บังคับเส้นตรง 90 องศา (หรือกด Shift ค้าง)">
            <button 
               onClick={() => setIsOrthoMode(!isOrthoMode)} 
               className={`p-2 rounded-sm transition-colors ${isOrthoMode ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-100 text-slate-400 opacity-60 hover:opacity-100'}`}
            >
               <Construction className="w-4 h-4" />
            </button>
         </Tooltip>

         <Tooltip text="Magnet Snap" subtext="ช่วยดูดูดจุดเชื่อมต่อเข้าหากันโดยอัตโนมัติ">
            <button 
               onClick={() => setIsMagnetActive(!isMagnetActive)} 
               className={`p-2 rounded-sm transition-colors ${isMagnetActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-400 opacity-60 hover:opacity-100'}`}
            >
               <Magnet className="w-4 h-4" />
            </button>
         </Tooltip>

         <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2" />

         <Tooltip text="Clear Pattern" subtext="ลบแบบที่วาดทั้งหมดออกจากแปลน (ไม่ลบ Library)">
            <button onClick={() => { if(confirm('Clear all drawings?')) { items.forEach(i => deleteItem(i.id)); } }} className="p-2 rounded-sm hover:bg-red-100 text-red-400">
               <Trash className="w-4 h-4" />
            </button>
         </Tooltip>

         <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2" />

         <Tooltip text="Trace Overlay" subtext="อัปโหลดรูปภาพแปลนเพื่อวาดทับ (PNG/JPG)">
            <button 
               onClick={() => refImage ? setIsRefSettingsOpen(!isRefSettingsOpen) : fileInputRef.current?.click()} 
               className={`p-2 rounded-sm transition-colors ${refImage ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-500'}`}
            >
               <ImageIcon className="w-5 h-5" />
            </button>
         </Tooltip>
         <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      </div>

      {/* REFERENCE IMAGE SETTINGS FLOATING PANEL */}
      <AnimatePresence>
        {isRefSettingsOpen && refImage && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-20 left-4 z-40 bg-white/95 backdrop-blur-md p-5 rounded-sm shadow-2xl border border-slate-200 w-72 space-y-5"
          >
             <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                   <Settings2 className="w-4 h-4 text-emerald-600" />
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Reference Settings</h5>
                </div>
                <button onClick={() => setIsRefSettingsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opacity</label>
                      <span className="text-[9px] font-bold text-slate-600">{Math.round(refImageOpacity * 100)}%</span>
                   </div>
                   <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={refImageOpacity} 
                      onChange={(e) => setRefImageValue('refImageOpacity', parseFloat(e.target.value))} 
                      className="w-full accent-emerald-600"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Scale Size</label>
                      <input 
                        type="number" step="0.01" 
                        value={refImageScale} 
                        onChange={(e) => setRefImageValue('refImageScale', parseFloat(e.target.value))} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs font-black"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Visibility</label>
                      <button 
                        onClick={() => setIsRefVisible(!isRefVisible)}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-sm border transition-all text-[10px] font-black uppercase ${isRefVisible ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      >
                        {isRefVisible ? <><Eye className="w-3.5 h-3.5" /> Visible</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Offset X (m)</label>
                      <div className="flex items-center gap-1">
                         <input 
                           type="number" step="0.1" 
                           value={refImageX} 
                           onChange={(e) => setRefImageValue('refImageX', parseFloat(e.target.value))} 
                           className="w-full bg-slate-50 border border-slate-200 rounded-sm px-2 py-2 text-xs font-black text-center"
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Offset Y (m)</label>
                      <input 
                        type="number" step="0.1" 
                        value={refImageY} 
                        onChange={(e) => setRefImageValue('refImageY', parseFloat(e.target.value))} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-sm px-2 py-2 text-xs font-black text-center"
                      />
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
             <p className="text-[8px] font-bold text-slate-400 italic">Tip: Use Scale and Offset to align the plan image with the structural grid.</p>
          </motion.div>
        )}
      </AnimatePresence>

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

      <div className="absolute bottom-4 right-4 md:bottom-16 md:right-4 z-10 flex flex-col gap-1 md:gap-2 items-end">
         <div className="flex flex-col gap-1 p-1.5 bg-white/95 backdrop-blur-sm rounded-sm shadow-2xl border border-slate-200 min-w-[120px] md:min-w-[160px] max-h-[150px] overflow-y-auto">
            {templates.map(t => (
               <button key={t.id} onClick={() => setSelectedTemplateId(t.id)} className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2.5 rounded-sm text-[9px] md:text-[10px] font-black transition-all flex items-center justify-between uppercase tracking-tighter ${selectedTemplateId === t.id ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <span className="truncate mr-2">{t.name}</span>
                  {selectedTemplateId === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
               </button>
            ))}
         </div>
         <span className="text-[8px] font-black text-slate-400 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-sm shadow-sm w-fit uppercase tracking-widest border border-slate-100">Type</span>
      </div>

      {editingLengthId && (
         <div 
          className="absolute z-50 bg-white p-1 rounded-sm shadow-2xl border-2 border-blue-600 flex items-center gap-1"
          style={{ 
            left: `${((items.find(i => i.id === editingLengthId).x1 + items.find(i => i.id === editingLengthId).x2) / 2 - viewBox.x) * (svgRef.current.clientWidth / viewBox.w)}px`,
            top: `${((items.find(i => i.id === editingLengthId).y1 + items.find(i => i.id === editingLengthId).y2) / 2 - viewBox.y) * (svgRef.current.clientHeight / viewBox.h) - 40}px`
          }}
         >
            <input 
              autoFocus
              className="w-16 admin-input py-1 text-xs font-black text-center"
              value={lengthInput}
              onChange={(e) => setLengthInput(e.target.value)}
              onKeyDown={handleLengthSubmit}
              onBlur={handleLengthSubmit}
            />
            <span className="text-[10px] font-black text-slate-400 pr-1">M</span>
         </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full touch-none"
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={() => { setIsDraggingNode(null); setIsDraggingObject(null); setIsPanning(false); }}
        onMouseLeave={() => { setIsDraggingNode(null); setIsDraggingObject(null); setIsPanning(false); }}
        onTouchMove={handlePointerMove}
        onTouchEnd={() => { setIsDraggingNode(null); setIsDraggingObject(null); setIsPanning(false); }}
      >
        <defs>
          <pattern id="smallGrid" width={0.2} height={0.2} patternUnits="userSpaceOnUse"><path d="M 0.2 0 L 0 0 0 0.2" fill="none" stroke="#E2E8F0" strokeWidth="0.015" /></pattern>
          <pattern id="grid" width={1} height={1} patternUnits="userSpaceOnUse"><rect width={1} height={1} fill="url(#smallGrid)" /><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#CBD5E1" strokeWidth="0.03" /></pattern>
        </defs>
        
        {/* VIEWPORT BG */}
        <rect x={viewBox.x - 500} y={viewBox.y - 500} width={viewBox.w + 1000} height={viewBox.h + 1000} fill="white" />

        {/* REFERENCE IMAGE LAYER */}
        {refImage && isRefVisible && (
          <image 
            href={refImage}
            x={refImageX} 
            y={refImageY} 
            width={100 * refImageScale} 
            height={100 * refImageScale} 
            style={{ opacity: refImageOpacity, pointerEvents: 'none' }}
          />
        )}

        {/* GRID LAYER */}
        <rect x={viewBox.x - 500} y={viewBox.y - 500} width={viewBox.w + 1000} height={viewBox.h + 1000} fill="url(#grid)" fillOpacity="0.4" pointerEvents="none" />

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
                if (drawMode === 'eraser') {
                  e.stopPropagation();
                  deleteItem(item.id);
                  return;
                }
                if (drawMode === 'select' && !isDraggingNode) {
                  e.stopPropagation();
                  setSelectedId(item.id);
                  const { x: curX, y: curY } = getCoords(e.clientX, e.clientY);
                  setIsDraggingObject({ itemId: item.id, startX: curX, startY: curY });
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

              <g 
                transform={`translate(${(item.x1 + item.x2) / 2}, ${(item.y1 + item.y2) / 2 - 0.4})`}
                onClick={(e) => {
                   if (isSelected && !isColumn) {
                      e.stopPropagation();
                      setEditingLengthId(item.id);
                      setLengthInput(item.length.toString());
                   }
                }}
              >
                <rect x="-0.8" y="-0.3" width="1.6" height="0.6" fill={isSelected ? "var(--primary)" : "white"} fillOpacity={isSelected ? "1" : "0.9"} rx="0.05" className="cursor-text transition-colors" />
                <text textAnchor="middle" y="0.1" className={`text-[0.4px] font-black pointer-events-none uppercase tracking-tighter ${isSelected ? 'fill-white' : 'fill-slate-800'}`}>
                  {item.name} {isColumn ? '' : `(${item.length}m)`}
                </text>
              </g>
              
              {!isColumn && (
                <>
                 <circle 
                   cx={item.x1} cy={item.y1} r="0.6" fill="transparent" 
                   className="cursor-nwse-resize" 
                   onMouseDown={(e) => { 
                     if (drawMode === 'select') {
                       e.stopPropagation(); 
                       handleNodeDrag(e.clientX, e.clientY, item.id, 'start');
                     }
                   }} 
                 />
                 <circle cx={item.x1} cy={item.y1} r="0.2" fill="white" stroke="var(--primary)" strokeWidth="0.08" className="pointer-events-none" />
                 
                 <circle 
                   cx={item.x2} cy={item.y2} r="0.6" fill="transparent" 
                   className="cursor-nwse-resize" 
                   onMouseDown={(e) => { 
                     if (drawMode === 'select') {
                        e.stopPropagation(); 
                        handleNodeDrag(e.clientX, e.clientY, item.id, 'end');
                     }
                   }} 
                 />
                <circle cx={item.x2} cy={item.y2} r="0.2" fill="white" stroke="var(--primary)" strokeWidth="0.08" className="pointer-events-none" />
                </>
              )}
              {isColumn && (
                <circle cx={item.x1} cy={item.y1} r="0.8" fill="transparent" className="cursor-move" onMouseDown={(e) => { if (drawMode === 'select') { e.stopPropagation(); handleNodeDrag(e.clientX, e.clientY, item.id, 'start') } }} />
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
