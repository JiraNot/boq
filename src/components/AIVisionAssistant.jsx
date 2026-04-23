import React, { useState, useRef } from 'react';
import { Sparkles, Upload, FileSearch, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { analyzeDrawing } from '../lib/gemini';

export default function AIVisionAssistant({ data, setValue, templates: currentTemplates }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  
  // Stages: 'upload' -> 'analyzing' -> 'review'
  const [stage, setStage] = useState('upload');
  const [planImage, setPlanImage] = useState(null);
  const [detailImage, setDetailImage] = useState(null);
  
  const [foundTemplates, setFoundTemplates] = useState({});
  const [detectedInstances, setDetectedInstances] = useState([]);

  const planInputRef = useRef(null);
  const detailInputRef = useRef(null);

  const handleImageUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === 'plan') setPlanImage(event.target.result);
      else setDetailImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async () => {
    if (!data.geminiApiKey) {
      setError("Please enter your Gemini API Key in Settings first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStage('analyzing');

    try {
      let templates = {};
      let instances = [];

      // 1. Analyze Details (if provided)
      if (detailImage) {
        templates = await analyzeDrawing(data.geminiApiKey, detailImage, 'detail');
        setFoundTemplates(templates);
      }

      // 2. Analyze Plan (if provided)
      if (planImage) {
        instances = await analyzeDrawing(data.geminiApiKey, planImage, 'plan');
        setDetectedInstances(instances);
      }

      setStage('review');
    } catch (err) {
      setError(err.message);
      setStage('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyToProject = () => {
    // 1. Merge Templates
    const newTemplates = [...(data.templates || [])];
    
    Object.entries(foundTemplates).forEach(([label, details]) => {
      // Check if template already exists
      const existingIdx = newTemplates.findIndex(t => t.name.toLowerCase().includes(label.toLowerCase()));
      
      const rawTop = (details.topBars || []).map(b => ({ ...b, size: b.size.replace(/\s*mm\.?/gi, '').toUpperCase() }));
      const rawBottom = (details.bottomBars || []).map(b => ({ ...b, size: b.size.replace(/\s*mm\.?/gi, '').toUpperCase() }));

      // Helper to group by size
      const groupByWeight = (bars) => bars.reduce((acc, b) => {
        acc[b.size] = (acc[b.size] || 0) + b.count;
        return acc;
      }, {});

      const topMid = groupByWeight(rawTop.filter(b => b.zone === 'mid'));
      const topSup = groupByWeight(rawTop.filter(b => b.zone === 'sup' || !b.zone));
      const botMid = groupByWeight(rawBottom.filter(b => b.zone === 'mid' || !b.zone));
      const botSup = groupByWeight(rawBottom.filter(b => b.zone === 'sup'));

      // 1. Main Top = What's in the mid section
      const topMain = Object.entries(topMid).map(([size, count]) => ({ count, size }));
      
      // 2. Extra Top (Support) = Support minus Mid
      const supportBars = [];
      Object.entries(topSup).forEach(([size, count]) => {
        const diff = count - (topMid[size] || 0);
        if (diff > 0) supportBars.push({ count: diff, size });
      });

      // 3. Main Bottom = What's in the support section
      const bottomMain = Object.entries(botSup).map(([size, count]) => ({ count, size }));
      
      // 4. Extra Bottom (Span) = Mid minus Support
      const spanBars = [];
      Object.entries(botMid).forEach(([size, count]) => {
        const diff = count - (botSup[size] || 0);
        if (diff > 0) spanBars.push({ count: diff, size });
      });

      // Fallback if AI didn't provide zones (default to mid)
      const finalTopMain = topMain.length > 0 ? topMain : Object.entries(topSup).map(([size, count]) => ({ count, size }));
      const finalBottomMain = bottomMain.length > 0 ? bottomMain : Object.entries(botMid).map(([size, count]) => ({ count, size }));

      const templateData = {
        id: `t-${Date.now()}-${label}`,
        name: `Beam ${label}`,
        assemblyId: 'a2',
        width: details.width || 0.2,
        depth: details.depth || 0.4,
        // UI Fields
        topBars: finalTopMain.length > 0 ? finalTopMain : [{ count: 2, size: 'DB12' }],
        bottomBars: finalBottomMain.length > 0 ? finalBottomMain : [{ count: 2, size: 'DB12' }],
        supportBars: supportBars,
        spanBars: spanBars,
        // Stirrups
        stirrupSize: (details.stirrupSize || 'RB6').replace(/\s*mm\.?/gi, '').toUpperCase(),
        stirrupSpacingEnd: details.stirrupSpacing || 0.15,
        stirrupSpacingMiddle: details.stirrupSpacing || 0.20,
        stirrupZoneRatio: 0.25
      };

      if (existingIdx !== -1) {
        newTemplates[existingIdx] = { ...newTemplates[existingIdx], ...templateData, id: newTemplates[existingIdx].id };
      } else {
        newTemplates.push(templateData);
      }
    });

    setValue('templates', newTemplates);

    // 2. Add Instances and set Background Image
    const newInstances = [...(data.instances || [])];
    
    // Set the plan image as the reference image for tracing if it exists
    if (planImage) {
      setValue('refImage', planImage);
      setValue('refImageScale', 0.05); // Initial sensible scale
      setValue('refImageOpacity', 0.6);
      setValue('isRefImageLocked', false);
    }

    detectedInstances.forEach((inst, idx) => {
      // Find matching template
      const template = newTemplates.find(t => t.name.toLowerCase().includes(inst.label.toLowerCase()));
      
      if (template) {
        // Map 0-1000 AI coords to canvas space (roughly 0-50 meters)
        let x1 = 0, y1 = idx * 2, x2 = inst.length, y2 = idx * 2;
        
        if (inst.coords && inst.coords.length === 4) {
          const SCALE = 0.05; // Matches refImageScale
          x1 = inst.coords[0] * SCALE;
          y1 = inst.coords[1] * SCALE;
          x2 = inst.coords[2] * SCALE;
          y2 = inst.coords[3] * SCALE;
        }

        newInstances.push({
          id: `inst-ai-${Date.now()}-${idx}`,
          templateId: template.id,
          length: inst.length,
          x1, y1, x2, y2,
          isPlaced: true
        });
      }
    });

    setValue('instances', newInstances);
    alert(`Successfully imported ${Object.keys(foundTemplates).length} templates and ${detectedInstances.length} beam instances.`);
    setStage('upload');
    setPlanImage(null);
    setDetailImage(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <div>
            <h2 className="font-bold text-lg leading-tight text-white">AI Vision Takeoff</h2>
            <p className="text-blue-100 text-[10px] uppercase tracking-widest font-medium">Gemini 1.5 Flash Powered Analysis</p>
          </div>
        </div>
        {stage !== 'upload' && !isAnalyzing && (
          <button onClick={() => setStage('upload')} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-8">
        {stage === 'upload' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PLAN UPLOAD */}
              <div 
                onClick={() => planInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${planImage ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'}`}
              >
                {planImage ? (
                  <>
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-green-700 font-bold text-sm">Plan Uploaded</span>
                    {planImage.startsWith('data:application/pdf') ? (
                      <div className="flex items-center gap-2 mt-1">
                        <FileSearch className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold">PDF Document</span>
                      </div>
                    ) : (
                      <img src={planImage} className="absolute inset-0 w-full h-full object-cover opacity-10 rounded-2xl" alt="preview" />
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="block text-slate-800 font-bold">Structural Plan</span>
                      <span className="text-slate-500 text-xs mt-1 block">Upload Plan (Image/PDF)</span>
                    </div>
                  </>
                )}
                <input type="file" ref={planInputRef} onChange={(e) => handleImageUpload(e, 'plan')} hidden accept="image/*,application/pdf" />
              </div>

              {/* DETAIL UPLOAD */}
              <div 
                onClick={() => detailInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${detailImage ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'}`}
              >
                {detailImage ? (
                  <>
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-green-700 font-bold text-sm">Details Uploaded</span>
                    {detailImage.startsWith('data:application/pdf') ? (
                      <div className="flex items-center gap-2 mt-1">
                        <FileSearch className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold">PDF Document</span>
                      </div>
                    ) : (
                      <img src={detailImage} className="absolute inset-0 w-full h-full object-cover opacity-10 rounded-2xl" alt="preview" />
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSearch className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="block text-slate-800 font-bold">Beam Details</span>
                      <span className="text-slate-500 text-xs mt-1 block">Upload Details (Image/PDF)</span>
                    </div>
                  </>
                )}
                <input type="file" ref={detailInputRef} onChange={(e) => handleImageUpload(e, 'detail')} hidden accept="image/*,application/pdf" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={startAnalysis}
              disabled={(!planImage && !detailImage) || isAnalyzing}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Drawings...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Run AI Analysis
                </>
              )}
            </button>
          </div>
        )}

        {stage === 'analyzing' && (
          <div className="py-20 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800">AI is studying your drawings...</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                Our structural engine is identifying beam segments, calculating lengths, and extracting steel reinforcement details.
              </p>
            </div>
          </div>
        )}

        {stage === 'review' && (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  AI Analysis Results
                </h3>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-500 uppercase tracking-tighter">
                  Review & Sync
                </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* FOUND TEMPLATES */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extracted Beam Details</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-bold">Label</th>
                          <th className="px-4 py-3 font-bold">Size (m)</th>
                          <th className="px-4 py-3 font-bold">Reinforcement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {Object.entries(foundTemplates).map(([label, details]) => (
                          <tr key={label} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-blue-600">{label}</td>
                            <td className="px-4 py-3">{details.width}x{details.depth}</td>
                            <td className="px-4 py-3 text-slate-500">
                              T:{details.topMainCount}{details.topMainSize} / B:{details.bottomMainCount}{details.bottomMainSize}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* DETECTED INSTANCES */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected Beam Segments</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-bold">Label</th>
                          <th className="px-4 py-3 font-bold">Length (m)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {detectedInstances.map((inst, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-indigo-600">{inst.label}</td>
                            <td className="px-4 py-3 font-mono">{inst.length.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             </div>

             <div className="flex gap-4 pt-4 border-t border-slate-100">
               <button 
                 onClick={() => setStage('upload')}
                 className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={applyToProject}
                 className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
               >
                 <CheckCircle2 className="w-5 h-5" />
                 Apply to Project BOQ
               </button>
             </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
          AI analysis results should be verified by a qualified engineer. 
          The system uses multimodal large language models to interpret visual structural data which may occasionally have inaccuracies.
        </p>
      </div>
    </div>
  );
}
