const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding process started...');

  // 1. CLEAR EXISTING DATA
  await prisma.recipeComponent.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.assembly.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.project.deleteMany();

  // 2. CREATE RESOURCES (GOV PRICES)
  const cement = await prisma.resource.create({
    data: { name: 'Cement Portland Type 1', unit: 'ton', type: 'MATERIAL', basePrice: 2450 }
  });
  const sand = await prisma.resource.create({
    data: { name: 'Sand (Construction)', unit: 'cu.m.', type: 'MATERIAL', basePrice: 550 }
  });
  const stone = await prisma.resource.create({
    data: { name: 'Stone (1/2)', unit: 'cu.m.', type: 'MATERIAL', basePrice: 650 }
  });
  const rb6 = await prisma.resource.create({
    data: { name: 'Steel RB6', unit: 'kg', type: 'MATERIAL', basePrice: 28.5 }
  });
  const db12 = await prisma.resource.create({
    data: { name: 'Steel DB12', unit: 'kg', type: 'MATERIAL', basePrice: 26.8 }
  });
  const laborConcrete = await prisma.resource.create({
    data: { name: 'Labor: Concrete Pouring', unit: 'cu.m.', type: 'LABOR', basePrice: 450 }
  });

  // 3. CREATE ASSEMBLIES (RECIPES)
  
  // BEAM ASSEMBLY: per 1 meter length
  // Variables: width, depth
  const beamAssembly = await prisma.assembly.create({
    data: {
      name: 'Standard Beam (B1)',
      category: 'Structural',
      unit: 'm',
      components: {
        create: [
          { resourceId: cement.id, formula: 'width * depth * 0.35', description: 'Cement content' },
          { resourceId: sand.id, formula: 'width * depth * 0.5', description: 'Sand content' },
          { resourceId: stone.id, formula: 'width * depth * 1.0', description: 'Stone content' },
          { resourceId: db12.id, formula: '4 * 0.888 * 1.05', description: 'Main Steel (4 bars) + 5% waste' },
          { resourceId: rb6.id, formula: '(1 / 0.2) * (2*(width+depth)) * 0.222', description: 'Stirrups every 20cm' },
          { resourceId: laborConcrete.id, formula: 'width * depth', description: 'Pouring labor' },
        ]
      }
    }
  });

  // 4. CREATE AN INITIAL PROJECT
  const project = await prisma.project.create({
    data: {
      name: 'Sample House Project',
      location: 'Bangkok',
      factorF: 1.30,
      items: {
        create: [
          { 
            name: 'First Floor Beams',
            assemblyId: beamAssembly.id,
            quantity: 12, // 12 columns/beams? No, let's say 12 sections
            width: 0.2,
            depth: 0.4,
            length: 4.0,
            unit: 'm',
            totalMaterial: 0, // Will be calculated by system
            totalLabor: 0
          }
        ]
      }
    }
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
