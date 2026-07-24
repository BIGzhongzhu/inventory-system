import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getClient } from '@/app/api/_db';

export async function GET(request: NextRequest) {
  const client = getClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'sales';
  const startDate = searchParams.get('startDate') || searchParams.get('dateFrom') || '';
  const endDate = searchParams.get('endDate') || searchParams.get('dateTo') || '';
  const preview = searchParams.get('preview') === 'true';

  // Preview mode: return JSON data for display
  if (preview) {
    if (type === 'sales') {
      const data = await getSalesPreview(startDate, endDate);
      return NextResponse.json({ type: 'sales', ...data });
    } else if (type === 'purchase' || type === 'purchases') {
      const data = await getPurchasePreview(startDate, endDate);
      return NextResponse.json({ type: 'purchases', ...data });
    } else if (type === 'stock') {
      const data = await getStockPreview();
      return NextResponse.json({ type: 'stock', ...data });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  }

  // Export mode: generate Excel file
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '进销存管理系统';
  workbook.created = new Date();

  if (type === 'sales' || type === 'purchases' || type === 'purchase') {
    await buildOrderSheet(workbook, type, startDate, endDate);
  } else if (type === 'stock') {
    await buildStockSheet(workbook);
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = type === 'sales' ? '出库明细表.xlsx' : (type === 'purchases' || type === 'purchase') ? '进货明细表.xlsx' : '产品库存表.xlsx';

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}

async function buildOrderSheet(workbook: ExcelJS.Workbook, type: string, startDate: string, endDate: string) {
  const client = getClient();
  const isSales = type === 'sales';
  const isPurchases = type === 'purchases' || type === 'purchase';
  const orderTable = isSales ? 'sales_orders' : 'purchase_orders';
  const itemTable = isSales ? 'sales_order_items' : 'purchase_order_items';
  const partyTable = isSales ? 'customers' : 'suppliers';
  const sheetName = isSales ? '出库明细' : '进货明细';

  // Fetch orders - use 'date' column for filtering (not created_at)
  let orderQuery = client.from(orderTable).select('*').order('date', { ascending: true });
  if (isSales) orderQuery = orderQuery.neq('verified', true);
  if (startDate) orderQuery = orderQuery.gte('date', startDate);
  if (endDate) orderQuery = orderQuery.lte('date', endDate);
  const { data: orders } = await orderQuery;

  // Fetch all order items
  const { data: allItems } = await client.from(itemTable).select('*');

  // Fetch parties
  const { data: parties } = await client.from(partyTable).select('*');

  // Fetch products
  const { data: products } = await client.from('products').select('*');

  const ws = workbook.addWorksheet(sheetName);

  // === Upper table: Order detail ===
  const upperHeaders = isSales
    ? ['日期', '部门', '物品', '型号', '单价', '数量', '总价']
    : ['日期', '供应商', '物品', '型号', '单价', '数量', '总价'];

  // Title row
  ws.mergeCells('A1:G1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `${sheetName}表`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).height = 36;

  // Header row
  const headerRow = ws.getRow(2);
  headerRow.values = upperHeaders;
  headerRow.height = 24;
  headerRow.eachCell((cell: ExcelJS.Cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  // Data rows
  let currentRow = 3;
  const partyMap = new Map((parties || []).map((p: Record<string, unknown>) => [p.id, p.name]));
  const productMap = new Map((products || []).map((p: Record<string, unknown>) => [p.id, p]));

  let grandTotal = 0;

  for (const order of (orders || [])) {
    const orderItems = (allItems || []).filter((i: Record<string, unknown>) => i.order_id === order.id);
    // Sales orders use customer_id, purchase orders use supplier_id
    const partyId = isSales ? order.customer_id : order.supplier_id;
    const partyName = partyMap.get(partyId) || '';
    const dateStr = order.date || '';

    for (const item of orderItems) {
      const prod: Record<string, unknown> | undefined = productMap.get(item.product_id) as Record<string, unknown> | undefined;
      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.qty) || 0;
      const row = ws.getRow(currentRow);
      row.values = [
        dateStr,
        partyName,
        prod?.name || '',
        prod?.spec || '',
        itemPrice,
        itemQty,
        itemPrice * itemQty,
      ];
      row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
        if (colNumber === 5 || colNumber === 6 || colNumber === 7) {
          cell.alignment = { horizontal: 'right' };
        } else {
          cell.alignment = { horizontal: 'center' };
        }
      });
      // Yellow highlight on total column
      const totalCell = row.getCell(7);
      totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      totalCell.numFmt = '0.00';

      grandTotal += itemPrice * itemQty;
      currentRow++;
    }
  }

  // Summary row
  const summaryRow = ws.getRow(currentRow);
  ws.mergeCells(`A${currentRow}:F${currentRow}`);
  summaryRow.getCell(1).value = '合计';
  summaryRow.getCell(1).font = { bold: true, size: 12 };
  summaryRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  summaryRow.getCell(7).value = grandTotal;
  summaryRow.getCell(7).font = { bold: true, size: 12, color: { argb: 'FFFF0000' } };
  summaryRow.getCell(7).numFmt = '0.00';
  summaryRow.getCell(7).alignment = { horizontal: 'right' };
  summaryRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  summaryRow.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
    cell.border = {
      top: { style: 'medium' }, left: { style: 'thin' },
      bottom: { style: 'medium' }, right: { style: 'thin' },
    };
  });

  // Column widths
  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 10;
  ws.getColumn(6).width = 8;
  ws.getColumn(7).width = 12;

  // === Lower table: Product summary ===
  currentRow += 2;
  const lowerStartRow = currentRow;
  const lowerHeaders = ['品名', '数量', '价格', '合计'];

  const lowerHeaderRow = ws.getRow(currentRow);
  lowerHeaderRow.values = lowerHeaders;
  lowerHeaderRow.height = 22;
  lowerHeaderRow.eachCell((cell: ExcelJS.Cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    cell.font = { bold: true, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  currentRow++;

  // Aggregate by product
  const productSummary = new Map<number, { name: string; qty: number; price: number; total: number }>();
  for (const item of (allItems || [])) {
    const prod: Record<string, unknown> | undefined = productMap.get(item.product_id) as Record<string, unknown> | undefined;
    if (!prod) continue;
    const itemPrice = Number(item.price) || 0;
    const itemQty = Number(item.qty) || 0;
    const existing = productSummary.get(item.product_id) || { name: prod.name as string, qty: 0, price: itemPrice, total: 0 };
    existing.qty += itemQty;
    existing.total += itemPrice * itemQty;
    productSummary.set(item.product_id, existing);
  }

  let lowerGrandTotal = 0;
  for (const [, summary] of productSummary) {
    const row = ws.getRow(currentRow);
    row.values = [summary.name, summary.qty, summary.price, summary.total];
    row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center' };
    });
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(4).numFmt = '0.00';
    lowerGrandTotal += summary.total;
    currentRow++;
  }

  // Lower summary row
  const lowerSummaryRow = ws.getRow(currentRow);
  ws.mergeCells(`A${currentRow}:C${currentRow}`);
  lowerSummaryRow.getCell(1).value = '合计';
  lowerSummaryRow.getCell(1).font = { bold: true };
  lowerSummaryRow.getCell(1).alignment = { horizontal: 'right' };
  lowerSummaryRow.getCell(4).value = lowerGrandTotal;
  lowerSummaryRow.getCell(4).font = { bold: true, color: { argb: 'FFFF0000' } };
  lowerSummaryRow.getCell(4).numFmt = '0';
  lowerSummaryRow.getCell(4).alignment = { horizontal: 'right' };
  lowerSummaryRow.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
    cell.border = {
      top: { style: 'medium' }, left: { style: 'thin' },
      bottom: { style: 'medium' }, right: { style: 'thin' },
    };
  });

  // Add auto-filter on upper table
  ws.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: Math.max(2, currentRow - 1), column: 7 },
  };
}

