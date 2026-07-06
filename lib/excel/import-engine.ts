import * as XLSX from "xlsx";
import { prisma } from "../db";
import type { ImportResult } from "../../types";

export async function importExcelData(fileBuffer: Buffer): Promise<ImportResult> {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetNames = workbook.SheetNames;

  const requiredSheets = [
    "Customer Demand",
    "Material Planning",
    "Product BOM",
    "EMS Build Plan",
    "EMS Dispatch Plan",
    "Synedyne Inventory",
    "Production Plan",
    "Customer Dispatch",
    "Revenue Tracker"
  ];

  const missingSheets = requiredSheets.filter(name => !sheetNames.includes(name));
  if (missingSheets.length > 0) {
    throw new Error(`Missing required sheets: ${missingSheets.join(", ")}`);
  }

  const result: ImportResult = {
    success: true,
    importedRows: 0,
    skippedRows: 0,
    errorRows: [],
    sheets: []
  };

  try {
    // Read all sheets upfront
    const R = {
      customerDemand: XLSX.utils.sheet_to_json<any>(workbook.Sheets["Customer Demand"]),
      materialPlanning: XLSX.utils.sheet_to_json<any>(workbook.Sheets["Material Planning"]),
      productBOM: XLSX.utils.sheet_to_json<any>(workbook.Sheets["Product BOM"]),
      emsBuild: XLSX.utils.sheet_to_json<any>(workbook.Sheets["EMS Build Plan"]),
      emsDispatch: XLSX.utils.sheet_to_json<any>(workbook.Sheets["EMS Dispatch Plan"]),
      synedyneInventory: XLSX.utils.sheet_to_json<any>(workbook.Sheets["Synedyne Inventory"]),
      productionPlan: XLSX.utils.sheet_to_json<any>(workbook.Sheets["Production Plan"]),
      customerDispatch: XLSX.utils.sheet_to_json<any>(workbook.Sheets["Customer Dispatch"]),
      revenueTracker: XLSX.utils.sheet_to_json<any>(workbook.Sheets["Revenue Tracker"]),
    };

    const parseDate = (val: any): Date => {
      if (!val) return new Date();
      if (val instanceof Date) return val;
      if (typeof val === "number") return new Date(Math.round((val - 25569) * 86400 * 1000));
      const p = Date.parse(String(val));
      return isNaN(p) ? new Date() : new Date(p);
    };

    const parseNum = (val: any): number => {
      if (val === undefined || val === null || val === "-" || val === "") return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const str = (val: any): string => String(val ?? "").trim();

    // ── STEP 1: CLEAN (batch deletes in dependency order) ──────────────────────
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.revenue.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.dispatchItem.deleteMany({});
    await prisma.dispatch.deleteMany({});
    await prisma.finishedGood.deleteMany({});
    await prisma.productionLog.deleteMany({});
    await prisma.productionOrder.deleteMany({});
    await prisma.purchaseRequest.deleteMany({});
    await prisma.materialPlan.deleteMany({});
    await prisma.salesOrderItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.customerDemand.deleteMany({});
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.bOMItem.deleteMany({});
    await prisma.component.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.eMSBuild.deleteMany({});
    await prisma.eMSDispatch.deleteMany({});

    // ── STEP 2: DEFAULT USER ───────────────────────────────────────────────────
    const defaultUser = await prisma.user.upsert({
      where: { clerkId: "mock_clerk_admin" },
      update: {},
      create: {
        clerkId: "mock_clerk_admin",
        email: "admin@synedyne.com",
        name: "System Admin",
        role: "ADMIN",
        department: "IT",
        isActive: true,
      },
    });

    // ── STEP 3: BUILD IN-MEMORY MAPS ───────────────────────────────────────────
    // Customers
    const custMap = new Map<string, string>(); // name -> code
    const addCust = (name: string, code?: string) => {
      if (!name) return;
      const n = name.trim();
      if (!custMap.has(n))
        custMap.set(n, code?.trim() || `CUST-${n.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "X")}`);
    };
    R.customerDemand.forEach(r => addCust(r["Customer"], r["Customer Code"]));
    R.customerDispatch.forEach(r => addCust(r["Customer"]));
    R.revenueTracker.forEach(r => addCust(r["Customer"]));

    // Products + prices
    const prodMap = new Map<string, string>(); // name -> code
    const prodCodeMap = new Map<string, string>(); // code -> name (for dedup)
    const productPrices = new Map<string, number>(); // name -> price
    const addProd = (name: string, code?: string) => {
      if (!name) return;
      const n = name.trim();
      const c = code?.trim() || `PROD-${n.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "X")}`;
      if (!prodMap.has(n)) { prodMap.set(n, c); prodCodeMap.set(c, n); }
    };
    R.productBOM.forEach(r => addProd(r["Product"], r["Product Code"]));
    R.customerDemand.forEach(r => addProd(r["Product"], r["Product Code"]));
    R.productionPlan.forEach(r => addProd(r["Product"]));
    R.customerDispatch.forEach(r => addProd(r["Product"]));
    R.revenueTracker.forEach(r => addProd(r["Product"]));
    R.revenueTracker.forEach(r => {
      const n = str(r["Product"]); const p = parseNum(r["Selling Price"]);
      if (n && p > 0) productPrices.set(n, p);
    });

    // Components
    const compDefs = new Map<string, { code: string; name: string; category: string; manufacturer?: string; distributor?: string; leadTime: number }>();
    R.materialPlanning.forEach(r => {
      const code = str(r["Component Code"]); const name = str(r["Component Name"]);
      if (code && name) compDefs.set(code, { code, name, category: str(r["Category"]) || "Electronic", manufacturer: str(r["Manufacturer"]) || undefined, distributor: str(r["Distributor"]) || undefined, leadTime: parseNum(r["Lead Time (Weeks)"]) || 2 });
    });
    R.productBOM.forEach(r => {
      const code = str(r["Component Code"]); const name = str(r["Component Name"]);
      if (code && name && !compDefs.has(code)) compDefs.set(code, { code, name, category: "Electronic", leadTime: 2 });
    });

    // ── STEP 4: BULK INSERT CUSTOMERS ─────────────────────────────────────────
    await prisma.customer.createMany({
      data: Array.from(custMap.entries()).map(([name, code]) => ({ code, name, country: "India", isActive: true })),
      skipDuplicates: true,
    });
    const dbCustomers = await prisma.customer.findMany({ select: { id: true, name: true } });
    const custId = new Map(dbCustomers.map(c => [c.name, c.id]));

    // ── STEP 5: BULK INSERT PRODUCTS ──────────────────────────────────────────
    await prisma.product.createMany({
      data: Array.from(prodMap.entries()).map(([name, code]) => ({ code, name, sellingPrice: productPrices.get(name) || 0, unit: "pcs", isActive: true })),
      skipDuplicates: true,
    });
    const dbProducts = await prisma.product.findMany({ select: { id: true, name: true, code: true } });
    const prodId = new Map(dbProducts.map(p => [p.name, p.id]));       // name -> id
    const prodCodeId = new Map(dbProducts.map(p => [p.code, p.id]));   // code -> id

    // ── STEP 6: BULK INSERT COMPONENTS ────────────────────────────────────────
    await prisma.component.createMany({
      data: Array.from(compDefs.values()).map(c => ({
        code: c.code, name: c.name, category: c.category,
        manufacturer: c.manufacturer, distributor: c.distributor,
        leadTimeWeeks: c.leadTime, unit: "pcs", isActive: true,
      })),
      skipDuplicates: true,
    });
    const dbComponents = await prisma.component.findMany({ select: { id: true, code: true } });
    const compId = new Map(dbComponents.map(c => [c.code, c.id]));

    // ── STEP 7: BULK INSERT BOM ITEMS ─────────────────────────────────────────
    const bomRows = R.productBOM
      .map(r => ({ productId: prodCodeId.get(str(r["Product Code"])), componentId: compId.get(str(r["Component Code"])), pcba: str(r["PCBA"]) || "Main PCBA", qtyPerProduct: parseNum(r["Quantity Per Product (QPS)"]), unit: str(r["Unit"]) || "pcs" }))
      .filter(r => r.productId && r.componentId) as any[];
    if (bomRows.length) await prisma.bOMItem.createMany({ data: bomRows, skipDuplicates: true });

    // ── STEP 8: BULK INSERT INVENTORY ─────────────────────────────────────────
    const invMap = new Map<string, { openingStock: number; currentStock: number; stockAtEMS: number; warehouse: string; remarks?: string }>();
    R.synedyneInventory.forEach(r => {
      const code = str(r["Item Code"]);
      if (code) invMap.set(code, { openingStock: parseNum(r["Opening Stock"]), currentStock: parseNum(r["Closing Stock"]), stockAtEMS: 0, warehouse: str(r["Warehouse"]) || "Raw Material Store", remarks: str(r["Remarks"]) || undefined });
    });
    R.materialPlanning.forEach(r => {
      const code = str(r["Component Code"]);
      if (!code) return;
      const cur = parseNum(r["Current Stock"]), ems = parseNum(r["Stock at EMS"]);
      const ex = invMap.get(code);
      if (ex) { ex.currentStock = cur; ex.stockAtEMS = ems; }
      else invMap.set(code, { openingStock: cur, currentStock: cur, stockAtEMS: ems, warehouse: "Raw Material Store" });
    });

    const invInserts = Array.from(invMap.entries())
      .filter(([code]) => compId.has(code))
      .map(([code, inv]) => ({ componentId: compId.get(code)!, warehouse: inv.warehouse, openingStock: inv.openingStock, currentStock: inv.currentStock, stockAtEMS: inv.stockAtEMS, remarks: inv.remarks, reorderPoint: Math.ceil(inv.currentStock * 0.15) }));
    if (invInserts.length) await prisma.inventory.createMany({ data: invInserts, skipDuplicates: true });

    // Inventory transactions (opening balances)
    const dbInventory = await prisma.inventory.findMany({ select: { id: true, componentId: true, openingStock: true } });
    const compToInvId = new Map(dbInventory.map(i => [i.componentId, i.id]));
    const invTxRows = dbInventory
      .filter(i => i.openingStock > 0)
      .map(i => ({ inventoryId: i.id, transactionType: "RECEIVE" as const, quantity: i.openingStock, balanceAfter: i.openingStock, notes: "Initial balance upload" }));
    if (invTxRows.length) await prisma.inventoryTransaction.createMany({ data: invTxRows, skipDuplicates: true });

    // ── STEP 9: CUSTOMER DEMAND (bulk) ────────────────────────────────────────
    const demandRows = R.customerDemand
      .map(r => ({ customerId: custId.get(str(r["Customer"])), productId: prodCodeId.get(str(r["Product Code"])), month: str(r["Month"]) || "Apr-2026", week: str(r["Week"]) || "W1", forecastQty: parseNum(r["Forecast Qty"]), confirmedOrderQty: parseNum(r["Confirmed Order Qty"]), actualDispatchQty: parseNum(r["Actual Dispatch Qty"]), pendingQty: parseNum(r["Pending Qty"]) }))
      .filter(r => r.customerId && r.productId) as any[];
    if (demandRows.length) await prisma.customerDemand.createMany({ data: demandRows, skipDuplicates: true });

    // ── STEP 10: SALES ORDERS ─────────────────────────────────────────────────
    // Group dispatch rows into orders
    const orderData = new Map<string, { customerId: string; orderNumber: string; date: Date; status: string; items: Map<string, { productId: string; qty: number; price: number }> }>();
    R.customerDispatch.forEach(r => {
      const on = str(r["Sales Order"]), cn = str(r["Customer"]), pn = str(r["Product"]);
      const cid = custId.get(cn), pid = prodId.get(pn);
      if (!on || !cid || !pid) return;
      if (!orderData.has(on)) orderData.set(on, { customerId: cid, orderNumber: on, date: parseDate(r["Date"]), status: r["Dispatch Status"] === "Dispatched" ? "DISPATCHED" : "IN_PRODUCTION", items: new Map() });
      const o = orderData.get(on)!;
      const qty = parseNum(r["Planned Dispatch"]), price = productPrices.get(pn) || 0;
      const ex = o.items.get(pid);
      if (ex) ex.qty += qty; else o.items.set(pid, { productId: pid, qty, price });
    });

    // Insert orders one by one (needed for items + returned IDs)
    const orderIdMap = new Map<string, string>();
    for (const [on, ord] of orderData.entries()) {
      let total = 0;
      const items = Array.from(ord.items.values()).map(it => { total += it.qty * it.price; return { productId: it.productId, quantity: it.qty, unitPrice: it.price, totalPrice: it.qty * it.price }; });
      const so = await prisma.salesOrder.create({
        data: { orderNumber: ord.orderNumber, customerId: ord.customerId, status: (ord.status === "DISPATCHED" ? "DISPATCHED" : "APPROVED") as any, orderDate: ord.date, totalAmount: total, createdBy: defaultUser.id, items: { create: items } },
      });
      orderIdMap.set(on, so.id);
    }

    // ── STEP 11: MATERIAL PLANS (bulk) ────────────────────────────────────────
    const firstSO = await prisma.salesOrder.findFirst();
    if (firstSO) {
      const planRows = R.materialPlanning
        .filter(r => str(r["PO Number"]) && str(r["PO Number"]) !== "-" && compId.has(str(r["Component Code"])))
        .map(r => ({ salesOrderId: firstSO.id, componentId: compId.get(str(r["Component Code"]))!, grossRequirement: parseNum(r["Weekly Requirement"]) * 4, currentStock: parseNum(r["Current Stock"]), stockAtEMS: parseNum(r["Stock at EMS"]), availableStock: parseNum(r["Available Stock"]), netRequirement: parseNum(r["Shortage Qty"]), shortageQty: parseNum(r["Shortage Qty"]), weeklyRequirement: parseNum(r["Weekly Requirement"]), leadTimeWeeks: parseNum(r["Lead Time (Weeks)"]), shortageWeek: r["Shortage Week"] !== "-" ? str(r["Shortage Week"]) : null }));
      if (planRows.length) {
        await prisma.materialPlan.createMany({ data: planRows, skipDuplicates: true });
        const dbPlans = await prisma.materialPlan.findMany({ select: { id: true, componentId: true } });
        const planByComp = new Map(dbPlans.map(p => [p.componentId, p.id]));

        const prRows = R.materialPlanning
          .filter(r => str(r["PO Number"]) && str(r["PO Number"]) !== "-" && compId.has(str(r["Component Code"])))
          .map(r => {
            const cid = compId.get(str(r["Component Code"]))!;
            const pid = planByComp.get(cid);
            if (!pid) return null;
            return { materialPlanId: pid, componentId: cid, requestedQty: parseNum(r["Shortage Qty"]) || parseNum(r["Ordered Qty"]) || 100, status: (r["PO Status"] === "Closed" ? "RECEIVED" : "ORDERED") as any, poNumber: str(r["PO Number"]), poStatus: (r["PO Status"] === "Closed" ? "CLOSED" : "OPEN") as any, orderedQty: parseNum(r["Ordered Qty"]), expectedDelivery: r["Expected Delivery"] && r["Expected Delivery"] !== "-" ? parseDate(r["Expected Delivery"]) : null };
          })
          .filter(Boolean) as any[];
        if (prRows.length) await prisma.purchaseRequest.createMany({ data: prRows, skipDuplicates: true });
      }
    }

    // ── STEP 12: PRODUCTION ORDERS (bulk then logs + finished goods) ──────────
    const prodOrderRows = R.productionPlan
      .filter(r => prodId.has(str(r["Product"])))
      .map(r => ({ productId: prodId.get(str(r["Product"]))!, plannedQty: parseNum(r["Planned Qty"]), actualQty: parseNum(r["Actual Qty"]), rejectedQty: parseNum(r["Rejected Qty"]), finishedQty: parseNum(r["Finished Qty"]), status: (r["Status"] === "Completed" ? "COMPLETED" : "IN_PROGRESS") as any, plannedDate: parseDate(r["Date"]), completedAt: r["Status"] === "Completed" ? parseDate(r["Date"]) : null }));
    if (prodOrderRows.length) {
      await prisma.productionOrder.createMany({ data: prodOrderRows, skipDuplicates: true });
      const dbPOs = await prisma.productionOrder.findMany({ select: { id: true, productId: true, status: true, finishedQty: true, plannedDate: true } });
      const logRows = dbPOs.map(po => ({ productionOrderId: po.id, logType: "STATUS_CHANGE" as const, message: `Status updated to ${po.status}`, createdBy: defaultUser.id }));
      if (logRows.length) await prisma.productionLog.createMany({ data: logRows, skipDuplicates: true });
      const fgRows = dbPOs.filter(po => po.finishedQty > 0).map(po => ({ productionOrderId: po.id, productId: po.productId, quantity: po.finishedQty, warehouseLocation: "Finished Goods Store", receivedAt: po.plannedDate ?? undefined }));
      if (fgRows.length) await prisma.finishedGood.createMany({ data: fgRows, skipDuplicates: true });
    }

    // ── STEP 13: EMS BUILD PLAN (bulk) ────────────────────────────────────────
    const emsBuildRows = R.emsBuild.map(r => ({ week: str(r["Week"]) || "W1", pcba: str(r["PCBA"]) || "Main Control Board", plannedQty: parseNum(r["Planned Qty"]), actualQty: parseNum(r["Actual Qty"]), rejectedQty: parseNum(r["Rejected Qty"]), goodQty: parseNum(r["Good Qty"]), dispatchToSynedyne: parseNum(r["Dispatch to Synedyne"]), status: (r["Status"] === "Completed" ? "COMPLETED" : "IN_PROGRESS") as any }));
    if (emsBuildRows.length) await prisma.eMSBuild.createMany({ data: emsBuildRows, skipDuplicates: true });

    // ── STEP 14: EMS DISPATCH PLAN (bulk) ─────────────────────────────────────
    const emsDispRows = R.emsDispatch.map(r => ({ emsDispatchDate: parseDate(r["Date"]), pcba: str(r["PCBA"]) || "Main Control Board", plannedDispatch: parseNum(r["Planned Dispatch"]), actualDispatch: parseNum(r["Actual Dispatch"]), receivedBySynedyne: parseNum(r["Received by Synedyne"]), pendingQty: parseNum(r["Pending Qty"]) }));
    if (emsDispRows.length) await prisma.eMSDispatch.createMany({ data: emsDispRows, skipDuplicates: true });

    // ── STEP 15: DISPATCHES & INVOICES ────────────────────────────────────────
    // Collect all invoices and revenues to bulk insert after dispatches
    const allInvoices: any[] = [];
    const allRevenues: any[] = [];

    for (const r of R.customerDispatch) {
      const on = str(r["Sales Order"]), cn = str(r["Customer"]), pn = str(r["Product"]);
      const soId = orderIdMap.get(on), cid = custId.get(cn), pid = prodId.get(pn);
      if (!soId || !cid || !pid) continue;

      const actQty = parseNum(r["Actual Dispatch"]), planQty = parseNum(r["Planned Dispatch"]);
      const dispatch = await prisma.dispatch.create({
        data: {
          salesOrderId: soId, customerId: cid,
          dispatchDate: parseDate(r["Date"]),
          plannedQty: planQty, actualQty: actQty,
          status: (r["Dispatch Status"] === "Dispatched" ? "DELIVERED" : "PARTIAL") as any,
          trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
          items: { create: { productId: pid, quantity: actQty } },
        },
      });

      const invNum = str(r["Invoice Number"]);
      if (invNum && invNum !== "-") {
        const price = productPrices.get(pn) || 0;
        const amt = actQty * price;
        allInvoices.push({ invoiceNumber: invNum, salesOrderId: soId, customerId: cid, invoiceDate: parseDate(r["Date"]), totalAmount: amt, paidAmount: amt, status: "PAID" as const, _prodName: pn, _custName: cn, _qty: actQty, _price: price });
      }
    }

    // Bulk insert invoices, then revenues
    if (allInvoices.length) {
      const invoiceInserts = allInvoices.map(({ _prodName, _custName, _qty, _price, ...rest }) => rest);
      await prisma.invoice.createMany({ data: invoiceInserts, skipDuplicates: true });
      const dbInvoices = await prisma.invoice.findMany({ select: { id: true, invoiceNumber: true, customerId: true } });
      const invNumToId = new Map(dbInvoices.map(i => [i.invoiceNumber, i.id]));

      for (const inv of allInvoices) {
        const invId = invNumToId.get(inv.invoiceNumber);
        const pid = prodId.get(inv._prodName);
        const cid = custId.get(inv._custName);
        if (!invId || !pid || !cid) continue;
        const matched = R.revenueTracker.find((rv: any) => str(rv["Customer"]) === inv._custName && str(rv["Product"]) === inv._prodName);
        const payStatus = matched?.["Payment Status"] === "Paid" ? "PAID" : matched?.["Payment Status"] === "Overdue" ? "OVERDUE" : "PENDING";
        allRevenues.push({ invoiceId: invId, customerId: cid, productId: pid, month: str(matched?.["Month"]) || "Apr-2026", unitsSold: inv._qty, sellingPrice: inv._price, revenue: inv._qty * inv._price, paymentStatus: payStatus as any });
      }
      if (allRevenues.length) await prisma.revenue.createMany({ data: allRevenues, skipDuplicates: true });
    }

    // ── STEP 16: AUDIT LOG ────────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: { action: "IMPORT", entity: "System", entityId: "Excel-Import", newValue: { customerCount: custMap.size, productCount: prodMap.size, componentCount: compDefs.size, ordersCreated: orderData.size }, userId: defaultUser.id },
    });

    result.importedRows = R.customerDemand.length + R.materialPlanning.length + R.productBOM.length;
    result.sheets = requiredSheets.map(name => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name]).length;
      return { sheetName: name, total: rows, imported: rows, skipped: 0, errors: [] };
    });

    return result;
  } catch (err: any) {
    console.error("[Import Engine Error]", err);
    result.success = false;
    result.errorRows.push({ row: 0, message: err?.message || "Unknown error during import" });
    return result;
  }
}
