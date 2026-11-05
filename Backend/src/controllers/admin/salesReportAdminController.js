import { fetchSalesReportService } from "../../services/admin/fetchSalesReportService.js";
import {
  generateExcelSalesReport,
  generatePdfSalesReport,
} from "../../utils/salesReportGenerators.js";

export const getAdminSalesReport = async (req, res, next) => {
  try {
    const reportData = await fetchSalesReportService(req.query, false);
    return res.status(200).json({
      success: true,
      ...reportData,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadAdminSalesReport = async (req, res, next) => {
  try {
    const { format = "excel" } = req.query;
    const { orders, summary, dateRange } = await fetchSalesReportService(
      req.query,
      true,
    );
    const timestamp = Date.now();
    if (format === "pdf") {
      const pdfBuffer = await generatePdfSalesReport(
        orders,
        summary,
        dateRange,
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=sales-report-${timestamp}.pdf`,
      );
      return res.send(pdfBuffer);
    }
    // Default: Excel
    const excelBuffer = await generateExcelSalesReport(
      orders,
      summary,
      dateRange,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${timestamp}.xlsx`,
    );
    return res.send(excelBuffer);
  } catch (err) {
    next(err);
  }
};