async function buildStockSheet(workbook: ExcelJS.Workbook) {
  const client = getClient();
  const { data: products } = await client.from('products').select('*').order('code', { ascending: true });
  const { data: stockData } = await client.from('stock_view').select('*');

  const ws = workbook.addWorksheet('产品库存');

  // Title
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = '产品库存表';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF375623' } };
  ws.getRow(1).height = 36;

  // Headers
  const headers = ['编号', '名称', '规格', '单位', '进货单价', '销售单价', '库存数量', '库存金额'];
  const headerRow = ws.getRow(2);
  headerRow.values = headers;
  headerRow.height = 24;
  headerRow.eachCell((cell: ExcelJS.Cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF375623' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });

  const stockMap = new Map((stockData || []).map((s: Record<string, unknown>) => [s.id, s]));
  let totalValue = 0;

  for (const p of (products || [])) {
    const stock = stockMap.get(p.id) as Record<string, unknown> | undefined;
    const stockQty = (stock?.stock_qty as number) || 0;
    const stockValue = stockQty * (p.price || 0);
    totalValue += stockValue;

    const row = ws.addRow([p.code, p.name, p.spec, p.unit, p.price, p.sale_price, stockQty, stockValue]);
    row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
      if (colNumber >= 5) {
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.alignment = { horizontal: 'center' };
      }
    });
    row.getCell(5).numFmt = '0.00';
    row.getCell(6).numFmt = '0.00';
    row.getCell(8).numFmt = '0.00';
  }

  // Summary row
  const summaryRow = ws.addRow([]);
  ws.mergeCells(`A${summaryRow.number}:G${summaryRow.number}`);
  summaryRow.getCell(1).value = '合计';
  summaryRow.getCell(1).font = { bold: true, size: 12 };
  summaryRow.getCell(1).alignment = { horizontal: 'right' };
  summaryRow.getCell(8).value = totalValue;
  summaryRow.getCell(8).font = { bold: true, size: 12, color: { argb: 'FFFF0000' } };
  summaryRow.getCell(8).numFmt = '0.00';
  summaryRow.getCell(8).alignment = { horizontal: 'right' };
  summaryRow.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
    cell.border = {
      top: { style: 'medium' }, left: { style: 'thin' },
      bottom: { style: 'medium' }, right: { style: 'thin' },
    };
  });

  // Column widths
  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 8;
  ws.getColumn(5).width = 12;
  ws.getColumn(6).width = 12;
  ws.getColumn(7).width = 12;
  ws.getColumn(8).width = 14;

  ws.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: Math.max(2, (products?.length || 0) + 2), column: 8 },
  };
}

