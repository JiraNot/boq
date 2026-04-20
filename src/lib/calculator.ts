/**
 * Take-off Engine: Calculates resource quantities based on assembly recipes and dimensions.
 */

export interface CalculationParams {
  width?: number;
  depth?: number;
  height?: number;
  length?: number;
  quantity: number;
}

export interface ResourceResult {
  resourceId: string;
  name: string;
  unit: string;
  type: 'MATERIAL' | 'LABOR';
  quantity: number;
  basePrice: number;
  totalPrice: number;
}

/**
 * Parses and evaluates a formula string with given parameters.
 * Basic implementation using replacement and Function constructor.
 */
export function evaluateFormula(formula: string, params: CalculationParams): number {
  let processedFormula = formula.toLowerCase();
  
  // Default missing params to 0 (except quantity which should be at least 1 for the mul logic if used)
  const safeParams = {
    width: params.width || 0,
    depth: params.depth || 0,
    height: params.height || 0,
    length: params.length || 0,
    qty: params.quantity || 0,
  };

  // Replace variable tokens with parameter values
  Object.entries(safeParams).forEach(([key, value]) => {
    // Regex to match whole words like 'width', 'qty', etc.
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    processedFormula = processedFormula.replace(regex, value.toString());
  });

  try {
    // Standard math evaluation
    // Note: Using new Function is generally safer than eval() but still powerful.
    // For a production app, a math parser library like mathjs would be better.
    return new Function(`return ${processedFormula}`)();
  } catch (error) {
    console.error(`Error evaluating formula: ${formula}`, error);
    return 0;
  }
}

/**
 * Main calculation function for a Work Item
 */
export function calculateWorkItem(
  assembly: any, // Assembly with components and resources
  params: CalculationParams
): ResourceResult[] {
  if (!assembly?.components) return [];

  return assembly.components.map((comp: any) => {
    const calculatedQty = evaluateFormula(comp.formula, params);
    
    return {
      resourceId: comp.resource.id,
      name: comp.resource.name,
      unit: comp.resource.unit,
      type: comp.resource.type,
      quantity: calculatedQty,
      basePrice: comp.resource.basePrice,
      totalPrice: calculatedQty * comp.resource.basePrice,
    };
  });
}
