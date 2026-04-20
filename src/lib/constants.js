export const STEEL_DATA = {
  'RB6': { id: 'r4', weight: 0.222, label: 'RB6', isMain: false },
  'RB9': { id: 'r9', weight: 0.499, label: 'RB9', isMain: false },
  'DB12': { id: 'r5', weight: 0.888, label: 'DB12', isMain: true },
  'DB16': { id: 'r6', weight: 1.578, label: 'DB16', isMain: true },
  'DB20': { id: 'r10', weight: 2.466, label: 'DB20', isMain: true },
  'DB25': { id: 'r11', weight: 3.853, label: 'DB25', isMain: true },
};

export const WIRE_MESH_DATA = {
  'WM3': { id: 'r4', weightPerSqm: 0.56, label: 'Wire Mesh 3mm @0.20' },
  'WM4': { id: 'r4', weightPerSqm: 0.99, label: 'Wire Mesh 4mm @0.20' },
  'WM6': { id: 'r4', weightPerSqm: 2.22, label: 'Wire Mesh 6mm @0.20' },
};

export const DEFAULT_RESOURCES = [
  { id: 'r1', name: 'Cement Portland Type 1', unit: 'ton', type: 'MATERIAL', basePrice: 2450 },
  { id: 'r2', name: 'Sand (Construction)', unit: 'cu.m.', type: 'MATERIAL', basePrice: 550 },
  { id: 'r3', name: 'Stone (1/2)', unit: 'cu.m.', type: 'MATERIAL', basePrice: 650 },
  { id: 'r4', name: 'Steel RB6', unit: 'kg', type: 'MATERIAL', basePrice: 28.5 },
  { id: 'r5', name: 'Steel DB12', unit: 'kg', type: 'MATERIAL', basePrice: 26.8 },
  { id: 'r6', name: 'Steel DB16', unit: 'kg', type: 'MATERIAL', basePrice: 25.5 },
  { id: 'r7', name: 'Labor: Concrete Pouring', unit: 'cu.m.', type: 'LABOR', basePrice: 450 },
  { id: 'r8', name: 'Labor: Steel Reinforcement', unit: 'kg', type: 'LABOR', basePrice: 4.5 },
  { id: 'r9', name: 'Steel RB9', unit: 'kg', type: 'MATERIAL', basePrice: 27.5 },
  { id: 'r10', name: 'Steel DB20', unit: 'kg', type: 'MATERIAL', basePrice: 24.5 },
  { id: 'r11', name: 'Steel DB25', unit: 'kg', type: 'MATERIAL', basePrice: 23.5 },
];

export const DEFAULT_ASSEMBLIES = [
  { 
    id: 'a1', name: 'Foundation Column (C1)', category: 'Structure', unit: 'm', 
    hasRebar: true,
    components: [
      { resourceId: 'r1', formula: 'width * depth * 0.35' },
      { resourceId: 'r2', formula: 'width * depth * 0.5' },
      { resourceId: 'r3', formula: 'width * depth * 1.0' },
      { resourceId: 'r7', formula: 'width * depth' },
    ]
  },
  { 
    id: 'a2', name: 'Standard Beam (B1)', category: 'Structure', unit: 'm', 
    hasRebar: true,
    components: [
      { resourceId: 'r1', formula: 'width * depth * 0.35' },
    ]
  },
  {
    id: 'a3', name: 'Solid Slab (S1)', category: 'Structure', unit: 'sq.m.',
    hasRebar: true, // Now supports specialized slab rebar UI
    isSlab: true,
    components: [
      { resourceId: 'r1', formula: 'depth * 0.35', description: 'Concrete for depth(thick)' }, // Using depth as thickness for slabs
      { resourceId: 'r7', formula: 'depth' },
    ]
  },
  {
    id: 'a4', name: 'Bored Pile (0.35m)', category: 'Foundation', unit: 'm',
    hasRebar: true,
    components: [
      { resourceId: 'r1', formula: '0.1 * 0.35' },
      { resourceId: 'r7', formula: '0.1' },
    ]
  }
];