// === Preview (JSON) helpers ===
async function getSalesPreview(startDate: string, endDate: string) {
  const client = getClient();
  let orderQuery = client.from('sales_orders').select('*').order('date', { ascending: true }).neq('verified', true);
  if (startDate) orderQuery = orderQuery.gte('date', startDate);
  if (endDate) orderQuery = orderQuery.lte('date', endDate);
  const { data: orders } = await orderQuery;
  const { data: items } = await client.from('sales_order_items').select('*');
  const { data: customers } = await client.from('customers').select('*');
  const { data: products } = await client.from('products').select('*');
  const customerMap = new Map((customers || []).map((c: Record<string, unknown>) => [c.id, c]));
  const productMap = new Map((products || []).map((p: Record<string, unknown>) => [p.id, p]));

  const previewItems: Record<string, string | number>[] = [];
  const summaryMap = new Map<string, { name: string; qty: number; price: number; total: number }>();
  let totalAmount = 0;

  for (const order of (orders || [])) {
    const cust = customerMap.get(order.customer_id) as Record<string, unknown> | undefined;
    const orderItems = (items || []).filter((i: Record<string, unknown>) => i.order_id === order.id);
    for (const item of orderItems) {
      const prod = productMap.get(item.product_id) as Record<string, unknown> | undefined;
      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.qty) || 0;
      const total = itemPrice * itemQty;
      totalAmount += total;
      previewItems.push({
        '日期': order.date || '',
        '部门': (cust?.name as string) || '',
        '物品': (prod?.name as string) || '',
        '型号': (prod?.spec as string) || '',
        '单价': itemPrice,
        '数量': itemQty,
        '总价': total,
      });
      const key = String(item.product_id);
      const existing = summaryMap.get(key) || { name: (prod?.name as string) || '', qty: 0, price: itemPrice, total: 0 };
      existing.qty += itemQty;
      existing.total += total;
      summaryMap.set(key, existing);
    }
  }

  const summaryItems = Array.from(summaryMap.values()).map((s) => ({
    '品名': s.name,
    '数量': s.qty,
    '价格': s.price,
    '合计': s.total,
  }));

  return {
    items: previewItems,
    summary: summaryItems,
    totalAmount,
  };
}

