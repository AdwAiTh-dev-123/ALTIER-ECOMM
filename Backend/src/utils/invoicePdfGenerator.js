import PDFDocument from "pdfkit";

// Helper date formatter
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Helper currency formatter
const formatCurrency = (amount) => {
  return `INR ${Number(amount || 0).toLocaleString("en-IN")}`;
};

/**
 * Generates an official, luxury branded Tax Invoice PDF buffer for an Order.
 * @param {Object} order - Populated mongoose Order document or lean object
 * @returns {Promise<Buffer>} - Buffer containing the generated PDF
 */
export const generatePdfInvoice = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 36, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // 1. Header Banner
      doc.rect(36, 36, 523, 48).fill("#1c1917");

      // Brand Title
      doc
        .fillColor("#ffffff")
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("ATELIER", 48, 46);

      doc
        .fillColor("#a8a29e")
        .fontSize(7.5)
        .font("Helvetica")
        .text("LUXURY APPAREL & COUTURE", 48, 66);

      // Invoice Title & Ref (Right Aligned)
      doc
        .fillColor("#ffffff")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("TAX INVOICE / RECEIPT", 320, 46, { width: 227, align: "right" });

      doc
        .fillColor("#d6d3d1")
        .fontSize(8.5)
        .font("Helvetica")
        .text(`Ref: ${order.orderId || "N/A"}`, 320, 64, {
          width: 227,
          align: "right",
        });

      // 2. Order Metadata Sub-bar
      const metaY = 92;
      doc.rect(36, metaY, 523, 24).fillAndStroke("#f5f4f0", "#e7e5e4");

      doc.fillColor("#57534e").fontSize(8).font("Helvetica-Bold");
      doc.text(`Order Date: `, 46, metaY + 7, { continued: true });
      doc
        .font("Helvetica")
        .text(formatDate(order.createdAt), { continued: false });

      doc
        .font("Helvetica-Bold")
        .text(`Payment Method: `, 210, metaY + 7, { continued: true });
      doc
        .font("Helvetica")
        .text(`${order.paymentMethod || "COD"} (${order.paymentStatus || "Pending"})`, {
          continued: false,
        });

      doc
        .font("Helvetica-Bold")
        .text(`Order Status: `, 420, metaY + 7, { continued: true });
      doc
        .font("Helvetica")
        .text(order.orderStatus || "Confirmed", { continued: false });

      // 3. Addresses Section (Two Columns)
      const addrY = 124;
      const addrBoxW = 257;
      const addrBoxH = 92;

      // Left Box: Billed / Shipped To
      doc
        .rect(36, addrY, addrBoxW, addrBoxH)
        .fillAndStroke("#ffffff", "#e7e5e4");

      doc
        .fillColor("#1c1917")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("CUSTOMER & SHIPPING DETAILS", 46, addrY + 8);

      const customerName =
        order.shippingAddress?.fullName || order.user?.name || "Customer";
      const customerPhone =
        order.shippingAddress?.phone || order.user?.phone || "N/A";
      const customerEmail = order.user?.email || "N/A";
      const street = order.shippingAddress?.streetAddress || "";
      const apt = order.shippingAddress?.apartment
        ? `${order.shippingAddress.apartment}, `
        : "";
      const cityState = `${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.postalCode || ""}`;

      doc.fillColor("#44403c").fontSize(8).font("Helvetica");
      doc.text(customerName, 46, addrY + 22, { width: 237 });
      doc.text(`${apt}${street}`.slice(0, 45), 46, addrY + 34, { width: 237 });
      doc.text(cityState.slice(0, 45), 46, addrY + 46, { width: 237 });
      doc.text(`Phone: ${customerPhone}`, 46, addrY + 58, { width: 237 });
      doc.text(`Email: ${customerEmail}`, 46, addrY + 70, { width: 237 });

      // Right Box: Fulfilled By / Seller
      const rightBoxX = 302;
      doc
        .rect(rightBoxX, addrY, addrBoxW, addrBoxH)
        .fillAndStroke("#ffffff", "#e7e5e4");

      doc
        .fillColor("#1c1917")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("SOLD & FULFILLED BY", rightBoxX + 10, addrY + 8);

      doc.fillColor("#44403c").fontSize(8).font("Helvetica");
      doc.text("ATELIER LUXURY APPAREL PVT. LTD.", rightBoxX + 10, addrY + 22);
      doc.text("Express Commerce Hub, Outer Ring Road", rightBoxX + 10, addrY + 34);
      doc.text("Bengaluru, Karnataka - 560103, India", rightBoxX + 10, addrY + 46);
      doc.text("GSTIN: 29AAAAA0000A1Z5", rightBoxX + 10, addrY + 58);
      doc.text("Support: care@atelierluxury.com", rightBoxX + 10, addrY + 70);

      // 4. Items Table
      let tableY = 224;
      doc.rect(36, tableY, 523, 20).fill("#292524");

      doc.fillColor("#ffffff").fontSize(7.5).font("Helvetica-Bold");
      doc.text("#", 42, tableY + 6, { width: 20 });
      doc.text("ITEM DESCRIPTION", 68, tableY + 6, { width: 250 });
      doc.text("PRICE", 328, tableY + 6, { width: 65, align: "right" });
      doc.text("QTY", 402, tableY + 6, { width: 35, align: "center" });
      doc.text("TOTAL", 448, tableY + 6, { width: 100, align: "right" });

      tableY += 22;

      // Table Rows
      const items = order.items || [];
      items.forEach((item, index) => {
        // Page break safety
        if (tableY > 680) {
          doc.addPage();
          tableY = 40;
        }

        const isEven = index % 2 === 0;
        const rowHeight = 28;
        if (isEven) {
          doc.rect(36, tableY - 2, 523, rowHeight).fill("#fcfbfa");
        }

        // Line number
        doc
          .fillColor("#78716c")
          .fontSize(7.5)
          .font("Helvetica")
          .text(String(index + 1), 42, tableY + 4, { width: 20 });

        // Item title
        doc
          .fillColor("#1c1917")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text(item.title || "Product Item", 68, tableY + 3, {
            width: 250,
            ellipsis: true,
          });

        // Item variant info & status tag
        let subtitle = `Color: ${item.color || "Standard"} | Size: ${item.size || "Standard"}`;
        if (item.status === "Cancelled" || item.status === "Returned") {
          subtitle += `  [${item.status.toUpperCase()}]`;
        }

        doc
          .fillColor(
            item.status === "Cancelled" || item.status === "Returned"
              ? "#dc2626"
              : "#78716c",
          )
          .fontSize(7)
          .font("Helvetica")
          .text(subtitle, 68, tableY + 15, { width: 250 });

        // Unit Price
        doc
          .fillColor("#1c1917")
          .fontSize(7.5)
          .font("Helvetica")
          .text(formatCurrency(item.price), 328, tableY + 5, {
            width: 65,
            align: "right",
          });

        // Qty
        doc
          .fillColor("#1c1917")
          .fontSize(7.5)
          .font("Helvetica")
          .text(String(item.quantity || 1), 402, tableY + 5, {
            width: 35,
            align: "center",
          });

        // Total
        doc
          .fillColor("#1c1917")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text(formatCurrency(item.itemTotal), 448, tableY + 5, {
            width: 100,
            align: "right",
          });

        tableY += rowHeight;
      });

      // 5. Financial Summary Block
      tableY += 10;
      if (tableY > 640) {
        doc.addPage();
        tableY = 40;
      }

      // Compute refunds if any
      let refundAmount = 0;
      if (order.paymentStatus === "Refunded") {
        refundAmount = order.pricing?.totalAmount || 0;
      } else if (order.paymentStatus === "Partially Refunded") {
        refundAmount = items.reduce((sum, it) => {
          if (it.status === "Cancelled" || it.status === "Returned") {
            return sum + (it.itemTotal || 0);
          }
          return sum;
        }, 0);
      }
      const netAmount = Math.max(
        0,
        (order.pricing?.totalAmount || 0) - refundAmount,
      );

      const summaryBoxW = 230;
      const summaryBoxX = 329;
      const summaryRows = [
        { label: "Items Subtotal", value: formatCurrency(order.pricing?.subtotal) },
      ];

      if (order.pricing?.couponDiscount > 0) {
        summaryRows.push({
          label: `Coupon Discount (${order.pricing?.couponCode || "COUPON"})`,
          value: `-${formatCurrency(order.pricing.couponDiscount)}`,
          color: "#15803d",
        });
      }

      summaryRows.push({
        label: "Shipping Fee",
        value:
          order.pricing?.shippingFee > 0
            ? formatCurrency(order.pricing.shippingFee)
            : "FREE",
      });

      // Draw summary box background
      const boxHeight = 65 + (refundAmount > 0 ? 32 : 0);
      doc
        .rect(summaryBoxX, tableY, summaryBoxW, boxHeight)
        .fillAndStroke("#fafaf9", "#e7e5e4");

      let sumLineY = tableY + 8;
      summaryRows.forEach((r) => {
        doc
          .fillColor("#57534e")
          .fontSize(7.5)
          .font("Helvetica")
          .text(r.label, summaryBoxX + 10, sumLineY);

        doc
          .fillColor(r.color || "#1c1917")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(r.value, summaryBoxX + 110, sumLineY, {
            width: 110,
            align: "right",
          });

        sumLineY += 14;
      });

      // Divider line
      doc
        .strokeColor("#d6d3d1")
        .lineWidth(0.5)
        .moveTo(summaryBoxX + 10, sumLineY)
        .lineTo(summaryBoxX + 220, sumLineY)
        .stroke();

      sumLineY += 6;

      // Total Amount Row
      doc
        .fillColor("#1c1917")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Grand Total", summaryBoxX + 10, sumLineY);

      doc
        .fillColor("#1c1917")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(formatCurrency(order.pricing?.totalAmount), summaryBoxX + 110, sumLineY, {
          width: 110,
          align: "right",
        });

      sumLineY += 15;

      // Refund & Net row if applicable
      if (refundAmount > 0) {
        doc
          .fillColor("#dc2626")
          .fontSize(7.5)
          .font("Helvetica")
          .text("Refund Amount", summaryBoxX + 10, sumLineY);

        doc
          .fillColor("#dc2626")
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(`-${formatCurrency(refundAmount)}`, summaryBoxX + 110, sumLineY, {
            width: 110,
            align: "right",
          });

        sumLineY += 13;

        doc
          .fillColor("#15803d")
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text("Net Paid", summaryBoxX + 10, sumLineY);

        doc
          .fillColor("#15803d")
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text(formatCurrency(netAmount), summaryBoxX + 110, sumLineY, {
            width: 110,
            align: "right",
          });
      }

      // 6. Page Footer
      doc
        .strokeColor("#e7e5e4")
        .lineWidth(0.5)
        .moveTo(36, 780)
        .lineTo(559, 780)
        .stroke();

      doc
        .fillColor("#78716c")
        .fontSize(7.5)
        .font("Helvetica")
        .text(
          "Thank you for shopping with ATELIER. For inquiries, email care@atelierluxury.com.",
          36,
          788,
          { align: "center", width: 523 },
        );

      doc
        .fillColor("#a8a29e")
        .fontSize(6.5)
        .text(
          "This is an electronically generated tax invoice. No physical signature is required.",
          36,
          800,
          { align: "center", width: 523 },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export default generatePdfInvoice;
