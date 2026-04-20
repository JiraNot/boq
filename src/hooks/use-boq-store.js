import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const STORAGE_KEY = 'boq_autopilot_v2';

const templateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  assemblyId: z.string(),
  width: z.number().min(0),
  depth: z.number().min(0),
  height: z.number().min(0).default(0),
  // Rebar specs (Shared by all instances)
  mainBarSize: z.string().default('DB12'),
  mainBarCount: z.number().min(0).default(4),
  topMainSize: z.string().default('DB12'),
  topMainCount: z.number().min(0).default(2),
  bottomMainSize: z.string().default('DB12'),
  bottomMainCount: z.number().min(0).default(2),
  extraTopSize: z.string().default('DB12'),
  extraTopCount: z.number().min(0).default(0),
  extraTopLength: z.number().min(0).default(1.0),
  extraBottomSize: z.string().default('DB12'),
  extraBottomCount: z.number().min(0).default(0),
  extraBottomLength: z.number().min(0).default(1.0),
  slabRebarType: z.enum(['WIREMESH', 'GRID']).default('WIREMESH'),
  slabWireMeshSize: z.string().default('WM4'),
  slabGridBarSize: z.string().default('RB6'),
  slabGridSpacing: z.number().min(0.01).default(0.20),
  // Advanced Stirrup Zions
  stirrupSize: z.string().default('RB6'),
  stirrupSpacingEnd: z.number().min(0.01).default(0.10),
  stirrupSpacingMiddle: z.number().min(0.01).default(0.20),
  stirrupZoneRatio: z.number().min(0).max(0.5).default(0.25), // L/4 per end
});

const instanceSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  x1: z.number().default(0),
  y1: z.number().default(0),
  x2: z.number().default(0),
  y2: z.number().default(0),
  length: z.number().min(0).default(0),
  isPlaced: z.boolean().default(true),
});

const boqV2Schema = z.object({
  projectName: z.string().min(1),
  profitRate: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100),
  overheadRate: z.number().min(0).max(100),
  templates: z.array(templateSchema).default([]),
  instances: z.array(instanceSchema).default([]),
});

const DEFAULT_TEMPLATES = [
  { 
    id: 't-c1', name: 'Column C1', assemblyId: 'a1', width: 0.2, depth: 0.2, 
    mainBarSize: 'DB12', mainBarCount: 4,
    stirrupSpacingEnd: 0.10, stirrupSpacingMiddle: 0.20, stirrupZoneRatio: 0.25
  },
  { 
    id: 't-b1', name: 'Beam B1', assemblyId: 'a2', width: 0.2, depth: 0.4, 
    topMainCount: 2, bottomMainCount: 2,
    stirrupSpacingEnd: 0.10, stirrupSpacingMiddle: 0.20, stirrupZoneRatio: 0.25
  },
];

export function useBoqStore() {
  const getInitialData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration for new stirrup fields
        parsed.templates = parsed.templates.map(t => ({
          stirrupSpacingEnd: 0.10,
          stirrupSpacingMiddle: 0.20,
          stirrupZoneRatio: 0.25,
          ...t
        }));
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    
    return {
      projectName: 'Standard Project',
      profitRate: 10,
      taxRate: 7,
      overheadRate: 13,
      templates: DEFAULT_TEMPLATES,
      instances: []
    };
  };

  const form = useForm({
    resolver: zodResolver(boqV2Schema),
    defaultValues: getInitialData()
  });

  const watchAll = form.watch();
  
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  return {
    form,
    data: watchAll,
  };
}
