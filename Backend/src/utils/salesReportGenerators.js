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
  worksheet.mergeCells("A1:G1");
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
  worksheet.mergeCells("A2:G2");
  const subCell = worksheet.getCell("A2");
  subCell.value = `Period: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)} | Generated on: ${formatDate(new Date())}`;
  subCell.font = { italic: true, size: 10, color: { argb: "FF555555" } };
  subCell.alignment = { horizontal: "center" };

  // Summary Metrics Section
  worksheet.addRow([]);
  const summaryHeaderRow = worksheet.addRow([
    "Total Orders",
    "Gross Sales",
    "Items Sold",
    "Avg Order Value",
  ]);
  summaryHeaderRow.font = { bold: true };
  const summaryValRow = worksheet.addRow([
    summary.totalOrders,
    `₹${Number(summary.totalSalesAmount || 0).toLocaleString("en-IN")}`,
    summary.totalItemsSold,
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
    { header: "Items Count", key: "itemsCount", width: 12 },
    { header: "Order Status", key: "status", width: 16 },
    { header: "Total Amount (₹)", key: "total", width: 18 },
  ];

  // Re-style the table header row (Row 6)
  const headerRow = worksheet.getRow(6);
  headerRow.values = [
    "Order ID",
    "Date",
    "Customer Name",
    "Payment Method",
    "Items Count",
    "Order Status",
    "Total Amount (₹)",
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
      itemsCount: order.items?.length || 0,
      status: order.orderStatus,
      total: order.pricing?.totalAmount || 0,
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

      // Metric Summary Cards
      const cardY = 104;
      const cardWidth = 125;
      const cardHeight = 44;
      const metrics = [
        { label: "TOTAL ORDERS", value: String(summary.totalOrders) },
        {
          label: "TOTAL REVENUE",
          value: `INR ${Number(summary.totalSalesAmount || 0).toLocaleString("en-IN")}`,
        },
        { label: "ITEMS SOLD", value: String(summary.totalItemsSold) },
        {
          label: "AVG ORDER VALUE",
          value: `INR ${Number(summary.averageOrderValue || 0).toLocaleString("en-IN")}`,
        },
      ];

      metrics.forEach((m, idx) => {
        const x = 36 + idx * (cardWidth + 8);
        doc
          .rect(x, cardY, cardWidth, cardHeight)
          .fillAndStroke("#f5f4f0", "#e7e5e4");
        doc
          .fillColor("#78716c")
          .fontSize(7)
          .font("Helvetica-Bold")
          .text(m.label, x + 8, cardY + 8);
        doc
          .fillColor("#1c1917")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(m.value, x + 8, cardY + 22);
      });

      // Table Header
      let tableY = 165;
      doc.rect(36, tableY, 523, 20).fill("#292524");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
      doc.text("ORDER ID", 42, tableY + 6, { width: 90 });
      doc.text("DATE", 136, tableY + 6, { width: 65 });
      doc.text("CUSTOMER", 205, tableY + 6, { width: 110 });
      doc.text("METHOD", 320, tableY + 6, { width: 60 });
      doc.text("STATUS", 385, tableY + 6, { width: 80 });
      doc.text("TOTAL", 470, tableY + 6, { width: 80, align: "right" });

      tableY += 22;

      // Table Rows
      doc.font("Helvetica").fontSize(8);
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
        doc.text(order.orderId || "N/A", 42, tableY, { width: 90 });
        doc.text(formatDate(order.createdAt), 136, tableY, { width: 65 });
        doc.text(
          (
            order.shippingAddress?.fullName ||
            order.user?.name ||
            "Customer"
          ).slice(0, 18),
          205,
          tableY,
          { width: 110 },
        );
        doc.text(order.paymentMethod || "COD", 320, tableY, { width: 60 });
        doc.text(order.orderStatus || "Pending", 385, tableY, { width: 80 });
        doc.text(
          `INR ${Number(order.pricing?.totalAmount || 0).toLocaleString("en-IN")}`,
          470,
          tableY,
          { width: 80, align: "right" },
        );

        tableY += 18;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
