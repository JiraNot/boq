export const PRESET_CATEGORIES = [
  { id: 'gb', name: 'Grade Beams (คานคอดิน)', icon: 'Construction' },
  { id: 'b', name: 'Floor Beams (คานชั้นบน)', icon: 'Layers' },
  { id: 'mesh', name: 'Wire Mesh (ตะแกรงเหล็ก)', icon: 'Grid' },
  { id: 'frp', name: 'FRP Mesh (ตะแกรง C-Bar)', icon: 'Hexagon' },
  { id: 'column', name: 'Columns (เสา)', icon: 'Box' },
];

export const PRESETS = [
  // --- GRADE BEAMS (GB) ---
  {
    id: 'lib-gb1-mid',
    categoryId: 'gb',
    name: 'GB1 (mid.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.40,
    topMainSize: 'DB12', topMainCount: 2,
    bottomMainSize: 'DB12', bottomMainCount: 3,
    stirrupSize: 'RB6', stirrupSpacingMiddle: 0.15, stirrupSpacingEnd: 0.15
  },
  {
    id: 'lib-gb1-sup',
    categoryId: 'gb',
    name: 'GB1 (sup.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.40,
    topMainSize: 'DB12', topMainCount: 3,
    bottomMainSize: 'DB12', bottomMainCount: 2,
    stirrupSize: 'RB6', stirrupSpacingMiddle: 0.15, stirrupSpacingEnd: 0.15
  },
  {
    id: 'lib-gb2-mid',
    categoryId: 'gb',
    name: 'GB2 (mid.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.40,
    topMainSize: 'DB12', topMainCount: 2,
    bottomMainSize: 'DB12', bottomMainCount: 2,
    stirrupSize: 'RB6', stirrupSpacingMiddle: 0.15, stirrupSpacingEnd: 0.15
  },
  {
    id: 'lib-gb2-sup',
    categoryId: 'gb',
    name: 'GB2 (sup.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.40,
    topMainSize: 'DB12', topMainCount: 3,
    bottomMainSize: 'DB12', bottomMainCount: 2,
    stirrupSize: 'RB6', stirrupSpacingMiddle: 0.15, stirrupSpacingEnd: 0.15
  },
  {
    id: 'lib-gb3-mid',
    categoryId: 'gb',
    name: 'GB3 (mid.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.50,
    topMainSize: 'DB12', topMainCount: 3,
    bottomMainSize: 'DB16', bottomMainCount: 3,
    stirrupSize: 'RB9', stirrupSpacingMiddle: 0.15, stirrupSpacingEnd: 0.15
  },
  {
    id: 'lib-gb3c',
    categoryId: 'gb',
    name: 'GB3c (cant.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.60,
    topMainSize: 'DB16', topMainCount: 3,
    bottomMainSize: 'DB12', bottomMainCount: 3,
    stirrupSize: 'RB9', stirrupSpacingMiddle: 0.125, stirrupSpacingEnd: 0.125
  },

  // --- FLOOR BEAMS (B) ---
  {
    id: 'lib-b1-mid',
    categoryId: 'b',
    name: 'B1 (mid.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.40,
    topMainSize: 'DB12', topMainCount: 2,
    bottomMainSize: 'DB12', bottomMainCount: 3,
    stirrupSize: 'RB6', stirrupSpacingMiddle: 0.15, stirrupSpacingEnd: 0.15
  },
  {
    id: 'lib-b2-sup',
    categoryId: 'b',
    name: 'B2 (sup.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.40,
    topMainSize: 'DB12', topMainCount: 3,
    bottomMainSize: 'DB12', bottomMainCount: 2,
    stirrupSize: 'RB6', stirrupSpacingMiddle: 0.15, stirrupSpacingEnd: 0.15
  },
  {
    id: 'lib-b4-mid',
    categoryId: 'b',
    name: 'B4 (mid.)',
    assemblyId: 'a2',
    width: 0.20, depth: 0.50,
    topMainSize: 'DB12', topMainCount: 2,
    bottomMainSize: 'DB16', bottomMainCount: 2,
    extraBottomSize: 'DB12', extraBottomCount: 1,
    stirrupSize: 'RB9', stirrupSpacingMiddle: 0.20, stirrupSpacingEnd: 0.20
  },

  // --- WIRE MESH ---
  {
    id: 'lib-wm-6-15',
    categoryId: 'mesh',
    name: 'WM 6mm @0.15',
    assemblyId: 'a3',
    width: 1, depth: 1, height: 0.10,
    slabRebarType: 'WIREMESH',
    slabWireMeshSize: 'WM6',
    slabGridSpacing: 0.15
  },
  {
    id: 'lib-wm-4-20',
    categoryId: 'mesh',
    name: 'WM 4mm @0.20',
    assemblyId: 'a3',
    width: 1, depth: 1, height: 0.10,
    slabRebarType: 'WIREMESH',
    slabWireMeshSize: 'WM4',
    slabGridSpacing: 0.20
  },
  {
    id: 'lib-wm-2.8-20',
    categoryId: 'mesh',
    name: 'WM 2.8mm @0.20',
    assemblyId: 'a3',
    width: 1, depth: 1, height: 0.10,
    slabRebarType: 'WIREMESH',
    slabWireMeshSize: 'WM2.8',
    slabGridSpacing: 0.20
  },

  // --- FRP MESH ---
  {
    id: 'lib-frp-2.8-20',
    categoryId: 'frp',
    name: 'FRP 2.8mm @0.20',
    assemblyId: 'a3',
    width: 1, depth: 1, height: 0.10,
    slabRebarType: 'GRID',
    slabGridBarSize: 'RB2.8',
    slabGridSpacing: 0.20
  },
  {
    id: 'lib-frp-10-15',
    categoryId: 'frp',
    name: 'FRP 10mm @0.15',
    assemblyId: 'a3',
    width: 1, depth: 1, height: 0.10,
    slabRebarType: 'GRID',
    slabGridBarSize: 'DB10',
    slabGridSpacing: 0.15
  },

  // --- COLUMNS ---
  {
    id: 'lib-c1',
    categoryId: 'column',
    name: 'Column C1',
    assemblyId: 'a1',
    width: 0.20, depth: 0.20,
    mainBarSize: 'DB12', mainBarCount: 4,
    stirrupSize: 'RB6', stirrupSpacingMiddle: 0.20, stirrupSpacingEnd: 0.10
  }
];
