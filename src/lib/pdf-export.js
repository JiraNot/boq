import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePDF(projectSummary, compositeFactorF) {
  const doc = new jsPDF();
  const projectName = projectSummary.calculatedItems[0]?.projectName || 'BOQ Project';
  const timestamp = new Date().toLocaleString();

  // HEADING
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('AUTO-PILOT BOQ REPORT', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${timestamp}`, 14, 30);
  doc.text(`Factor F Multiplier: ${compositeFactorF.toFixed(2)}x`, 14, 35);

  // MAIN TABLE
  const tableData = projectSummary.calculatedItems.map((item, index) => [
    index + 1,
    item.name,
    `${item.width}x${item.depth}x${item.length}`,
    item.quantity,
    `฿${item.materialCost.toLocaleString()}`,
    `฿${item.laborCost.toLocaleString()}`,
    `฿${(item.cost * compositeFactorF).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['ID', 'Description', 'Dimensions (WxDxL)', 'Qty', 'Material', 'Labor', 'Final Sale']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillStyle: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    }
  });

  // SUMMARY SECTION
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('COST SUMMARY', 14, finalY);

  const summaryData = [
    ['Direct Material Cost', `฿${projectSummary.totalMaterialCost.toLocaleString()}`],
    ['Direct Labor Cost', `฿${projectSummary.totalLaborCost.toLocaleString()}`],
    ['Direct Total (No Markup)', `฿${projectSummary.directCost.toLocaleString()}`],
    ['Total Project Value (Inc. Markup)', `฿${projectSummary.totalSale.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
    ['Projected Net Margin', `฿${projectSummary.margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`]
  ];

  autoTable(doc, {
    startY: finalY + 5,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // MATERIAL BREAKDOWN
  const breakdownY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('MATERIAL BREAKDOWN', 14, breakdownY);

  const breakdownData = Object.values(projectSummary.resourceTotals).map(res => [
    res.name,
    `${res.totalQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${res.unit}`,
    `฿${res.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  ]);

  autoTable(doc, {
    startY: breakdownY + 5,
    head: [['Resource', 'Total Quantity', 'Total Cost']],
    body: breakdownData,
    theme: 'striped',
    headStyles: { fillStyle: [100, 100, 100] },
    styles: { fontSize: 8 }
  });

  // FOOTER
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
  }

  doc.save(`BOQ_Report_${Date.now()}.pdf`);
}
