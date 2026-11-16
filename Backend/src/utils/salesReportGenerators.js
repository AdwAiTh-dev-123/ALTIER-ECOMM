import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

//Format date helper (DD/MM/YYYY)

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

//Generate Excel (.xlsx) Report using ExcelJS

export const generateExcelSalesReport = async (orders, summary, dateRange) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  // Title Block
  worksheet.mergeCells("A1:J1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "ATELIER LUXURY APPAREL - SALES REPORT";
  titleCell.font = {
    name: "Arial",
    size: 14,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1C1917" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 30;

  // Metadata Subtitle
  worksheet.mergeCells("A2:J2");
  const subCell = worksheet.getCell("A2");
  subCell.value = `Period: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)} | Generated on: ${formatDate(new Date())}`;
  subCell.font = { italic: true, size: 10, color: { argb: "FF555555" } };
  subCell.alignment = { horizontal: "center" };

  // Summary Metrics Section
  worksheet.addRow([]);
  const summaryHeaderRow = worksheet.addRow([
    "Total Orders",
    "Gross Sales",
    "Total Refunds",
    "Net Revenue",
    "Units Retained",
    "Returned Units",
    "Avg Order Value",
  ]);
  summaryHeaderRow.font = { bold: true };
  const summaryValRow = worksheet.addRow([
    summary.totalOrders || 0,
    `₹${Number(summary.grossSalesAmount || summary.totalSalesAmount || 0).toLocaleString("en-IN")}`,
    `-₹${Number(summary.totalRefundAmount || 0).toLocaleString("en-IN")}`,
    `₹${Number(summary.netSalesAmount || 0).toLocaleString("en-IN")}`,
    summary.totalItemsSold || 0,
    summary.totalReturnedItems || 0,
    `₹${Number(summary.averageOrderValue || 0).toLocaleString("en-IN")}`,
  ]);
  summaryValRow.font = { size: 11, bold: true, color: { argb: "FF15803D" } };

  worksheet.addRow([]);

  // Orders Table Columns
  worksheet.columns = [
    { header: "Order ID", key: "orderId", width: 18 },
    { header: "Date", key: "date", width: 14 },
    { header: "Customer Name", key: "customer", width: 22 },
    { header: "Payment Method", key: "paymentMethod", width: 16 },
    { header: "Payment Status", key: "paymentStatus", width: 16 },
    { header: "Order Status", key: "status", width: 16 },
    { header: "Items (Units)", key: "itemsCount", width: 14 },
    { header: "Gross Total (₹)", key: "grossTotal", width: 16 },
    { header: "Refund (₹)", key: "refund", width: 14 },
    { header: "Net Amount (₹)", key: "netTotal", width: 16 },
  ];

  // Re-style the table header row (Row 6)
  const headerRow = worksheet.getRow(6);
  headerRow.values = [
    "Order ID",
    "Date",
    "Customer Name",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Items (Units)",
    "Gross Total (₹)",
    "Refund (₹)",
    "Net Amount (₹)",
  ];
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF292524" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  headerRow.height = 24;

  // Add Order Rows
  orders.forEach((order) => {
    worksheet.addRow({
      orderId: order.orderId,
      date: formatDate(order.createdAt),
      customer:
        order.shippingAddress?.fullName || order.user?.name || "Customer",
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || "Pending",
      status: order.orderStatus,
      itemsCount: order.activeItemsCount ?? (order.items?.length || 0),
      grossTotal: order.pricing?.totalAmount || 0,
      refund: order.refundAmount || 0,
      netTotal: order.netAmount ?? (order.pricing?.totalAmount || 0),
    });
  });

  return await workbook.xlsx.writeBuffer();
};

//Generate PDF Report using PDFKit
export const generatePdfSalesReport = (orders, summary, dateRange) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 36, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Header Banner
      doc.rect(36, 36, 523, 40).fill("#1c1917");
      doc
        .fillColor("#ffffff")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("ATELIER - SALES REPORT", 46, 48);

      doc
        .fillColor("#78716c")
        .fontSize(9)
        .font("Helvetica")
        .text(
          `Date Range: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)} | Printed: ${formatDate(new Date())}`,
          36,
          84,
        );

      // Metric Summary Cards (5 cards across width 523)
      const cardY = 104;
      const cardWidth = 99;
      const cardHeight = 44;
      const metrics = [
        { label: "TOTAL ORDERS", value: String(summary.totalOrders || 0) },
        {
          label: "GROSS SALES",
          value: `INR ${Number(summary.grossSalesAmount || summary.totalSalesAmount || 0).toLocaleString("en-IN")}`,
        },
        {
          label: "TOTAL REFUNDS",
          value: `-INR ${Number(summary.totalRefundAmount || 0).toLocaleString("en-IN")}`,
        },
        {
          label: "NET REVENUE",
          value: `INR ${Number(summary.netSalesAmount || 0).toLocaleString("en-IN")}`,
        },
        {
          label: "UNITS SOLD",
          value: String(summary.totalItemsSold || 0),
        },
      ];

      metrics.forEach((m, idx) => {
        const x = 36 + idx * (cardWidth + 7);
        doc
          .rect(x, cardY, cardWidth, cardHeight)
          .fillAndStroke("#f5f4f0", "#e7e5e4");
        doc
          .fillColor("#78716c")
          .fontSize(6.5)
          .font("Helvetica-Bold")
          .text(m.label, x + 6, cardY + 8);
        doc
          .fillColor(m.label === "TOTAL REFUNDS" && summary.totalRefundAmount > 0 ? "#dc2626" : "#1c1917")
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .text(m.value, x + 6, cardY + 22);
      });

      // Table Header
      let tableY = 165;
      doc.rect(36, tableY, 523, 20).fill("#292524");
      doc.fillColor("#ffffff").fontSize(7.5).font("Helvetica-Bold");
      doc.text("ORDER ID", 40, tableY + 6, { width: 75 });
      doc.text("DATE", 116, tableY + 6, { width: 55 });
      doc.text("CUSTOMER", 172, tableY + 6, { width: 85 });
      doc.text("PAYMENT", 258, tableY + 6, { width: 58 });
      doc.text("STATUS", 318, tableY + 6, { width: 62 });
      doc.text("GROSS", 382, tableY + 6, { width: 45, align: "right" });
      doc.text("REFUND", 429, tableY + 6, { width: 45, align: "right" });
      doc.text("NET", 476, tableY + 6, { width: 45, align: "right" });

      tableY += 22;

      // Table Rows
      doc.font("Helvetica").fontSize(7.5);
      orders.forEach((order, index) => {
        // Page overflow check
        if (tableY > 750) {
          doc.addPage();
          tableY = 40;
        }

        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(36, tableY - 2, 523, 18).fill("#fbfbfa");
        }

        doc.fillColor("#1c1917");
        doc.text(order.orderId || "N/A", 40, tableY, { width: 75 });
        doc.text(formatDate(order.createdAt), 116, tableY, { width: 55 });
        doc.text(
          (
            order.shippingAddress?.fullName ||
            order.user?.name ||
            "Customer"
          ).slice(0, 14),
          172,
          tableY,
          { width: 85 },
        );
        doc.text(order.paymentMethod || "COD", 258, tableY, { width: 58 });
        doc.text(order.orderStatus || "Pending", 318, tableY, { width: 62 });
        doc.text(
          `INR ${Number(order.pricing?.totalAmount || 0).toLocaleString("en-IN")}`,
          382,
          tableY,
          { width: 45, align: "right" },
        );
        doc.text(
          order.refundAmount ? `-INR ${Number(order.refundAmount).toLocaleString("en-IN")}` : "-",
          429,
          tableY,
          { width: 45, align: "right" },
        );
        doc.text(
          `INR ${Number(order.netAmount ?? order.pricing?.totalAmount ?? 0).toLocaleString("en-IN")}`,
          476,
          tableY,
          { width: 45, align: "right" },
        );

        tableY += 18;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