async function getPurchasePreview(startDate: string, endDate: string) {
  const client = getClient();
  let orderQuery = client.from('purchase_orders').select('*').order('date', { ascending: true });
  if (startDate) orderQuery = orderQuery.gte('date', startDate);
  if (endDate) orderQuery = orderQuery.lte('date', endDate);
  const { data: orders } = await orderQuery;
  const { data: items } = await client.from('purchase_order_items').select('*');
  const { data: suppliers } = await client.from('suppliers').select('*');
  const { data: products } = await client.from('products').select('*');
  const supplierMap = new Map((suppliers || []).map((s: Record<string, unknown>) => [s.id, s]));
  const productMap = new Map((products || []).map((p: Record<string, unknown>) => [p.id, p]));

  const previewItems: Record<string, string | number>[] = [];
  const summaryMap = new Map<string, { name: string; qty: number; price: number; total: number }>();
  let totalAmount = 0;

  for (const order of (orders || [])) {
    const supp = supplierMap.get(order.supplier_id) as Record<string, unknown> | undefined;
    const orderItems = (items || []).filter((i: Record<string, unknown>) => i.order_id === order.id);
    for (const item of orderItems) {
      const prod = productMap.get(item.product_id) as Record<string, unknown> | undefined;
      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.qty) || 0;
      const total = itemPrice * itemQty;
      totalAmount += total;
      previewItems.push({
        '日期': order.date || '',
        '供应商': (supp?.name as string) || '',
        '物品': (prod?.name as string) || '',
        '型号': (prod?.spec as string) || '',
        '单价': itemPrice,
        '数量': itemQty,
        '总价': total,
      });
      const key = String(item.product_id);
      const existing = summaryMap.get(key) || { name: (prod?.name as string) || '', qty: 0, price: itemPrice, total: 0 };
      existing.qty += itemQty;
      existing.total += total;
      summaryMap.set(key, existing);
    }
  }

  const summaryItems = Array.from(summaryMap.values()).map((s) => ({
    '品名': s.name,
    '数量': s.qty,
    '价格': s.price,
    '合计': s.total,
  }));

  return {
    items: previewItems,
    summary: summaryItems,
    totalAmount,
  };
}

async function getStockPreview() {
  const client = getClient();
  const { data: products } = await client.from('products').select('*').order('code', { ascending: true });
  const { data: stockData } = await client.from('stock_view').select('*');
  const stockMap = new Map((stockData || []).map((s: Record<string, unknown>) => [s.id, s]));

  const previewItems: Record<string, string | number>[] = [];
  let totalAmount = 0;

  for (const p of (products || [])) {
    const stock = stockMap.get(p.id) as Record<string, unknown> | undefined;
    const stockQty = (stock?.stock_qty as number) || 0;
    const stockValue = stockQty * (p.price || 0);
    totalAmount += stockValue;
    previewItems.push({
      '编号': p.code as string,
      '名称': p.name as string,
      '规格': (p.spec as string) || '',
      '单位': (p.unit as string) || '',
      '进货单价': p.price as number,
      '销售单价': p.sale_price as number,
      '库存数量': stockQty,
      '库存金额': stockValue,
    });
  }

  return { items: previewItems, summary: [] as Record<string, string | number>[], totalAmount };
}
